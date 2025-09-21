import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Phone, 
  Target, 
  Dumbbell, 
  CheckCircle, 
  X, 
  Edit3,
  Save,
  ChevronUp,
  Heart,
  Ruler,
  Weight,
  Calendar,
  Check,
  Clock,
  Plus,
  Trash2,
  Activity,
  Settings,
  AlertTriangle,
  Moon,
  Zap,
  Timer
} from 'lucide-react';

interface PendingWorkout {
  id: string;
  user_id: string;
  workout_date: string;
  workout_title: string;
  workout_content: string;
  approval_status: string;
  user_name: string;
  user_email: string;
  fitness_goal?: string;
  age?: number;
  gender?: string;
  experience_level?: string;
  phone_number: string;
  height?: number;
  weight?: number;
  workout_days_per_week?: number;
  specific_goal?: string;
  activity_level?: string;
  session_duration?: number;
  available_equipment?: string[];
  exercise_preferences?: string;
  exercise_restrictions?: string;
  medical_conditions?: string;
  commitment_level?: string;
  stress_level?: number;
  sleep_quality?: number;
  average_sleep_hours?: number;
}

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  weight?: string;
  instructions?: string;
}

interface ExpandedUserReviewProps {
  userWorkouts: PendingWorkout[];
  onCollapse: () => void;
  onWorkoutApproved: (workoutId: string) => void;
  onWorkoutRejected: (workoutId: string) => void;
  approvedWorkouts: Set<string>;
}

