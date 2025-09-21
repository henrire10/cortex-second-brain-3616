import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkoutData {
  id: string;
  workout_title: string;
  workout_content: string;
  workout_date: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  name: string;
}

interface UserWhatsApp {
  phone_number: string;
  opted_in: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { workout_id, dry_run, test_hardcoded, scheduled_send } = await req.json();

    if (!workout_id) {
      return new Response(
        JSON.stringify({ error: 'workout_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing workout for WhatsApp send:', workout_id, 
      dry_run ? '(DRY RUN)' : '', 
      test_hardcoded ? '(HARDCODED TEST)' : '',
      scheduled_send ? '(SCHEDULED SEND)' : ''
    );

    // Check if all required environment variables are present
    const melhorZapUrl = Deno.env.get('MELHORZAP_API_URL');
    const instanceId = Deno.env.get('MELHORZAP_INSTANCE_ID');
    const accessToken = Deno.env.get('MELHORZAP_ACCESS_TOKEN');

    console.log('Environment check:', {
      melhorZapUrl: melhorZapUrl ? 'Present' : 'Missing',
      instanceId: instanceId ? 'Present' : 'Missing',
      accessToken: accessToken ? 'Present' : 'Missing'
    });

    if (!melhorZapUrl || !instanceId || !accessToken) {
      console.error('Missing MelhorZap configuration');
      const missingVars = [];
      if (!melhorZapUrl) missingVars.push('MELHORZAP_API_URL');
      if (!instanceId) missingVars.push('MELHORZAP_INSTANCE_ID');
      if (!accessToken) missingVars.push('MELHORZAP_ACCESS_TOKEN');
      
      return new Response(
        JSON.stringify({ 
          error: 'WhatsApp service not configured', 
          missing: missingVars,
          details: 'Configure as variáveis de ambiente necessárias' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If it's a dry run (connection test), return success without processing
    if (dry_run) {
      console.log('Dry run successful - API configuration is valid');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'API configuration test successful',
          dry_run: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get workout data
    const { data: workout, error: workoutError } = await supabase
      .from('daily_workouts')
      .select('*')
      .eq('id', workout_id)
      .single();

    if (workoutError || !workout) {
      console.error('Workout fetch error:', workoutError);
      return new Response(
        JSON.stringify({ error: 'Workout not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Workout data retrieved:', {
      id: workout.id,
      title: workout.workout_title,
      date: workout.workout_date,
      user_id: workout.user_id,
      status: workout.status
    });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', workout.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no profile found, create a default one
    let userName = 'Usuário';
    if (!profile) {
      console.log('No profile found for user:', workout.user_id, 'using default name');
      
      // Try to get user info from auth.users to get email/name
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(workout.user_id);
      
      if (authUser?.user) {
        userName = authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Usuário';
        
        // Create profile entry for future use
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: workout.user_id,
            name: userName
          });
        
        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
        }
      }
    } else {
      userName = profile.name;
    }

    console.log('User name resolved:', userName);

    // Get user WhatsApp info
    const { data: whatsappInfo, error: whatsappError } = await supabase
      .from('user_whatsapp')
      .select('*')
      .eq('user_id', workout.user_id)
      .eq('opted_in', true)
      .maybeSingle();

    if (whatsappError) {
      console.error('WhatsApp fetch error:', whatsappError);
      return new Response(
        JSON.stringify({ error: 'Error fetching WhatsApp info' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!whatsappInfo) {
      console.log('No WhatsApp info found for user:', workout.user_id);
      return new Response(
        JSON.stringify({ error: 'User not opted in for WhatsApp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number correctly
    let formattedPhone = whatsappInfo.phone_number.replace(/\D/g, '');
    
    // Add country code if not present (assume Brazil +55)
    if (formattedPhone.length === 11 && !formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    // Build the message with improved formatting
    let message: string;
    
    if (test_hardcoded) {
      console.log('Using hardcoded test message');
      message = `Olá ${userName}! 👋

Seu treino de hoje no BiaFitness está pronto! 💪

🔥 Teste de Treino Hardcoded 🔥
1️⃣ Supino Reto: 3 séries de 10 repetições (60-80kg), Descanso: 90s
2️⃣ Crucifixo Inclinado: 3 séries de 12 repetições (20-30kg), Descanso: 60s  
3️⃣ Tríceps Pulley: 3 séries de 15 repetições (25-35kg), Descanso: 45s

✅ Quando terminar, responda *FEITO* para marcar como concluído!

🚀 Consistência gera resultado. Você está no caminho certo!`;
    } else {
      // Format workout date
      const workoutDate = new Date(workout.workout_date).toLocaleDateString('pt-BR');
      
      // Enhanced message formatting for scheduled or manual sends
      const greeting = scheduled_send ? 
        `🌅 *Bom dia, ${userName}!* 

Aqui está seu treino de hoje! 💪` :
        `Olá ${userName}! 👋

Seu treino está pronto! 💪`;

      const workoutTitle = `📋 *${workout.workout_title}*`;
      
      // Parse and enhance workout content to include weights
      let enhancedContent = '';
      const lines = workout.workout_content.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          // Se a linha já tem peso, manter. Senão, é do formato antigo
          if (!line.includes('kg') && !line.includes('Peso corporal')) {
            // Formato antigo - adicionar peso sugerido baseado no exercício
            enhancedContent += line;
            if (line.toLowerCase().includes('supino') || line.toLowerCase().includes('leg press')) {
              enhancedContent += ' (60-80kg)';
            } else if (line.toLowerCase().includes('rosca') || line.toLowerCase().includes('tríceps')) {
              enhancedContent += ' (15-25kg)';
            } else if (line.toLowerCase().includes('agachamento') || line.toLowerCase().includes('flexora')) {
              enhancedContent += ' (40-60kg)';
            }
          } else {
            enhancedContent += line;
          }
          enhancedContent += '\n';
        }
      });
      
      const footer = scheduled_send ?
        `✅ Responda *FEITO* quando finalizar
❌ Responda *NÃO* se não conseguir treinar

🚀 Consistência gera resultado. Você está no caminho certo!` :
        `✅ Responda *FEITO* quando finalizar o treino
❌ Responda *NÃO* se não conseguir treinar hoje

💪 Vamos nessa! Você consegue!`;

      message = `${greeting}

${workoutTitle}

${enhancedContent.trim()}

${footer}`;
    }

    console.log('Message prepared, length:', message.length);

    // Send message via MelhorZap API
    const apiUrl = "https://app.melhorzap.com/api/send";

    const payload = {
      number: formattedPhone,
      type: "text",
      message: message,
      instance_id: instanceId.trim(),
      access_token: accessToken.trim()
    };

    console.log('Sending message to:', formattedPhone, 'for workout:', workout_id);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BiaFitness-WhatsApp-Bot/1.0'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    
    console.log('MelhorZap response status:', response.status);
    console.log('MelhorZap response body:', result);

    if (!response.ok) {
      console.error('MelhorZap API error. Status:', response.status);
      console.error('MelhorZap API error body:', result);
      
      // Log error for scheduled sends
      if (scheduled_send) {
        await supabase
          .from('system_logs')
          .insert({
            log_level: 'ERROR',
            message: `Erro ao enviar treino via WhatsApp para ${userName} (${formattedPhone}): ${result}`
          });
      }
      
      let errorMessage = 'Failed to send WhatsApp message';
      if (result.includes('token') || result.includes('acesso')) {
        errorMessage = 'Token de acesso inválido ou expirado';
      } else if (result.includes('instance')) {
        errorMessage = 'Instância do WhatsApp não encontrada ou inativa';
      } else if (result.includes('number')) {
        errorMessage = 'Número de telefone inválido';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage, 
          details: result,
          status: response.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Message sent successfully via MelhorZap');

    // Try to parse result as JSON, fall back to text
    let resultData;
    try {
      resultData = JSON.parse(result);
    } catch {
      resultData = { message: result, raw_response: true };
    }

    // Log the message in our database
    const { error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: workout.user_id,
        phone_number: formattedPhone,
        message_content: message,
        message_type: scheduled_send ? 'scheduled_workout' : 'workout_notification',
        status: 'sent',
        webhook_id: resultData.message_id || null
      });

    if (logError) {
      console.error('Error logging message:', logError);
    }

    // Update workout as sent
    const { error: updateError } = await supabase
      .from('daily_workouts')
      .update({ 
        sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .eq('id', workout_id);

    if (updateError) {
      console.error('Error updating workout status:', updateError);
    }

    // Log success for scheduled sends
    if (scheduled_send) {
      await supabase
        .from('system_logs')
        .insert({
          log_level: 'INFO',
          message: `Treino enviado com sucesso via WhatsApp para ${userName} (${formattedPhone})`
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: scheduled_send ? 'Scheduled workout sent successfully' : 
                 test_hardcoded ? 'Test message sent successfully' : 
                 'Workout message sent successfully',
        message_id: resultData.message_id || 'success',
        phone: formattedPhone,
        scheduled: scheduled_send || false,
        api_response: resultData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-workout:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
