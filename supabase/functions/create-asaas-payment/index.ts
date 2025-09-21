import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ASAAS-PAYMENT] ${step}${detailsStr}`);
};

// 🔧 VALIDAÇÃO E CORREÇÃO AUTOMÁTICA DE CONFIGURAÇÃO
const validateAndFixAsaasConfig = (apiKey: string | null, baseUrl: string | null) => {
  logStep("🔧 Validating ASAAS configuration", { keyExists: !!apiKey, baseUrlExists: !!baseUrl });
  
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurado. Configure o secret no dashboard do Supabase.");
  }

  // 🚨 DETECTAR CHAVE NO LUGAR DA URL
  if (baseUrl && baseUrl.startsWith('$aact_')) {
    logStep("🚨 ERRO CRÍTICO: baseUrl é uma chave API em vez de URL", { baseUrl: baseUrl.substring(0, 20) + "..." });
    baseUrl = null; // Forçar correção automática
  }

  // 🔄 AUTO-DETECÇÃO DO AMBIENTE
  const isSandbox = apiKey.includes('hmlg') || apiKey.includes('sandbox');
  const correctBaseUrl = isSandbox 
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";

  // Se baseUrl está incorreto ou não foi fornecido, usar o correto
  if (!baseUrl || baseUrl === apiKey || !baseUrl.startsWith('http')) {
    logStep("🔄 Auto-corrigindo baseUrl", { from: baseUrl, to: correctBaseUrl });
    baseUrl = correctBaseUrl;
  }

  // 🔍 VALIDAÇÃO CRUZADA
  const urlIsSandbox = baseUrl.includes('sandbox');
  if (isSandbox !== urlIsSandbox) {
    logStep("⚠️ INCOMPATIBILIDADE: chave/URL de ambientes diferentes", { 
      keyEnvironment: isSandbox ? 'SANDBOX' : 'PRODUCTION',
      urlEnvironment: urlIsSandbox ? 'SANDBOX' : 'PRODUCTION'
    });
    baseUrl = correctBaseUrl; // Priorizar ambiente da chave
  }

  logStep("✅ Configuração final validada", { 
    environment: isSandbox ? 'SANDBOX' : 'PRODUCTION',
    baseUrl,
    keyFormat: apiKey.substring(0, 10) + "..."
  });

  return { apiKey, baseUrl, environment: isSandbox ? 'SANDBOX' : 'PRODUCTION' };
};

// 🔍 ERRO MAPPER PARA UX
const mapAsaasError = (status: number, errorText: string, operation: string) => {
  if (status === 401) {
    return `Erro de autenticação com Asaas. Verifique se a API key está correta para o ambiente ${operation}.`;
  }
  if (status === 400) {
    return `Dados inválidos enviados para o Asaas durante ${operation}. Verifique os parâmetros.`;
  }
  if (status === 403) {
    return `Acesso negado pelo Asaas durante ${operation}. Verifique permissões da API key.`;
  }
  if (status === 404) {
    return `Recurso não encontrado no Asaas durante ${operation}.`;
  }
  if (status >= 500) {
    return `Erro interno do servidor Asaas durante ${operation}. Tente novamente em alguns minutos.`;
  }
  return `Erro inesperado (${status}) durante ${operation}: ${errorText}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🚀 Function started", { method: req.method, url: req.url });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("❌ Missing Authorization header");
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("🔐 Attempting authentication", { hasToken: !!token });
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      logStep("❌ Authentication error", { error: authError.message });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      logStep("❌ User not authenticated or email not available", { user: !!user, email: user?.email });
      throw new Error("User not authenticated or email not available");
    }
    logStep("✅ User authenticated successfully", { userId: user.id, email: user.email });

    // 📥 PARSE DO BODY COM VALIDAÇÃO ROBUSTA
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      logStep("❌ Failed to parse request body", { error: e.message, contentType: req.headers.get('content-type') });
      throw new Error("Invalid JSON in request body");
    }

    const { planType, billingType, cpf } = requestBody;
    
    if (!billingType || !['PIX', 'CREDIT_CARD'].includes(billingType)) {
      throw new Error("Invalid billing type. Must be PIX or CREDIT_CARD");
    }

    // Validar CPF para PIX
    if (billingType === 'PIX' && !cpf) {
      throw new Error("CPF é obrigatório para pagamentos PIX");
    }

    logStep("📋 Payment data received", { planType, billingType, hasCpf: !!cpf });

    // 🔧 VALIDAÇÃO E CORREÇÃO DA CONFIGURAÇÃO ASAAS
    const rawApiKey = Deno.env.get("ASAAS_API_KEY");
    const rawBaseUrl = Deno.env.get("ASAAS_API_BASE_URL");
    
    const { apiKey, baseUrl, environment } = validateAndFixAsaasConfig(rawApiKey, rawBaseUrl);

    // 👤 CRIAR OU BUSCAR CLIENTE NO ASAAS
    let customerId;
    
    logStep("🔍 Searching for existing customer", { email: user.email });
    const searchCustomerResponse = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(user.email)}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!searchCustomerResponse.ok) {
      const errorText = await searchCustomerResponse.text();
      logStep("❌ Customer search failed", { 
        status: searchCustomerResponse.status, 
        statusText: searchCustomerResponse.statusText,
        error: errorText,
        environment
      });
      
      const friendlyError = mapAsaasError(searchCustomerResponse.status, errorText, "busca de cliente");
      throw new Error(friendlyError);
    }

    const customerSearchData = await searchCustomerResponse.json();
    logStep("📊 Customer search response", { 
      dataExists: !!customerSearchData.data, 
      count: customerSearchData.data?.length || 0 
    });
    
    if (customerSearchData.data && customerSearchData.data.length > 0) {
      customerId = customerSearchData.data[0].id;
      logStep("✅ Existing customer found", { customerId });
    } else {
      // Criar novo cliente
      logStep("➕ Creating new customer", { name: user.user_metadata?.name || user.email });
      const createCustomerResponse = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.user_metadata?.name || user.email,
          email: user.email,
          cpfCnpj: cpf || user.user_metadata?.cpf || null,
        }),
      });

      if (!createCustomerResponse.ok) {
        const errorText = await createCustomerResponse.text();
        logStep("❌ Customer creation failed", { 
          status: createCustomerResponse.status, 
          error: errorText,
          environment
        });
        
        const friendlyError = mapAsaasError(createCustomerResponse.status, errorText, "criação de cliente");
        throw new Error(friendlyError);
      }

      const customerData = await createCustomerResponse.json();
      if (!customerData.id) {
        logStep("❌ Customer creation response invalid", customerData);
        throw new Error("Failed to create customer - no ID returned");
      }
      customerId = customerData.id;
      logStep("✅ New customer created successfully", { customerId });
    }

    // 💰 DEFINIR VALORES POR PLANO
    let value;
    let description;
    switch (planType) {
      case 'monthly':
        value = 69.99;
        description = 'Plano Mensal - BetzaFit';
        break;
      case 'quarterly':
        value = 149.97;
        description = 'Plano Trimestral - BetzaFit';
        break;
      case 'annual':
        value = 359.88;
        description = 'Plano Anual - BetzaFit';
        break;
      default:
        throw new Error("Invalid plan type");
    }

    logStep("💳 Creating payment", { value, planType, billingType, environment });

    // 🔄 CRIAR COBRANÇA NO ASAAS
    const paymentData = {
      customer: customerId,
      billingType: billingType,
      value: value,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h para pagamento
      description: description,
      externalReference: user.id,
      enabledPaymentTypes: ["CREDIT_CARD", "PIX"],
      // 🔥 FORÇAR GERAÇÃO DE PIX
      ...(billingType === 'PIX' && {
        pixAddressKey: user.email, // Usar email como chave PIX
        pixQrCodeType: 'STATIC', // Garantir QR Code estático
      })
    };

    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      logStep("❌ Payment creation failed", { 
        status: paymentResponse.status, 
        error: errorText,
        environment,
        paymentData: { ...paymentData, customer: customerId }
      });
      
      const friendlyError = mapAsaasError(paymentResponse.status, errorText, "criação de pagamento");
      throw new Error(friendlyError);
    }

    const payment = await paymentResponse.json();
    
    if (!payment.id) {
      logStep("❌ Payment response invalid", payment);
      throw new Error("Payment creation failed - no payment ID returned");
    }

    // 🔍 LOG DETALHADO DOS CAMPOS PIX
    logStep("✅ Payment created successfully", { 
      paymentId: payment.id, 
      status: payment.status,
      environment,
      hasPixQrCode: !!payment.pixQrCode,
      hasPixCopyAndPaste: !!payment.pixCopyAndPaste,
      pixQrCodeLength: payment.pixQrCode?.length || 0,
      pixCopyLength: payment.pixCopyAndPaste?.length || 0,
      allFields: Object.keys(payment)
    });

    // 🚨 GARANTIR QUE PIX SEJA GERADO
    if (billingType === 'PIX' && (!payment.pixQrCode || !payment.pixCopyAndPaste)) {
      logStep("⚠️ PIX fields missing, trying to generate", { 
        pixQrCode: !!payment.pixQrCode,
        pixCopyAndPaste: !!payment.pixCopyAndPaste
      });
      
      // Se não tem PIX, tentar buscar novamente após delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pixResponse = await fetch(`${baseUrl}/payments/${payment.id}`, {
        method: 'GET',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        if (pixData.pixQrCode && pixData.pixCopyAndPaste) {
          payment.pixQrCode = pixData.pixQrCode;
          payment.pixCopyAndPaste = pixData.pixCopyAndPaste;
          logStep("✅ PIX data retrieved on second attempt");
        }
      }
    }

    return new Response(JSON.stringify({
      id: payment.id,
      status: payment.status,
      value: payment.value,
      dueDate: payment.dueDate,
      description: payment.description,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      pixQrCode: payment.pixQrCode,
      pixCopyAndPaste: payment.pixCopyAndPaste,
      customer: customerId,
      planType: planType,
      environment: environment
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 CRITICAL ERROR in create-asaas-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      diagnostic: "Se o erro persistir, use o botão de diagnóstico na interface de pagamento."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});