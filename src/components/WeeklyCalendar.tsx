import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Trophy, Loader2, Calendar, CheckCircle, Clock, AlertCircle, Coffee, Dumbbell, Lock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { CalendarDay } from './calendar/CalendarDay';
import { AnimatedPanel } from './animations/AnimatedPanel';
import { ModernExerciseCard } from './workout/ModernExerciseCard';
import { getBrazilDateForDay, getBrazilCurrentDateString, logCriticalTime, formatBrazilDate, getBrazilCurrentDate } from '@/utils/brazilTime';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  weight?: string;
  muscleGroup: string;
  difficulty?: string;
  instructions: string;
  commonMistakes?: string;
  alternatives?: string;
  videoKeywords?: string;
  tips?: string;
}

interface WorkoutDay {
  day: number;
  title: string;
  focus: string;
  duration: string;
  exercises: Exercise[];
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  intensity?: string;
  estimatedCalories?: number;
  isRestDay?: boolean;
  hasValidData?: boolean;
  approvalStatus?: string;
  isApproved?: boolean;
  isPreviouslyApproved?: boolean;
  isPending?: boolean;
  workoutDate: string;
}

interface WeeklyCalendarProps {
  onWorkoutSelect: (day: number, workout?: any) => void;
  completedWorkouts: {
    [key: string]: boolean;
  };
  approvedWorkouts: {
    [key: string]: boolean;
  };
  workoutDays: WorkoutDay[];
  selectedDay?: number | null;
  selectedWorkout?: WorkoutDay | null;
  completedExercises?: string[];
  onExerciseToggle?: (exerciseName: string, isCompleted: boolean) => void;
  onCompleteWorkout?: () => void;
  onCloseWorkout?: () => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  onWorkoutSelect,
  completedWorkouts = {},
  approvedWorkouts = {},
  workoutDays = [],
  selectedDay,
  selectedWorkout,
  completedExercises = [],
  onExerciseToggle,
  onCompleteWorkout,
  onCloseWorkout
}) => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [dailyWorkouts, setDailyWorkouts] = useState<{
    [key: string]: any;
  }>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [persistedCompletedWorkouts, setPersistedCompletedWorkouts] = useState<{
    [key: string]: boolean;
  }>({});

  // Mobile swipe refs and config
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const isSwipingRef = React.useRef(false);
  const justSwipedAtRef = React.useRef<number>(0);
  const SWIPE_THRESHOLD = 50; // px
  const DIRECTION_THRESHOLD = 10; // px to determine horizontal intent

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    const initializeUserId = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        const newUserId = user?.id || null;
        setUserId(newUserId);
      } catch (error) {
        console.error('Erro ao obter userId:', error);
        setUserId(null);
      }
    };
    initializeUserId();
  }, []);

  const {
    templates,
    getWorkoutForDate,
    loading: templatesLoading
  } = useWorkoutTemplates(userId);

  const getDateForDay = (dayIndex: number, weekOffset: number = 0): string => {
    logCriticalTime('getDateForDay called', {
      dayIndex,
      weekOffset
    });
    return getBrazilDateForDay(dayIndex, weekOffset);
  };

  const createFutureWorkouts = async () => {
    if (!userId) return;

    // ✅ BLOQUEIO: Não criar se já existe treinos da semana atual ou plano pendente
    try {
      // Base Brasil
      const todayBrazil = getBrazilCurrentDate();
      const startOfWeek = new Date(todayBrazil);
      const dayOfWeek = todayBrazil.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(todayBrazil.getDate() - daysToMonday);
      startOfWeek.setHours(12, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(12, 0, 0, 0);
      const startStr = formatBrazilDate(startOfWeek);
      const endStr = formatBrazilDate(endOfWeek);

      // Verificar se já existe treinos desta semana
      const {
        data: weekWorkouts
      } = await supabase.from('daily_workouts').select('id').eq('user_id', userId).gte('workout_date', startStr).lte('workout_date', endStr);

      // Verificar se existe plano pendente
      const {
        data: pendingPlan
      } = await supabase.from('workout_plans_approval').select('id').eq('user_id', userId).eq('status', 'pending_approval').limit(1);
      if (weekWorkouts && weekWorkouts.length > 0) {
        console.log('🚫 BLOQUEIO: Já existem treinos desta semana');
        return;
      }
      if (pendingPlan && pendingPlan.length > 0) {
        console.log('🚫 BLOQUEIO: Existe plano pendente de aprovação');
        return;
      }
      console.log('🚀 CRIAÇÃO PERMITIDA: Criando treinos futuros...');
      const futureWorkouts = [];

      // Criar treinos para os próximos 30 dias (sempre data Brasil ao meio-dia)
      const baseBrazilNoon = getBrazilCurrentDate();
      baseBrazilNoon.setHours(12, 0, 0, 0);
      for (let i = 0; i <= 30; i++) {
        const futureDate = new Date(baseBrazilNoon);
        futureDate.setDate(baseBrazilNoon.getDate() + i);
        futureDate.setHours(12, 0, 0, 0);
        const dateString = formatBrazilDate(futureDate);
        const dayOfWeek = futureDate.getDay();
        if (dayOfWeek === 0) continue; // Pular domingos

        const workoutFromTemplate = getWorkoutForDate(dateString);
        if (workoutFromTemplate && !workoutFromTemplate.isRestDay && workoutFromTemplate.exercises && workoutFromTemplate.exercises.length > 0) {
          const {
            data: existingWorkout
          } = await supabase.from('daily_workouts').select('id').eq('user_id', userId).eq('workout_date', dateString).maybeSingle();
          if (!existingWorkout) {
            const exercises = workoutFromTemplate.exercises || [];
            let workoutContent = '';
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
            futureWorkouts.push({
              user_id: userId,
              workout_date: dateString,
              workout_title: workoutFromTemplate.title,
              workout_content: workoutContent,
              status: 'pending',
              approval_status: 'pending_approval',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }
      if (futureWorkouts.length > 0) {
        const {
          error: insertError
        } = await supabase.from('daily_workouts').insert(futureWorkouts);
        if (insertError) {
          console.error('❌ Erro ao criar treinos:', insertError);
        } else {
          console.log(`✅ ${futureWorkouts.length} treinos futuros criados`);
          setTimeout(() => fetchDailyWorkouts(), 1000);
        }
      }
    } catch (error) {
      console.error('❌ Erro no sistema:', error);
    }
  };

  const checkPatternApproval = async (): Promise<{
    hasApprovedPattern: boolean;
    trainerId?: string;
  }> => {
    if (!userId) return {
      hasApprovedPattern: false
    };
    try {
      console.log('🔍 PADRÃO SEMANAL: Verificando treinos únicos aprovados');
      const {
        data: approvedWorkouts,
        error
      } = await supabase.from('daily_workouts').select('workout_title, approved_by').eq('user_id', userId).eq('approval_status', 'approved').gte('workout_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('❌ Erro ao verificar padrão aprovado:', error);
        return {
          hasApprovedPattern: false
        };
      }
      if (!approvedWorkouts || approvedWorkouts.length === 0) {
        console.log('📝 PADRÃO SEMANAL: Nenhum treino aprovado encontrado');
        return {
          hasApprovedPattern: false
        };
      }
      const uniqueApprovedWorkouts = new Set(approvedWorkouts.map(workout => workout.workout_title));
      const approvedTrainers = new Set(approvedWorkouts.map(workout => workout.approved_by).filter(Boolean));
      console.log(`🎯 PADRÃO SEMANAL RESULTADO:`, {
        totalApproved: approvedWorkouts.length,
        uniqueTitles: Array.from(uniqueApprovedWorkouts),
        uniqueCount: uniqueApprovedWorkouts.size,
        trainers: Array.from(approvedTrainers)
      });
      const hasApprovedPattern = uniqueApprovedWorkouts.size >= 3;
      const trainerId = approvedTrainers.size > 0 ? Array.from(approvedTrainers)[0] as string : undefined;
      return {
        hasApprovedPattern,
        trainerId
      };
    } catch (error) {
      console.error('❌ Erro na verificação do padrão:', error);
      return {
        hasApprovedPattern: false
      };
    }
  };

  const checkPlanApproval = async (): Promise<{
    hasApprovedPlan: boolean;
    trainerId?: string;
  }> => {
    if (!userId) return {
      hasApprovedPlan: false
    };
    try {
      console.log('🔍 PLANO COMPLETO: Verificando aprovação tradicional');
      const {
        data: approvedPlans,
        error
      } = await supabase.from('workout_plans_approval').select('id, trainer_id, status, updated_at').eq('user_id', userId).eq('status', 'approved').order('updated_at', {
        ascending: false
      }).limit(1);
      if (error) {
        console.error('❌ Erro ao verificar plano aprovado:', error);
        return {
          hasApprovedPlan: false
        };
      }
      const hasApproval = approvedPlans && approvedPlans.length > 0;
      const trainerId = hasApproval ? approvedPlans[0].trainer_id : undefined;
      console.log(`🎯 PLANO COMPLETO RESULTADO: ${hasApproval ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`, {
        hasApproval,
        trainerId,
        planId: hasApproval ? approvedPlans[0].id : null
      });
      return {
        hasApprovedPlan: hasApproval,
        trainerId
      };
    } catch (error) {
      console.error('❌ Erro inesperado ao verificar plano aprovado:', error);
      return {
        hasApprovedPlan: false
      };
    }
  };

  const autoApproveWorkoutsFromPlan = async (trainerId: string) => {
    if (!userId || !trainerId) return;
    try {
      console.log('🚀 APROVAÇÃO EM CASCATA: Aprovando treinos pendentes baseado no plano');
      const {
        data: pendingWorkouts,
        error: fetchError
      } = await supabase.from('daily_workouts').select('id, workout_title, workout_date').eq('user_id', userId).eq('approval_status', 'pending_approval');
      if (fetchError) {
        console.error('❌ Erro ao buscar treinos pendentes:', fetchError);
        return;
      }
      console.log(`📋 APROVAÇÃO EM CASCATA: Encontrados ${pendingWorkouts?.length || 0} treinos pendentes`);
      if (pendingWorkouts && pendingWorkouts.length > 0) {
        const {
          error: updateError
        } = await supabase.from('daily_workouts').update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: trainerId,
          status: 'sent'
        }).eq('user_id', userId).eq('approval_status', 'pending_approval');
        if (updateError) {
          console.error('❌ Erro na aprovação automática:', updateError);
        } else {
          console.log(`✅ APROVAÇÃO EM CASCATA: ${pendingWorkouts.length} treinos aprovados automaticamente`);
          setTimeout(() => fetchDailyWorkouts(), 1000);
        }
      }
    } catch (error) {
      console.error('❌ Erro inesperado na aprovação automática:', error);
    }
  };

  const fetchDailyWorkouts = async () => {
    if (!userId) {
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    try {
      if (initialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const timestamp = new Date().toISOString();
      console.log(`🇧🇷 BRAZIL TIME FETCH [${timestamp}]: Iniciando busca com tempo Brasil`);

      // Limites de busca usando Brazil Time (últimos 7 e próximos 60 dias)
      const baseBrazilNoon = getBrazilCurrentDate();
      baseBrazilNoon.setHours(12, 0, 0, 0);
      const past = new Date(baseBrazilNoon);
      past.setDate(baseBrazilNoon.getDate() - 7);
      past.setHours(12, 0, 0, 0);
      const future = new Date(baseBrazilNoon);
      future.setDate(baseBrazilNoon.getDate() + 60);
      future.setHours(12, 0, 0, 0);
      const pastStr = formatBrazilDate(past);
      const futureStr = formatBrazilDate(future);

      console.log(`🔍 PERSISTÊNCIA: Buscando treinos incluindo status 'completed'`);

      // 🔥 CORREÇÃO: Buscar dados dos treinos incluindo os concluídos
      const { data: workoutsData, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', pastStr)
        .lte('workout_date', futureStr)
        .order('workout_date', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar treinos:', error);
        return;
      }

      // Buscar planos de aprovação
      const { data: approvalPlans } = await supabase
        .from('workout_plans_approval')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('📋 DADOS CARREGADOS:', {
        treinos: workoutsData?.length || 0,
        planosAprovacao: approvalPlans?.length || 0,
        treinosCompletos: workoutsData?.filter(w => w.status === 'completed').length || 0
      });

      // Para a semana atual, usar o sistema de 7 dias com Brazil Time
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = getDateForDay(i, selectedWeek);
        console.log(`🇧🇷 BRAZIL WEEK: dayIndex=${i} (${weekDays[i]}) → data=${date}`);
        return date;
      });

      // Montar mapa de treinos baseado nos dados do banco
      const workoutsMap: { [key: string]: any } = {};
      const completedMap: { [key: string]: boolean } = {};

      for (const workout of workoutsData || []) {
        // Determinar status de aprovação
        const isDirectlyApproved = workout.approval_status === 'approved';
        const isPendingApproval = workout.approval_status === 'pending_approval';
        const isCompleted = workout.status === 'completed';

        // Verificar se o plano está aprovado através do plan_id
        const isFromApprovedPlan = approvalPlans?.some(plan => 
          plan.id === workout.plan_id && plan.status === 'approved'
        ) || false;

        const isFinallyApproved = isDirectlyApproved || isFromApprovedPlan;
        const isPending = isPendingApproval && !isFromApprovedPlan;

        workoutsMap[workout.workout_date] = {
          ...workout,
          isApproved: isFinallyApproved,
          isPending: isPending,
          approvalStatus: isFinallyApproved ? 'approved' : workout.approval_status,
          isCompleted: isCompleted
        };

        // 🔥 CORREÇÃO: Mapear treinos concluídos para estado persistido
        if (isCompleted) {
          completedMap[workout.workout_date] = true;
        }

        console.log(`🎯 TREINO PROCESSADO:`, {
          date: workout.workout_date,
          title: workout.workout_title,
          status: workout.status,
          isDirectlyApproved,
          isFromApprovedPlan,
          isFinallyApproved,
          isPending,
          isCompleted,
          finalStatus: isCompleted ? 'CONCLUÍDO' : 
                      isFinallyApproved ? 'APROVADO' : 
                      isPending ? 'PENDENTE' : 'BLOQUEADO'
        });
      }

      console.log(`✅ Brazil Time workoutsMap criado com ${Object.keys(workoutsMap).length} entradas`);
      console.log(`✅ PERSISTÊNCIA: ${Object.keys(completedMap).length} treinos concluídos carregados:`, completedMap);

      setDailyWorkouts(workoutsMap);
      setPersistedCompletedWorkouts(completedMap);

      // 🔥 CORREÇÃO: Verificar aprovações e criar treinos futuros se necessário
      const { hasApprovedPlan, trainerId: planTrainerId } = await checkPlanApproval();
      const { hasApprovedPattern, trainerId: patternTrainerId } = await checkPatternApproval();
      
      if (hasApprovedPlan || hasApprovedPattern) {
        const trainerId = planTrainerId || patternTrainerId;
        console.log('🚀 SISTEMA DE APROVAÇÃO: Status detectado, executando ações automáticas');
        
        if (trainerId) {
          await autoApproveWorkoutsFromPlan(trainerId);
        }
        
        // Criar treinos futuros apenas se necessário
        await createFutureWorkouts();
      }

    } catch (error) {
      console.error('❌ BRAZIL TIME: Erro inesperado:', error);
    } finally {
      if (initialLoading) {
        setLoading(false);
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const getWorkoutForDay = (dayIndex: number): WorkoutDay => {
    const timestamp = new Date().toISOString();
    const dayDate = getDateForDay(dayIndex, selectedWeek);
    
    logCriticalTime('getWorkoutForDay', {
      dayIndex,
      dayName: weekDays[dayIndex],
      calculatedDate: dayDate,
      selectedWeek
    });

    console.log(`🇧🇷 BRAZIL getWorkoutForDay [${timestamp}]:`, {
      dayIndex,
      dayName: weekDays[dayIndex],
      calculatedDate: dayDate,
      selectedWeek,
      expectedDay: weekDays[dayIndex]
    });

    const workoutFromTemplate = getWorkoutForDate(dayDate);
    console.log(`🎯 BRAZIL: Template retornado para ${dayDate}:`, {
      title: workoutFromTemplate?.title,
      isRestDay: workoutFromTemplate?.isRestDay,
      exercisesCount: workoutFromTemplate?.exercises?.length || 0
    });

    if (!workoutFromTemplate) {
      console.log(`⚠️ BRAZIL: Sem template para ${dayDate}, retornando descanso`);
      return {
        day: dayIndex,
        title: 'Descanso',
        focus: 'Recuperação muscular',
        duration: '0min',
        exercises: [],
        difficulty: 'Fácil' as const,
        isRestDay: true,
        workoutDate: dayDate
      };
    }

    const workoutFromDB = dailyWorkouts[dayDate];
    console.log(`📊 BRAZIL: Workout do banco para ${dayDate}:`, {
      exists: !!workoutFromDB,
      title: workoutFromDB?.workout_title,
      status: workoutFromDB?.status,
      approval_status: workoutFromDB?.approval_status
    });

    // 🔥 CORREÇÃO: Verificar conclusão tanto do estado local quanto persistido
    const isCompletedLocal = completedWorkouts[dayDate] || false;
    const isCompletedPersisted = persistedCompletedWorkouts[dayDate] || false;
    const isCompletedDB = workoutFromDB?.status === 'completed' || workoutFromDB?.isCompleted || false;
    const isCompleted = isCompletedLocal || isCompletedPersisted || isCompletedDB;

    const isApproved = workoutFromDB?.isApproved || approvedWorkouts[dayDate] || false;
    let isPending = workoutFromDB?.isPending || false;
    const approvalStatus = workoutFromDB?.approvalStatus || 'pending_approval';
    const isPreviouslyApproved = workoutFromDB?.isPreviouslyApproved || false;

    console.log(`🔍 PERSISTÊNCIA CHECK para ${dayDate}:`, {
      isCompletedLocal,
      isCompletedPersisted,
      isCompletedDB,
      isCompleted: isCompleted || persistedCompletedWorkouts[dayDate] || false,
      workoutStatus: workoutFromDB?.status
    });

    // Se não há registro no banco mas existe template válido, verificar se está nos próximos 30 dias
    if (!isPending && !isApproved && !workoutFromTemplate.isRestDay && (workoutFromTemplate.exercises?.length || 0) > 0) {
      const dateObj = new Date(dayDate + 'T00:00:00');
      const todayBrazil = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      todayBrazil.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((dateObj.getTime() - todayBrazil.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 30) {
        isPending = true; // Força ampulheta ⏳ para os próximos 30 dias
        console.log(`⏳ CORREÇÃO 30 DIAS: ${dayDate} marcado como pendente (${diffDays} dias no futuro)`);
      }
    }

    // DOMINGO SEMPRE É DESCANSO
    if (dayIndex === 0 || workoutFromTemplate.isRestDay) {
      console.log(`😴 CORREÇÃO: Domingo ou dia de descanso para ${dayDate}`);
      return {
        day: dayIndex,
        title: 'Descanso',
        focus: 'Recuperação muscular',
        duration: '0min',
        exercises: [],
        difficulty: 'Fácil' as const,
        isRestDay: true,
        workoutDate: dayDate
      };
    }

    let focus = 'Treino Pendente';
    if (isCompleted) {
      focus = 'Treino Concluído';
    } else if (isApproved) {
      focus = isPreviouslyApproved ? 'Treino Disponível (Aprovado Previamente)' : 'Treino Disponível';
    } else if (isPending) {
      focus = 'Aguardando Aprovação';
    }

    console.log(`✅ BRAZIL FINAL WORKOUT:`, {
      dayIndex,
      dayName: weekDays[dayIndex],
      date: dayDate,
      title: workoutFromTemplate.title,
      focus,
      isApproved,
      isPending,
      isCompleted,
      exercisesCount: workoutFromTemplate.exercises?.length || 0,
      validation: `${weekDays[dayIndex]} (${dayIndex}) → ${dayDate} → ${workoutFromTemplate.title}`
    });

    return {
      day: dayIndex,
      title: workoutFromTemplate.title,
      focus: focus,
      duration: '45-60min',
      exercises: workoutFromTemplate.exercises || [],
      difficulty: 'Médio' as const,
      workoutDate: dayDate,
      isRestDay: false,
      hasValidData: true,
      isApproved: isApproved,
      isPending: isPending,
      approvalStatus: approvalStatus,
      isPreviouslyApproved: isPreviouslyApproved
    };
  };

  useEffect(() => {
    if (userId) {
      fetchDailyWorkouts();
    }
  }, [selectedWeek, userId]);

  const handleDayClick = (dayIndex: number) => {
    if (isSwipingRef.current || Date.now() - justSwipedAtRef.current < 300) {
      return;
    }

    const workout = getWorkoutForDay(dayIndex);
    const dayDate = getDateForDay(dayIndex, selectedWeek);
    
    // 🔥 CORREÇÃO: Usar lógica completa de verificação de conclusão
    const isCompletedLocal = completedWorkouts[dayDate] || false;
    const isCompletedPersisted = persistedCompletedWorkouts[dayDate] || false;
    const isCompletedDB = dailyWorkouts[dayDate]?.status === 'completed' || false;
    const isCompleted = isCompletedLocal || isCompletedPersisted || isCompletedDB;

    console.log(`🔍 CLICK PERSISTÊNCIA para ${dayDate}:`, {
      isCompletedLocal,
      isCompletedPersisted,
      isCompletedDB,
      finalIsCompleted: isCompleted
    });

    // 🔥 FIX: Handle rest days without opening panel
    if (workout.isRestDay) {
      toast({
        title: "Dia de Descanso 😴",
        description: "Hoje é dia de recuperação! Aproveite para descansar.",
        duration: 3000
      });
      // Don't call onWorkoutSelect for rest days to prevent opening empty panel
      return;
    }

    if (selectedDay === dayIndex && selectedWorkout) {
      onWorkoutSelect(dayIndex, null);
      return;
    }

    if (isCompleted) {
      toast({
        title: "Treino Já Concluído! ✅",
        description: "Parabéns! Você já finalizou este treino.",
        duration: 3000
      });
      onWorkoutSelect(dayIndex, workout);
      return;
    }

    if (workout.isPending && !workout.isRestDay) {
      toast({
        title: "Treino Enviado para Aprovação ⏳",
        description: "Treino enviado para aprovação do personal.",
        duration: 4000
      });
      return;
    }

    if (!workout.isApproved && !workout.isPending && !workout.isRestDay) {
      toast({
        title: "Treino Bloqueado 🚫",
        description: "Este treino está aguardando aprovação do seu personal trainer.",
        duration: 4000
      });
      return;
    }

    if (!workout.exercises || workout.exercises.length === 0) {
      toast({
        title: "Treino Sem Exercícios ⚠️",
        description: "Este treino não possui exercícios válidos.",
        variant: "destructive"
      });
      onWorkoutSelect(dayIndex, null);
      return;
    }

    onWorkoutSelect(dayIndex, workout);
  };

  const completedCount = selectedWorkout ? completedExercises.length : 0;
  const totalExercises = selectedWorkout?.exercises?.length || 0;
  const progressPercentage = totalExercises > 0 ? completedCount / totalExercises * 100 : 0;
  const isWorkoutComplete = completedCount === totalExercises && totalExercises > 0;

  const handlePreviousWeek = () => {
    setNavDirection('prev');
    setSelectedWeek(prev => Math.max(-8, prev - 1));
    setTimeout(() => setNavDirection(null), 350);
  };

  const handleNextWeek = () => {
    setNavDirection('next');
    setSelectedWeek(prev => Math.min(8, prev + 1));
    setTimeout(() => setNavDirection(null), 350);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    isSwipingRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    if (!isSwipingRef.current) {
      if (Math.abs(dx) > DIRECTION_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        isSwipingRef.current = true;
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        handleNextWeek();
      } else {
        handlePreviousWeek();
      }
      justSwipedAtRef.current = Date.now();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwipingRef.current = false;
  };

  const getWeekDateRange = () => {
    const startDate = new Date(getDateForDay(1, selectedWeek) + 'T12:00:00');
    const endDate = new Date(getDateForDay(6, selectedWeek) + 'T12:00:00');
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getCurrentMonthYear = () => {
    const currentDate = new Date(getDateForDay(3, selectedWeek) + 'T12:00:00'); // Use Wednesday as reference
    return currentDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading || templatesLoading && initialLoading) {
    return <Card className="w-full shadow-lg border-2 border-purple-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Carregando calendário...</span>
          </div>
        </CardContent>
      </Card>;
  }

  return (
    <div className="w-full space-y-4">
      <Card className="w-full shadow-xl border border-slate-200/50 overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20">
        <CardHeader className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-0 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
          </div>
          
          <div className="relative z-10 p-4 bg-[#ed56fe]/[0.64]">
            <div className="flex justify-between items-center">
              {/* Left section - Title and dates */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg font-bold text-white truncate">
                      Calendário de Treinos
                    </CardTitle>
                  </div>
                </div>
                
                {/* Date info */}
                <div className="space-y-1">
                  <div className="text-sm text-blue-100 font-medium">
                    {getCurrentMonthYear()}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-200">
                      {getWeekDateRange()}
                    </span>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${selectedWeek === 0 ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : 'bg-blue-500/20 text-blue-200 border-blue-400/30'}`}>
                      {selectedWeek === 0 ? 'Atual' : selectedWeek > 0 ? `+${selectedWeek}` : `${selectedWeek}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right section - Controls */}
              <div className="flex items-center gap-2 ml-4">
                {(refreshing || templatesLoading && !initialLoading) && <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/20">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-200" />
                    <span className="text-xs text-blue-200 hidden sm:block">Sync</span>
                  </div>}
                
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handlePreviousWeek} className="border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white backdrop-blur-sm transition-all duration-200 h-8 px-2">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextWeek} className="border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white backdrop-blur-sm transition-all duration-200 h-8 px-2">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient border at bottom */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50/50">
          <div key={selectedWeek} className={`grid grid-cols-7 gap-2 sm:gap-4 mb-6 ${navDirection === 'next' ? 'animate-slide-in-right' : navDirection === 'prev' ? 'animate-slide-in-left' : ''}`} onTouchStart={isMobile ? onTouchStart : undefined} onTouchMove={isMobile ? onTouchMove : undefined} onTouchEnd={isMobile ? onTouchEnd : undefined}>
            {weekDays.map((day, index) => {
              const workout = getWorkoutForDay(index);
              const dayDate = getDateForDay(index, selectedWeek);
              
              // 🔥 CORREÇÃO: Usar lógica completa de verificação de conclusão
              const isCompletedLocal = completedWorkouts[dayDate] || false;
              const isCompletedPersisted = persistedCompletedWorkouts[dayDate] || false;
              const isCompletedDB = dailyWorkouts[dayDate]?.status === 'completed' || false;
              const isCompleted = isCompletedLocal || isCompletedPersisted || isCompletedDB;
              
              const isApproved = workout.isApproved || false;
              const isPending = workout.isPending || false;
              const exercisesCount = workout.exercises?.length || 0;

              // Usar Brazil Time para comparação
              const todayString = getBrazilCurrentDateString();
              const isToday = dayDate === todayString && selectedWeek === 0;

              // 🇧🇷 BRAZIL: Log para cada dia do calendário
              console.log(`🇧🇷 BRAZIL CALENDAR DAY [${day}]:`, {
                index,
                dayName: day,
                date: dayDate,
                isToday,
                workoutTitle: workout.title,
                isRestDay: workout.isRestDay,
                isCompletedLocal,
                isCompletedPersisted,
                isCompletedDB,
                finalIsCompleted: isCompleted,
                isApproved,
                isPending,
                exercisesCount,
                validation: `Posição ${index} (${day}) → Data ${dayDate} → Treino ${workout.title}`
              });

              return (
                <CalendarDay
                  key={index}
                  day={day}
                  date={new Date(dayDate + 'T12:00:00').getDate()}
                  isToday={isToday}
                  isSelected={selectedDay === index}
                  isCompleted={isCompleted}
                  isApproved={isApproved}
                  isRestDay={workout.isRestDay || false}
                  isPending={isPending}
                  exerciseCount={exercisesCount}
                  workout={{
                    ...workout,
                    isPreviouslyApproved: workout.isPreviouslyApproved || false
                  }}
                  onClick={() => handleDayClick(index)}
                />
              );
            })}
          </div>
          
          {/* Legend Section - More organized */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200/50">
            <div className="flex justify-center gap-4 sm:gap-8 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-slate-700 font-medium">Concluído</span>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">Aprovado</span>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">Pré-aprovado</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-slate-700 font-medium">Aguardando</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-slate-700 font-medium">Hoje</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                <span className="text-slate-700 font-medium">Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-slate-700 font-medium">Descanso</span>
              </div>
            </div>
            
            {/* Helper text */}
            <div className="text-center mt-4 space-y-1">
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                <span>📱</span>
                <span>Toque em qualquer dia para ver os exercícios</span>
              </p>
              
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatedPanel isOpen={!!selectedWorkout && selectedDay !== null} onClose={() => onCloseWorkout?.()}>
        {selectedWorkout && <>
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 px-4 py-5 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-5 h-5 flex-shrink-0" />
                      <h2 className="text-xl font-bold leading-tight">{selectedWorkout.title}</h2>
                    </div>
                    <p className="text-purple-100 text-base leading-relaxed">{selectedWorkout.focus}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onCloseWorkout?.()} className="text-white hover:bg-white/20 rounded-full p-2 h-auto flex-shrink-0">
                    ×
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-100">Progresso</span>
                    <span className="text-sm font-bold">{completedCount}/{totalExercises}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all duration-500 ease-out" style={{
                  width: `${progressPercentage}%`
                }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {selectedWorkout.isRestDay ? <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">😴</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Dia de Descanso</h3>
                  <p className="text-gray-600 text-base">Aproveite para recuperar suas energias!</p>
                </div> : <div className="space-y-4">
                  {selectedWorkout.exercises.map((exercise, index) => <ModernExerciseCard key={`${exercise.name}-${index}`} exercise={exercise} isCompleted={completedExercises.includes(exercise.name)} exerciseIndex={index + 1} onToggleComplete={() => {
              const isCurrentlyCompleted = completedExercises.includes(exercise.name);
              onExerciseToggle?.(exercise.name, !isCurrentlyCompleted);
            }} />)}
                </div>}
            </div>

            {!selectedWorkout.isRestDay && <div className="p-4 bg-gray-50 border-t">
                <Button onClick={onCompleteWorkout} disabled={!isWorkoutComplete} className={`w-full h-14 font-bold text-base transition-all duration-300 ${isWorkoutComplete ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                  <Trophy className="w-5 h-5 mr-2" />
                  {isWorkoutComplete ? 'Finalizar Treino Completo' : `Faltam ${totalExercises - completedCount} exercícios`}
                </Button>
              </div>}
          </>}
      </AnimatedPanel>
    </div>
  );
};
