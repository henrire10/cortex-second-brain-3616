import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Target, Weight, AlertTriangle, Lightbulb, Zap, Activity, Timer, Flame } from 'lucide-react';
import { ExerciseGifDisplay } from '../ExerciseGifDisplay';
import { calculatePersonalizedSuggestedWeight } from '@/utils/exerciseScientificAnalysis';
import { useAuth } from '@/contexts/AuthContext';
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
interface ExerciseDetailViewProps {
  exercise: Exercise;
  isCompleted: boolean;
  onToggleComplete: () => void;
}
export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({
  exercise,
  isCompleted,
  onToggleComplete
}) => {
  const {
    profile
  } = useAuth();

  // ✅ FASE 1: AUDITORIA DETALHADA DAS INSTRUÇÕES
  console.log('🔍 AUDITORIA CRÍTICA - ExerciseDetailView:', {
    exerciseName: exercise.name,
    instructionsAnalysis: {
      rawInstructions: exercise.instructions,
      instructionsLength: exercise.instructions?.length || 0,
      isEmpty: !exercise.instructions,
      isGeneric: exercise.instructions === 'Instruções não disponíveis para este exercício.',
      isVague: exercise.instructions?.includes('técnica adequada') && (exercise.instructions?.length || 0) < 100,
      hasSteps: exercise.instructions?.includes('\n') || exercise.instructions?.includes('1.'),
      qualityScore: getInstructionQuality(exercise.instructions)
    },
    exerciseData: {
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets,
      reps: exercise.reps,
      hasTips: !!exercise.tips,
      hasCommonMistakes: !!exercise.commonMistakes
    }
  });

  // Calcular peso personalizado baseado no perfil do usuário
  const personalizedWeight = useMemo(() => {
    if (!profile) return null;
    try {
      const userProfile = {
        weight: profile.weight,
        gender: profile.gender,
        experience_level: profile.experienceLevel || 'iniciante',
        age: profile.age,
        fitness_goal: profile.fitnessGoal
      };
      const exerciseForCalculation = {
        name: exercise.name,
        sets: exercise.sets.toString(),
        reps: exercise.reps,
        rest: exercise.rest,
        muscleGroup: exercise.muscleGroup
      };
      return calculatePersonalizedSuggestedWeight(exerciseForCalculation, userProfile);
    } catch (error) {
      console.error('Erro ao calcular peso personalizado:', error);
      return null;
    }
  }, [exercise, profile]);
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Médio':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Difícil':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const estimatedTime = `${exercise.sets * 45}s`;

  // Verificação defensiva para muscleGroup
  const muscleGroups = exercise.muscleGroup ? exercise.muscleGroup.split(',').map(m => m.trim()) : ['Músculos gerais'];

  // Determinar o peso a ser exibido (prioridade: personalizado > do exercício > peso corporal)
  const displayWeight = personalizedWeight || exercise.suggestedWeight || exercise.weight || 'Peso corporal';

  // ✅ NOVO: Calcular calorias inteligentes baseado no perfil
  const intelligentCalories = useMemo(() => {
    if (!profile || !profile.weight) return null;
    try {
      return getCachedCalories({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.rest,
        muscleGroup: exercise.muscleGroup
      }, {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        experienceLevel: profile.experienceLevel,
        activityLevel: profile.activityLevel
      });
    } catch (error) {
      console.error('Erro ao calcular calorias:', error);
      return null;
    }
  }, [exercise, profile]);

  // ✅ FASE 2 + 4: VALIDAÇÃO E FALLBACK INTELIGENTE PARA INSTRUÇÕES
  function getInstructionQuality(instructions: string): number {
    if (!instructions) return 0;
    if (instructions.length < 30) return 20;
    if (instructions.includes('Instruções não disponíveis')) return 10;
    if (instructions.includes('técnica adequada') && instructions.length < 80) return 40;
    if (instructions.includes('\n') || instructions.includes('1.')) return 90;
    return 60;
  }
  function getEnhancedInstructions(): string {
    const quality = getInstructionQuality(exercise.instructions);

    // Se a qualidade for boa, usar as instruções originais
    if (quality >= 80 && exercise.instructions) {
      return exercise.instructions;
    }

    // Sistema de instruções aprimoradas baseado no nome do exercício
    const exerciseName = exercise.name.toLowerCase();
    const enhancedInstructions: Record<string, string> = {
      'supino': `🎯 EXECUÇÃO TÉCNICA DO SUPINO:

1️⃣ POSICIONAMENTO:
• Deite no banco com os pés firmes no chão
• Mantenha as escápulas retraídas e peito alto
• Pegada na largura dos ombros ou ligeiramente maior

2️⃣ MOVIMENTO DESCENDENTE:
• Desça a barra controladamente até tocar o peito
• Mantenha os cotovelos em ângulo de 45° com o tronco
• Respiração: inspire durante a descida

3️⃣ MOVIMENTO ASCENDENTE:
• Pressione a barra para cima de forma explosiva
• Mantenha os punhos firmes e alinhados
• Respiração: expire durante a subida

⚠️ PONTOS CRÍTICOS:
• Não arqueie excessivamente as costas
• Mantenha controle total em toda amplitude
• Não toque e quique no peito`,
      'agachamento': `🎯 EXECUÇÃO TÉCNICA DO AGACHAMENTO:

1️⃣ POSICIONAMENTO INICIAL:
• Pés na largura dos ombros, pontas levemente para fora
• Peito alto, olhar para frente
• Core ativado e coluna neutra

2️⃣ MOVIMENTO DESCENDENTE:
• Inicie flexionando quadris e joelhos simultaneamente
• Desça até coxas paralelas ao chão
• Joelhos alinhados com a ponta dos pés

3️⃣ MOVIMENTO ASCENDENTE:
• Pressione o chão com os pés para subir
• Estenda quadris e joelhos simultaneamente
• Mantenha o peito alto durante todo movimento

⚠️ PONTOS CRÍTICOS:
• Não deixe os joelhos entrarem
• Mantenha o peso distribuído no pé todo
• Controle a velocidade de descida`,
      'deadlift': `🎯 EXECUÇÃO TÉCNICA DO LEVANTAMENTO TERRA:

1️⃣ POSICIONAMENTO:
• Pés sob a barra, largura dos quadris
• Pegada pronada na largura dos ombros
• Barra próxima às canelas

2️⃣ PREPARAÇÃO:
• Peito alto, ombros sobre a barra
• Coluna neutra, core ativado
• Olhar neutro, não para cima

3️⃣ MOVIMENTO:
• Levante estendendo quadris e joelhos juntos
• Mantenha a barra próxima ao corpo
• Finalize com ombros alinhados sobre quadris

⚠️ PONTOS CRÍTICOS:
• Nunca curve as costas
• Não hiperextenda no topo
• Mantenha tensão no core o tempo todo`
    };

    // Buscar instruções específicas
    for (const [key, instruction] of Object.entries(enhancedInstructions)) {
      if (exerciseName.includes(key)) {
        return instruction;
      }
    }

    // Instruções por grupo muscular (com validação defensiva)
    const muscleGroup = exercise.muscleGroup?.toLowerCase() || '';
    if (muscleGroup.includes('peito')) {
      return `🎯 EXERCÍCIO PARA PEITORAL - ${exercise.name}:

1️⃣ Mantenha as escápulas retraídas
2️⃣ Controle total na fase excêntrica (descida)
3️⃣ Contração máxima do peitoral no topo
4️⃣ Respiração: inspire na descida, expire na subida
5️⃣ Amplitude completa do movimento

⚠️ Evite: movimentos bruscos e falta de controle`;
    }
    if (muscleGroup.includes('costas')) {
      return `🎯 EXERCÍCIO PARA COSTAS - ${exercise.name}:

1️⃣ Inicie com escápulas retraídas
2️⃣ Puxe com os músculos das costas, não só braços
3️⃣ Aperte as escápulas no final do movimento
4️⃣ Controle na volta à posição inicial
5️⃣ Mantenha coluna neutra sempre

⚠️ Evite: usar apenas os braços para puxar`;
    }

    // Fallback com qualidade mínima aceitável
    return `🎯 EXECUÇÃO TÉCNICA - ${exercise.name}:

1️⃣ PREPARAÇÃO:
• Posicione-se corretamente
• Ative o core e mantenha postura
• Ajuste carga conforme sua capacidade

2️⃣ EXECUÇÃO:
• Movimento controlado e fluido
• Amplitude completa respeitando limites
• Respiração coordenada com o movimento

3️⃣ FINALIZAÇÃO:
• Controle total até posição inicial
• Mantenha tensão muscular adequada

⚠️ IMPORTANTE: Priorize sempre a técnica sobre a carga`;
  }
  const finalInstructions = getEnhancedInstructions();
  return <div className="h-full w-full relative" style={{
    height: '100%',
    overflow: 'hidden'
  }}>
      <div className="h-full w-full overflow-y-auto overscroll-contain" style={{
      scrollbarWidth: 'thin',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
        <div className="px-4 py-4 space-y-4 pb-24">
        {/* Exercise Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{exercise.name}</h2>
          <div className="flex justify-center gap-2 flex-wrap">
            {muscleGroups.map((muscle, index) => <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-700">
                {muscle}
              </Badge>)}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Tempo Estimado</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{estimatedTime}</div>
          </div>
          
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Gasto Calórico</span>
            </div>
            <div className="text-lg font-bold text-orange-600">
              {intelligentCalories ? `${intelligentCalories.totalCalories} kcal` : exercise.estimatedCalories ? `${exercise.estimatedCalories} kcal` : 'Complete seu perfil'}
            </div>
            {intelligentCalories && <div className="text-xs text-orange-600 mt-1">
                ~{intelligentCalories.caloriesPerSet} kcal/série • {intelligentCalories.burnRate} intensidade
              </div>}
          </div>
        </div>

        {/* Difficulty */}
        {exercise.difficulty && <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Nível de Dificuldade:</span>
            <Badge variant="outline" className={getDifficultyColor(exercise.difficulty)}>
              {exercise.difficulty}
            </Badge>
          </div>}

        {/* Series Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              
              <div className="text-xs font-medium text-blue-600 uppercase">Séries</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">{exercise.reps}</div>
              <div className="text-xs font-medium text-purple-600 uppercase">Repetições</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-orange-600 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {exercise.rest}
              </div>
              <div className="text-xs font-medium text-orange-600 uppercase">Descanso</div>
            </div>
          </div>
        </div>

        {/* Peso Sugerido Personalizado */}
        

        {/* Exercise GIF */}
        <ExerciseGifDisplay exerciseName={exercise.name} videoKeywords={exercise.videoKeywords} className="rounded-lg overflow-hidden shadow-sm" />

        {/* ✅ FASE 5: INSTRUÇÕES APRIMORADAS COM MELHOR APRESENTAÇÃO */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg">Como Executar</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${getInstructionQuality(exercise.instructions) >= 80 ? 'bg-green-500' : getInstructionQuality(exercise.instructions) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-blue-600">
                  {getInstructionQuality(exercise.instructions) >= 80 ? 'Instruções Detalhadas ✨' : getInstructionQuality(exercise.instructions) >= 60 ? 'Instruções Padrão' : 'Instruções Aprimoradas 🤖'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-blue-800 text-sm leading-relaxed">
            <div className="whitespace-pre-line font-mono bg-white/50 rounded-lg p-3 border border-blue-200">
              {finalInstructions}
            </div>
          </div>
          
          {/* ✅ INDICADOR DE QUALIDADE DAS INSTRUÇÕES */}
          {getInstructionQuality(exercise.instructions) < 60 && <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                🤖 Instruções aprimoradas automaticamente pela IA para melhor experiência de treino
              </p>
            </div>}
        </div>

        {/* Tips */}
        {exercise.tips && <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Dicas Importantes</h3>
            </div>
            <p className="text-blue-700 text-sm leading-relaxed">{exercise.tips}</p>
          </div>}

        {/* Common Mistakes */}
        {exercise.commonMistakes && <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Erros Comuns</h3>
            </div>
            <p className="text-red-700 text-sm leading-relaxed">{exercise.commonMistakes}</p>
          </div>}


        {/* Alternatives */}
        {exercise.alternatives && <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Exercícios Alternativos</h3>
            </div>
            <p className="text-yellow-700 text-sm leading-relaxed">{exercise.alternatives}</p>
          </div>}
        </div>
      </div>

      {/* Fixed bottom action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-30" style={{
      paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
    }}>
        <Button onClick={onToggleComplete} className={`w-full h-12 text-sm font-semibold rounded-lg transition-all duration-200 ${isCompleted ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {isCompleted ? 'Concluído ✓' : 'Marcar como Concluído'}
        </Button>
      </div>
    </div>;
};