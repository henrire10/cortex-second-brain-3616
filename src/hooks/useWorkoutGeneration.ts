import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WorkoutGenerationResult {
  success: boolean;
  workoutPlan?: any;
  qualityMetrics?: {
    score: number;
    errors: number;
    warnings: number;
    variability: string;
    totalExercises: number;
    uniqueExercises: number;
  };
  generationInfo?: {
    model: string;
    timeMs: number;
    version: string;
  };
  source?: string;
  error?: string;
}

interface WorkoutGenerationHook {
  isGenerating: boolean;
  generationProgress: number;
  generateWorkout: () => Promise<WorkoutGenerationResult>;
}

// ✅ VALIDAÇÃO AVANÇADA NO FRONTEND
const validateAIWorkoutAdvanced = (
  workoutPlan: any, 
  expectedDays: number,
  qualityMetrics?: any
): { isValid: boolean; errors: string[]; qualityInfo: string } => {
  const errors: string[] = [];

  if (!workoutPlan) {
    errors.push('Plano de treino não encontrado');
    return { isValid: false, errors, qualityInfo: 'Erro crítico' };
  }

  if (!workoutPlan.workoutDays || !Array.isArray(workoutPlan.workoutDays)) {
    errors.push('Dias de treino não encontrados');
    return { isValid: false, errors, qualityInfo: 'Estrutura inválida' };
  }

  if (workoutPlan.workoutDays.length !== expectedDays) {
    errors.push(`Dias incorretos: ${workoutPlan.workoutDays.length}/${expectedDays}`);
  }

  workoutPlan.workoutDays.forEach((day: any, index: number) => {
    if (!day.title) errors.push(`Dia ${index + 1}: Título ausente`);
    if (!day.exercises || day.exercises.length < 3 || day.exercises.length > 8) {
      errors.push(`Dia ${index + 1}: Quantidade de exercícios inadequada`);
    }
    
    day.exercises?.forEach((exercise: any, exerciseIndex: number) => {
      if (!exercise.name) errors.push(`Dia ${index + 1}, Ex ${exerciseIndex + 1}: Nome ausente`);
      if (!exercise.sets || !exercise.reps) {
        errors.push(`Dia ${index + 1}, Ex ${exerciseIndex + 1}: Séries/reps ausentes`);
      }
    });
  });

  const qualityInfo = qualityMetrics ? 
    `Qualidade: ${qualityMetrics.score}% | Variabilidade: ${qualityMetrics.variability} | ${qualityMetrics.uniqueExercises}/${qualityMetrics.totalExercises} exercícios únicos` :
    'Análise de qualidade não disponível';

  return { isValid: errors.length === 0, errors, qualityInfo };
};

// ✅ CORREÇÃO: Função para calcular programação semanal padrão
const getWeeklySchedule = (workoutDaysPerWeek: number): number[] => {
  console.log('📅 HOOK PROGRAMAÇÃO: Calculando dias da semana para:', workoutDaysPerWeek, 'treinos');
  
  let schedule: number[] = [];
  switch (workoutDaysPerWeek) {
    case 1: schedule = [3]; break; // Quarta
    case 2: schedule = [2, 5]; break; // Terça e sexta
    case 3: schedule = [1, 3, 5]; break; // Segunda, quarta, sexta
    case 4: schedule = [1, 2, 4, 5]; break; // Segunda, terça, quinta, sexta
    case 5: schedule = [1, 2, 3, 4, 5]; break; // Segunda à sexta
    case 6: schedule = [1, 2, 3, 4, 5, 6]; break; // Segunda ao sábado
    case 7: schedule = [1, 2, 3, 4, 5, 6]; break; // ✅ CORREÇÃO: Mesmo com 7 dias, domingo é descanso
    default: schedule = [1, 3, 5]; break; // Padrão: 3x por semana
  }
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  console.log('📅 HOOK PROGRAMAÇÃO RESULTADO:', {
    dias: workoutDaysPerWeek,
    schedule,
    nomesDias: schedule.map(day => weekDays[day]),
    domingoIncluido: schedule.includes(0) ? 'SIM - ERRO!' : 'NÃO - CORRETO'
  });
  
  return schedule;
};

// ✅ CORREÇÃO: Função para calcular data do treino baseada no dia da semana programado
const getWorkoutDateForScheduledDay = (scheduledDayOfWeek: number): string => {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  
  // Calcular quantos dias faltam para o dia programado
  let daysUntilWorkout = scheduledDayOfWeek - currentDayOfWeek;
  
  // Se o dia já passou esta semana, agendar para a próxima semana
  if (daysUntilWorkout < 0) {
    daysUntilWorkout += 7;
  }
  
  const workoutDate = new Date(today);
  workoutDate.setDate(today.getDate() + daysUntilWorkout);
  
  return workoutDate.toISOString().split('T')[0];
};

