
import { WorkoutPlan } from './types.ts';

// ✅ SISTEMA DE VALIDAÇÃO CORRIGIDO - MENOS RESTRITIVO
export const validateWorkoutPlanAdvanced = (
  workoutPlan: any, 
  expectedDays: number,
  experienceLevel: string
): { isValid: boolean; errors: string[]; warnings: string[]; qualityScore: number } => {
  
  const errors: string[] = [];
  const warnings: string[] = [];
  let qualityScore = 100;
  
  console.log('🔍 VALIDAÇÃO CORRIGIDA: Iniciando análise otimizada do treino...');

  // VALIDAÇÃO BÁSICA ESTRUTURAL
  if (!workoutPlan) {
    errors.push('Plano de treino não encontrado');
    return { isValid: false, errors, warnings, qualityScore: 0 };
  }

  if (!workoutPlan.workoutDays || !Array.isArray(workoutPlan.workoutDays)) {
    errors.push('Dias de treino não encontrados ou inválidos');
    return { isValid: false, errors, warnings, qualityScore: 0 };
  }

  if (workoutPlan.workoutDays.length !== expectedDays) {
    errors.push(`Número incorreto de dias. Esperado: ${expectedDays}, Recebido: ${workoutPlan.workoutDays.length}`);
    qualityScore -= 15;
  }

  // ✅ CORREÇÃO: VALIDAÇÃO FLEXÍVEL DE EXERCÍCIOS
  const expectedExerciseCount = getFlexibleExerciseCount(experienceLevel);
  let totalExercises = 0;
  let exerciseNames: string[] = [];
  let muscleGroupCoverage: string[] = [];

  workoutPlan.workoutDays.forEach((day: any, dayIndex: number) => {
    // Validar estrutura do dia
    if (!day.title || typeof day.title !== 'string') {
      warnings.push(`Dia ${dayIndex + 1}: Título ausente ou inválido`);
      qualityScore -= 5;
    }

    if (!day.focus || typeof day.focus !== 'string') {
      warnings.push(`Dia ${dayIndex + 1}: Foco do treino não especificado`);
      qualityScore -= 3;
    }

    if (!day.exercises || !Array.isArray(day.exercises)) {
      errors.push(`Dia ${dayIndex + 1}: Lista de exercícios inválida`);
      qualityScore -= 20;
      return;
    }

    // ✅ CORREÇÃO: VALIDAÇÃO FLEXÍVEL - CONVERTER ERROS EM AVISOS
    const exerciseCount = day.exercises.length;
    totalExercises += exerciseCount;

    if (exerciseCount < expectedExerciseCount.min) {
      // ✅ MUDANÇA: Agora é apenas um aviso, não erro crítico
      warnings.push(`Dia ${dayIndex + 1}: Poucos exercícios (${exerciseCount}). Sugerido: ${expectedExerciseCount.min}-${expectedExerciseCount.max}`);
      qualityScore -= 8; // Redução menor de pontos
    } else if (exerciseCount > expectedExerciseCount.max) {
      warnings.push(`Dia ${dayIndex + 1}: Muitos exercícios (${exerciseCount}). Recomendado: ${expectedExerciseCount.min}-${expectedExerciseCount.max}`);
      qualityScore -= 5;
    }

    // Validar cada exercício
    day.exercises.forEach((exercise: any, exerciseIndex: number) => {
      const exerciseId = `Dia ${dayIndex + 1}, Ex ${exerciseIndex + 1}`;

      // Validações críticas apenas
      if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.length < 2) {
        errors.push(`${exerciseId}: Nome do exercício inválido`);
        qualityScore -= 8;
      } else {
        exerciseNames.push(exercise.name.toLowerCase());
      }

      if (!exercise.sets || !exercise.reps) {
        errors.push(`${exerciseId}: Séries ou repetições ausentes`);
        qualityScore -= 8;
      }

      // ✅ FASE 2: VALIDAÇÃO RIGOROSA DE INSTRUÇÕES
      if (!exercise.instructions || exercise.instructions.length < 50) {
        errors.push(`${exerciseId}: Instruções inadequadas (mínimo 50 caracteres)`);
        qualityScore -= 20;
      } else if (exercise.instructions.length < 80) {
        warnings.push(`${exerciseId}: Instruções curtas (recomendado 100+ caracteres)`);
        qualityScore -= 10;
      }

      // ✅ FASE 2: VALIDAÇÃO DE QUALIDADE DAS INSTRUÇÕES
      if (exercise.instructions) {
        const instructionQuality = validateInstructionContent(exercise.instructions, exerciseId);
        qualityScore -= instructionQuality.penalty;
        if (instructionQuality.errors.length > 0) {
          errors.push(...instructionQuality.errors);
        }
        if (instructionQuality.warnings.length > 0) {
          warnings.push(...instructionQuality.warnings);
        }
      }

      if (!exercise.muscleGroup) {
        warnings.push(`${exerciseId}: Grupo muscular não especificado`);
        qualityScore -= 1; // Redução mínima
      } else {
        muscleGroupCoverage.push(exercise.muscleGroup.toLowerCase());
      }
    });
  });

  // ✅ ANÁLISE DE VARIABILIDADE OTIMIZADA
  const uniqueExercises = new Set(exerciseNames).size;
  const variabilityScore = totalExercises > 0 ? (uniqueExercises / totalExercises) * 100 : 0;
  
  if (variabilityScore < 60) {
    warnings.push(`Variabilidade baixa: ${variabilityScore.toFixed(1)}% únicos`);
    qualityScore -= 8;
  } else if (variabilityScore > 85) {
    console.log('🌟 ALTA VARIABILIDADE: Excelente diversidade de exercícios!');
    qualityScore += 3;
  }

  // ✅ ANÁLISE DE COBERTURA MUSCULAR FLEXÍVEL
  const uniqueMuscleGroups = new Set(muscleGroupCoverage).size;
  if (uniqueMuscleGroups < 3 && expectedDays >= 3) {
    warnings.push(`Cobertura muscular limitada: ${uniqueMuscleGroups} grupos`);
    qualityScore -= 5;
  }

  // ✅ CALCULAR QUALIDADE FINAL COM PONDERAÇÃO
  qualityScore = Math.max(30, Math.min(100, qualityScore)); // Mínimo 30, máximo 100
  const isValid = errors.length === 0; // ✅ CORREÇÃO: Só falha com erros críticos

  console.log('📊 VALIDAÇÃO CORRIGIDA CONCLUÍDA:', {
    isValid,
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    qualityScore,
    totalExercises,
    uniqueExercises,
    variabilityScore: `${variabilityScore.toFixed(1)}%`,
    muscleGroupCoverage: uniqueMuscleGroups,
    experienceLevel,
    validation: 'FLEXÍVEL E INTELIGENTE',
    recommendation: qualityScore >= 80 ? 'EXCELENTE' : qualityScore >= 60 ? 'BOM' : 'ACEITÁVEL'
  });

  return { isValid, errors, warnings, qualityScore };
};