export const ExpandedUserReview: React.FC<ExpandedUserReviewProps> = ({
  userWorkouts,
  onCollapse,
  onWorkoutApproved,
  onWorkoutRejected,
  approvedWorkouts
}) => {
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [editedExercises, setEditedExercises] = useState<Exercise[]>([]);
  const [processingApproval, setProcessingApproval] = useState<string | null>(null);
  const [savingWorkout, setSavingWorkout] = useState<string | null>(null);
  const [showTrainerNotes, setShowTrainerNotes] = useState<string | null>(null);

  const firstWorkout = userWorkouts[0];

  const parseWorkoutContent = (content: string): Exercise[] => {
    console.log('🔍 Parseando exercícios do conteúdo');
    
    const lines = content.split('\n').filter(line => line.trim());
    const parsedExercises: Exercise[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^\d+️⃣\s+(.+?):\s*(\d+)x(.+?)(?:,\s*Descanso:\s*(.+?))?(?:\s*\((.+?)\))?$/);
      
      if (match) {
        const [, name, sets, reps, rest, weight] = match;
        
        const exercise = {
          name: name.trim(),
          sets: sets,
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
          sets: '3',
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
        sets: '3',
        reps: '10-12',
        rest: '60s',
        weight: '',
        instructions: 'Instruções do exercício.'
      });
    }

    console.log('✅ Exercícios parseados:', parsedExercises.length);
    return parsedExercises;
  };

  const handleEditWorkout = (workoutId: string, content: string) => {
    console.log('🔧 Iniciando edição do treino:', workoutId);
    setEditingWorkout(workoutId);
    const exercises = parseWorkoutContent(content);
    setEditedExercises(exercises);
    console.log('📝 Exercícios carregados para edição:', exercises.length);
  };

  const updateEditedExercise = (index: number, field: keyof Exercise, value: string) => {
    const updatedExercises = [...editedExercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setEditedExercises(updatedExercises);
  };

  const addEditedExercise = () => {
    setEditedExercises([...editedExercises, {
      name: '',
      sets: '3',
      reps: '10-12',
      rest: '60s',
      weight: '',
      instructions: 'Execute o movimento de forma controlada'
    }]);
  };

  const removeEditedExercise = (index: number) => {
    if (editedExercises.length > 1) {
      setEditedExercises(editedExercises.filter((_, i) => i !== index));
    }
  };

  const buildWorkoutContent = () => {
    return editedExercises.map((exercise, index) => {
      let content = `${index + 1}️⃣ ${exercise.name}: ${exercise.sets}x${exercise.reps}`;
      if (exercise.rest) {
        content += `, Descanso: ${exercise.rest}`;
      }
      if (exercise.weight && exercise.weight !== 'Peso corporal' && exercise.weight.trim() !== '') {
        content += ` (${exercise.weight})`;
      }
      return content;
    }).join('\n');
  };

  const handleSaveWorkout = async (workoutId: string) => {
    if (!editedExercises.length) {
      toast({
        title: "Erro de validação",
        description: "É necessário ter pelo menos um exercício.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingWorkout(workoutId);
      console.log('💾 Salvando treino editado:', workoutId);
      
      const newContent = buildWorkoutContent();
      console.log('📝 Novo conteúdo construído:', newContent);

      const { error } = await supabase
        .from('daily_workouts')
        .update({ 
          workout_content: newContent,
          personal_notes: personalNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutId);

      if (error) throw error;

      toast({
        title: "Treino atualizado!",
        description: "As modificações foram salvas com sucesso.",
      });

      // Notificar o componente pai sobre a atualização
      if (onWorkoutApproved) {
        onWorkoutApproved(workoutId);
      }

      setEditingWorkout(null);
      setEditedExercises([]);
      setPersonalNotes('');
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar treino:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro inesperado ao salvar o treino.",
        variant: "destructive",
      });
    } finally {
      setSavingWorkout(null);
    }
  };

  const handleApproveWorkout = async (workout: PendingWorkout, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    
    if (event.currentTarget.closest('form')) {
      const form = event.currentTarget.closest('form') as HTMLFormElement;
      form.onsubmit = (e) => e.preventDefault();
    }
    
    try {
      setProcessingApproval(workout.id);
      console.log('✅ Iniciando aprovação em lote para treino:', workout.id);

      // Buscar todos os treinos similares do mesmo usuário nos próximos 30 dias
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: similarWorkouts, error: fetchError } = await supabase
        .from('daily_workouts')
        .select('id, workout_title, workout_content, workout_date')
        .eq('user_id', workout.user_id)
        .eq('workout_title', workout.workout_title) // Mesmo título (Treino A, B, C, etc.)
        .gte('workout_date', new Date().toISOString().split('T')[0])
        .lte('workout_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .in('approval_status', ['pending_approval', 'pending']);

      if (fetchError) {
        console.error('❌ Erro ao buscar treinos similares:', fetchError);
        throw fetchError;
      }

      console.log(`📋 Encontrados ${similarWorkouts?.length || 0} treinos similares para aprovação em lote`);

      // Aprovar todos os treinos similares
      const workoutIds = similarWorkouts?.map(w => w.id) || [];
      
      if (workoutIds.length > 0) {
        const { error: bulkUpdateError } = await supabase
          .from('daily_workouts')
          .update({
            approval_status: 'approved',
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
            trainer_payout: 5.00,
            status: 'sent',
            personal_notes: personalNotes || null
          })
          .in('id', workoutIds);

        if (bulkUpdateError) {
          console.error('❌ Erro na aprovação em lote:', bulkUpdateError);
          throw bulkUpdateError;
        }

        console.log(`✅ Aprovados ${workoutIds.length} treinos em lote com sucesso`);

        toast({
          title: "Treinos Aprovados em Lote! 🎉",
          description: `${workoutIds.length} treinos "${workout.workout_title}" de ${workout.user_name} foram aprovados. Você ganhou R$ ${(workoutIds.length * 5.00).toFixed(2).replace('.', ',')}.`,
        });

        // Marcar todos os treinos como aprovados na interface
        workoutIds.forEach(id => {
          setTimeout(() => {
            onWorkoutApproved(id);
          }, 100);
        });

      } else {
        // Fallback para aprovação individual
        const { error } = await supabase
          .from('daily_workouts')
          .update({
            approval_status: 'approved',
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
            trainer_payout: 5.00,
            status: 'sent',
            personal_notes: personalNotes || null
          })
          .eq('id', workout.id);

        if (error) throw error;

        toast({
          title: "Treino Aprovado! ✅",
          description: `Treino de ${workout.user_name} aprovado com sucesso. Você ganhou R$ 5,00.`,
        });

        setTimeout(() => {
          onWorkoutApproved(workout.id);
        }, 1000);
      }

    } catch (error: any) {
      console.error('❌ Erro na aprovação:', error);
      
      toast({
        title: "Erro na aprovação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingApproval(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-orange-200 shadow-lg animate-accordion-down">
      {/* Header com botão de fechar */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Revisão Detalhada - {firstWorkout.user_name}
        </h3>
        <Button
          onClick={onCollapse}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <User className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                <p className="text-lg font-semibold text-gray-900">{firstWorkout.user_name}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="text-sm text-gray-700">{firstWorkout.user_email}</p>
              </div>

              {firstWorkout.phone_number && firstWorkout.phone_number !== 'Não cadastrado' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </Label>
                  <p className="text-sm font-medium text-blue-600">{firstWorkout.phone_number}</p>
                </div>
              )}

              {firstWorkout.age && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Idade
                  </Label>
                  <p className="text-sm text-gray-700">{firstWorkout.age} anos</p>
                </div>
              )}

              {firstWorkout.gender && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Gênero</Label>
                  <p className="text-sm text-gray-700 capitalize">{firstWorkout.gender}</p>
                </div>
              )}

              {firstWorkout.height && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Ruler className="w-4 h-4" />
                    Altura
                  </Label>
                  <p className="text-sm font-semibold text-gray-700">{firstWorkout.height} cm</p>
                </div>
              )}

              {firstWorkout.weight && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    Peso
                  </Label>
                  <p className="text-sm font-semibold text-gray-700">{firstWorkout.weight} kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Perfil Fitness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Target className="w-5 h-5" />
              Perfil Fitness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Objetivo Principal</Label>
                <Badge variant="outline" className="text-sm">
                  {firstWorkout.fitness_goal || 'Não especificado'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Nível de Experiência</Label>
                <Badge variant="secondary">
                  {firstWorkout.experience_level || 'Não especificado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NOVA SEÇÃO: Informações Complementares */}
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Settings className="w-5 h-5" />
              Informações Complementares
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              
              {/* Objetivo Específico - Destacado */}
              {firstWorkout.specific_goal && (
                <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                  <Label className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5" />
                    Objetivo Específico
                  </Label>
                  <p className="text-base font-medium text-blue-900">{firstWorkout.specific_goal}</p>
                </div>
              )}

              {/* Rotina de Treino */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {firstWorkout.workout_days_per_week && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <Label className="text-sm font-medium text-green-700 flex items-center gap-1 mb-1">
                      <Calendar className="w-4 h-4" />
                      Frequência Semanal
                    </Label>
                    <p className="text-lg font-bold text-green-800">{firstWorkout.workout_days_per_week}x por semana</p>
                  </div>
                )}

                {firstWorkout.session_duration && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Label className="text-sm font-medium text-orange-700 flex items-center gap-1 mb-1">
                      <Timer className="w-4 h-4" />
                      Duração da Sessão
                    </Label>
                    <p className="text-lg font-bold text-orange-800">{firstWorkout.session_duration} min</p>
                  </div>
                )}

                {firstWorkout.activity_level && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Label className="text-sm font-medium text-purple-700 flex items-center gap-1 mb-1">
                      <Activity className="w-4 h-4" />
                      Nível de Atividade
                    </Label>
                    <p className="text-sm font-semibold text-purple-800 capitalize">{firstWorkout.activity_level}</p>
                  </div>
                )}

                {firstWorkout.commitment_level && (
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <Label className="text-sm font-medium text-teal-700 flex items-center gap-1 mb-1">
                      <Zap className="w-4 h-4" />
                      Compromisso
                    </Label>
                    <p className="text-sm font-semibold text-teal-800 capitalize">{firstWorkout.commitment_level}</p>
                  </div>
                )}
              </div>

              {/* Equipamentos e Preferências */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firstWorkout.available_equipment && firstWorkout.available_equipment.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      Equipamentos Disponíveis
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {firstWorkout.available_equipment.map((equipment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {firstWorkout.exercise_preferences && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      Preferências de Exercício
                    </Label>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {firstWorkout.exercise_preferences}
                    </p>
                  </div>
                )}
              </div>

              {/* Restrições e Condições */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firstWorkout.exercise_restrictions && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Restrições de Exercício
                    </Label>
                    <p className="text-sm text-red-800 bg-red-50 p-2 rounded border border-red-200">
                      {firstWorkout.exercise_restrictions}
                    </p>
                  </div>
                )}

                {firstWorkout.medical_conditions && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Condições Médicas
                    </Label>
                    <p className="text-sm text-red-800 bg-red-50 p-2 rounded border border-red-200">
                      {firstWorkout.medical_conditions}
                    </p>
                  </div>
                )}
              </div>

              {/* Estilo de Vida */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {firstWorkout.stress_level && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Nível de Estresse
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-3 h-3 rounded-full mr-1 ${
                              level <= firstWorkout.stress_level!
                                ? 'bg-red-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700">{firstWorkout.stress_level}/5</span>
                    </div>
                  </div>
                )}

                {firstWorkout.sleep_quality && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Moon className="w-4 h-4" />
                      Qualidade do Sono
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-3 h-3 rounded-full mr-1 ${
                              level <= firstWorkout.sleep_quality!
                                ? 'bg-blue-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700">{firstWorkout.sleep_quality}/5</span>
                    </div>
                  </div>
                )}

                {firstWorkout.average_sleep_hours && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Horas de Sono
                    </Label>
                    <p className="text-sm font-semibold text-gray-700">
                      {firstWorkout.average_sleep_hours}h por noite
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treinos para Revisão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Dumbbell className="w-5 h-5" />
              Treinos para Aprovação ({userWorkouts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userWorkouts.map((workout, index) => {
              const isApproved = approvedWorkouts.has(workout.id);
              
              return (
                <div key={workout.id} className={`border rounded-lg p-4 space-y-3 transition-all ${
                  isApproved 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{workout.workout_title}</h4>
                      <p className="text-sm text-gray-500">
                        Data: {new Date(workout.workout_date).toLocaleDateString('pt-BR')}
                      </p>
                      {isApproved && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprovado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isApproved ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isApproved ? '✅ R$ 5,00' : '+R$ 5,00'}
                      </span>
                      {!isApproved && editingWorkout !== workout.id && (
                        <Button
                          onClick={() => handleEditWorkout(workout.id, workout.workout_content)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {!isApproved && editingWorkout === workout.id && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveWorkout(workout.id)}
                            size="sm"
                            variant="outline"
                            disabled={savingWorkout === workout.id}
                          >
                            {savingWorkout === workout.id ? (
                              <>
                                <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Salvar
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setEditingWorkout(null)}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de Exercícios */}
                  <div className="space-y-2">
                    {editingWorkout === workout.id ? (
                      // Modo de edição
                       <div className="space-y-3">
                         {editedExercises.map((exercise, exerciseIndex) => (
                           <div key={exerciseIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 rounded">
                             <Input
                               value={exercise.name}
                               onChange={(e) => updateEditedExercise(exerciseIndex, 'name', e.target.value)}
                               placeholder="Nome do exercício"
                             />
                             <Input
                               value={exercise.sets}
                               onChange={(e) => updateEditedExercise(exerciseIndex, 'sets', e.target.value)}
                               placeholder="Séries"
                               type="number"
                               min="1"
                             />
                             <Input
                               value={exercise.reps}
                               onChange={(e) => updateEditedExercise(exerciseIndex, 'reps', e.target.value)}
                               placeholder="Repetições (ex: 10-12)"
                             />
                             <Input
                               value={exercise.rest || ''}
                               onChange={(e) => updateEditedExercise(exerciseIndex, 'rest', e.target.value)}
                               placeholder="Descanso (ex: 60s)"
                             />
                             <div className="flex gap-1">
                               <Input
                                 value={exercise.weight || ''}
                                 onChange={(e) => updateEditedExercise(exerciseIndex, 'weight', e.target.value)}
                                 placeholder="Peso/Carga"
                                 className="flex-1"
                               />
                               {editedExercises.length > 1 && (
                                 <Button
                                   onClick={() => removeEditedExercise(exerciseIndex)}
                                   size="sm"
                                   variant="ghost"
                                   className="text-red-600 hover:text-red-700 p-2"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               )}
                             </div>
                           </div>
                         ))}
                         <Button
                           onClick={addEditedExercise}
                           size="sm"
                           variant="outline"
                           className="w-full"
                         >
                           <Plus className="w-4 h-4 mr-2" />
                           Adicionar Exercício
                         </Button>
                       </div>
                    ) : (
                      // Modo de visualização
                      <div className={`rounded p-3 ${
                        isApproved ? 'bg-green-100' : 'bg-gray-50'
                      }`}>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {workout.workout_content}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  {editingWorkout !== workout.id && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      {isApproved ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-md">
                          <Check className="w-4 h-4" />
                          <span className="font-medium">Aprovado - R$ 5,00 ganhos</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={(e) => handleApproveWorkout(workout, e)}
                          onMouseDown={(e) => e.preventDefault()}
                          disabled={processingApproval === workout.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {processingApproval === workout.id ? 'Aprovando...' : 'Aprovar Treino'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notas do Educador */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Observações do Educador Físico</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Adicione observações específicas para este aluno (opcional)..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Aviso sobre aprovação em lote */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800">🚀 Aprovação Inteligente em Lote</h4>
                <p className="text-sm text-green-700 mt-1">
                  Ao aprovar um treino (ex: "Treino A"), <strong>todos os treinos similares deste usuário nos próximos 30 dias serão aprovados automaticamente</strong>. 
                  Isso economiza tempo e garante que todo o ciclo mensal seja aprovado de uma vez.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
