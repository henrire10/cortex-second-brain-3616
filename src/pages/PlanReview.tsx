
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Dumbbell,
  Target,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkoutPlanData, ApprovePlanResponse } from '@/types/workout-plan';

const PlanReview = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [personalNotes, setPersonalNotes] = useState('');

  // Buscar dados do plano
  const { data: planData, isLoading } = useQuery({
    queryKey: ['plan-review', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_plans_approval')
        .select(`
          *,
          profiles!workout_plans_approval_user_id_fkey(name, email, fitness_goal, age, gender, experience_level),
          user_whatsapp!left(phone_number)
        `)
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!planId
  });

  // Buscar daily_workouts associados ao plano
  const { data: dailyWorkouts } = useQuery({
    queryKey: ['daily-workouts-by-plan', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('plan_id', planId)
        .order('workout_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!planId
  });

  // Mutation para aprovar plano
  const approvePlanMutation = useMutation({
    mutationFn: async ({ planId, trainerId }: { planId: string; trainerId: string }) => {
      const { data, error } = await supabase.rpc('approve_workout_plan', {
        p_plan_id: planId,
        p_trainer_id: trainerId
      });

      if (error) throw error;
      return data as unknown as ApprovePlanResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Plano Aprovado! ✅",
          description: `Plano aprovado com sucesso. Pagamento: R$ ${data.plan_payout?.toFixed(2)}`,
        });
        queryClient.invalidateQueries({ queryKey: ['plan-review'] });
        queryClient.invalidateQueries({ queryKey: ['admin-workout-plans-approval'] });
        navigate('/admin/approvals');
      } else {
        toast({
          title: "Erro na Aprovação",
          description: data.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Aprovação",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  const handleApprovePlan = () => {
    if (!user?.id || !planId) return;
    
    approvePlanMutation.mutate({
      planId,
      trainerId: user.id
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando plano...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plano não encontrado</h1>
          <Button onClick={() => navigate('/admin/approvals')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const workoutPlanData = planData.plan_data as unknown as WorkoutPlanData;
  const workoutDays = workoutPlanData?.workoutDays || [];
  const userProfile = Array.isArray(planData.profiles) ? planData.profiles[0] : planData.profiles;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/approvals')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Revisão de Plano de Treino</h1>
                <p className="text-gray-600">Analise e aprove o plano completo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                Aguardando Aprovação
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Cliente */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{userProfile?.name}</p>
                  <p className="text-sm text-gray-600">{userProfile?.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Idade</p>
                    <p className="font-medium">{userProfile?.age} anos</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gênero</p>
                    <p className="font-medium">{userProfile?.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Experiência</p>
                    <p className="font-medium">{userProfile?.experience_level}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Meta</p>
                    <p className="font-medium">{userProfile?.fitness_goal}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Data do Plano</p>
                  <p className="font-medium">
                    {format(new Date(planData.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Resumo do Plano */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Resumo do Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Objetivo</p>
                  <p className="font-medium">{workoutPlanData?.goal || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dificuldade</p>
                  <p className="font-medium">{workoutPlanData?.difficulty || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dias de Treino</p>
                  <p className="font-medium">{workoutDays.length} dias</p>
                </div>
                {workoutPlanData?.estimatedCalories && (
                  <div>
                    <p className="text-sm text-gray-500">Calorias Estimadas</p>
                    <p className="font-medium">{workoutPlanData.estimatedCalories}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dias de Treino */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Dias de Treino ({workoutDays.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workoutDays.map((day, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">
                          Dia {index + 1}: {day.title}
                        </h3>
                        <Badge variant="outline">
                          {day.exercises?.length || 0} exercícios
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500">Foco</p>
                          <p className="font-medium">{day.focus}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duração</p>
                          <p className="font-medium">{day.duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Dificuldade</p>
                          <p className="font-medium">{day.difficulty}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Exercícios:</h4>
                        {day.exercises?.map((exercise, exerciseIndex) => (
                          <div key={exerciseIndex} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {exerciseIndex + 1}. {exercise.name}
                              </span>
                              <span className="text-sm text-gray-600">
                                {exercise.sets}x{exercise.reps} - {exercise.rest}
                              </span>
                            </div>
                            {exercise.instructions && (
                              <p className="text-sm text-gray-600 mt-1">
                                {exercise.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notas do Personal */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notas do Personal Trainer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Adicione suas observações sobre o plano (opcional)..."
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="mt-6 flex gap-4">
              <Button
                onClick={handleApprovePlan}
                disabled={approvePlanMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {approvePlanMutation.isPending ? 'Aprovando...' : 'Aprovar Plano'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/admin/approvals')}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar Plano
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanReview;
