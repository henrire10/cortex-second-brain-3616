import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    logStep("Webhook data", { event: body.event, paymentId: body.payment?.id });

    const payment = body.payment;
    if (!payment) {
      logStep("No payment data in webhook");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Buscar usuário pelo externalReference (user_id)
    const userId = payment.externalReference;
    if (!userId) {
      logStep("No externalReference found");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let subscriptionStatus;
    let planId = null;
    let subscriptionEndsAt = null;

    switch (body.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        // Pagamento confirmado - ativar assinatura
        subscriptionStatus = "active";
        
        // Determinar plano baseado no valor
        const value = payment.value;
        if (value >= 350) {
          planId = "annual";
          // Assinatura anual - válida por 1 ano
          subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else if (value >= 140) {
          planId = "quarterly";
          // Assinatura trimestral - válida por 3 meses
          subscriptionEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          planId = "monthly";
          // Assinatura mensal - válida por 1 mês
          subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        logStep("Payment confirmed - activating subscription", {
          userId,
          planId,
          subscriptionEndsAt
        });
        break;
      }

      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED": {
        subscriptionStatus = "cancelled";
        logStep("Payment overdue/deleted - cancelling subscription", { userId });
        break;
      }

      default:
        logStep("Unhandled event type", { event: body.event });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
    }

    // Atualizar profile do usuário
    const updateData: any = {
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    };

    if (planId) {
      updateData.plan_id = planId;
    }

    if (subscriptionEndsAt) {
      updateData.subscription_ends_at = subscriptionEndsAt;
    }

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      logStep("Error updating profile", { error: updateError, userId });
      throw updateError;
    }

    logStep("Profile updated successfully", { userId, subscriptionStatus, planId });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in asaas-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});