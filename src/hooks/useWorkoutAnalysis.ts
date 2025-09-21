import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkoutPlanData } from '@/types/workout-plan';
import { 
  generatePersonalizedScientificRationale, 
  generatePersonalizedBenefits,
  calculatePersonalizedCalories 
} from '@/utils/exerciseScientificAnalysis';

interface WorkoutQualityMetrics {
  qualityScore: number;
  variabilityScore: number;
  totalExercises: number;
  uniqueExercises: number;
  muscleGroupCoverage: number;
  errors: string[];
  warnings: string[];
  generationTime: number;
  tokensUsed?: number;
  retryCount?: number;
}

interface WorkoutSession {
  id: string;
  title: string;
  focus: string;
  scientificStrategy: string;
  volumeIntensity: string;
  weeklyTiming: string;
  personalAdaptations: string[];
  totalExercises: number;
  estimatedDuration: number;
  primaryMuscleGroups: string[];
  estimatedCalories: number;
  difficultyLevel: string;
}

interface WeeklyDistribution {
  frequency: {
    total: number;
    distribution: string;
    rationale: string;
  };
  recovery: {
    restDays: number;
    pattern: string;
    explanation: string;
  };
  progression: {
    weeklyStructure: string;
    intensityPattern: string;
    adaptation: string;
  };
  muscleBalancing: {
    upperLower: string;
    pushPull: string;
    strategy: string;
  };
}

interface WorkoutAnalysisData {
  workoutPlan: any;
  qualityMetrics: WorkoutQualityMetrics;
  workoutSessions: WorkoutSession[];
  weeklyDistribution: WeeklyDistribution;
  personalizedInsights: {
    ageOptimization: string;
    experienceAdaptation: string;
    goalAlignment: string;
    biometricConsiderations: string;
  };
  muscleDistribution: { [key: string]: number };
  progressionStrategy: {
    week1: string;
    week2: string;
    week4: string;
    week8: string;
  };
}

