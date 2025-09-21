import { supabase } from '@/integrations/supabase/client';

// Função para executar aprovação direta dos treinos da Suzana
export const executeSuzanaApproval = async () => {
  try {
    console.log('🚀 Iniciando aprovação automática para suzanadossantoscosta63@gmail.com');

    // 1. Encontrar o usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id, profile_status, id')
      .eq('email', 'suzanadossantoscosta63@gmail.com')
      .single();

    if (userError || !userData) {
      console.error('❌ Usuário não encontrado:', userError);
      return;
    }

    const userId = userData.user_id;
    console.log('✅ Usuário encontrado:', { userId, profile_status: userData.profile_status });

    // 2. Buscar treinos pendentes nos próximos 30 dias
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: pendingWorkouts, error: workoutsError } = await supabase
      .from('daily_workouts')
      .select('id, workout_date, approval_status')
      .eq('user_id', userId)
      .gte('workout_date', new Date().toISOString().split('T')[0])
      .lte('workout_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    if (workoutsError) {
      console.error('❌ Erro ao buscar treinos:', workoutsError);
      return;
    }

    console.log('📊 Treinos encontrados:', {
      total: pendingWorkouts?.length || 0,
      pending: pendingWorkouts?.filter(w => w.approval_status === 'pending_approval' || w.approval_status === 'pending').length || 0
    });

    if (!pendingWorkouts || pendingWorkouts.length === 0) {
      console.log('⚠️ Nenhum treino encontrado para os próximos 30 dias');
      return;
    }

    // 3. Filtrar apenas treinos pendentes
    const workoutsToApprove = pendingWorkouts.filter(w => 
      w.approval_status === 'pending_approval' || w.approval_status === 'pending'
    );

    if (workoutsToApprove.length === 0) {
      console.log('⚠️ Todos os treinos já estão aprovados');
      return;
    }

    // 4. Aprovar todos os treinos em lote
    const workoutIds = workoutsToApprove.map(w => w.id);
    
    const { error: approvalError } = await supabase
      .from('daily_workouts')
      .update({
        approval_status: 'approved',
        approved_by: 'system-auto-approval',
        approved_at: new Date().toISOString(),
        trainer_payout: 5.00,
        status: 'sent'
      })
      .in('id', workoutIds);

    if (approvalError) {
      console.error('❌ Erro ao aprovar treinos:', approvalError);
      return;
    }

    console.log(`✅ ${workoutsToApprove.length} treinos aprovados com sucesso!`);

    // 5. Atualizar profile_status se necessário
    if (userData.profile_status !== 'treino_gerado') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          profile_status: 'treino_gerado',
          profile_completed: true,
          questionnaire_completed: true
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('❌ Erro ao atualizar profile_status:', profileError);
      } else {
        console.log('✅ Profile status atualizado para treino_gerado');
      }
    }

    console.log('🎉 Aprovação automática concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral na aprovação automática:', error);
  }
};

// Executar automaticamente quando o módulo for importado
setTimeout(() => {
  executeSuzanaApproval();
}, 1000);