import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-DIAGNOSTICS] ${step}${detailsStr}`);
};

// 🔧 VALIDAÇÃO E CORREÇÃO AUTOMÁTICA DE CONFIGURAÇÃO
const validateAndFixAsaasConfig = (apiKey: string | null, baseUrl: string | null) => {
  const results = {
    configErrors: [] as string[],
    warnings: [] as string[],
    fixes: [] as string[],
    finalConfig: { apiKey: '', baseUrl: '', environment: '' }
  };

  if (!apiKey) {
    results.configErrors.push("ASAAS_API_KEY não configurado");
    return results;
  }

  // 🚨 DETECTAR CHAVE NO LUGAR DA URL
  if (baseUrl && baseUrl.startsWith('$aact_')) {
    results.configErrors.push("ASAAS_API_BASE_URL contém uma API key em vez de uma URL");
    results.fixes.push("Corrigindo automaticamente para URL apropriada");
    baseUrl = null;
  }

  // 🔄 AUTO-DETECÇÃO DO AMBIENTE
  const isSandbox = apiKey.includes('hmlg') || apiKey.includes('sandbox');
  const correctBaseUrl = isSandbox 
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";

  // Se baseUrl está incorreto ou não foi fornecido, usar o correto
  if (!baseUrl || baseUrl === apiKey || !baseUrl.startsWith('http')) {
    if (baseUrl && baseUrl !== correctBaseUrl) {
      results.warnings.push(`URL base incorreta: ${baseUrl}`);
    }
    results.fixes.push(`Usando URL correta para ambiente: ${correctBaseUrl}`);
    baseUrl = correctBaseUrl;
  }

  // 🔍 VALIDAÇÃO CRUZADA
  const urlIsSandbox = baseUrl.includes('sandbox');
  if (isSandbox !== urlIsSandbox) {
    results.warnings.push("Incompatibilidade entre ambiente da chave e URL");
    results.fixes.push(`Priorizando ambiente da chave: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
    baseUrl = correctBaseUrl;
  }

  results.finalConfig = {
    apiKey,
    baseUrl,
    environment: isSandbox ? 'SANDBOX' : 'PRODUCTION'
  };

  return results;
};

// 🧪 TESTES DE CONECTIVIDADE
const testAsaasConnectivity = async (apiKey: string, baseUrl: string) => {
  const tests = {
    basicAuth: { status: 'pending', error: null as string | null },
    customerList: { status: 'pending', error: null as string | null },
    apiHealth: { status: 'pending', error: null as string | null }
  };

  try {
    // Teste 1: Autenticação básica
    logStep("🧪 Testing basic authentication");
    const authResponse = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (authResponse.ok) {
      tests.basicAuth.status = 'success';
      logStep("✅ Basic auth test passed");
    } else {
      tests.basicAuth.status = 'failed';
      tests.basicAuth.error = `HTTP ${authResponse.status}: ${authResponse.statusText}`;
      logStep("❌ Basic auth test failed", { status: authResponse.status });
    }

    // Teste 2: Listar clientes (capacidade de leitura)
    if (authResponse.ok) {
      logStep("🧪 Testing customer list access");
      const customerData = await authResponse.json();
      tests.customerList.status = 'success';
      logStep("✅ Customer list test passed", { count: customerData.data?.length || 0 });
    } else {
      tests.customerList.status = 'failed';
      tests.customerList.error = "Auth failed, skipping customer test";
    }

    // Teste 3: Verificar saúde da API
    logStep("🧪 Testing API health");
    const healthResponse = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (healthResponse.ok) {
      tests.apiHealth.status = 'success';
      logStep("✅ API health test passed");
    } else {
      tests.apiHealth.status = 'failed';
      tests.apiHealth.error = `API não responsiva: ${healthResponse.status}`;
      logStep("❌ API health test failed");
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    tests.basicAuth.status = 'failed';
    tests.basicAuth.error = `Network error: ${errorMsg}`;
    tests.customerList.status = 'failed';
    tests.customerList.error = "Network error";
    tests.apiHealth.status = 'failed';
    tests.apiHealth.error = "Network error";
    logStep("💥 Connectivity test failed", { error: errorMsg });
  }

  return tests;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🚀 ASAAS Diagnostics started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // 🔐 AUTENTICAÇÃO (opcional para diagnósticos)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    logStep("👤 User context", { hasUser: !!user, userId: user?.id });

    // 🔧 FASE 1: VALIDAÇÃO DE CONFIGURAÇÃO
    logStep("🔧 FASE 1: Validando configuração dos secrets");
    const rawApiKey = Deno.env.get("ASAAS_API_KEY");
    const rawBaseUrl = Deno.env.get("ASAAS_API_BASE_URL");
    
    const configValidation = validateAndFixAsaasConfig(rawApiKey, rawBaseUrl);
    
    // Se há erros críticos de configuração, parar aqui
    if (configValidation.configErrors.length > 0) {
      logStep("❌ Critical configuration errors found");
      return new Response(JSON.stringify({
        success: false,
        phase: "configuration",
        configErrors: configValidation.configErrors,
        recommendations: [
          "Configure ASAAS_API_KEY no dashboard do Supabase",
          "Configure ASAAS_API_BASE_URL (ou deixe vazio para auto-detecção)",
          "Certifique-se de usar a chave correta para o ambiente desejado"
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 🧪 FASE 2: TESTES DE CONECTIVIDADE
    logStep("🧪 FASE 2: Testando conectividade com Asaas");
    const connectivityTests = await testAsaasConnectivity(
      configValidation.finalConfig.apiKey,
      configValidation.finalConfig.baseUrl
    );

    // 📊 FASE 3: RELATÓRIO FINAL
    logStep("📊 FASE 3: Gerando relatório de diagnóstico");
    
    const allTestsPassed = Object.values(connectivityTests).every(test => test.status === 'success');
    const hasWarnings = configValidation.warnings.length > 0;

    let status = 'healthy';
    if (!allTestsPassed) status = 'error';
    else if (hasWarnings) status = 'warning';

    const recommendations = [];
    
    if (configValidation.warnings.length > 0) {
      recommendations.push("Verifique a configuração dos secrets no Supabase");
    }
    
    if (connectivityTests.basicAuth.status === 'failed') {
      recommendations.push("Verifique se a ASAAS_API_KEY está correta");
      recommendations.push("Confirme se você está usando o ambiente correto (sandbox vs production)");
    }
    
    if (allTestsPassed) {
      recommendations.push("✅ Configuração OK! Se ainda há erros, verifique os logs detalhados.");
    }

    const diagnosticReport = {
      success: true,
      timestamp: new Date().toISOString(),
      status,
      environment: configValidation.finalConfig.environment,
      
      configuration: {
        hasApiKey: !!rawApiKey,
        hasBaseUrl: !!rawBaseUrl,
        autoDetectedBaseUrl: configValidation.finalConfig.baseUrl,
        warnings: configValidation.warnings,
        fixes: configValidation.fixes
      },
      
      connectivity: connectivityTests,
      
      summary: {
        allTestsPassed,
        hasConfigWarnings: hasWarnings,
        canCreatePayments: allTestsPassed && connectivityTests.basicAuth.status === 'success',
        canCheckPayments: allTestsPassed && connectivityTests.basicAuth.status === 'success'
      },
      
      recommendations
    };

    logStep("✅ Diagnostic complete", { 
      status, 
      allTestsPassed, 
      environment: configValidation.finalConfig.environment 
    });

    return new Response(JSON.stringify(diagnosticReport), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 CRITICAL ERROR in asaas-diagnostics", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: "Diagnostic failed",
      message: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});