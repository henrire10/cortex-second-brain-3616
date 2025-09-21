
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WorkoutPlan {
  id: string;
  weekNumber: number;
  goal: string;
  difficulty: string;
  estimatedCalories?: string;
  workoutDays: any[];
  weeklyTips: string[];
  plan_data?: any;
}

interface PlanData {
  workoutDays?: any[];
  weeklyTips?: string[];
  [key: string]: any;
}

export const useWorkoutData = () => {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();

  const loadWorkoutFromDatabase = async () => {
    if (!user?.id) {
      console.log('🔍 WORKOUT: No user ID available');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 WORKOUT: Loading workout from database for user:', user.id);
      
      const { data: workoutPlans, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ WORKOUT: Error loading workout from database:', error);
        setCurrentWorkout(null);
        return;
      }

      if (workoutPlans && workoutPlans.length > 0) {
        const plan = workoutPlans[0];
        const planData = plan.plan_data as PlanData | null;
        
        console.log('✅ WORKOUT: Workout loaded from database:', {
          id: plan.id,
          goal: plan.goal,
          difficulty: plan.difficulty,
          workoutDaysCount: planData?.workoutDays?.length || 0,
          totalExercises: planData?.workoutDays?.reduce((total: number, day: any) => 
            total + (day.exercises?.length || 0), 0) || 0,
          hasValidData: !!(planData?.workoutDays && planData.workoutDays.length > 0)
        });

        const standardizedWorkout: WorkoutPlan = {
          id: plan.id,
          weekNumber: plan.week_number || 1,
          goal: plan.goal || 'Melhorar condicionamento',
          difficulty: plan.difficulty || 'intermediario',
          estimatedCalories: plan.estimated_calories || '400-600',
          workoutDays: planData?.workoutDays || [],
          weeklyTips: planData?.weeklyTips || [
            'Mantenha-se hidratado durante os exercícios',
            'Respeite os tempos de descanso',
            'Aumente a carga progressivamente'
          ],
          plan_data: planData
        };

        setCurrentWorkout(standardizedWorkout);
      } else {
        console.log('⚠️ WORKOUT: No active workout plan found in database');
        setCurrentWorkout(null);
      }
    } catch (error) {
      console.error('❌ WORKOUT: Unexpected error loading workout:', error);
      setCurrentWorkout(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkout = async () => {
    console.log('🔄 WORKOUT: Refreshing workout data...');
    setIsLoading(true);
    
    // Aguardar um pouco para dar tempo do banco atualizar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await loadWorkoutFromDatabase();
  };

  // Verificar se o usuário tem perfil baseado no status correto
  const hasUserProfile = () => {
    if (!user?.id || !profile) return false;
    
    // Baseado no novo status: se completou questionário ou tem treino
    return ['questionario_concluido', 'gerando_treino', 'treino_gerado'].includes(profile.profile_status);
  };

  const hasCompleteWorkout = () => {
    if (!profile) return false;
    return profile.profile_status === 'treino_gerado' && currentWorkout !== null;
  };

  const isGeneratingWorkout = () => {
    if (!profile) return false;
    return profile.profile_status === 'gerando_treino';
  };

  const hasGenerationFailed = () => {
    if (!profile) return false;
    return profile.profile_status === 'falha_na_geracao';
  };

  useEffect(() => {
    if (user?.id && profile) {
      console.log('🔄 WORKOUT: User and profile available, checking status...', {
        userId: user.id,
        profileStatus: profile.profile_status,
        hasProfile: hasUserProfile()
      });
      
      // Carregar treino apenas se o status for 'treino_gerado'
      if (profile.profile_status === 'treino_gerado') {
        loadWorkoutFromDatabase();
      } else {
        console.log('⚠️ WORKOUT: Profile status indicates no workout ready yet:', profile.profile_status);
        setCurrentWorkout(null);
        setIsLoading(false);
      }
    } else {
      setCurrentWorkout(null);
      setIsLoading(false);
    }
  }, [user?.id, profile?.profile_status]);

  return {
    currentWorkout,
    isLoading,
    refreshWorkout,
    hasUserProfile: hasUserProfile(),
    hasCompleteWorkout: hasCompleteWorkout(),
    isGeneratingWorkout: isGeneratingWorkout(),
    hasGenerationFailed: hasGenerationFailed()
  };
};
