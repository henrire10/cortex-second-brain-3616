// ✅ VALIDADOR ESPECÍFICO PARA TREINOS COM CARDIO
// Garante que usuários com sobrepeso/obesidade recebam cardio adequado

import { WorkoutPlan } from './types.ts';

export interface CardioValidationResult {
  isValid: boolean;
  hasRequiredCardio: boolean;
  cardioCount: number;
  strengthCount: number;
  totalExercises: number;
  bmiCompliance: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export function validateCardioInWorkout(
  workoutPlan: WorkoutPlan, 
  userBMI: number, 
  fitnessGoal: string
): CardioValidationResult {
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Determinar se cardio é obrigatório
  const needsCardio = userBMI >= 25 || 
    fitnessGoal?.toLowerCase().includes('perda de peso') || 
    fitnessGoal?.toLowerCase().includes('emagrecer');
  
  // Determinar quantidade mínima de cardio
  let minCardioPerWorkout = 0;
  if (userBMI >= 30) minCardioPerWorkout = 3; // Obesidade
  else if (userBMI >= 25) minCardioPerWorkout = 2; // Sobrepeso
  else if (fitnessGoal?.toLowerCase().includes('perda de peso')) minCardioPerWorkout = 2;
  
  console.log('🔍 VALIDAÇÃO CARDIO:', {
    userBMI,
    fitnessGoal,
    needsCardio,
    minCardioPerWorkout
  });
  
  let totalCardioExercises = 0;
  let totalStrengthExercises = 0;
  let totalExercises = 0;
  
  // Analisar cada dia de treino
  workoutPlan.workoutDays.forEach((day, dayIndex) => {
    let dayCardioCount = 0;
    let dayStrengthCount = 0;
    
    day.exercises.forEach(exercise => {
      totalExercises++;
      
      // Identificar tipo de exercício
      const isCardio = isCardioExercise(exercise.name, exercise.muscleGroup);
      
      if (isCardio) {
        dayCardioCount++;
        totalCardioExercises++;
      } else {
        dayStrengthCount++;
        totalStrengthExercises++;
      }
    });
    
    // Validações por dia
    if (needsCardio && dayCardioCount < minCardioPerWorkout) {
      errors.push(`Dia ${dayIndex + 1}: Apenas ${dayCardioCount} exercícios de cardio (mínimo: ${minCardioPerWorkout})`);
    }
    
    if (dayCardioCount === 0 && needsCardio) {
      errors.push(`Dia ${dayIndex + 1}: ZERO exercícios cardiovasculares para usuário com IMC ${userBMI}`);
    }
    
    if (day.exercises.length < 4) {
      warnings.push(`Dia ${dayIndex + 1}: Poucos exercícios (${day.exercises.length})`);
    }
  });
  
  // Validações gerais
  const cardioPercentage = totalExercises > 0 ? (totalCardioExercises / totalExercises) * 100 : 0;
  
  if (needsCardio) {
    const targetCardioPercentage = userBMI >= 30 ? 60 : userBMI >= 25 ? 40 : 30;
    
    if (cardioPercentage < targetCardioPercentage) {
      errors.push(`Proporção de cardio inadequada: ${cardioPercentage.toFixed(1)}% (target: ${targetCardioPercentage}%)`);
    }
  }
  
  // Recomendações baseadas no IMC
  if (userBMI >= 30) {
    recommendations.push("IMC ≥30: Priorizar HIIT intenso e circuitos metabólicos");
    recommendations.push("Incluir 3-4 exercícios cardiovasculares por treino");
    recommendations.push("Foco em queima calórica máxima (400+ kcal por sessão)");
  } else if (userBMI >= 25) {
    recommendations.push("IMC 25-30: Combinar cardio intervalado com musculação");
    recommendations.push("Incluir 2-3 exercícios cardiovasculares por treino");
    recommendations.push("Equilibrar condicionamento e fortalecimento");
  }
  
  if (fitnessGoal?.toLowerCase().includes('perda de peso')) {
    recommendations.push("Objetivo perda de peso: Aumentar componente cardiovascular");
    recommendations.push("Considerar treinos em circuito para máxima eficiência");
  }
  
  const isValid = errors.length === 0;
  const hasRequiredCardio = needsCardio ? totalCardioExercises >= (minCardioPerWorkout * workoutPlan.workoutDays.length) : true;
  const bmiCompliance = needsCardio ? hasRequiredCardio : true;
  
  const result: CardioValidationResult = {
    isValid,
    hasRequiredCardio,
    cardioCount: totalCardioExercises,
    strengthCount: totalStrengthExercises,
    totalExercises,
    bmiCompliance,
    errors,
    warnings,
    recommendations
  };
  
  console.log('✅ RESULTADO VALIDAÇÃO CARDIO:', result);
  
  return result;
}

// ✅ FUNÇÃO AUXILIAR PARA IDENTIFICAR EXERCÍCIOS CARDIOVASCULARES
function isCardioExercise(exerciseName: string, muscleGroup?: string): boolean {
  const cardioKeywords = [
    'hiit', 'cardio', 'esteira', 'bike', 'bicicleta', 'ergômetro', 'remo',
    'elíptico', 'step', 'aeróbico', 'corrida', 'caminhada', 'intervalo',
    'circuito metabólico', 'burpees', 'mountain climber', 'jumping',
    'pular corda', 'escada', 'stairmaster', 'spinning', 'cross training'
  ];
  
  const cardioMuscleGroups = ['cardiovascular', 'cardio', 'aeróbico'];
  
  const nameMatch = cardioKeywords.some(keyword => 
    exerciseName.toLowerCase().includes(keyword)
  );
  
  const muscleGroupMatch = muscleGroup ? 
    cardioMuscleGroups.some(group => 
      muscleGroup.toLowerCase().includes(group)
    ) : false;
  
  return nameMatch || muscleGroupMatch;
}

// ✅ FUNÇÃO PARA CORRIGIR TREINO COM CARDIO INSUFICIENTE
export function suggestCardioCorrections(
  validationResult: CardioValidationResult,
  userBMI: number
): string[] {
  const corrections: string[] = [];
  
  if (!validationResult.hasRequiredCardio) {
    if (userBMI >= 30) {
      corrections.push("ADICIONAR: 3-4 exercícios de HIIT intenso por treino");
      corrections.push("SUGESTÃO: Circuito metabólico + esteira intervalada + bike alta intensidade");
    } else if (userBMI >= 25) {
      corrections.push("ADICIONAR: 2-3 exercícios cardiovasculares moderados por treino");
      corrections.push("SUGESTÃO: Esteira inclinada + elíptico + remo contínuo");
    }
  }
  
  if (validationResult.cardioCount === 0) {
    corrections.push("CRÍTICO: Incluir pelo menos 1 exercício cardiovascular por treino");
  }
  
  if (validationResult.totalExercises < 6) {
    corrections.push("AUMENTAR: Total de exercícios para 6-8 por treino");
  }
  
  return corrections;
}