
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ExerciseGifDisplay } from './ExerciseGifDisplay';
import { Play, Clock, Target, Eye, CheckCircle, Flame } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getCachedCalories } from '@/utils/calorieCalculator';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  weight?: string;
  muscleGroup: string;
  difficulty?: string;
  instructions: string;
  suggestedWeight?: string;
  estimatedCalories?: number;
  commonMistakes?: string;
  alternatives?: string;
  videoKeywords?: string;
  tips?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete: () => void;
  workoutTitle?: string;
  completedExercises?: string[];
  onExerciseToggle?: (exerciseName: string, isCompleted: boolean) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onComplete,
  workoutTitle = '',
  completedExercises = [],
  onExerciseToggle
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  // ✅ CORREÇÃO: Verificar se o exercício está concluído baseado nos dados persistidos
  const isCompleted = completedExercises.includes(exercise.name);

  // ✅ FASE 1: DIAGNÓSTICO APRIMORADO - Logging detalhado das instruções
  const safeExercise = {
    name: exercise?.name || 'Exercício sem nome',
    sets: exercise?.sets || 3,
    reps: exercise?.reps || '10-12',
    rest: exercise?.rest || '60s',
    weight: exercise?.weight || null,
    muscleGroup: exercise?.muscleGroup || 'Geral',
    difficulty: exercise?.difficulty || 'Médio',
    instructions: exercise?.instructions || getSmartInstructionFallback(exercise?.name || ''),
    estimatedCalories: exercise?.estimatedCalories || 0,
    commonMistakes: exercise?.commonMistakes || '',
    alternatives: exercise?.alternatives || '',
    videoKeywords: exercise?.videoKeywords || '',
    tips: exercise?.tips || ''
  };

  // ✅ FASE 1: LOGGING DETALHADO DAS INSTRUÇÕES
  console.log('🔍 AUDITORIA INSTRUÇÕES - ExerciseCard:', {
    exerciseName: safeExercise.name,
    instructionsData: {
      original: exercise?.instructions,
      processed: safeExercise.instructions,
      length: safeExercise.instructions?.length || 0,
      isGeneric: safeExercise.instructions === 'Instruções não disponíveis para este exercício.',
      isSmartFallback: safeExercise.instructions?.includes('Execute com técnica adequada'),
      quality: validateInstructionQuality(safeExercise.instructions)
    },
    isCompleted,
    workoutTitle,
    completedExercisesCount: completedExercises.length
  });

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Médio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Difícil':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: Identificar grupo muscular pelo nome do exercício
  const identifyMuscleGroupFromExerciseName = (exerciseName: string): string => {
    const name = exerciseName.toLowerCase();

    // Mapeamento mais específico baseado no nome do exercício
    if (name.includes('agachamento') || name.includes('squat') || name.includes('leg press') || name.includes('cadeira extensora') || name.includes('hack squat')) {
      return 'quadriceps';
    }
    if (name.includes('stiff') || name.includes('levantamento terra') || name.includes('deadlift') || name.includes('mesa flexora') || name.includes('leg curl')) {
      return 'posterior';
    }
    if (name.includes('hip thrust') || name.includes('glúteo') || name.includes('abdutora') || name.includes('adutora') || name.includes('ponte')) {
      return 'gluteos';
    }
    if (name.includes('afundo') || name.includes('passada') || name.includes('lunge')) {
      return 'pernas';
    }
    if (name.includes('supino') || name.includes('flexão') || name.includes('chest') || name.includes('peito') || name.includes('crucifixo')) {
      return 'peito';
    }
    if (name.includes('pulldown') || name.includes('puxada') || name.includes('remada') || name.includes('barra fixa') || name.includes('costas')) {
      return 'costas';
    }
    if (name.includes('desenvolvimento') || name.includes('elevação lateral') || name.includes('ombro') || name.includes('militar') || name.includes('shoulder')) {
      return 'ombros';
    }
    if (name.includes('rosca') && (name.includes('bíceps') || name.includes('bicep'))) {
      return 'biceps';
    }
    if (name.includes('tríceps') || name.includes('tricep') || name.includes('supino fechado') || name.includes('mergulho')) {
      return 'triceps';
    }
    if (name.includes('panturrilha') || name.includes('calf') || name.includes('gêmeos')) {
      return 'panturrilha';
    }
    if (name.includes('abdominal') || name.includes('prancha') || name.includes('core')) {
      return 'core';
    }

    // Se não conseguir identificar especificamente, usar o grupo muscular fornecido
    return safeExercise.muscleGroup.toLowerCase();
  };

  // ✅ NOVA FUNÇÃO: Calcular peso sugerido SEMPRE baseado no perfil com grupos musculares específicos
  const calculateSuggestedWeightRange = () => {
    if (!profile || !profile.weight || !profile.experienceLevel) {
      console.log('⚠️ PESO: Perfil incompleto, usando fallback genérico');
      return 'Consulte seu personal trainer';
    }
    const userWeight = profile.weight;
    const experienceLevel = profile.experienceLevel.toLowerCase();
    const detectedMuscleGroup = identifyMuscleGroupFromExerciseName(safeExercise.name);
    console.log('🎯 PESO: Calculando peso baseado no perfil:', {
      userWeight,
      experienceLevel,
      exerciseName: safeExercise.name,
      detectedMuscleGroup,
      originalMuscleGroup: safeExercise.muscleGroup
    });

    // Multiplicadores baseados no nível de experiência
    const experienceMultipliers = {
      'iniciante': {
        min: 0.2,
        max: 0.4
      },
      'experiencia_iniciante': {
        min: 0.2,
        max: 0.4
      },
      'intermediario': {
        min: 0.4,
        max: 0.7
      },
      'experiencia_intermediario': {
        min: 0.4,
        max: 0.7
      },
      'avancado': {
        min: 0.7,
        max: 1.0
      },
      'experiencia_avancado': {
        min: 0.7,
        max: 1.0
      }
    };

    // Multiplicadores específicos para cada grupo muscular
    const muscleGroupMultipliers = {
      'peito': 0.6,
      'costas': 0.7,
      'ombros': 0.3,
      'biceps': 0.2,
      'triceps': 0.3,
      'pernas': 1.0,
      'quadriceps': 1.2,
      'posterior': 0.9,
      'gluteos': 0.8,
      'panturrilha': 0.4,
      'core': 0.1,
      'abdomen': 0.1
    };

    const expMultiplier = experienceMultipliers[experienceLevel as keyof typeof experienceMultipliers] || experienceMultipliers.iniciante;
    const muscleMultiplier = muscleGroupMultipliers[detectedMuscleGroup as keyof typeof muscleGroupMultipliers] || 0.5;
    const baseWeight = userWeight * muscleMultiplier;
    const minWeight = Math.max(2, Math.round(baseWeight * expMultiplier.min));
    const maxWeight = Math.round(baseWeight * expMultiplier.max);
    const calculatedRange = `${minWeight} a ${maxWeight} kg`;
    console.log('✅ PESO: Calculado com sucesso:', {
      baseWeight,
      minWeight,
      maxWeight,
      result: calculatedRange,
      muscleMultiplier,
      expMultiplier
    });
    return calculatedRange;
  };

  // ✅ NOVA FUNÇÃO: Alternar estado do exercício (marcar/desmarcar como concluído)
  const handleToggleExercise = async () => {
    if (!user?.id || !workoutTitle) {
      console.error('❌ Usuário não autenticado ou título do treino ausente');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (isCompleted) {
        // Desmarcar exercício como concluído
        const { error } = await supabase
          .from('completed_exercises')
          .delete()
          .eq('user_id', user.id)
          .eq('workout_date', today)
          .eq('exercise_name', safeExercise.name)
          .eq('workout_title', workoutTitle);

        if (error) {
          console.error('❌ Erro ao desmarcar exercício:', error);
          toast({
            title: "Erro",
            description: "Não foi possível desmarcar o exercício.",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Exercício desmarcado:', safeExercise.name);
        toast({
          title: "Exercício desmarcado",
          description: `${safeExercise.name} foi desmarcado.`,
          duration: 2000,
        });
      } else {
        // Marcar exercício como concluído
        const { error } = await supabase
          .from('completed_exercises')
          .insert({
            user_id: user.id,
            workout_date: today,
            exercise_name: safeExercise.name,
            workout_title: workoutTitle
          });

        if (error) {
          console.error('❌ Erro ao marcar exercício:', error);
          toast({
            title: "Erro",
            description: "Não foi possível marcar o exercício como concluído.",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Exercício marcado como concluído:', safeExercise.name);
        toast({
          title: "Exercício Concluído! 💪",
          description: `Parabéns! Você completou ${safeExercise.name}.`,
          duration: 2000,
        });
        
        // Chamar callback do componente pai
        onComplete();
      }

      // Atualizar estado via callback
      if (onExerciseToggle) {
        onExerciseToggle(safeExercise.name, !isCompleted);
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao alternar exercício:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o exercício.",
        variant: "destructive"
      });
    }
  };

  // ✅ FASE 4: SISTEMA INTELIGENTE DE INSTRUÇÕES POR EXERCÍCIO
  function getSmartInstructionFallback(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    
    // Banco de instruções específicas para exercícios comuns
    const instructionDatabase: Record<string, string> = {
      'supino': '1. Deite no banco com os pés no chão\n2. Pegada na largura dos ombros\n3. Desça a barra controladamente até o peito\n4. Pressione para cima mantendo os cotovelos alinhados\n5. Mantenha as escápulas retraídas durante todo movimento',
      'agachamento': '1. Posicione os pés na largura dos ombros\n2. Mantenha o peito alto e coluna neutra\n3. Desça flexionando quadris e joelhos simultaneamente\n4. Desça até coxas paralelas ao chão\n5. Suba pressionando o chão com os pés',
      'deadlift': '1. Posicione-se com pés sob a barra\n2. Pegada pronada na largura dos ombros\n3. Mantenha coluna neutra e peito alto\n4. Levante estendendo quadris e joelhos\n5. Finalize com ombros sobre a linha dos quadris',
      'rosca': '1. Mantenha cotovelos fixos ao lado do corpo\n2. Flexione o antebraço em direção ao bíceps\n3. Contraia o bíceps no topo do movimento\n4. Desça controladamente até extensão completa\n5. Mantenha punhos firmes e alinhados'
    };

    // Buscar instruções específicas
    for (const [key, instruction] of Object.entries(instructionDatabase)) {
      if (name.includes(key)) {
        return instruction;
      }
    }

    // Instruções por categoria muscular
    if (name.includes('peito') || name.includes('chest')) {
      return 'Execute com técnica adequada, mantendo controle total do movimento. Foque na contração do peitoral e mantenha a respiração coordenada.';
    }
    if (name.includes('costas') || name.includes('back')) {
      return 'Mantenha a coluna neutra, retraia as escápulas e foque na contração dos músculos das costas durante toda a execução.';
    }
    if (name.includes('perna') || name.includes('quadríceps')) {
      return 'Mantenha o alinhamento dos joelhos, desça controladamente e suba com força, sempre respeitando a amplitude do movimento.';
    }

    // Fallback genérico melhorado
    return `Execute ${exerciseName} com técnica adequada, mantendo controle total do movimento e respiração coordenada. Consulte um profissional para orientação específica.`;
  }

  // ✅ FASE 2: VALIDAÇÃO DE QUALIDADE DAS INSTRUÇÕES
  function validateInstructionQuality(instructions: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    if (!instructions || instructions.length < 50) {
      issues.push('Instruções muito curtas');
      score -= 30;
    }

    if (instructions.includes('Instruções não disponíveis')) {
      issues.push('Instruções genéricas');
      score -= 40;
    }

    if (instructions.includes('técnica adequada') && instructions.length < 100) {
      issues.push('Instruções vagas');
      score -= 20;
    }

    // Verificar se contém palavras técnicas relevantes
    const technicalWords = ['mantenha', 'execute', 'controle', 'movimento', 'respiração', 'alinhamento'];
    const hasTechnicalWords = technicalWords.some(word => instructions.toLowerCase().includes(word));
    
    if (!hasTechnicalWords) {
      issues.push('Falta terminologia técnica');
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }

  // ✅ CORREÇÃO: Sempre usar o cálculo baseado no perfil
  const suggestedWeight = calculateSuggestedWeightRange();

  // ✅ NOVO: Calcular calorias inteligentes
  const intelligentCalories = profile && profile.weight ? getCachedCalories(
    {
      name: safeExercise.name,
      sets: safeExercise.sets,
      reps: safeExercise.reps,
      rest: safeExercise.rest,
      muscleGroup: safeExercise.muscleGroup
    },
    {
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      gender: profile.gender,
      experienceLevel: profile.experienceLevel,
      activityLevel: profile.activityLevel
    }
  ) : null;

  return <>
      <Card className={`border-2 transition-all duration-200 hover:shadow-md ${isCompleted ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200 hover:border-purple-300'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-gray-800 mb-2">
                {safeExercise.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {safeExercise.muscleGroup}
                </Badge>
                <Badge className={getDifficultyColor(safeExercise.difficulty)}>
                  {safeExercise.difficulty}
                </Badge>
                {(intelligentCalories || safeExercise.estimatedCalories > 0) && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Flame className="w-3 h-3 mr-1" />
                    {intelligentCalories ? `${intelligentCalories.totalCalories}` : `${safeExercise.estimatedCalories}`} kcal
                    {intelligentCalories && (
                      <span className="ml-1 text-xs opacity-75">
                        (IA)
                      </span>
                    )}
                  </Badge>}
                {isCompleted && <Badge className="bg-green-100 text-green-800 border-green-300">
                    ✓ Concluído
                  </Badge>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{safeExercise.sets}</div>
              <div className="text-xs text-gray-500">séries</div>
            </div>
          </div>
          
          {/* GIF do Exercício */}
          <div className="mt-4">
            <ExerciseGifDisplay 
              exerciseName={safeExercise.name}
              videoKeywords={safeExercise.videoKeywords}
              className="w-full h-32 rounded-lg border border-gray-200"
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-600">Repetições:</span>
              <span className="font-semibold text-gray-800">{safeExercise.reps}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-600">Descanso:</span>
              <span className="font-semibold text-orange-600">{safeExercise.rest}</span>
            </div>
            {suggestedWeight && suggestedWeight !== 'Consulte seu personal trainer' && <div className="sm:col-span-2 flex items-center gap-2">
                <span className="text-gray-600">Peso sugerido pela IA:</span>
                <span className="font-semibold text-green-600">{suggestedWeight}</span>
                <span className="text-xs text-gray-500">(baseado no seu perfil)</span>
              </div>}
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {safeExercise.instructions && safeExercise.instructions.length > 120 ? `${safeExercise.instructions.substring(0, 120)}...` : safeExercise.instructions}
            </p>
          </div>

          <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <Button onClick={() => setIsDetailModalOpen(true)} variant="outline" className={`border-purple-200 text-purple-600 hover:bg-purple-50 ${isMobile ? 'w-full' : 'flex-1'}`} size={isMobile ? "default" : "default"}>
              <Eye className={`w-4 h-4 ${isMobile ? 'mr-2' : 'mr-2'}`} />
              <span className={isMobile ? 'text-base' : 'text-sm'}>Ver Detalhes</span>
            </Button>
            
            <Button onClick={handleToggleExercise} className={`text-white transition-all duration-200 ${isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'} ${isMobile ? 'w-full py-3' : 'flex-1'}`} size={isMobile ? "default" : "default"}>
              {isCompleted ? <>
                  <CheckCircle className={`w-4 h-4 ${isMobile ? 'mr-2' : 'mr-2'}`} />
                  <span className={isMobile ? 'text-base font-medium' : 'text-sm'}>Exercício Concluído</span>
                </> : <>
                  <Play className={`w-4 h-4 ${isMobile ? 'mr-2' : 'mr-2'}`} />
                  <span className={isMobile ? 'text-base font-medium' : 'text-sm'}>Feito</span>
                </>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExerciseDetailModal 
        exercise={safeExercise} 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        onComplete={handleToggleExercise} 
      />
    </>;
};
