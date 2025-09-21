// ✅ SISTEMA INTELIGENTE DE CÁLCULO DE CALORIAS

interface UserProfile {
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  experienceLevel?: string;
  activityLevel?: string;
}

interface ExerciseData {
  name: string;
  sets: number | string;
  reps: string;
  rest: string;
  muscleGroup?: string;
}

interface CalorieCalculationResult {
  totalCalories: number;
  caloriesPerSet: number;
  metabolicEquivalent: number;
  burnRate: 'baixa' | 'moderada' | 'alta' | 'muito alta';
  explanation: string;
}

// ✅ BASE DE DADOS DE EQUIVALENTES METABÓLICOS (METs) por exercício
const EXERCISE_METS_DATABASE: Record<string, number> = {
  // Exercícios de peito
  'supino': 6.0,
  'supino inclinado': 6.5,
  'supino declinado': 6.0,
  'flexão': 3.8,
  'flexão de braço': 3.8,
  'crucifixo': 5.5,
  'chest press': 6.0,
  'pec deck': 5.0,

  // Exercícios de costas
  'pulldown': 5.5,
  'puxada': 5.5,
  'remada': 6.0,
  'remada curvada': 6.5,
  'barra fixa': 8.0,
  'pull up': 8.0,
  'chin up': 8.0,
  'deadlift': 7.5,
  'levantamento terra': 7.5,

  // Exercícios de pernas
  'agachamento': 7.0,
  'squat': 7.0,
  'leg press': 6.5,
  'hack squat': 6.8,
  'afundo': 6.5,
  'lunge': 6.5,
  'passada': 6.0,
  'stiff': 6.5,
  'cadeira extensora': 5.5,
  'mesa flexora': 5.5,
  'leg curl': 5.5,
  'panturrilha': 4.5,
  'calf raise': 4.5,

  // Exercícios de ombros
  'desenvolvimento': 6.0,
  'shoulder press': 6.0,
  'elevação lateral': 4.5,
  'lateral raise': 4.5,
  'elevação frontal': 4.5,
  'front raise': 4.5,
  'desenvolvimento militar': 6.5,
  'arnold press': 6.2,

  // Exercícios de braços
  'rosca': 4.0,
  'bicep curl': 4.0,
  'rosca martelo': 4.2,
  'hammer curl': 4.2,
  'tríceps': 4.5,
  'tricep': 4.5,
  'supino fechado': 6.2,
  'mergulho': 5.5,
  'dips': 5.5,

  // Exercícios de core
  'abdominal': 4.0,
  'crunch': 4.0,
  'prancha': 4.0,
  'plank': 4.0,
  'mountain climber': 8.0,
  'russian twist': 5.0,

  // Exercícios cardiovasculares
  'burpee': 10.0,
  'jumping jack': 7.0,
  'high knee': 8.0,
  'cardio': 8.0
};

// ✅ MULTIPLICADORES POR NÍVEL DE EXPERIÊNCIA
const EXPERIENCE_MULTIPLIERS = {
  'iniciante': 0.8,
  'experiencia_iniciante': 0.8,
  'intermediario': 1.0,
  'experiencia_intermediario': 1.0,
  'avancado': 1.2,
  'experiencia_avancado': 1.2
};

// ✅ MULTIPLICADORES POR NÍVEL DE ATIVIDADE
const ACTIVITY_MULTIPLIERS = {
  'sedentario': 0.9,
  'levemente_ativo': 1.0,
  'moderado': 1.1,
  'ativo': 1.2,
  'muito_ativo': 1.3
};

// ✅ MULTIPLICADORES POR GÊNERO
const GENDER_MULTIPLIERS = {
  'masculino': 1.0,
  'feminino': 0.85,
  'outro': 0.92
};

/**
 * ✅ FUNÇÃO PRINCIPAL: Calcular calorias baseado em exercício e perfil do usuário
 */
