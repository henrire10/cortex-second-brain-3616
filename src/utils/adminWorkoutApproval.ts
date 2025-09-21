import { supabase } from '@/integrations/supabase/client';

export const approveUserWorkouts = async (userEmail: string, adminUserId: string) => {
  try {
    // 1. Encontrar o usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id, profile_status')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      throw new Error(`Usuário não encontrado: ${userEmail}`);
    }

    const userId = userData.user_id;

    // 2. Buscar treinos pendentes nos próximos 30 dias
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: pendingWorkouts, error: workoutsError } = await supabase
      .from('daily_workouts')
      .select('id, workout_date')
      .eq('user_id', userId)
      .gte('workout_date', new Date().toISOString().split('T')[0])
      .lte('workout_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .in('approval_status', ['pending_approval', 'pending']);

    if (workoutsError) {
      throw new Error(`Erro ao buscar treinos: ${workoutsError.message}`);
    }

    if (!pendingWorkouts || pendingWorkouts.length === 0) {
      throw new Error('Nenhum treino pendente encontrado para os próximos 30 dias');
    }

    // 3. Aprovar todos os treinos em lote
    const workoutIds = pendingWorkouts.map(w => w.id);
    
    const { error: approvalError } = await supabase
      .from('daily_workouts')
      .update({
        approval_status: 'approved',
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        trainer_payout: 5.00,
        status: 'sent'
      })
      .in('id', workoutIds);

    if (approvalError) {
      throw new Error(`Erro ao aprovar treinos: ${approvalError.message}`);
    }

    // 4. Atualizar profile_status se necessário
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
        console.error('Erro ao atualizar profile_status:', profileError);
      }
    }

    return {
      success: true,
      message: `${pendingWorkouts.length} treinos aprovados para ${userEmail}`,
      approvedWorkouts: pendingWorkouts.length
    };

  } catch (error) {
    console.error('Erro na aprovação de treinos:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      approvedWorkouts: 0
    };
  }
};