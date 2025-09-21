import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface CompletedWorkout {
  id: string;
  workout_date: string;
  status: string;
  completed_at: string;
}

export const useWorkoutCompletion = () => {
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Carregar treinos concluídos do banco
  const loadCompletedWorkouts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: completed, error } = await supabase
        .from('daily_workouts')
        .select('id, workout_date, status, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('workout_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('workout_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) {
        console.error('❌ Error loading completed workouts:', error);
        return;
      }

      const completedMap: Record<string, boolean> = {};
      completed?.forEach((workout: CompletedWorkout) => {
        completedMap[workout.workout_date] = true;
      });

      console.log('✅ Loaded completed workouts:', completedMap);
      setCompletedWorkouts(completedMap);

    } catch (error) {
      console.error('❌ Unexpected error loading completed workouts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Marcar treino como concluído
  const completeWorkout = useCallback(async (workoutDate: string, workoutData?: any) => {
    if (!user?.id || !workoutDate) {
      console.error('Missing user ID or workout date');
      return false;
    }

    try {
      console.log('🔄 Completing workout for date:', workoutDate);

      // Verificar se já existe o treino
      const { data: existing, error: checkError } = await supabase
        .from('daily_workouts')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('workout_date', workoutDate)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing workout:', checkError);
        throw checkError;
      }

      if (existing?.id) {
        // Já existe - apenas atualizar status
        const { error: updateError } = await supabase
          .from('daily_workouts')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating workout:', updateError);
          throw updateError;
        }

        console.log('✅ Updated existing workout:', existing.id);
      } else {
        // Criar novo treino concluído
        const exercises = workoutData?.exercises || [];
        let workoutContent = '';
        exercises.forEach((ex: any, i: number) => {
          workoutContent += `${i + 1}️⃣ ${ex.name}: ${ex.sets}x${ex.reps}${ex.rest ? ` - Descanso: ${ex.rest}` : ''}\n`;
        });

        const { error: insertError } = await supabase
          .from('daily_workouts')
          .insert([{
            user_id: user.id,
            workout_date: workoutDate,
            workout_title: workoutData?.title || 'Treino Completo',
            workout_content: workoutContent,
            status: 'completed',
            completed_at: new Date().toISOString(),
            approval_status: 'pending_approval'
          }]);

        if (insertError) {
          console.error('Error inserting workout:', insertError);
          throw insertError;
        }

        console.log('✅ Created new completed workout for date:', workoutDate);
      }

      // Atualizar streak
      try {
        const { error: streakError } = await supabase.functions.invoke('update-workout-streak', {
          body: { user_id: user.id, workout_date: workoutDate }
        });
        
        if (streakError) {
          console.warn('⚠️ Warning: Could not update workout streak:', streakError);
        } else {
          console.log('✅ Workout streak updated successfully');
        }
      } catch (streakErr) {
        console.warn('⚠️ Warning: Streak update failed:', streakErr);
      }

      // Atualizar estado local imediatamente
      setCompletedWorkouts(prev => ({ ...prev, [workoutDate]: true }));
      
      toast({ 
        title: 'Treino concluído! ✅', 
        description: 'Parabéns, progresso salvo no calendário.' 
      });

      // Recarregar dados após um delay
      setTimeout(() => {
        loadCompletedWorkouts();
      }, 1000);

      return true;

    } catch (error: any) {
      console.error('Error completing workout:', error);
      toast({ 
        title: 'Erro ao concluir treino', 
        description: error.message || 'Tente novamente.', 
        variant: 'destructive' 
      });
      return false;
    }
  }, [user?.id, loadCompletedWorkouts]);

  // Verificar se um treino está concluído
  const isWorkoutCompleted = useCallback((workoutDate: string) => {
    return completedWorkouts[workoutDate] || false;
  }, [completedWorkouts]);

  // Carregar ao inicializar
  useEffect(() => {
    if (user?.id) {
      loadCompletedWorkouts();
    }
  }, [user?.id, loadCompletedWorkouts]);

  return {
    completedWorkouts,
    loading,
    completeWorkout,
    isWorkoutCompleted,
    refreshCompletedWorkouts: loadCompletedWorkouts
  };
};