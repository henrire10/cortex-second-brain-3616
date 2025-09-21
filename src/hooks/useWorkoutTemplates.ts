import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutPlanData } from '@/types/workout-plan';
import { getBrazilDateForDay, logCriticalTime } from '@/utils/brazilTime';

interface WorkoutTemplate {
  dayOfWeek: number;
  title: string;
  content: string;
  exercises: any[];
  workoutPosition: number;
  isRestDay?: boolean;
}

interface UseWorkoutTemplatesReturn {
  templates: WorkoutTemplate[];
  loading: boolean;
  getTemplateForDay: (dayOfWeek: number) => WorkoutTemplate | null;
  getWorkoutForDate: (date: string) => WorkoutTemplate | null;
  refreshTemplates: () => void;
}

export const useWorkoutTemplates = (userId: string | undefined): UseWorkoutTemplatesReturn => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log('🇧🇷 BRAZIL HOOK INICIADO:', {
    timestamp: new Date().toISOString(),
    userId: userId || 'SEM_USER'
  });

  // 🇧🇷 BRAZIL TIME: getWorkoutForDate com Brasil Time
  const getWorkoutForDate = (dateString: string): WorkoutTemplate | null => {
    const timestamp = new Date().toISOString();
    
    logCriticalTime('getWorkoutForDate called', {
      inputDate: dateString,
      hasPlan: !!workoutPlan
    });
    
    console.log(`🇧🇷 BRAZIL getWorkoutForDate [${timestamp}]:`, {
      inputDate: dateString,
      hasPlan: !!workoutPlan,
      hasPlanData: !!workoutPlan?.plan_data
    });

    if (!workoutPlan || !workoutPlan.plan_data) {
      console.log(`❌ BRAZIL: Sem plano disponível para: ${dateString}`);
      return {
        dayOfWeek: 0,
        title: 'Descanso',
        content: '',
        exercises: [],
        workoutPosition: 0,
        isRestDay: true
      };
    }

    const planData = workoutPlan.plan_data as WorkoutPlanData;
    const workoutDays = planData.workoutDays || [];
    const totalWorkouts = workoutDays.length;

    console.log(`📋 BRAZIL PLAN DATA:`, {
      totalWorkouts,
      workoutTitles: workoutDays.map((w: any) => w.title),
      dateRequested: dateString
    });

    if (totalWorkouts === 0) {
      console.log(`❌ BRAZIL: Plano vazio para: ${dateString}`);
      return {
        dayOfWeek: 0,
        title: 'Descanso',
        content: '',
        exercises: [],
        workoutPosition: 0,
        isRestDay: true
      };
    }

    // 🇧🇷 BRAZIL TIME: Analisar a data usando Brasil Time
    const targetDate = new Date(dateString + 'T12:00:00');
    const dayOfWeek = targetDate.getDay(); // 0=Dom, 1=Seg, 2=Ter, ..., 6=Sáb

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    console.log(`🇧🇷 BRAZIL DATE ANALYSIS:`, {
      dateString,
      targetDateISO: targetDate.toISOString(),
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      dateObject: {
        getDay: targetDate.getDay(),
        getDate: targetDate.getDate(),
        getMonth: targetDate.getMonth(),
        getFullYear: targetDate.getFullYear()
      }
    });

    // 🚨 VALIDAÇÃO CRÍTICA: DOMINGO SEMPRE DESCANSO
    if (dayOfWeek === 0) {
      console.log(`😴 BRAZIL DOMINGO: ${dateString} → Descanso obrigatório (dayOfWeek=0)`);
      return {
        dayOfWeek,
        title: 'Descanso',
        content: '',
        exercises: [],
        workoutPosition: 0,
        isRestDay: true
      };
    }

    // 🇧🇷 DISTRIBUIÇÃO INTELIGENTE BRASIL:
    // Criar mapeamento dinâmico baseado no total de treinos
    const getWorkoutMapping = (totalWorkouts: number): { [dayOfWeek: number]: number } => {
      if (totalWorkouts === 3) {
        return { 1: 0, 3: 1, 5: 2 }; // Seg/Qua/Sex
      } else if (totalWorkouts === 4) {
        return { 1: 0, 2: 1, 4: 2, 5: 3 }; // Seg/Ter/Qui/Sex
      } else if (totalWorkouts === 5) {
        return { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }; // Seg/Ter/Qua/Qui/Sex
      } else if (totalWorkouts >= 6) {
        return { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // Seg/Ter/Qua/Qui/Sex/Sab
      }
      return {};
    };

    const workoutMapping = getWorkoutMapping(totalWorkouts);
    const workoutIndex = workoutMapping[dayOfWeek];
    
    console.log(`🎯 BRAZIL MAPEAMENTO INTELIGENTE:`, {
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      workoutIndex,
      totalWorkouts,
      willBeRestDay: workoutIndex === undefined,
      distribution: totalWorkouts === 3 ? 'Seg/Qua/Sex' :
                   totalWorkouts === 4 ? 'Seg/Ter/Qui/Sex' :
                   totalWorkouts === 5 ? 'Seg/Ter/Qua/Qui/Sex' :
                   'Seg/Ter/Qua/Qui/Sex/Sab'
    });
    
    // Se não está no mapeamento = dia de descanso
    if (workoutIndex === undefined) {
      console.log(`😴 BRAZIL DESCANSO INTELIGENTE: ${dateString} (${dayNames[dayOfWeek]}) → Não mapeado para ${totalWorkouts} treinos`);
      return {
        dayOfWeek,
        title: 'Descanso',
        content: '',
        exercises: [],
        workoutPosition: 0,
        isRestDay: true
      };
    }

    const selectedWorkout = workoutDays[workoutIndex];
    if (!selectedWorkout) {
      console.error(`❌ BRAZIL ERRO: Treino não encontrado no índice ${workoutIndex}`);
      return {
        dayOfWeek,
        title: 'Descanso',
        content: '',
        exercises: [],
        workoutPosition: 0,
        isRestDay: true
      };
    }

    const exercises = selectedWorkout.exercises || [];
    const workoutLetter = String.fromCharCode(65 + workoutIndex); // A, B, C, D, E, F

    console.log(`✅ BRAZIL MAPEAMENTO FINAL:`, {
      dateString,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      workoutIndex,
      workoutTitle: selectedWorkout.title,
      workoutLetter,
      exercisesCount: exercises.length,
      mapping: `${dayNames[dayOfWeek]} → Treino ${workoutLetter} (${selectedWorkout.title})`
    });

    const content = exercises.map((ex: any, idx: number) => 
      `${idx + 1}️⃣ ${ex.name}: ${ex.sets}x${ex.reps}, Descanso: ${ex.rest}`
    ).join('\n');

    return {
      dayOfWeek,
      title: selectedWorkout.title,
      content,
      exercises: exercises,
      workoutPosition: workoutIndex + 1,
      isRestDay: false
    };
  };

  const createUserSpecificTemplates = async () => {
    const timestamp = new Date().toISOString();
    
    if (!userId) {
      console.log(`⚠️ AUDITORIA [${timestamp}]: Sem userId fornecido`);
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      console.log(`🔄 AUDITORIA TEMPLATES [${timestamp}]: Buscando plano para:`, userId);
      
      const { data: workoutPlanData, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error(`❌ AUDITORIA [${timestamp}]: Erro ao buscar plano:`, error);
        setTemplates([]);
        setWorkoutPlan(null);
        setLoading(false);
        return;
      }

      console.log(`🎯 AUDITORIA PLANO ENCONTRADO [${timestamp}]:`, {
        planId: workoutPlanData?.id,
        userId: workoutPlanData?.user_id,
        createdAt: workoutPlanData?.created_at,
        isActive: workoutPlanData?.is_active,
        hasPlanData: !!workoutPlanData?.plan_data
      });

      setWorkoutPlan(workoutPlanData);

      const planData = workoutPlanData?.plan_data as unknown as WorkoutPlanData | null;
      
      if (!workoutPlanData || !planData || !planData.workoutDays || !Array.isArray(planData.workoutDays)) {
        console.log(`⚠️ AUDITORIA [${timestamp}]: Usuário sem plano ativo ou dados inválidos`);
        setTemplates([]);
        setLoading(false);
        return;
      }

      const planWorkouts = planData.workoutDays;
      const totalWorkouts = planWorkouts.length;

      console.log(`📋 AUDITORIA PLAN DATA VÁLIDO [${timestamp}]:`, {
        totalWorkouts,
        workoutTitles: planWorkouts.map((w: any) => w.title),
        mapeamento: 'Segunda=A, Terça=B, Quarta=C, etc.',
        workoutDetails: planWorkouts.map((w: any, idx: number) => ({
          index: idx,
          title: w.title,
          exercisesCount: w.exercises?.length || 0,
          letter: String.fromCharCode(65 + idx)
        }))
      });

      // 🔥 CRIAR TEMPLATES CORRETOS
      const userTemplates: WorkoutTemplate[] = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      // 🔥 CRIAR TEMPLATES COM DISTRIBUIÇÃO INTELIGENTE
      const getWorkoutMapping = (totalWorkouts: number): { [dayOfWeek: number]: number } => {
        if (totalWorkouts === 3) {
          return { 1: 0, 3: 1, 5: 2 }; // Seg/Qua/Sex
        } else if (totalWorkouts === 4) {
          return { 1: 0, 2: 1, 4: 2, 5: 3 }; // Seg/Ter/Qui/Sex
        } else if (totalWorkouts === 5) {
          return { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }; // Seg/Ter/Qua/Qui/Sex
        } else if (totalWorkouts >= 6) {
          return { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // Seg/Ter/Qua/Qui/Sex/Sab
        }
        return {};
      };

      const workoutMapping = getWorkoutMapping(totalWorkouts);
      
      // Criar templates para cada dia da semana baseado no mapeamento
      for (let dayIndex = 1; dayIndex <= 6; dayIndex++) {
        const workoutIndex = workoutMapping[dayIndex];
        
        if (workoutIndex !== undefined && workoutIndex < totalWorkouts) {
          const workoutFromPlan = planWorkouts[workoutIndex];
          
          if (workoutFromPlan) {
            const exercises = workoutFromPlan.exercises || [];
            const workoutLetter = String.fromCharCode(65 + workoutIndex); // A, B, C, D, E, F
            
            const template = {
              dayOfWeek: dayIndex,
              title: workoutFromPlan.title,
              content: exercises.map((ex: any, idx: number) => 
                `${idx + 1}️⃣ ${ex.name}: ${ex.sets}x${ex.reps}, Descanso: ${ex.rest}`
              ).join('\n'),
              exercises: exercises,
              workoutPosition: workoutIndex + 1,
              isRestDay: false
            };
            
            userTemplates.push(template);
            
            console.log(`✅ AUDITORIA TEMPLATE CRIADO [${timestamp}]:`, {
              dayIndex,
              dayName: dayNames[dayIndex],
              workoutIndex,
              workoutTitle: workoutFromPlan.title,
              workoutLetter,
              exercisesCount: exercises.length,
              mapping: `${dayNames[dayIndex]}(${dayIndex}) → Treino ${workoutLetter} (${workoutFromPlan.title})`
            });
          }
        } else {
          console.log(`😴 AUDITORIA TEMPLATE DESCANSO [${timestamp}]:`, {
            dayIndex,
            dayName: dayNames[dayIndex],
            reason: `Excede ${totalWorkouts} treinos disponíveis`
          });
        }
      }

      console.log(`✅ AUDITORIA TEMPLATES FINALIZADOS [${timestamp}]:`, {
        templatesCount: userTemplates.length,
        totalWorkoutsInPlan: totalWorkouts,
        distribuicao: userTemplates.map(t => ({
          dayIndex: t.dayOfWeek,
          dia: dayNames[t.dayOfWeek],
          treino: t.title,
          letra: String.fromCharCode(64 + t.workoutPosition),
          workoutPosition: t.workoutPosition
        })),
        finalValidation: {
          segunda: userTemplates.find(t => t.dayOfWeek === 1)?.title || 'SEM TREINO',
          terca: userTemplates.find(t => t.dayOfWeek === 2)?.title || 'SEM TREINO',
          quarta: userTemplates.find(t => t.dayOfWeek === 3)?.title || 'SEM TREINO'
        }
      });

      setTemplates(userTemplates);

    } catch (error) {
      console.error(`❌ AUDITORIA ERRO NO SISTEMA [${timestamp}]:`, error);
      setTemplates([]);
      setWorkoutPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateForDay = (dayOfWeek: number): WorkoutTemplate | null => {
    const timestamp = new Date().toISOString();
    const template = templates.find(template => template.dayOfWeek === dayOfWeek);
    
    console.log(`📋 AUDITORIA getTemplateForDay [${timestamp}]:`, {
      requestedDayOfWeek: dayOfWeek,
      dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
      templateFound: !!template,
      templateTitle: template?.title || 'NENHUM',
      templatesAvailable: templates.length,
      allTemplates: templates.map(t => ({
        dayOfWeek: t.dayOfWeek,
        title: t.title,
        dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][t.dayOfWeek]
      }))
    });
    
    return template || null;
  };

  const refreshTemplates = () => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 AUDITORIA REFRESH [${timestamp}]: Atualizando templates...`);
    setLoading(true);
    createUserSpecificTemplates();
  };

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🇧🇷 BRAZIL useEffect [${timestamp}]: Disparado - userId:`, userId || 'SEM_USER');
    createUserSpecificTemplates();
  }, [userId]);

  return {
    templates,
    loading,
    getTemplateForDay,
    getWorkoutForDate,
    refreshTemplates
  };
};
