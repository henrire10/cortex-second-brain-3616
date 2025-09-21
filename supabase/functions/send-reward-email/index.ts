
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RewardEmailRequest {
  userEmail: string;
  userName: string;
  reward: {
    title: string;
    description: string;
    type: string;
    value: string;
  };
}

const getRewardContent = (reward: any) => {
  switch (reward.type) {
    case 'spotify':
      return {
        subject: '🎵 Seu prêmio Spotify Premium chegou!',
        instructions: 'Entre em contato com nosso suporte através do email suporte@biafitness.com com o código SPOTIFY-PREMIUM-2024 para ativar seu mês grátis de Spotify Premium.',
        emoji: '🎵'
      };
    case 'netflix':
      return {
        subject: '🎬 Seu prêmio Netflix chegou!',
        instructions: 'Entre em contato com nosso suporte através do email suporte@biafitness.com com o código NETFLIX-PREMIUM-2024 para ativar seu mês grátis de Netflix.',
        emoji: '🎬'
      };
    case 'discount':
      return {
        subject: '💰 Seu desconto especial chegou!',
        instructions: `Use o código DESCONTO${reward.value.replace('%', '')} na sua próxima renovação para obter ${reward.value} de desconto.`,
        emoji: '💰'
      };
    default:
      return {
        subject: '🎁 Seu prêmio Bia Fitness chegou!',
        instructions: 'Seu prêmio foi adicionado automaticamente à sua conta.',
        emoji: '🎁'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, reward }: RewardEmailRequest = await req.json();
    const rewardContent = getRewardContent(reward);

    const emailResponse = await resend.emails.send({
      from: "Bia Fitness <noreply@biafitness.com>",
      to: [userEmail],
      subject: rewardContent.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Seu Prêmio Bia Fitness</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                ${rewardContent.emoji} Parabéns!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Você ganhou um prêmio incrível!
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">
                  Olá, ${userName}!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">
                  Você alcançou um novo nível e ganhou este prêmio especial:
                </p>
              </div>

              <!-- Prize Card -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px solid #8b5cf6;">
                <div style="font-size: 48px; margin-bottom: 15px;">${rewardContent.emoji}</div>
                <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px; font-weight: bold;">
                  ${reward.title}
                </h3>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  ${reward.description}
                </p>
              </div>

              <!-- Instructions -->
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                  📋 Como resgatar seu prêmio:
                </h4>
                <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                  ${rewardContent.instructions}
                </p>
              </div>

              <!-- Footer Message -->
              <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
                  Continue treinando com a Bia Fitness e desbloqueie mais recompensas incríveis!
                </p>
                <p style="color: #8b5cf6; margin: 15px 0 0 0; font-size: 16px; font-weight: bold;">
                  💪 Bia Fitness Team
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                Este é um email automático. Para dúvidas, entre em contato em suporte@biafitness.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Reward email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reward-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
