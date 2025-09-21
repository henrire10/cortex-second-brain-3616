
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Target, 
  Calendar, 
  Check,
  Plus,
  Trash2,
  Clock,
  Scale,
  Activity,
  Heart,
  Dumbbell,
  Info,
  Users,
  MapPin,
  NotepadText,
  CheckCircle
} from 'lucide-react';
import { UserCompletionPaymentResponse } from '@/types/workout-plan';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  weight?: string;
  instructions: string;
}

// Interface atualizada para corresponder à nova view pending_workouts_with_profile
interface PendingWorkoutWithProfile {
  id: string;
  user_id: string;
  workout_date: string;
  workout_title: string;
  workout_content: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
  status: string;
  personal_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  trainer_payout: number | null;
  plan_id: string | null;
  sent_at: string | null;
  completed_at: string | null;
  timezone: string | null;
  total_estimated_calories: number | null;
  user_completion_payment: number | null;
  user_name: string | null;
  user_email: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  fitness_goal: string | null;
  experience_level: string | null;
  phone_number: string | null;
}

export default function PersonalReview() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isPersonalTrainer, loading: checkingRole } = usePersonalTrainer();
  
  const [workout, setWorkout] = useState<PendingWorkoutWithProfile | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userCompletionStatus, setUserCompletionStatus] = useState<{
    totalWorkouts: number;
    approvedWorkouts: number;
    isComplete: boolean;
    alreadyPaid: boolean;
  }>({
    totalWorkouts: 0,
    approvedWorkouts: 0,
    isComplete: false,
    alreadyPaid: false
  });

  useEffect(() => {
    if (!checkingRole && (!user || !isPersonalTrainer)) {
      navigate('/personal-login');
    }
  }, [user, isPersonalTrainer, checkingRole, navigate]);

  useEffect(() => {
    if (workoutId && isPersonalTrainer) {
      initializeWorkoutData();
    }
  }, [workoutId, isPersonalTrainer]);

  const initializeWorkoutData = async () => {
    try {
      console.log('🔍 Inicializando dados do treino usando nova view:', workoutId);
      
      // Usar a nova view pending_workouts_with_profile em vez de consultas complexas
      const { data: workoutData, error: workoutError } = await supabase
        .from('pending_workouts_with_profile')
        .select('*')
        .eq('id', workoutId)
        .maybeSingle();

      if (workoutError) {
        console.error('❌ Erro ao buscar treino:', workoutError);
        throw new Error(`Erro ao buscar treino: ${workoutError.message}`);
      }

      if (!workoutData) {
        throw new Error('Treino não encontrado ou já foi processado');
      }

      console.log('✅ Dados do treino carregados com sucesso:', workoutData);
      
      // Buscar dados completos do perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('specific_goal')
        .eq('id', workoutData.user_id)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
      }
      
      setWorkout(workoutData);
      setUserProfile(profileData);
      setWorkoutTitle(workoutData.workout_title);
      setPersonalNotes(workoutData.personal_notes || '');
      parseExercisesFromContent(workoutData.workout_content);
      
      await checkUserCompletionStatus(workoutData.user_id);
      
      setLoading(false);
      
    } catch (error: any) {
      console.error('❌ Erro ao inicializar:', error);
      
      toast({
        title: "Erro ao carregar treino",
        description: `Ocorreu um erro: ${error.message}. Voltando ao dashboard...`,
        variant: "destructive",
      });
      
      setTimeout(() => navigate('/personal-dashboard'), 3000);
    }
  };

  const checkUserCompletionStatus = async (userId: string) => {
    try {
      console.log('🔍 Verificando status de conclusão para usuário:', userId);
      
      const { data: workoutStats, error: statsError } = await supabase
        .from('daily_workouts')
        .select('approval_status, user_completion_payment, approved_by')
        .eq('user_id', userId)
        .gte('workout_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (statsError) {
        console.error('❌ Erro ao buscar estatísticas:', statsError);
        return;
      }

      const totalWorkouts = workoutStats?.length || 0;
      const approvedWorkouts = workoutStats?.filter(w => w.approval_status === 'approved').length || 0;
      const isComplete = totalWorkouts > 0 && totalWorkouts === approvedWorkouts;
      const alreadyPaid = workoutStats?.some(w => w.user_completion_payment > 0 && w.approved_by === user?.id) || false;

      setUserCompletionStatus({
        totalWorkouts,
        approvedWorkouts,
        isComplete,
        alreadyPaid
      });

      console.log('✅ Status de conclusão calculado:', {
        totalWorkouts,
        approvedWorkouts,
        isComplete,
        alreadyPaid
      });

    } catch (error: any) {
      console.error('❌ Erro ao verificar status de conclusão:', error.message);
    }
  };

  const parseExercisesFromContent = (content: string) => {
    console.log('🔍 Parseando exercícios do conteúdo');
    
    const lines = content.split('\n').filter(line => line.trim());
    const parsedExercises: Exercise[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^\d+️⃣\s+(.+?):\s*(\d+)x(.+?)(?:,\s*Descanso:\s*(.+?))?(?:\s*\((.+?)\))?$/);
      
      if (match) {
        const [, name, sets, reps, rest, weight] = match;
        
        const exercise = {
          name: name.trim(),
          sets: parseInt(sets) || 3,
          reps: reps.trim() || '10-12',
          rest: rest?.trim() || '60s',
          weight: weight?.trim() || '',
          instructions: 'Mantenha a forma correta e controle o movimento.'
        };
        
        parsedExercises.push(exercise);
      } else if (line.includes(':')) {
        const [name, details] = line.split(':');
        parsedExercises.push({
          name: name.replace(/^\d+️⃣\s*/, '').trim(),
          sets: 3,
          reps: details?.trim() || '10-12',
          rest: '60s',
          weight: '',
          instructions: 'Mantenha a forma correta e controle o movimento.'
        });
      }
    });

    if (parsedExercises.length === 0) {
      parsedExercises.push({
        name: 'Exercício Base',
        sets: 3,
        reps: '10-12',
        rest: '60s',
        weight: '',
        instructions: 'Instruções do exercício.'
      });
    }

    console.log('✅ Exercícios parseados:', parsedExercises.length);
    setExercises(parsedExercises);
  };

  const addExercise = () => {
    setExercises([...exercises, {
      name: '',
      sets: 3,
      reps: '10-12',
      rest: '60s',
      weight: '',
      instructions: ''
    }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setExercises(updatedExercises);
  };

  const buildWorkoutContent = () => {
    return exercises.map((exercise, index) => {
      let content = `${index + 1}️⃣ ${exercise.name}: ${exercise.sets}x${exercise.reps}`;
      if (exercise.rest) {
        content += `, Descanso: ${exercise.rest}`;
      }
      if (exercise.weight && exercise.weight !== 'Peso corporal') {
        content += ` (${exercise.weight})`;
      }
      return content;
    }).join('\n');
  };

  const processUserCompletionPayment = async (userId: string) => {
    try {
      console.log('💰 Processando pagamento de conclusão para usuário:', userId);
      
      const { data, error } = await supabase.rpc('process_user_completion_payment', {
        p_user_id: userId,
        p_trainer_id: user?.id
      });

      if (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        return { 
          success: false, 
          message: error.message,
          payment_amount: undefined,
          workouts_approved: undefined
        } as UserCompletionPaymentResponse;
      }

      console.log('✅ Resultado do pagamento:', data);
      return data as unknown as UserCompletionPaymentResponse;
    } catch (error: any) {
      console.error('❌ Erro crítico no pagamento:', error);
      return { 
        success: false, 
        message: error.message,
        payment_amount: undefined,
        workouts_approved: undefined
      } as UserCompletionPaymentResponse;
    }
  };

  const handleApproveWorkout = async () => {
    setSaving(true);
    try {
      console.log('✅ Iniciando aprovação com lógica de lote:', workoutId);
      
      const updatedContent = buildWorkoutContent();
      
      // Primeiro, buscar informações do treino atual
      const { data: currentWorkout, error: fetchError } = await supabase
        .from('daily_workouts')
        .select('workout_title, user_id, workout_date')
        .eq('id', workoutId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar treino atual:', fetchError);
        throw fetchError;
      }

      console.log('📋 Treino atual encontrado:', currentWorkout);

      // Buscar todos os treinos similares nos próximos 30 dias
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: similarWorkouts, error: similarError } = await supabase
        .from('daily_workouts')
        .select('id, workout_title, workout_date')
        .eq('user_id', currentWorkout.user_id)
        .eq('workout_title', workoutTitle) // Usar o título editado
        .gte('workout_date', new Date().toISOString().split('T')[0])
        .lte('workout_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .in('approval_status', ['pending_approval', 'pending']);

      if (similarError) {
        console.error('❌ Erro ao buscar treinos similares:', similarError);
        throw similarError;
      }

      console.log(`📅 Encontrados ${similarWorkouts?.length || 0} treinos similares para aprovação em lote`);

      // Aprovar todos os treinos similares (incluindo o atual)
      const workoutIds = similarWorkouts?.map(w => w.id) || [];
      
      if (workoutIds.length > 0) {
        const { error: bulkUpdateError } = await supabase
          .from('daily_workouts')
          .update({
            workout_title: workoutTitle,
            workout_content: updatedContent,
            approval_status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            personal_notes: personalNotes,
            status: 'pending',
            trainer_payout: 0
          })
          .in('id', workoutIds);

        if (bulkUpdateError) {
          console.error('❌ Erro na aprovação em lote:', bulkUpdateError);
          throw bulkUpdateError;
        }

        console.log(`✅ Aprovados ${workoutIds.length} treinos em lote com sucesso`);

        // Processar pagamento de conclusão
        const paymentResult = await processUserCompletionPayment(currentWorkout.user_id);

        let toastMessage = `${workoutIds.length} Treinos Aprovados em Lote! 🎉`;
        let toastDescription = `Todos os treinos "${workoutTitle}" dos próximos 30 dias foram aprovados automaticamente.`;

        if (paymentResult.success && paymentResult.payment_amount) {
          toastDescription += ` Como todos os treinos deste usuário estão aprovados, você recebeu R$ ${paymentResult.payment_amount.toFixed(2).replace('.', ',')} pelos treinos completos.`;
        } else if (paymentResult.message?.includes('já foi pago')) {
          toastDescription += " Este usuário já foi pago anteriormente.";
        } else {
          toastDescription += " Os treinos estarão disponíveis no calendário do aluno.";
        }

        console.log('✅ Processo de aprovação em lote concluído com sucesso');

        toast({
          title: toastMessage,
          description: toastDescription,
        });

      } else {
        // Fallback para aprovação individual
        const { error: updateError } = await supabase
          .from('daily_workouts')
          .update({
            workout_title: workoutTitle,
            workout_content: updatedContent,
            approval_status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            personal_notes: personalNotes,
            status: 'pending',
            trainer_payout: 0
          })
          .eq('id', workoutId);

        if (updateError) throw updateError;

        const paymentResult = await processUserCompletionPayment(workout!.user_id);

        let toastMessage = "Treino aprovado com sucesso! ✅";
        let toastDescription = "O treino foi aprovado e está disponível para o aluno.";

        if (paymentResult.success && paymentResult.payment_amount) {
          toastDescription = `Como todos os treinos deste usuário estão aprovados, você recebeu R$ ${paymentResult.payment_amount.toFixed(2).replace('.', ',')} pelos treinos completos.`;
        }

        toast({
          title: toastMessage,
          description: toastDescription,
        });
      }

      navigate('/personal-dashboard');
    } catch (error: any) {
      console.error('❌ Erro ao aprovar treino:', error);
      
      toast({
        title: "Erro na aprovação",
        description: `Falha na aprovação: ${error.message}. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (checkingRole || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do treino...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Treino não encontrado</p>
          <Button onClick={() => navigate('/personal-dashboard')} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/personal-dashboard')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Revisão de Treino</h1>
                <p className="text-sm text-gray-500">
                  {workout && formatDate(workout.workout_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Status de Pagamento */}
              {userCompletionStatus.alreadyPaid ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✅ Usuário já pago
                </Badge>
              ) : userCompletionStatus.isComplete ? (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  💰 Pronto para pagamento
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  📝 {userCompletionStatus.approvedWorkouts}/{userCompletionStatus.totalWorkouts} aprovados
                </Badge>
              )}
              
              <Button
                onClick={handleApproveWorkout}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {saving ? 'Aprovando...' : 'Aprovar Treino'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Perfil do Aluno - Layout Modernizado com Cards */}
          <div className="space-y-6">
            {/* Card 1: Dados Pessoais */}
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                    <p className="font-semibold text-gray-900">
                      {workout.user_name || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-gray-900 break-all">
                      {workout.user_email || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Idade</Label>
                    <p className="text-gray-900">
                      {workout.age ? `${workout.age} anos` : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Gênero</Label>
                    <p className="text-gray-900">
                      {workout.gender || 'Não informado'}
                    </p>
                  </div>
                </div>
                {/* Telefone com verificação melhorada */}
                {workout.phone_number && workout.phone_number !== 'Não cadastrado' && workout.phone_number.trim() && (
                  <div className="pt-2 border-t border-blue-200">
                    <Label className="text-sm font-medium text-gray-600">Telefone WhatsApp</Label>
                    <p className="font-semibold text-blue-600">📱 {workout.phone_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Medidas Corporais */}
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Scale className="w-5 h-5" />
                  Medidas Corporais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Altura</Label>
                    <p className="text-gray-900 font-semibold">
                      {workout.height ? `${workout.height} cm` : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Peso</Label>
                    <p className="text-gray-900 font-semibold">
                      {workout.weight ? `${workout.weight} kg` : 'Não informado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Perfil Fitness */}
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Dumbbell className="w-5 h-5" />
                  Perfil Fitness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Objetivo Principal</Label>
                    <p className="text-gray-900 font-semibold">
                      {workout.fitness_goal || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nível de Experiência</Label>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {workout.experience_level || 'Não informado'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Objetivo Detalhado */}
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Target className="w-5 h-5" />
                  Objetivo Detalhado do Aluno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Descrição Específica do Objetivo</Label>
                  <div className="mt-2 p-3 bg-white rounded-lg border border-orange-200 min-h-16">
                     <p className="text-gray-900 whitespace-pre-wrap">
                       {userProfile?.specific_goal || 'O aluno não forneceu uma descrição detalhada do objetivo.'}
                     </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Notas do Educador */}
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <NotepadText className="w-5 h-5" />
                  Notas do Educador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Observações Pessoais</Label>
                  <Textarea
                    placeholder="Adicione suas observações sobre este aluno..."
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    className="mt-2 min-h-24 border-indigo-200 focus:border-indigo-400"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plano de Treino Editável */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Plano de Treino Sugerido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="workout-title">Título do Treino</Label>
                <Input
                  id="workout-title"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Exercícios ({exercises.length})
                  </Label>
                  <Button onClick={addExercise} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {exercises.map((exercise, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <Label className="font-medium">Exercício {index + 1}</Label>
                          {exercises.length > 1 && (
                            <Button
                              onClick={() => removeExercise(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Input
                            placeholder="Nome do exercício"
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          />

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Séries</Label>
                              <Input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Repetições</Label>
                              <Input
                                placeholder="10-12"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Descanso</Label>
                              <Input
                                placeholder="60s"
                                value={exercise.rest}
                                onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                              />
                            </div>
                          </div>

                          <Input
                            placeholder="Peso/Carga (opcional)"
                            value={exercise.weight}
                            onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          />

                          <Textarea
                            placeholder="Instruções de execução..."
                            value={exercise.instructions}
                            onChange={(e) => updateExercise(index, 'instructions', e.target.value)}
                            className="min-h-16"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleApproveWorkout}
            disabled={saving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3 text-lg"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-3" />
            {saving ? 'Aprovando...' : 'Aprovar Treino'}
          </Button>
        </div>

        {/* Aviso sobre aprovação em lote */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-800">🚀 Aprovação Inteligente em Lote</h4>
              <p className="text-sm text-green-700 mt-1">
                Ao aprovar este treino, <strong>todos os treinos similares deste usuário nos próximos 30 dias serão aprovados automaticamente</strong>. 
                Isso economiza tempo e garante que todo o ciclo mensal seja aprovado de uma vez, aparecendo no calendário do aluno.
              </p>
              {!userCompletionStatus.alreadyPaid && userCompletionStatus.isComplete && (
                <p className="text-sm font-medium text-green-800 mt-2">
                  🎉 Este usuário está pronto para gerar pagamento ao aprovar este treino!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Aviso sobre a nova lógica */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-800">💰 Sistema de Pagamento por Usuário Completo</h4>
              <p className="text-sm text-blue-700 mt-1">
                Você recebe o pagamento <strong>quando todos os treinos de um usuário estão aprovados</strong>, não por treino individual. 
                Isso garante que o trabalho completo seja remunerado adequadamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