// ✅ FASE 2: VALIDAÇÃO RIGOROSA DO CONTEÚDO DAS INSTRUÇÕES
const validateInstructionContent = (instructions: string, exerciseId: string): { 
  errors: string[], 
  warnings: string[], 
  penalty: number 
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let penalty = 0;

  // Verificar instruções genéricas proibidas
  const forbiddenPhrases = [
    'execute com técnica adequada',
    'mantenha a postura correta',
    'controle o movimento',
    'respiração adequada',
    'instruções não disponíveis',
    'técnica adequada'
  ];

  const instructionsLower = instructions.toLowerCase();
  
  for (const phrase of forbiddenPhrases) {
    if (instructionsLower.includes(phrase)) {
      errors.push(`${exerciseId}: Instrução genérica proibida: "${phrase}"`);
      penalty += 25;
    }
  }

  // Verificar estrutura de passos
  const hasSteps = instructions.includes('1️⃣') || instructions.match(/\d+\./);
  if (!hasSteps && instructions.length > 30) {
    warnings.push(`${exerciseId}: Instruções sem estrutura de passos`);
    penalty += 8;
  }

  // Verificar palavras técnicas específicas
  const technicalWords = ['posicionamento', 'execução', 'respiração', 'movimento', 'controle', 'amplitude'];
  const technicalWordsCount = technicalWords.filter(word => 
    instructionsLower.includes(word)
  ).length;

  if (technicalWordsCount < 2) {
    warnings.push(`${exerciseId}: Poucas palavras técnicas (${technicalWordsCount}/6)`);
    penalty += 5;
  }

  // Bonus para instruções muito detalhadas
  if (instructions.length > 150 && hasSteps && technicalWordsCount >= 3) {
    penalty -= 5; // Reduz penalidade (melhora score)
  }

  return { errors, warnings, penalty };
};

// ✅ CORREÇÃO: LIMITES FLEXÍVEIS DE EXERCÍCIOS
const getFlexibleExerciseCount = (experienceLevel: string): { min: number; max: number } => {
  switch (experienceLevel?.toLowerCase()) {
    case 'iniciante':
      return { min: 3, max: 5 }; // Mantido: 3-5 exercícios
    case 'avancado':
    case 'avançado':
      return { min: 6, max: 8 }; // ✅ CORREÇÃO: 6-8 exercícios
    case 'intermediario':
    case 'intermediário':
    default:
      return { min: 5, max: 7 }; // ✅ CORREÇÃO: 5-7 exercícios
  }
};
