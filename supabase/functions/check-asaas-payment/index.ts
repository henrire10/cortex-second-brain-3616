import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ASAAS-PAYMENT] ${step}${detailsStr}`);
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
    return `Pagamento não encontrado no Asaas. Pode ter sido cancelado ou não existe.`;
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
    logStep("🚀 Function started");

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
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      logStep("❌ Authentication error", { error: authError.message });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user) {
      logStep("❌ User not authenticated");
      throw new Error("User not authenticated");
    }
    logStep("✅ User authenticated", { userId: user.id });

    // 📥 PARSE DO BODY COM VALIDAÇÃO ROBUSTA
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      logStep("❌ Failed to parse request body", { error: e.message, contentType: req.headers.get('content-type') });
      throw new Error("Invalid JSON in request body");
    }

    const { paymentId } = requestBody;
    if (!paymentId) {
      throw new Error("paymentId is required");
    }
    logStep("🔍 Checking payment", { paymentId });

    // 🔧 VALIDAÇÃO E CORREÇÃO DA CONFIGURAÇÃO ASAAS
    const rawApiKey = Deno.env.get("ASAAS_API_KEY");
    const rawBaseUrl = Deno.env.get("ASAAS_API_BASE_URL");
    
    const { apiKey, baseUrl, environment } = validateAndFixAsaasConfig(rawApiKey, rawBaseUrl);

    // 📊 CONSULTAR STATUS DO PAGAMENTO NO ASAAS
    const paymentResponse = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      logStep("❌ Payment fetch failed", { 
        status: paymentResponse.status, 
        error: errorText,
        environment,
        paymentId
      });
      
      const friendlyError = mapAsaasError(paymentResponse.status, errorText, "consulta de pagamento");
      throw new Error(friendlyError);
    }

    const payment = await paymentResponse.json();
    if (!payment.id) {
      logStep("❌ Invalid payment response", payment);
      throw new Error("Invalid payment response");
    }
    
    logStep("✅ Payment status fetched", { 
      paymentId, 
      status: payment.status,
      value: payment.value,
      environment
    });

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
      confirmedDate: payment.confirmedDate,
      billingType: payment.billingType,
      environment: environment
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 CRITICAL ERROR in check-asaas-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      diagnostic: "Se o erro persistir, use o botão de diagnóstico na interface de pagamento."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});