import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🇧🇷 BRAZIL TIME: Função para obter data atual do Brasil
const getBrazilCurrentDate = (): Date => {
  const now = new Date();
  // Usar formatação específica para Brasil
  const brazilTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const year = parseInt(brazilTime.find(part => part.type === 'year')?.value || '2024');
  const month = parseInt(brazilTime.find(part => part.type === 'month')?.value || '1') - 1;
  const day = parseInt(brazilTime.find(part => part.type === 'day')?.value || '1');
  const hour = parseInt(brazilTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(brazilTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(brazilTime.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

// 🇧🇷 BRAZIL TIME: Função para obter string da data Brasil
const getBrazilCurrentDateString = (): string => {
  const brazilDate = getBrazilCurrentDate();
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

    console.log('🇧🇷 BRAZIL EDGE FUNCTION: Iniciando distribuição com Brazil Time...');

    // 🇧🇷 BRAZIL TIME: Usar data consistente do Brasil
    const brazilTime = getBrazilCurrentDate();
    const today = getBrazilCurrentDateString();
    const currentDayOfWeek = brazilTime.getDay(); // 0=Domingo, 1=Segunda, etc.

    console.log('📅 BRAZIL EDGE: Data e dia processados:', {
      today,
      currentDayOfWeek,
      dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][currentDayOfWeek],
      brazilTime: brazilTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });

    // 🚨 VALIDAÇÃO CRÍTICA: Se for domingo, não processar treinos
    if (currentDayOfWeek === 0) {
      console.log('🚫 BRAZIL DOMINGO DETECTADO: Sistema não processa treinos aos domingos. Dia de descanso obrigatório.');
      
      await supabase
        .from('system_logs')
        .insert({
          log_level: 'INFO',
          message: `🚫 BRAZIL DOMINGO: Sistema não processa treinos aos domingos (${today}). Dia de descanso obrigatório.`
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Domingo é dia de descanso obrigatório',
          skipped: true,
          date: today,
          day: 'Domingo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuários com WhatsApp ativo
    const { data: users, error: usersError } = await supabase
      .from('user_whatsapp')
      .select(`
        user_id,
        phone_number,
        profiles!inner(name, workout_days_per_week)
      `)
      .eq('opted_in', true);

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    let processedCount = 0;
    let workoutsCreated = 0;
    let skippedCount = 0;

    for (const user of users || []) {
      try {
        console.log('👤 BRAZIL Processing usuário:', user.profiles.name);

        // 🚨 CORREÇÃO CRÍTICA: Verificar se usuário já tem plano APROVADO
        const { data: approvedPlan, error: approvedPlanError } = await supabase
          .from('workout_plans_approval')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let isAutoApproved = false;
        let planIdToUse = null;
        let approvedTrainerId = null;

        if (approvedPlan) {
          console.log(`✅ PLANO APROVADO ENCONTRADO: ${user.profiles.name} - Auto-aprovação ativada`);
          isAutoApproved = true;
          planIdToUse = approvedPlan.id;
          approvedTrainerId = approvedPlan.trainer_id;
        } else {
          console.log(`⚠️ PLANO NÃO APROVADO: ${user.profiles.name} - Criando treinos para aprovação (máximo 7 dias)`);
        }

        // Buscar plano de treino ativo do usuário
        const { data: workoutPlan, error: planError } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (planError || !workoutPlan) {
          console.log('⚠️ Nenhum plano ativo para usuário:', user.profiles.name);
          skippedCount++;
          continue;
        }

        const planData = workoutPlan.plan_data;
        const workoutDays = planData.workoutDays || [];
        const totalWorkouts = workoutDays.length;

        if (totalWorkouts === 0) {
          console.log('⚠️ Plano sem treinos para usuário:', user.profiles.name);
          skippedCount++;
          continue;
        }

        console.log(`📋 BRAZIL Usuário ${user.profiles.name}: ${totalWorkouts} treinos definidos`, {
          totalWorkouts,
          currentDay: currentDayOfWeek,
          dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][currentDayOfWeek]
        });

        // 🚨 CORREÇÃO CRÍTICA: Se não tem plano aprovado, criar apenas treinos da primeira semana
        if (!isAutoApproved) {
          const firstWeekStart = new Date(today);
          const daysSinceMonday = (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1); // Domingo = 6 dias após segunda
          firstWeekStart.setDate(firstWeekStart.getDate() - daysSinceMonday);
          
          const firstWeekEnd = new Date(firstWeekStart);
          firstWeekEnd.setDate(firstWeekStart.getDate() + 6); // 7 dias da semana
          
          const currentDate = new Date(today);
          
          if (currentDate > firstWeekEnd) {
            console.log(`🚫 PLANO NÃO APROVADO: ${user.profiles.name} - Não criando treinos após primeira semana. Aguardando aprovação.`);
            skippedCount++;
            continue;
          }
          
          console.log(`⚠️ PRIMEIRA SEMANA: ${user.profiles.name} - Criando treino da primeira semana para aprovação`);
        }

        // 🔥 DISTRIBUIÇÃO INTELIGENTE BRASIL:
        // Criar mapeamento dinâmico baseado no total de treinos
        const getWorkoutMapping = (totalWorkouts: number): { [dayOfWeek: number]: number } => {
          if (totalWorkouts === 3) {
            return { 1: 0, 3: 1, 5: 2 }; // Seg/Qua/Sex
          } else if (totalWorkouts === 4) {
            return { 1: 0, 2: 1, 4: 2, 5: 3 }; // Seg/Ter/Qui/Sex
          } else if (totalWorkouts === 5) {
            return { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }; // Seg/Ter/Qua/Qui/Sex
          } else if (totalWorkouts >= 6) {
            return { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // Seg/Ter/Qua/Qui/Sex/Sab
          }
          return {};
        };

        const workoutMapping = getWorkoutMapping(totalWorkouts);
        const workoutIndex = workoutMapping[currentDayOfWeek];

        // Se não está no mapeamento = dia de descanso
        if (workoutIndex === undefined) {
          const distribution = totalWorkouts === 3 ? 'Seg/Qua/Sex' :
                             totalWorkouts === 4 ? 'Seg/Ter/Qui/Sex' :
                             totalWorkouts === 5 ? 'Seg/Ter/Qua/Qui/Sex' :
                             'Seg/Ter/Qua/Qui/Sex/Sab';
          console.log(`😴 BRAZIL DESCANSO INTELIGENTE: ${user.profiles.name} - Dia não mapeado (distribuição: ${distribution})`);
          continue;
        }

        const selectedWorkout = workoutDays[workoutIndex];

        if (!selectedWorkout) {
          console.log(`❌ BRAZIL Treino não encontrado no índice ${workoutIndex} para usuário ${user.profiles.name}`);
          skippedCount++;
          continue;
        }

        const workoutLetter = String.fromCharCode(65 + workoutIndex); // A, B, C, D, E...
        const distribution = totalWorkouts === 3 ? 'Seg/Qua/Sex' :
                           totalWorkouts === 4 ? 'Seg/Ter/Qui/Sex' :
                           totalWorkouts === 5 ? 'Seg/Ter/Qua/Qui/Sex' :
                           'Seg/Ter/Qua/Qui/Sex/Sab';
        console.log(`✅ BRAZIL DISTRIBUIÇÃO INTELIGENTE: ${user.profiles.name} -> Dia ${currentDayOfWeek} = Treino ${workoutLetter} (${selectedWorkout.title}) - Distribuição: ${distribution}`);

        // Verificar se já existe treino para hoje
        const { data: existingWorkout, error: existingError } = await supabase
          .from('daily_workouts')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('workout_date', today)
          .maybeSingle();

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('❌ Erro ao verificar treino existente:', existingError);
          continue;
        }

        // Formatar conteúdo do treino para WhatsApp
        let workoutContent = '';
        const exercises = selectedWorkout.exercises || [];
        
        exercises.forEach((exercise: any, index: number) => {
          workoutContent += `${index + 1}️⃣ ${exercise.name}: ${exercise.sets}x${exercise.reps}`;
          if (exercise.weight && exercise.weight !== 'Peso corporal') {
            workoutContent += ` (${exercise.weight})`;
          }
          if (exercise.rest) {
            workoutContent += ` - Descanso: ${exercise.rest}`;
          }
          workoutContent += '\n';
        });

        const workoutTitle = selectedWorkout.title;

        // 🚨 CORREÇÃO: REMOVER AUTO-APROVAÇÃO - Todos os treinos precisam aprovação manual
        const finalApprovalStatus = 'pending_approval';
        const finalStatus = 'pending';

        if (existingWorkout) {
          // Atualizar treino existente
          await supabase
            .from('daily_workouts')
            .update({
              workout_title: workoutTitle,
              workout_content: workoutContent,
              approval_status: finalApprovalStatus,
              status: finalStatus,
              approved_by: null,
              approved_at: null,
              plan_id: planIdToUse,
              trainer_payout: 0,
              user_completion_payment: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingWorkout.id);

          console.log(`✅ Treino ${workoutLetter} atualizado para ${user.profiles.name} - ${today} (PENDENTE APROVAÇÃO)`);
        } else {
          // Criar novo treino
          await supabase
            .from('daily_workouts')
            .insert({
              user_id: user.user_id,
              workout_date: today,
              workout_title: workoutTitle,
              workout_content: workoutContent,
              status: finalStatus,
              approval_status: finalApprovalStatus,
              approved_by: null,
              approved_at: null,
              plan_id: planIdToUse,
              trainer_payout: 0,
              user_completion_payment: 0
            });

          console.log(`✅ Treino ${workoutLetter} criado para ${user.profiles.name} - ${today} (PENDENTE APROVAÇÃO)`);
          workoutsCreated++;
        }

        processedCount++;

      } catch (userError) {
        console.error('❌ BRAZIL Erro ao processar usuário:', user.profiles.name, userError);
        skippedCount++;
      }
    }

    // Log do resultado
    await supabase
      .from('system_logs')
      .insert({
        log_level: 'INFO',
        message: `✅ BRAZIL TIME EDGE! Data: ${today}, Dia: ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDayOfWeek]}. Processados: ${processedCount}, Criados: ${workoutsCreated}, Ignorados: ${skippedCount}. TODOS OS TREINOS PRECISAM DE APROVAÇÃO MANUAL DO PERSONAL.`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `BRAZIL TIME EDGE! Processados ${processedCount} usuários, criados ${workoutsCreated} novos treinos TODOS PENDENTES DE APROVAÇÃO`,
        processed: processedCount,
        workouts_created: workoutsCreated,
        skipped: skippedCount,
        date: today,
        day_of_week: currentDayOfWeek,
        day_name: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][currentDayOfWeek],
        feature: 'brazil_time_consistency'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ BRAZIL Erro na distribuição:', error);
    
    // Log do erro
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabase
      .from('system_logs')
      .insert({
        log_level: 'ERROR',
        message: `❌ BRAZIL Erro na distribuição: ${error.message}`
      });

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
