
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell, TrendingUp, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutHistory {
  id: string;
  workout_date: string;
  workout_title: string;
  workout_content: string;
  status: string;
  completed_at?: string;
}

export const WorkoutHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    currentStreak: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  const loadWorkoutHistory = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('workout_date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
      }

      if (data) {
        setWorkoutHistory(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (workouts: WorkoutHistory[]) => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekCount = workouts.filter(w => 
      new Date(w.workout_date) >= startOfWeek
    ).length;

    const thisMonthCount = workouts.filter(w => 
      new Date(w.workout_date) >= startOfMonth
    ).length;

    setStats({
      totalCompleted: workouts.length,
      currentStreak: 0, // Implementar lógica de streak
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount
    });
  };

  useEffect(() => {
    loadWorkoutHistory();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            <div className="text-sm opacity-90">Total Concluídos</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <div className="text-sm opacity-90">Esta Semana</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Treinos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico de Treinos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workoutHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum treino concluído ainda
              </h3>
              <p className="text-gray-600 text-sm">
                Complete seu primeiro treino para vê-lo aqui!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workoutHistory.map((workout) => (
                <div
                  key={workout.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 flex-1">
                      {workout.workout_title}
                    </h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Concluído
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(workout.workout_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    {workout.completed_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(workout.completed_at), 'HH:mm')}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {workout.workout_content.split('\n').slice(0, 3).map((line, index) => (
                      <div key={index} className="mb-1">{line}</div>
                    ))}
                    {workout.workout_content.split('\n').length > 3 && (
                      <div className="text-gray-500 italic">
                        ... e mais exercícios
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
