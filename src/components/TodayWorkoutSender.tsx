
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, Calendar, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface WorkoutPlan {
  weekNumber: number;
  goal: string;
  difficulty: string;
  estimatedCalories?: string;
  workoutDays: Array<{
    day: number;
    title: string;
    focus: string;
    duration: string;
    intensity?: string;
    estimatedCalories?: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: string;
      weight?: string;
      muscleGroup: string;
    }>;
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
  }>;
  weeklyTips: string[];
}

interface TodayWorkoutSenderProps {
  currentWorkout: WorkoutPlan | null;
}

export const TodayWorkoutSender: React.FC<TodayWorkoutSenderProps> = ({ currentWorkout }) => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const getTodayWorkout = () => {
    if (!currentWorkout) return null;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    // Lógica para mapear dias da semana para treinos baseado no número de dias
    const numDays = currentWorkout.workoutDays.length;
    let scheduledDays: number[] = [];
    
    switch (numDays) {
      case 1:
        scheduledDays = [3]; // Quarta
        break;
      case 2:
        scheduledDays = [2, 5]; // Terça e Sexta
        break;
      case 3:
        scheduledDays = [1, 3, 5]; // Segunda, Quarta, Sexta
        break;
      case 4:
        scheduledDays = [1, 2, 4, 5]; // Segunda, Terça, Quinta, Sexta
        break;
      case 5:
        scheduledDays = [1, 2, 3, 4, 5]; // Segunda à Sexta
        break;
      case 6:
        scheduledDays = [1, 2, 3, 4, 5, 6]; // Segunda ao Sábado
        break;
      default:
        scheduledDays = [1, 3, 5]; // Padrão: 3x por semana
    }

    const workoutIndex = scheduledDays.indexOf(dayOfWeek);
    
    if (workoutIndex === -1) {
      return null; // Hoje é dia de descanso
    }

    return currentWorkout.workoutDays[workoutIndex % currentWorkout.workoutDays.length];
  };

  const sendTodayWorkout = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!currentWorkout) {
      toast.error('Nenhum plano de treino ativo encontrado');
      return;
    }

    const todayWorkout = getTodayWorkout();
    if (!todayWorkout) {
      toast.error('Hoje é dia de descanso! Nenhum treino programado.');
      return;
    }

    setIsSending(true);
    try {
      // Obter data atual no Brasil
      const now = new Date();
      const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const today = brazilTime.toISOString().split('T')[0];

      // Formatar conteúdo do treino
      let workoutContent = '';
      const exercises = todayWorkout.exercises || [];
      
      exercises.forEach((exercise, index) => {
        workoutContent += `${index + 1}️⃣ ${exercise.name}: ${exercise.sets}x${exercise.reps}`;
        if (exercise.weight && exercise.weight !== 'Peso corporal') {
          workoutContent += ` (${exercise.weight})`;
        }
        workoutContent += '\n';
      });

      // Verificar se já existe treino para hoje
      const { data: existingWorkout, error: workoutError } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_date', today)
        .maybeSingle();

      if (workoutError && workoutError.code !== 'PGRST116') {
        console.error('Error checking existing workout:', workoutError);
        throw new Error('Erro ao verificar treino existente');
      }

      let workoutId;

      if (existingWorkout) {
        // Atualizar treino existente
        const { data: updatedWorkout, error: updateError } = await supabase
          .from('daily_workouts')
          .update({
            workout_title: todayWorkout.title,
            workout_content: workoutContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWorkout.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating workout:', updateError);
          throw new Error('Erro ao atualizar treino');
        }
        workoutId = updatedWorkout.id;
      } else {
        // Criar novo treino
        const { data: newWorkout, error: createError } = await supabase
          .from('daily_workouts')
          .insert({
            user_id: user.id,
            workout_date: today,
            workout_title: todayWorkout.title,
            workout_content: workoutContent,
            status: 'pending',
            approval_status: 'pending_approval'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating workout:', createError);
          throw new Error('Erro ao criar treino');
        }
        workoutId = newWorkout.id;
      }

      // Enviar via WhatsApp
      const { data, error } = await supabase.functions.invoke('send-whatsapp-workout', {
        body: { workout_id: workoutId }
      });

      if (error) {
        console.error('Error sending workout:', error);
        throw new Error(error.message || 'Erro ao enviar treino via WhatsApp');
      }

      if (data?.error) {
        console.error('WhatsApp service error:', data);
        throw new Error(data.error);
      }

      toast.success(`Treino enviado via WhatsApp para ${data.phone || 'seu número'}!`);
      setLastSent(new Date().toLocaleTimeString('pt-BR'));

    } catch (error: any) {
      console.error('Error sending today workout:', error);
      toast.error(`Erro ao enviar treino: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const todayWorkout = getTodayWorkout();
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const today = dayNames[new Date().getDay()];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Enviar Treino de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do Dia */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hoje ({today}):</span>
            {todayWorkout ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Dia de Treino
              </Badge>
            ) : (
              <Badge variant="secondary">
                Dia de Descanso
              </Badge>
            )}
          </div>

          {todayWorkout && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <div className="font-medium">{todayWorkout.title}</div>
              <div className="text-muted-foreground">
                {todayWorkout.focus} • {todayWorkout.duration}
                {todayWorkout.intensity && ` • ${todayWorkout.intensity}`}
              </div>
              {todayWorkout.estimatedCalories && (
                <div className="text-muted-foreground text-xs">
                  Calorias: {todayWorkout.estimatedCalories}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão de Envio */}
        <Button 
          onClick={sendTodayWorkout}
          disabled={isSending || !todayWorkout || !currentWorkout}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Enviando...' : 'Enviar Treino via WhatsApp'}
        </Button>

        {/* Informações Adicionais */}
        {!currentWorkout && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhum plano de treino ativo encontrado. Gere um plano primeiro.
            </AlertDescription>
          </Alert>
        )}

        {!todayWorkout && currentWorkout && (
          <Alert>
            <AlertDescription>
              Hoje é dia de descanso segundo seu plano de treino.
            </AlertDescription>
          </Alert>
        )}

        {lastSent && (
          <div className="text-xs text-muted-foreground text-center">
            Último envio: {lastSent}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
