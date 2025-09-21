
import { WorkoutRequestData, UserProfile } from './types.ts';

export function processUserProfile(requestData: WorkoutRequestData): UserProfile {
  console.log('🔧 PROCESSAMENTO AVANÇADO: Extraindo todos os dados do perfil com cálculo de IMC...');
  
  const userProfile = requestData.userProfile || {};
  
  // Log de todos os dados recebidos
  console.log('📊 DADOS RECEBIDOS COMPLETOS:', {
    hasUserProfile: !!userProfile,
    userProfileKeys: Object.keys(userProfile),
    workoutDaysPerWeek: requestData.workoutDaysPerWeek,
    experienceLevel: requestData.experienceLevel,
    fitnessGoal: requestData.fitnessGoal,
    fullProfile: userProfile
  });
  
  // Extrair dados biométricos
  const weight = Math.max(30, Math.min(300, userProfile.peso_kg || 70));
  const height = Math.max(120, Math.min(250, userProfile.altura_cm || 170));
  
  // Calcular IMC
  const bmi = weight / Math.pow(height/100, 2);
  
  // Classificar categoria de IMC
  let bmiCategory = 'normal';
  let cardioNecessity = 'baixa';
  
  if (bmi < 18.5) {
    bmiCategory = 'abaixo_peso';
    cardioNecessity = 'baixa';
  } else if (bmi >= 18.5 && bmi < 25) {
    bmiCategory = 'normal';
    cardioNecessity = 'moderada';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'sobrepeso';
    cardioNecessity = 'alta';
  } else {
    bmiCategory = 'obesidade';
    cardioNecessity = 'critica';
  }
  
  console.log('🧮 ANÁLISE BIOMÉTRICA:', {
    weight: weight,
    height: height,
    bmi: bmi.toFixed(1),
    bmiCategory,
    cardioNecessity
  });
  
  // Extrair dias de treino com múltiplas fontes
  let workoutDaysPerWeek = 3; // Default seguro
  
  if (userProfile.dias_por_semana_treino !== undefined && userProfile.dias_por_semana_treino !== null) {
    workoutDaysPerWeek = Number(userProfile.dias_por_semana_treino);
  } else if (requestData.workoutDaysPerWeek !== undefined && requestData.workoutDaysPerWeek !== null) {
    workoutDaysPerWeek = Number(requestData.workoutDaysPerWeek);
  }
  
  // Validação
  if (workoutDaysPerWeek < 1 || workoutDaysPerWeek > 7 || isNaN(workoutDaysPerWeek)) {
    console.warn('⚠️ Dias inválidos, usando padrão 3. Valor original:', workoutDaysPerWeek);
    workoutDaysPerWeek = 3;
  }
  
  // Extrair nível de experiência
  let experienceLevel = 'intermediario';
  const rawExperience = userProfile.nivel_experiencia_treino || requestData.experienceLevel;
  
  if (rawExperience) {
    if (rawExperience.includes('iniciante')) experienceLevel = 'iniciante';
    else if (rawExperience.includes('intermediari')) experienceLevel = 'intermediario';
    else if (rawExperience.includes('avanc')) experienceLevel = 'avancado';
  }

  // Extrair objetivo
  let fitnessGoal = 'Melhorar condicionamento';
  const rawGoal = userProfile.meta_principal_usuario || requestData.fitnessGoal;
  if (rawGoal && rawGoal.trim().length > 0) {
    fitnessGoal = rawGoal;
  }

  // Construir perfil completo com TODOS os dados disponíveis + IMC
  const processedProfile: UserProfile = {
    // Dados básicos obrigatórios
    age: Math.max(16, Math.min(80, userProfile.idade || 25)),
    gender: userProfile.genero || 'feminino',
    weight: weight,
    height: height,
    
    // Novos campos para análise de saúde
    bmi: Number(bmi.toFixed(1)),
    bmiCategory: bmiCategory,
    cardioNecessity: cardioNecessity,
    
    // Dados de treino
    workoutDaysPerWeek: workoutDaysPerWeek,
    experienceLevel: experienceLevel,
    fitnessGoal: fitnessGoal,
    workoutDuration: Math.max(20, Math.min(180, userProfile.duracao_sessao_treino_minutos || 60)),
    
    // Equipamentos disponíveis
    workoutPreferences: userProfile.disponibilidade_equipamentos || ['academia_completa'],
    
    // Dados de estilo de vida COMPLETOS
    activityLevel: userProfile.nivel_atividade_diaria || 'moderado',
    commitmentLevel: userProfile.nivel_comprometimento_objetivo || 'alto',
    sleepQuality: Math.max(1, Math.min(5, userProfile.qualidade_sono_percebida || 4)),
    sleepHours: Math.max(4, Math.min(12, userProfile.media_horas_sono || 8)),
    stressLevel: Math.max(1, Math.min(5, userProfile.nivel_estresse_percebido || 3)),
    waterIntake: '2-3 litros', // Valor padrão - campo removido do questionário
    
    // Dados de alimentação REMOVIDOS - foco apenas em treino
    dietaryRestrictions: [],
    favoriteFoods: [],
    avoidedFoods: [],
    mealsPerDay: 3,
    
    // Dados específicos de exercício COMPLETOS
    exerciseRestrictions: userProfile.restricoes_exercicios || requestData.exerciseRestrictions || 'Nenhuma',
    exercisePreferences: userProfile.preferencias_exercicios || requestData.exercisePreferences || 'Não especificado',
    medicalConditions: userProfile.condicoes_medicas_limitantes || requestData.medicalConditions || 'Nenhuma',
    specificGoal: userProfile.meta_especifica_texto || fitnessGoal,
    
    // Dados adicionais removidos - foco apenas em treino
    culinarySkill: 'intermediario', // Valor padrão - campo removido
    cookingTime: '30-60min', // Valor padrão - campo removido
    supplementInterest: [] // Campo removido do questionário
  };

  console.log('✅ PERFIL PROCESSADO COMPLETO COM IMC:', {
    age: processedProfile.age,
    gender: processedProfile.gender,
    workoutDaysPerWeek: processedProfile.workoutDaysPerWeek,
    experienceLevel: processedProfile.experienceLevel,
    fitnessGoal: processedProfile.fitnessGoal,
    workoutDuration: processedProfile.workoutDuration,
    bmi: processedProfile.bmi,
    bmiCategory: processedProfile.bmiCategory,
    cardioNecessity: processedProfile.cardioNecessity,
    hasAllBasicData: !!(processedProfile.age && processedProfile.gender && processedProfile.weight && processedProfile.height),
    hasCompleteProfile: !!(
      processedProfile.age && 
      processedProfile.gender && 
      processedProfile.experienceLevel && 
      processedProfile.fitnessGoal &&
      processedProfile.workoutDaysPerWeek >= 1 &&
      processedProfile.workoutDaysPerWeek <= 7 &&
      processedProfile.activityLevel &&
      processedProfile.commitmentLevel
    ),
    totalFieldsPopulated: Object.keys(processedProfile).filter(key => 
      processedProfile[key as keyof UserProfile] !== undefined && 
      processedProfile[key as keyof UserProfile] !== null &&
      processedProfile[key as keyof UserProfile] !== ''
    ).length
  });

  return processedProfile;
}