export function calculateExerciseCalories(
  exercise: ExerciseData,
  userProfile: UserProfile
): CalorieCalculationResult {
  console.log('🔥 CALORIAS: Iniciando cálculo inteligente:', {
    exercise: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    userWeight: userProfile.weight,
    userGender: userProfile.gender,
    userExperience: userProfile.experienceLevel
  });

  // ✅ Validação de dados mínimos
  if (!userProfile.weight || userProfile.weight <= 0) {
    console.warn('⚠️ CALORIAS: Peso do usuário inválido, usando fallback');
    return {
      totalCalories: 15,
      caloriesPerSet: 3,
      metabolicEquivalent: 4.0,
      burnRate: 'moderada',
      explanation: 'Estimativa baseada em dados padrão (complete seu perfil para cálculo personalizado)'
    };
  }

  // ✅ Detectar MET do exercício
  const detectedMET = detectExerciseMET(exercise.name);
  
  // ✅ Calcular número de séries
  const numberOfSets = typeof exercise.sets === 'number' 
    ? exercise.sets 
    : parseInt(exercise.sets.toString()) || 3;

  // ✅ Estimar duração do exercício (baseado em séries, reps e descanso)
  const estimatedDurationMinutes = estimateExerciseDuration(exercise);

  // ✅ Aplicar multiplicadores baseados no perfil
  const experienceMultiplier = EXPERIENCE_MULTIPLIERS[userProfile.experienceLevel as keyof typeof EXPERIENCE_MULTIPLIERS] || 1.0;
  const activityMultiplier = ACTIVITY_MULTIPLIERS[userProfile.activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || 1.0;
  const genderMultiplier = GENDER_MULTIPLIERS[userProfile.gender as keyof typeof GENDER_MULTIPLIERS] || 1.0;

  // ✅ Fórmula de cálculo de calorias: MET × peso(kg) × tempo(h) × multiplicadores
  const baseCalories = detectedMET * userProfile.weight * (estimatedDurationMinutes / 60);
  const adjustedCalories = baseCalories * experienceMultiplier * activityMultiplier * genderMultiplier;
  
  const totalCalories = Math.round(adjustedCalories);
  const caloriesPerSet = Math.round(totalCalories / numberOfSets);

  // ✅ Determinar taxa de queima
  const burnRate = determineBurnRate(detectedMET);

  const explanation = `Baseado em: ${detectedMET} METs, ${userProfile.weight}kg, ${estimatedDurationMinutes}min, nível ${userProfile.experienceLevel}`;

  const result = {
    totalCalories,
    caloriesPerSet,
    metabolicEquivalent: detectedMET,
    burnRate,
    explanation
  };

  console.log('✅ CALORIAS: Cálculo concluído:', {
    exerciseName: exercise.name,
    detectedMET,
    duration: estimatedDurationMinutes,
    baseCalories: Math.round(baseCalories),
    multipliers: {
      experience: experienceMultiplier,
      activity: activityMultiplier,
      gender: genderMultiplier
    },
    finalResult: result
  });

  return result;
}

/**
 * ✅ DETECTAR MET DO EXERCÍCIO baseado no nome
 */
function detectExerciseMET(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  
  // Busca exata primeiro
  for (const [key, met] of Object.entries(EXERCISE_METS_DATABASE)) {
    if (name.includes(key)) {
      console.log(`🎯 CALORIAS: MET encontrado exato: ${key} = ${met}`);
      return met;
    }
  }

  // Categorização por grupo muscular se não encontrar exato
  if (name.includes('agachamento') || name.includes('squat')) return 7.0;
  if (name.includes('supino') || name.includes('chest') || name.includes('peito')) return 6.0;
  if (name.includes('puxada') || name.includes('remada') || name.includes('costas')) return 5.5;
  if (name.includes('rosca') || name.includes('bíceps') || name.includes('bicep')) return 4.0;
  if (name.includes('tríceps') || name.includes('tricep')) return 4.5;
  if (name.includes('ombro') || name.includes('shoulder')) return 6.0;
  if (name.includes('panturrilha') || name.includes('calf')) return 4.5;
  if (name.includes('abdominal') || name.includes('core')) return 4.0;

  console.log(`🤔 CALORIAS: MET não encontrado para "${exerciseName}", usando padrão 5.0`);
  return 5.0; // MET padrão para exercícios de musculação
}

/**
 * ✅ ESTIMAR DURAÇÃO DO EXERCÍCIO baseado em séries, reps e descanso
 */
function estimateExerciseDuration(exercise: ExerciseData): number {
  const numberOfSets = typeof exercise.sets === 'number' 
    ? exercise.sets 
    : parseInt(exercise.sets.toString()) || 3;

  // Estimar tempo por série (baseado nas repetições)
  const repsString = exercise.reps.toString().toLowerCase();
  let timePerSet = 45; // segundos padrão

  if (repsString.includes('até falha') || repsString.includes('máximo')) {
    timePerSet = 60;
  } else if (repsString.includes('-')) {
    // Ex: "8-12" reps
    const repsNumbers = repsString.match(/\d+/g);
    if (repsNumbers && repsNumbers.length >= 2) {
      const avgReps = (parseInt(repsNumbers[0]) + parseInt(repsNumbers[1])) / 2;
      timePerSet = Math.max(30, Math.min(90, avgReps * 3)); // 3 segundos por rep
    }
  } else {
    const repsMatch = repsString.match(/\d+/);
    if (repsMatch) {
      const reps = parseInt(repsMatch[0]);
      timePerSet = Math.max(30, Math.min(90, reps * 3));
    }
  }

  // Estimar tempo de descanso
  const restString = exercise.rest.toLowerCase();
  let restTime = 60; // segundos padrão

  if (restString.includes('s')) {
    const restMatch = restString.match(/(\d+)\s*s/);
    if (restMatch) restTime = parseInt(restMatch[1]);
  } else if (restString.includes('min')) {
    const restMatch = restString.match(/(\d+)\s*min/);
    if (restMatch) restTime = parseInt(restMatch[1]) * 60;
  } else if (restString.includes(':')) {
    const restMatch = restString.match(/(\d+):(\d+)/);
    if (restMatch) restTime = parseInt(restMatch[1]) * 60 + parseInt(restMatch[2]);
  }

  // Tempo total = (tempo por série × número de séries) + (tempo de descanso × (séries - 1))
  const totalSeconds = (timePerSet * numberOfSets) + (restTime * (numberOfSets - 1));
  const totalMinutes = totalSeconds / 60;

  console.log(`⏱️ CALORIAS: Duração estimada para ${exercise.name}:`, {
    sets: numberOfSets,
    timePerSet,
    restTime,
    totalMinutes: Math.round(totalMinutes * 10) / 10
  });

  return Math.max(2, totalMinutes); // Mínimo 2 minutos
}

/**
 * ✅ DETERMINAR TAXA DE QUEIMA baseada no MET
 */
function determineBurnRate(met: number): 'baixa' | 'moderada' | 'alta' | 'muito alta' {
  if (met >= 8.0) return 'muito alta';
  if (met >= 6.0) return 'alta';
  if (met >= 4.0) return 'moderada';
  return 'baixa';
}

/**
 * ✅ FUNÇÃO AUXILIAR: Calcular calorias simplificada para fallback
 */
export function calculateBasicCalories(exerciseName: string, sets: number = 3): number {
  const met = detectExerciseMET(exerciseName);
  const estimatedCalories = met * 70 * 0.1; // Assumindo 70kg e 6 minutos
  return Math.round(estimatedCalories * sets / 3); // Normalizar para o número de séries
}

/**
 * ✅ FUNÇÃO DE CACHE: Evitar recálculos desnecessários
 */
const calorieCache = new Map<string, CalorieCalculationResult>();

export function getCachedCalories(
  exercise: ExerciseData,
  userProfile: UserProfile
): CalorieCalculationResult {
  const cacheKey = `${exercise.name}-${exercise.sets}-${exercise.reps}-${userProfile.weight}-${userProfile.experienceLevel}`;
  
  if (calorieCache.has(cacheKey)) {
    console.log(`🚀 CALORIAS: Cache hit para ${exercise.name}`);
    return calorieCache.get(cacheKey)!;
  }

  const result = calculateExerciseCalories(exercise, userProfile);
  calorieCache.set(cacheKey, result);
  
  console.log(`💾 CALORIAS: Resultado cached para ${exercise.name}`);
  return result;
}