export const useWorkoutGeneration = (): WorkoutGenerationHook => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { user, updateProfileStatus, refreshProfile } = useAuth();

  const generateWorkout = async (): Promise<WorkoutGenerationResult> => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      console.log('🚀 HOOK SISTEMA APRIMORADO: Iniciando geração com Gemini 2.5 Pro...');
      
      setIsGenerating(true);
      setGenerationProgress(10);
      await updateProfileStatus('gerando_treino');

      progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 3, 70));
      }, 800);

      // Desativar treinos existentes
      if (user?.id) {
        await supabase
          .from('workout_plans')
          .update({ is_active: false })
          .eq('user_id', user.id);
          
        // ✅ LIMPAR daily_workouts antigos
        await supabase
          .from('daily_workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('approval_status', 'pending_approval');
          
        console.log('✅ HOOK: Limpeza de dados antigos concluída');
      }

      // Verificar dados do questionário
      const questionnaireData = localStorage.getItem(`biafitness_questionnaire_${user?.id}`);
      if (!questionnaireData) {
        throw new Error('Dados do questionário não encontrados. Complete o questionário primeiro.');
      }

      const userData = JSON.parse(questionnaireData);
      
      // Extrair dias de treino corretamente
      let workoutDaysFromQuestionnaire = 3;
      
      if (userData.dias_por_semana_treino !== undefined && userData.dias_por_semana_treino !== null) {
        workoutDaysFromQuestionnaire = Number(userData.dias_por_semana_treino);
      } else if (userData.workoutDaysPerWeek !== undefined && userData.workoutDaysPerWeek !== null) {
        workoutDaysFromQuestionnaire = Number(userData.workoutDaysPerWeek);
      }
      
      // Validar limites
      if (workoutDaysFromQuestionnaire < 1 || workoutDaysFromQuestionnaire > 7 || isNaN(workoutDaysFromQuestionnaire)) {
        console.warn('⚠️ HOOK: Dias inválidos, usando padrão 3');
        workoutDaysFromQuestionnaire = 3;
      }
      
      // ✅ CORREÇÃO CRÍTICA: Calcular programação semanal
      const weeklySchedule = getWeeklySchedule(workoutDaysFromQuestionnaire);
      
      console.log('📊 HOOK: Dados para geração CORRIGIDA:', {
        diasPorSemana: workoutDaysFromQuestionnaire,
        programacaoSemanal: weeklySchedule,
        diasProgramados: weeklySchedule.map(day => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]),
        nivel: userData.nivel_experiencia_treino,
        objetivo: userData.meta_principal_usuario
      });

      // ✅ NOVA LÓGICA: Criar perfil completo com validação - MESMA ESTRUTURA DO WORKOUTGENERATIONMANAGER
      const completeProfileData = {
        idade: userData.idade || 25,
        genero: userData.genero || 'feminino', 
        peso_kg: userData.peso_kg || 70,
        altura_cm: userData.altura_cm || 170,
        dias_por_semana_treino: workoutDaysFromQuestionnaire,
        workoutDaysPerWeek: workoutDaysFromQuestionnaire,
        nivel_experiencia_treino: userData.nivel_experiencia_treino || 'intermediario',
        meta_principal_usuario: userData.meta_principal_usuario || 'Melhorar condicionamento',
        duracao_sessao_treino_minutos: userData.duracao_sessao_treino_minutos || 60,
        disponibilidade_equipamentos: userData.disponibilidade_equipamentos || ['equip_basico'],
        nivel_atividade_diaria: userData.nivel_atividade_diaria || 'moderado',
        nivel_comprometimento_objetivo: userData.nivel_comprometimento_objetivo || 'alto',
        qualidade_sono_percebida: userData.qualidade_sono_percebida || 4,
        media_horas_sono: userData.media_horas_sono || 8,
        nivel_estresse_percebido: userData.nivel_estresse_percebido || 3,
        consumo_agua_diario_aproximado: userData.consumo_agua_diario_aproximado || '2-3 litros',
        restricoes_alimentares: userData.restricoes_alimentares || [],
        alimentos_favoritos: userData.alimentos_favoritos || [],
        alimentos_nao_consumidos: userData.alimentos_nao_consumidos || [],
        refeicoes_por_dia: userData.refeicoes_por_dia || 4,
        restricoes_exercicios: userData.restricoes_exercicios || 'Nenhuma',
        preferencias_exercicios: userData.preferencias_exercicios || 'Não especificado',
        condicoes_medicas_limitantes: userData.condicoes_medicas_limitantes || 'Nenhuma',
        meta_especifica_texto: userData.meta_especifica_texto || 'Melhorar condicionamento'
      };

      // MESMA ESTRUTURA DE DADOS DO WORKOUTGENERATIONMANAGER
      const enhancedRequestData = {
        userId: user?.id,
        userProfile: completeProfileData,
        fitnessGoal: completeProfileData.meta_principal_usuario,
        experienceLevel: completeProfileData.nivel_experiencia_treino,
        workoutPreferences: completeProfileData.disponibilidade_equipamentos,
        exercisePreferences: completeProfileData.preferencias_exercicios,
        exerciseRestrictions: completeProfileData.restricoes_exercicios,
        medicalConditions: completeProfileData.condicoes_medicas_limitantes,
        weekNumber: 1,
        forceRegenerate: true,
        source: "robust_workflow"
      };

      console.log('📤 HOOK SISTEMA APRIMORADO: Enviando para IA com validação avançada:', {
        diasEsperados: workoutDaysFromQuestionnaire,
        sistema: "Gemini 2.5 Pro + Validação Avançada",
        optimizations: ["Quantidade 5-6 exercícios", "Alta variabilidade", "Logs de qualidade"]
      });
      
      const { data: result, error } = await supabase.functions.invoke('generate-workout', {
        body: enhancedRequestData
      });

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      setGenerationProgress(75);

      if (error) {
        console.error('❌ HOOK: Erro na chamada da IA:', error);
        throw new Error(error.message || 'Erro na chamada da IA');
      }

      if (!result?.success || !result?.workoutPlan) {
        console.error('❌ HOOK: Resposta inválida da IA:', result);
        throw new Error(result?.error || 'Resposta inválida da IA');
      }

      // VALIDAÇÃO AVANÇADA NO FRONTEND
      setGenerationProgress(80);
      const validation = validateAIWorkoutAdvanced(
        result.workoutPlan, 
        workoutDaysFromQuestionnaire,
        result.qualityMetrics
      );
      
      if (!validation.isValid) {
        console.error('❌ HOOK: Validação avançada falhou:', validation.errors);
        throw new Error(`Treino não atende aos critérios: ${validation.errors.join(', ')}`);
      }

      console.log('✅ HOOK: Validação avançada passou!', validation.qualityInfo);

      // Salvar no banco de dados
      setGenerationProgress(90);

      const { error: saveError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user?.id,
          goal: result.workoutPlan.goal,
          difficulty: result.workoutPlan.difficulty,
          estimated_calories: result.workoutPlan.estimatedCalories,
          week_number: result.workoutPlan.weekNumber || 1,
          plan_data: result.workoutPlan,
          is_active: true
        });

      if (saveError) {
        console.error('❌ HOOK: Erro ao salvar treino:', saveError);
        throw new Error('Erro ao salvar treino no banco de dados');
      }

      console.log('✅ HOOK: Treino salvo com sucesso!');

      // ✅ CRIAR PLANO DE APROVAÇÃO PARA 30 DIAS
      console.log('📋 HOOK EXPANDIDO: Criando plano de aprovação para 30 dias...', {
        userId: user?.id,
        hasWorkoutPlan: !!result.workoutPlan,
        workoutPlanKeys: result.workoutPlan ? Object.keys(result.workoutPlan) : []
      });

      const { data: approvalPlan, error: approvalError } = await supabase
        .from('workout_plans_approval')
        .insert({
          user_id: user?.id,
          plan_data: result.workoutPlan,
          status: 'pending_approval'
        })
        .select()
        .single();

      if (approvalError) {
        console.error('❌ HOOK: ERRO CRÍTICO ao criar plano de aprovação:', {
          error: approvalError,
          message: approvalError.message,
          code: approvalError.code,
          details: approvalError.details,
          hint: approvalError.hint,
          userId: user?.id,
          dataSize: JSON.stringify(result.workoutPlan).length
        });
        
        // Tentar criar mesmo assim para não bloquear o fluxo
        console.warn('⚠️ HOOK: Continuando sem plano de aprovação devido ao erro');
      } else {
        console.log('✅ HOOK: Plano de aprovação criado com sucesso:', {
          id: approvalPlan.id,
          userId: approvalPlan.user_id,
          status: approvalPlan.status,
          createdAt: approvalPlan.created_at
        });
      }

      // ✅ CRIAR TREINOS INICIAIS COM PROGRAMAÇÃO PARA 30 DIAS
      const workoutDays = result.workoutPlan.workoutDays || [];
      const planIdForDailyWorkouts = approvalPlan?.id || null;
      
      console.log('📅 HOOK EXPANDIDO: Criando treinos iniciais (aprovação expandirá para 30 dias):', {
        totalTreinosGerados: workoutDays.length,
        diasProgramados: weeklySchedule.length,
        programacaoSemanal: weeklySchedule.map(day => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]),
        primeiroTreino: workoutDays[0]?.title || 'N/A',
        approvalPlanId: planIdForDailyWorkouts,
        observacao: 'Aprovação do personal criará automaticamente 30 dias'
      });
      
      // ✅ GARANTIR QUE TODOS OS TREINOS SEJAM CRIADOS, INCLUINDO O TREINO A
      for (let workoutIndex = 0; workoutIndex < workoutDays.length && workoutIndex < weeklySchedule.length; workoutIndex++) {
        const workout = workoutDays[workoutIndex];
        const scheduledDayOfWeek = weeklySchedule[workoutIndex];
        const workoutDateString = getWorkoutDateForScheduledDay(scheduledDayOfWeek);
        
        const workoutContent = workout.exercises?.map((exercise: any, index: number) => 
          `${index + 1}️⃣ ${exercise.name}: ${exercise.sets}x${exercise.reps}, Descanso: ${exercise.rest}`
        ).join('\n') || 'Conteúdo do treino não disponível';

        const dailyWorkoutData = {
          user_id: user?.id,
          workout_date: workoutDateString,
          workout_title: workout.title || `Treino ${String.fromCharCode(65 + workoutIndex)}`, // A, B, C, D, E, F
          workout_content: workoutContent,
          status: 'pending',
          approval_status: 'pending_approval',
          ...(planIdForDailyWorkouts && { plan_id: planIdForDailyWorkouts })
        };

        const { error: dailyWorkoutError } = await supabase
          .from('daily_workouts')
          .insert(dailyWorkoutData);

        if (dailyWorkoutError) {
          console.error('❌ HOOK: ERRO CRÍTICO ao criar daily_workout:', {
            index: workoutIndex,
            error: dailyWorkoutError,
            data: dailyWorkoutData
          });
        } else {
          const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          console.log('✅ HOOK CORREÇÃO TREINO A: Daily workout criado com sucesso:', {
            indice: workoutIndex,
            titulo: workout.title,
            letra: String.fromCharCode(65 + workoutIndex),
            diaDaSemana: weekDays[scheduledDayOfWeek],
            data: workoutDateString,
            status: 'pending_approval',
            planId: planIdForDailyWorkouts,
            isTreinoA: workoutIndex === 0 ? 'SIM - TREINO A CRIADO!' : 'NÃO'
          });
        }
      }

      console.log('✅ HOOK EXPANDIDO: Treinos iniciais criados - aguardando aprovação para expansão automática de 30 dias');

      // Atualizar status para 'treino_gerado'
      await updateProfileStatus('treino_gerado');
      await refreshProfile();

      setGenerationProgress(100);

      const generatedDays = result.workoutPlan.workoutDays?.length || 0;
      const totalExercises = result.workoutPlan.workoutDays?.reduce((total: number, day: any) => 
        total + (day.exercises?.length || 0), 0) || 0;

      console.log('✅ HOOK SISTEMA APRIMORADO: Processo concluído:', {
        qualityScore: result.qualityMetrics?.score || 'N/A',
        variability: result.qualityMetrics?.variability || 'N/A',
        totalExercises: result.qualityMetrics?.totalExercises || 'N/A',
        uniqueExercises: result.qualityMetrics?.uniqueExercises || 'N/A',
        model: result.generationInfo?.model || 'Gemini 2.5 Pro',
        timeMs: result.generationInfo?.timeMs || 'N/A',
        version: result.generationInfo?.version || 'v2.5-pro-optimized'
      });

      const qualityMessage = result.qualityMetrics?.score >= 85 ? 
        `Treino de EXCELENTE qualidade (${result.qualityMetrics.score}%)!` :
        `Treino de boa qualidade (${result.qualityMetrics?.score || 'N/A'}%)!`;

      toast({
        title: "✨ Treino Personalizado Criado!",
        description: `${qualityMessage}`,
        duration: 5000,
      });

      return {
        success: true,
        workoutPlan: result.workoutPlan,
        qualityMetrics: result.qualityMetrics,
        generationInfo: result.generationInfo,
        source: result.source
      };

    } catch (error: any) {
      console.error('❌ HOOK SISTEMA APRIMORADO: Falha no processo:', error);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      await updateProfileStatus('falha_na_geracao');
      setGenerationProgress(0);
      
      toast({
        title: "Erro na Criação do Treino",
        description: "Falha na geração do treino. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });

      return {
        success: false,
        error: error.message || 'Erro desconhecido no sistema aprimorado'
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generationProgress,
    generateWorkout
  };
};