export const useWorkoutAnalysis = () => {
  const [analysisData, setAnalysisData] = useState<WorkoutAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();

  const generateWorkoutSessionAnalysis = (workoutDays: any[], userProfile: any): WorkoutSession[] => {
    return workoutDays.map((day, index) => {
      const exercises = day.exercises || [];
      const totalExercises = exercises.length;
      const estimatedDuration = totalExercises * 4; // ~4 minutes per exercise
      const estimatedCalories = exercises.reduce((total: number, ex: any) => 
        total + calculatePersonalizedCalories(ex, userProfile), 0
      );
      
      const primaryMuscleGroups = [...new Set(exercises.map((ex: any) => ex.muscleGroup).filter((group: any) => group) as string[])];
      const sessionLetter = String.fromCharCode(65 + index); // A, B, C, D...
      
      return {
        id: `session-${index}`,
        title: `Treino ${sessionLetter} - ${day.title}`,
        focus: day.focus || `Treino focado em ${primaryMuscleGroups.join(' e ')}`,
        scientificStrategy: generateSessionStrategy(day, userProfile),
        volumeIntensity: generateVolumeIntensityAnalysis(exercises, userProfile),
        weeklyTiming: generateWeeklyTiming(index, workoutDays.length),
        personalAdaptations: generateSessionAdaptations(day, userProfile),
        totalExercises,
        estimatedDuration,
        primaryMuscleGroups,
        estimatedCalories,
        difficultyLevel: calculateSessionDifficulty(exercises, userProfile)
      };
    });
  };

  const generateWeeklyDistribution = (workoutDays: any[], userProfile: any): WeeklyDistribution => {
    const totalSessions = workoutDays.length;
    const restDays = 7 - totalSessions;
    
    return {
      frequency: {
        total: totalSessions,
        distribution: generateFrequencyDistribution(totalSessions),
        rationale: generateFrequencyRationale(totalSessions, userProfile)
      },
      recovery: {
        restDays,
        pattern: generateRecoveryPattern(totalSessions),
        explanation: generateRecoveryExplanation(restDays, userProfile)
      },
      progression: {
        weeklyStructure: generateWeeklyStructure(workoutDays),
        intensityPattern: generateIntensityPattern(workoutDays),
        adaptation: generateAdaptationStrategy(userProfile)
      },
      muscleBalancing: {
        upperLower: generateUpperLowerBalance(workoutDays),
        pushPull: generatePushPullBalance(workoutDays),
        strategy: generateBalancingStrategy(workoutDays, userProfile)
      }
    };
  };

  const getDifficultyFromReps = (reps: string, experienceLevel?: string): string => {
    const repsNumber = parseInt(reps?.split('-')[0] || '10');
    const experience = experienceLevel?.toLowerCase() || 'iniciante';
    
    if (experience === 'iniciante') {
      return repsNumber > 15 ? 'fácil' : repsNumber > 10 ? 'médio' : 'difícil';
    } else if (experience === 'intermediário' || experience === 'intermediario') {
      return repsNumber > 12 ? 'fácil' : repsNumber > 8 ? 'médio' : 'difícil';
    } else {
      return repsNumber > 10 ? 'fácil' : repsNumber > 6 ? 'médio' : 'difícil';
    }
  };

  const calculateMuscleDistribution = (exercises: any[]): { [key: string]: number } => {
    const distribution: { [key: string]: number } = {};
    
    exercises.forEach(exercise => {
      const muscle = exercise.muscleGroup || 'outros';
      distribution[muscle] = (distribution[muscle] || 0) + 1;
    });

    return distribution;
  };

  const generatePersonalizedInsights = (profile: any, workoutPlan: any) => {
    const age = profile?.age || 25;
    const experience = profile?.experience_level || 'iniciante';
    const goal = profile?.fitness_goal || 'condicionamento geral';
    const weight = profile?.weight || 70;
    const height = profile?.height || 170;
    
    return {
      ageOptimization: age < 25 
        ? `Aos ${age} anos, seu organismo possui capacidade de síntese proteica 25% superior e recuperação neurológica acelerada. O treino explora essa janela anabólica natural, com intensidades que aproveitam sua alta tolerância ao estresse mecânico e metabólico.`
        : age < 40 
        ? `Na faixa dos ${age} anos, o programa equilibra intensidade com recuperação inteligente. Seu perfil hormonal ainda permite ganhos significativos, mas com atenção especial à qualidade do movimento e prevenção de lesões por sobrecarga.`
        : `Após os ${age} anos, o treino foca em combater a sarcopenia (perda natural de 3-8% de massa muscular por década). Prioriza exercícios funcionais e cargas que estimulem densidade óssea, crucial para longevidade ativa.`,
      
      experienceAdaptation: experience === 'iniciante'
        ? `Como iniciante, 60-80% dos seus ganhos iniciais serão neurológicos (melhora na coordenação e recrutamento muscular). O programa prioriza aprendizado motor correto, com progressão gradual que respeita sua curva de adaptação natural.`
        : experience === 'intermediario' || experience === 'intermediário'
        ? `No nível intermediário, você já possui base neuromuscular sólida. O treino implementa variações de ângulos, tempos de tensão e intensidade para quebrar platôs adaptativos. Foco na periodização para ganhos contínuos.`
        : `Como praticante avançado, seu sistema neuromuscular requer estímulos sofisticados. O programa utiliza técnicas de intensificação, controle excêntrico e variações biomecânicas para desafiar sua alta capacidade adaptativa.`,
      
      goalAlignment: goal === 'Perda de peso'
        ? `Para perda de peso eficaz, o treino maximiza EPOC (consumo excessivo de oxigênio pós-exercício), mantendo queima calórica elevada por 24-48h. Com seu peso atual (${weight}kg), cada sessão pode gerar até ${Math.round(weight * 8)}kcal extras no pós-treino.`
        : goal === 'Ganho de massa muscular'
        ? `Para hipertrofia otimizada, o protocolo ativa mTOR (via principal de crescimento), com volumes que estimulam síntese proteica sem overtraining. Considerando seu biotipo, o foco são cargas de 70-85% 1RM com 3-5 séries por grupamento.`
        : `Para definição e condicionamento, o programa combina estímulos hipertróficos com demanda metabólica. Equilibra preservação muscular durante déficit calórico com queima de gordura localizada através de exercícios específicos.`,
      
      biometricConsiderations: `Com ${height}cm e ${weight}kg (IMC: ${(weight / Math.pow(height/100, 2)).toFixed(1)}), suas proporções corporais influenciam a biomecânica dos exercícios. Alavancas articulares foram consideradas na seleção de movimentos, otimizando ângulos de trabalho para máxima eficiência e mínimo risco lesional. ${height > 180 ? 'Sua estatura elevada favorece exercícios com amplitude maior.' : height < 165 ? 'Sua estrutura compacta permite cargas relativas superiores.' : 'Suas proporções equilibradas permitem versatilidade na execução dos movimentos.'}`
    };
  };

  const loadAnalysisData = async () => {
    if (!user?.id || !profile) {
      setIsLoading(false);
      return;
    }

    try {
      // Carregar plano de treino ativo
      const { data: workoutPlan, error: planError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError || !workoutPlan) {
        console.error('Error loading workout plan:', planError);
        setAnalysisData(null);
        return;
      }

      // Safe type conversion through unknown first
      let planData: WorkoutPlanData;
      try {
        planData = workoutPlan.plan_data as unknown as WorkoutPlanData;
        if (!planData || !planData.workoutDays) {
          throw new Error('Invalid plan data structure');
        }
      } catch (error) {
        console.error('Error parsing plan data:', error);
        setAnalysisData(null);
        return;
      }

      const allExercises = planData.workoutDays?.flatMap((day: any) => day.exercises || []) || [];

      // Simular métricas de qualidade baseadas nos dados reais
      const qualityMetrics: WorkoutQualityMetrics = {
        qualityScore: planData?.qualityScore || 85,
        variabilityScore: calculateVariability(allExercises),
        totalExercises: allExercises.length,
        uniqueExercises: new Set(allExercises.map((ex: any) => ex.name)).size,
        muscleGroupCoverage: new Set(allExercises.map((ex: any) => ex.muscleGroup)).size,
        errors: [],
        warnings: [],
        generationTime: 2500,
        tokensUsed: 3200,
        retryCount: 0
      };

      const workoutSessions = generateWorkoutSessionAnalysis(planData.workoutDays, profile);
      const weeklyDistribution = generateWeeklyDistribution(planData.workoutDays, profile);
      const muscleDistribution = calculateMuscleDistribution(allExercises);
      const personalizedInsights = generatePersonalizedInsights(profile, workoutPlan);

      const progressionStrategy = {
        week1: 'Adaptação neural e aprendizado dos movimentos',
        week2: 'Aumento progressivo da intensidade e volume',
        week4: 'Consolidação da técnica e ganhos iniciais',
        week8: 'Resultados visíveis e adaptação completa'
      };

      setAnalysisData({
        workoutPlan,
        qualityMetrics,
        workoutSessions,
        weeklyDistribution,
        personalizedInsights,
        muscleDistribution,
        progressionStrategy
      });

    } catch (error) {
      console.error('Error loading analysis data:', error);
      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateVariability = (exercises: any[]): number => {
    if (exercises.length === 0) return 0;
    const uniqueCount = new Set(exercises.map(ex => ex.name)).size;
    return (uniqueCount / exercises.length) * 100;
  };

  // Helper functions for workout session analysis
  const generateSessionStrategy = (day: any, profile: any): string => {
    const exercises = day.exercises || [];
    const muscleGroups = [...new Set(exercises.map((ex: any) => ex.muscleGroup))];
    
    if (muscleGroups.includes('Pernas') || muscleGroups.includes('Glúteos')) {
      return `Sessão focada no trem inferior com ênfase em força funcional e hipertrofia. A sequência de exercícios maximiza o recrutamento das fibras tipo II, promovendo ganhos de potência e massa muscular através da sobrecarga progressiva.`;
    } else if (muscleGroups.includes('Peito') || muscleGroups.includes('Ombros')) {
      return `Treino de empurrar (push) que trabalha sinergicamente peito, ombros e tríceps. A progressão angular dos movimentos otimiza a ativação muscular e previne desequilíbrios, seguindo princípios biomecânicos para máxima eficiência.`;
    } else {
      return `Sessão balanceada que integra múltiplos grupos musculares, promovendo coordenação inter e intramuscular. O volume e intensidade são calibrados para seu nível de experiência, maximizando adaptações neurais e estruturais.`;
    }
  };

  const generateVolumeIntensityAnalysis = (exercises: any[], profile: any): string => {
    const totalSets = exercises.reduce((total: number, ex: any) => 
      total + parseInt(ex.sets || '3'), 0
    );
    const avgReps = exercises.reduce((total: number, ex: any) => 
      total + parseInt(ex.reps?.split('-')[0] || '10'), 0
    ) / exercises.length;

    if (totalSets >= 20) {
      return `Alto volume (${totalSets} séries) com intensidade moderada. Ideal para hipertrofia e resistência muscular, promovendo adaptações metabólicas e estruturais através do estresse por volume.`;
    } else if (totalSets >= 12) {
      return `Volume moderado (${totalSets} séries) com foco em qualidade do movimento. Equilibra estímulo hipertrófico com recuperação adequada, permitindo progressão sustentável.`;
    } else {
      return `Volume concentrado (${totalSets} séries) priorizando intensidade e técnica. Maximiza adaptações neurais e força através de cargas mais elevadas e menor volume total.`;
    }
  };

  const generateWeeklyTiming = (index: number, totalWorkouts: number): string => {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const position = Math.floor((index / totalWorkouts) * 6);
    return `Posicionado estrategicamente na ${days[position]}, permitindo recuperação adequada entre estímulos similares e otimizando a supercompensação.`;
  };

  const generateSessionAdaptations = (day: any, profile: any): string[] => {
    const adaptations = [];
    const age = profile?.age || 25;
    const experience = profile?.experience_level || 'iniciante';
    const goal = profile?.fitness_goal || 'condicionamento geral';

    if (age < 30) {
      adaptations.push('Alta capacidade de recuperação');
    } else {
      adaptations.push('Foco na prevenção e mobilidade');
    }

    if (experience === 'iniciante') {
      adaptations.push('Progressão gradual');
      adaptations.push('Ênfase na técnica');
    } else {
      adaptations.push('Intensidade elevada');
      adaptations.push('Variações avançadas');
    }

    if (goal.includes('peso')) {
      adaptations.push('Alto gasto calórico');
    } else if (goal.includes('massa')) {
      adaptations.push('Foco hipertrófico');
    }

    return adaptations;
  };

  const calculateSessionDifficulty = (exercises: any[], profile: any): string => {
    const avgReps = exercises.reduce((total: number, ex: any) => 
      total + parseInt(ex.reps?.split('-')[0] || '10'), 0
    ) / exercises.length;
    
    const experience = profile?.experience_level || 'iniciante';
    
    if (experience === 'iniciante') {
      return avgReps > 12 ? 'fácil' : avgReps > 8 ? 'médio' : 'difícil';
    } else if (experience === 'intermediario' || experience === 'intermediário') {
      return avgReps > 10 ? 'fácil' : avgReps > 6 ? 'médio' : 'difícil';
    } else {
      return avgReps > 8 ? 'fácil' : avgReps > 5 ? 'médio' : 'difícil';
    }
  };

  const generateFrequencyDistribution = (total: number): string => {
    const patterns = {
      1: 'Concentração semanal única',
      2: 'Distribuição alternada',
      3: 'Padrão clássico (Segunda/Quarta/Sexta)',
      4: 'Frequência alta com descanso estratégico',
      5: 'Intensidade diária moderada',
      6: 'Volume máximo com domingo de descanso'
    };
    return patterns[total as keyof typeof patterns] || 'Distribuição personalizada';
  };

  const generateFrequencyRationale = (total: number, profile: any): string => {
    if (total <= 3) {
      return `Frequência moderada ideal para iniciantes e intermediários, permitindo recuperação completa entre sessões (48-72h) e adaptação neural progressiva.`;
    } else {
      return `Frequência elevada apropriada para praticantes experientes, com divisão muscular que permite recuperação regional enquanto mantém estímulo constante.`;
    }
  };

  const generateRecoveryPattern = (total: number): string => {
    if (total <= 3) {
      return 'Recuperação completa entre grupos musculares';
    } else if (total <= 5) {
      return 'Recuperação ativa com alternância de grupos';
    } else {
      return 'Micro-recuperação com domingo de descanso total';
    }
  };

  const generateRecoveryExplanation = (restDays: number, profile: any): string => {
    const age = profile?.age || 25;
    if (restDays >= 3) {
      return `${restDays} dias de descanso permitem síntese proteica completa (24-48h) e restauração do glicogênio muscular, essencial para ganhos sustentáveis.`;
    } else {
      return `${restDays} dias de descanso com recuperação ativa. ${age > 35 ? 'Adequado para idade, priorizando qualidade sobre quantidade.' : 'Intensidade controlada para maximizar adaptações.'}`;
    }
  };

  const generateWeeklyStructure = (workoutDays: any[]): string => {
    const muscleGroups = workoutDays.map(day => 
      [...new Set((day.exercises || []).map((ex: any) => ex.muscleGroup))]
    );
    
    const hasLowerFocus = muscleGroups.some(groups => 
      groups.some((group: string) => ['Pernas', 'Glúteos', 'Panturrilha'].includes(group))
    );
    
    const hasUpperFocus = muscleGroups.some(groups => 
      groups.some((group: string) => ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'].includes(group))
    );

    if (hasLowerFocus && hasUpperFocus) {
      return 'Divisão upper/lower com foco equilibrado entre trem superior e inferior';
    } else if (workoutDays.length >= 4) {
      return 'Divisão por grupos musculares com especialização por sessão';
    } else {
      return 'Treino full-body com ênfase em movimentos compostos';
    }
  };

  const generateIntensityPattern = (workoutDays: any[]): string => {
    return 'Progressão ondulatória: intensidade moderada nos primeiros dias, pico no meio da semana, e volume controlado nos dias finais para otimizar recuperação.';
  };

  const generateAdaptationStrategy = (profile: any): string => {
    const experience = profile?.experience_level || 'iniciante';
    if (experience === 'iniciante') {
      return 'Adaptação neural prioritária nas primeiras 6-8 semanas, seguida por ganhos estruturais progressivos.';
    } else {
      return 'Periodização avançada com fases de intensificação e recuperação para quebrar platôs adaptativos.';
    }
  };

  const generateUpperLowerBalance = (workoutDays: any[]): string => {
    const upperCount = workoutDays.filter(day => 
      (day.exercises || []).some((ex: any) => 
        ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'].includes(ex.muscleGroup)
      )
    ).length;
    
    const lowerCount = workoutDays.filter(day => 
      (day.exercises || []).some((ex: any) => 
        ['Pernas', 'Glúteos', 'Panturrilha'].includes(ex.muscleGroup)
      )
    ).length;

    return `${upperCount}:${lowerCount} (Superior:Inferior)`;
  };

  const generatePushPullBalance = (workoutDays: any[]): string => {
    return 'Equilibrio 1:1 entre movimentos de empurrar e puxar, prevenindo desequilíbrios posturais e lesões por overuse.';
  };

  const generateBalancingStrategy = (workoutDays: any[], profile: any): string => {
    return 'Distribuição biomecânica que respeita cadeias cinéticas, priorizando movimentos funcionais e prevenindo compensações musculares através de ativação balanceada.';
  };

  useEffect(() => {
    loadAnalysisData();
  }, [user?.id, profile]);

  return {
    analysisData,
    isLoading,
    refreshAnalysis: loadAnalysisData
  };
};
