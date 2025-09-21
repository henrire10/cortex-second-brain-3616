
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

    const { message, from, timestamp, message_id } = webhookData;
    
    if (!message || !from) {
      console.log('Invalid webhook data - missing message or from');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phoneNumber = from.replace(/\D/g, '');
    
    // Buscar usuário por telefone
    const { data: userWhatsApp, error: userError } = await supabase
      .from('user_whatsapp')
      .select('user_id, phone_number')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError || !userWhatsApp) {
      console.log('User not found for phone number:', phoneNumber);
      await supabase
        .from('whatsapp_messages')
        .insert({
          phone_number: phoneNumber,
          message_content: message,
          message_type: 'incoming_unknown',
          status: 'received',
          webhook_id: message_id
        });
      
      return new Response(
        JSON.stringify({ success: true, message: 'Message logged but user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log da mensagem recebida
    const { error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userWhatsApp.user_id,
        phone_number: phoneNumber,
        message_content: message,
        message_type: 'incoming_response',
        status: 'received',
        webhook_id: message_id
      });

    if (logError) {
      console.error('Error logging message:', logError);
    }

    // Processamento aprimorado da mensagem
    const messageText = message.toLowerCase().trim();
    
    // Palavras de confirmação expandidas
    const positiveWords = [
      'feito', 'pronto', 'concluído', 'concluido', 'terminei', 'finalizado', 
      'acabei', 'completei', 'ok', 'sim', 'yes', 'done', 'finished', 
      'completado', 'realizado', 'cumprido', 'executado', '✅', 'check',
      'finalizado', 'acabado', 'completo'
    ];
    
    const negativeWords = [
      'não', 'nao', 'no', 'não consegui', 'nao consegui', 'não fiz', 
      'nao fiz', 'pulei', 'skipei', 'skip', 'não deu', 'nao deu',
      'impossível', 'impossivel', 'cancelar', 'desistir', 'parar'
    ];

    const isPositiveResponse = positiveWords.some(word => messageText.includes(word));
    const isNegativeResponse = negativeWords.some(word => messageText.includes(word));

    let responseMessage = '';
    let workoutUpdated = false;

    if (isPositiveResponse) {
      // Buscar treino de hoje
      const today = new Date().toISOString().split('T')[0];
      const { data: todayWorkout, error: workoutError } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('user_id', userWhatsApp.user_id)
        .eq('workout_date', today)
        .in('status', ['pending', 'sent'])
        .single();

      if (!workoutError && todayWorkout) {
        // Marcar como concluído
        const { error: updateError } = await supabase
          .from('daily_workouts')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', todayWorkout.id);

        if (!updateError) {
          workoutUpdated = true;
          responseMessage = `🎉 *Parabéns!* 

Treino marcado como concluído! 💪

Você está cada vez mais forte! Continue assim! 🚀

✨ *Pontos ganhos:* +10 pontos
🔥 *Sequência mantida!*

Amanhã tem mais! Descanse bem hoje. 😴`;
        } else {
          console.error('Error updating workout:', updateError);
          responseMessage = `Recebi sua confirmação! 😊 

Houve um probleminha ao atualizar, mas já anotei que você treinou! 💪

Continue assim! 🚀`;
        }
      } else {
        responseMessage = `Obrigado pela confirmação! 😊 

Não encontrei um treino pendente para hoje, mas é ótimo saber que você está se exercitando! 💪

Continue com essa dedicação! 🚀`;
      }
    } else if (isNegativeResponse) {
      responseMessage = `Sem problemas! 😊

Todo mundo tem dias difíceis. O importante é não desistir! 💪

Amanhã é uma nova oportunidade para arrasar no treino! 🚀

💡 *Dica:* Que tal tentar pelo menos 10 minutinhos de exercício hoje? Qualquer movimento conta! 🏃‍♂️`;
    } else {
      // Resposta genérica para mensagens não reconhecidas
      responseMessage = `Olá! 👋

Para confirmar seu treino, responda:
✅ *FEITO* - se concluiu o treino
❌ *NÃO* - se não conseguiu treinar

Outras palavras que funcionam:
✅ Pronto, Concluído, Terminei, OK
❌ Não consegui, Pulei, Não deu

Qualquer dúvida, estamos aqui para ajudar! 💪`;
    }

    // Enviar resposta via WhatsApp
    if (responseMessage) {
      const melhorZapUrl = Deno.env.get('MELHORZAP_API_URL');
      const instanceId = Deno.env.get('MELHORZAP_INSTANCE_ID');
      const accessToken = Deno.env.get('MELHORZAP_ACCESS_TOKEN');

      if (melhorZapUrl && instanceId && accessToken) {
        const responsePayload = {
          number: phoneNumber,
          message: responseMessage,
          instance_id: instanceId
        };

        console.log('Sending response message:', responsePayload);

        const response = await fetch(`${melhorZapUrl}/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(responsePayload)
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('Response sent successfully:', result);
          
          // Log da resposta enviada
          await supabase
            .from('whatsapp_messages')
            .insert({
              user_id: userWhatsApp.user_id,
              phone_number: phoneNumber,
              message_content: responseMessage,
              message_type: 'automated_response',
              status: 'sent',
              webhook_id: result.message_id || null
            });
        } else {
          console.error('Error sending response:', result);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        workout_updated: workoutUpdated,
        response_sent: !!responseMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
