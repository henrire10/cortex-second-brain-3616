
import { UserProfile } from './types.ts';

// ✅ PROMPT OTIMIZADO PARA GEMINI 1.5 PRO COM INSTRUÇÕES PRECISAS
export const generateAdvancedWorkoutPrompt = (profileDetails: UserProfile): string => {
  
  const isWoman = profileDetails.gender?.toLowerCase() === 'feminino';
  const exerciseRange = getExerciseRangeForLevel(profileDetails.experienceLevel);
  
  // Determinar necessidade de cardio baseado no IMC
  const bmi = profileDetails.bmi || 22;
  const needsCardio = bmi >= 25 || profileDetails.fitnessGoal?.toLowerCase().includes('perda de peso') || profileDetails.fitnessGoal?.toLowerCase().includes('emagrecer');
  
  // Calcular proporção cardio/musculação
  let cardioPercentage = 20; // Padrão
  if (bmi >= 30) cardioPercentage = 60; // Obesidade
  else if (bmi >= 25) cardioPercentage = 40; // Sobrepeso
  else if (profileDetails.fitnessGoal?.toLowerCase().includes('perda de peso')) cardioPercentage = 50;
  
  const musculationPercentage = 100 - cardioPercentage;
  
  return `🤖 GEMINI 2.5 PRO PERSONAL TRAINER EXPERT: Crie um treino PERFEITO e PERSONALIZADO com CARDIO OBRIGATÓRIO.

⚠️ CRÍTICO: RESPONDA APENAS JSON VÁLIDO. NÃO ADICIONE TEXTO EXTRA.

PERFIL COMPLETO DO CLIENTE:
🧬 DADOS BIOMÉTRICOS E SAÚDE:
• Gênero: ${profileDetails.gender}, ${profileDetails.age} anos
• Estrutura física: ${profileDetails.height}cm, ${profileDetails.weight}kg
• IMC: ${profileDetails.bmi} (${profileDetails.bmiCategory})
• NECESSIDADE DE CARDIO: ${profileDetails.cardioNecessity.toUpperCase()}
• PROPORÇÃO RECOMENDADA: ${cardioPercentage}% cardio + ${musculationPercentage}% musculação

💪 EXPERIÊNCIA E OBJETIVOS:
• Nível: ${profileDetails.experienceLevel} 
• Objetivo Principal: ${profileDetails.fitnessGoal}
• Meta Específica: ${profileDetails.specificGoal}
• Frequência: ${profileDetails.workoutDaysPerWeek} dias por semana
• Duração: ${profileDetails.workoutDuration} minutos por sessão

🏋️ EQUIPAMENTOS E PREFERÊNCIAS:
• Equipamentos: ${Array.isArray(profileDetails.workoutPreferences) ? profileDetails.workoutPreferences.join(', ') : profileDetails.workoutPreferences || 'Academia completa'}
• Exercícios Preferidos: ${profileDetails.exercisePreferences}
• Restrições: ${profileDetails.exerciseRestrictions}
• Condições Médicas: ${profileDetails.medicalConditions}

🌟 ESTILO DE VIDA:
• Atividade Diária: ${profileDetails.activityLevel}
• Comprometimento: ${profileDetails.commitmentLevel}
• Sono: ${profileDetails.sleepQuality}/5 (${profileDetails.sleepHours}h)
• Estresse: ${profileDetails.stressLevel}/5
• Hidratação: ${profileDetails.waterIntake}

🍽️ PERFIL NUTRICIONAL:
• Restrições: ${profileDetails.dietaryRestrictions.join(', ') || 'Nenhuma'}
• Alimentos Favoritos: ${profileDetails.favoriteFoods.slice(0, 3).join(', ')}
• Refeições/dia: ${profileDetails.mealsPerDay}

${isWoman ? `
👩 FOCO FEMININO ESPECIALIZADO:
• PRIORIDADE: Glúteos, posterior de coxa, core
• Exercícios de modelagem e tonificação
• Movimentos funcionais e resistência
• Fortalecimento de membros superiores
` : `
👨 FOCO MASCULINO:
• Desenvolvimento de força e massa
• Exercícios compostos prioritários
• Foco em membros superiores (peito, ombros, braços)
• Base forte (posterior e glúteos)
`}

🎯 INSTRUÇÕES CRÍTICAS PARA CRIAÇÃO:

${needsCardio ? `
🔥 CARDIO OBRIGATÓRIO - IMC ${profileDetails.bmi}:
• INCLUIR ${cardioPercentage >= 40 ? '3-4' : '2-3'} EXERCÍCIOS CARDIOVASCULARES por treino
• Tipos obrigatórios: ${bmi >= 30 ? 'HIIT intenso, circuitos metabólicos' : bmi >= 25 ? 'HIIT moderado, cardio intervalado' : 'cardio tradicional, LISS'}
• Duração cardio: ${cardioPercentage >= 50 ? '15-20 min' : '10-15 min'} por exercício
• Equipamentos: esteira, bike, elíptico, remo, circuitos funcionais
• PRIORIDADE MÁXIMA: Queima calórica e condicionamento cardiovascular
` : ''}

⚠️ QUANTIDADE EXATA DE EXERCÍCIOS:
• TOTAL: ${profileDetails.experienceLevel === 'iniciante' ? '4-6 exercícios por treino' : 
    profileDetails.experienceLevel === 'intermediário' || profileDetails.experienceLevel === 'intermediario' ? '6-8 exercícios por treino' : 
    '7-9 exercícios por treino'}
${needsCardio ? `• CARDIO: ${cardioPercentage >= 40 ? '3-4' : '2-3'} exercícios cardiovasculares
• MUSCULAÇÃO: ${cardioPercentage >= 40 ? '3-4' : '4-5'} exercícios de força` : '• MUSCULAÇÃO: Foco total em exercícios de força'}
• RESPEITE estes limites rigorosamente!

🚨 INSTRUÇÕES TÉCNICAS OBRIGATÓRIAS - QUALIDADE MÁXIMA:
• MÍNIMO 100 caracteres por instrução (não genérica!)
• ESTRUTURA OBRIGATÓRIA: "1️⃣ Posicionamento: [detalhe] 2️⃣ Execução: [detalhe] 3️⃣ Respiração: [detalhe]"
• ZERO instruções vagas como "Execute com técnica adequada"
• EXEMPLOS OBRIGATÓRIOS:
  - "1️⃣ Deite no banco com pés no chão, pegada na largura dos ombros 2️⃣ Desça a barra controladamente até o peito, cotovelos 45° 3️⃣ Pressione explosivamente, expire na subida"
  - "1️⃣ Pés largura dos ombros, core ativado, peito alto 2️⃣ Desça flexionando quadris e joelhos até coxas paralelas 3️⃣ Suba pressionando o chão, expire no esforço"
• PENALIZAÇÃO SEVERA: -50 pontos para instruções < 80 caracteres
• BONUS: +10 pontos para instruções > 150 caracteres com detalhes técnicos

🔥 MÁXIMA VARIABILIDADE:
• Use exercícios COMPLETAMENTE DIFERENTES entre os dias
• CARDIO: Varie modalidades (esteira, bike, remo, HIIT, circuitos)
• MUSCULAÇÃO: Varie ângulos, pegadas, equipamentos, posições
• Alterne exercícios unilaterais/bilaterais
• Mix de compostos, isoladores E cardiovasculares
• ZERO repetição de exercícios entre dias

💡 PROGRESSÃO INTELIGENTE:
• Séries: ${profileDetails.experienceLevel === 'iniciante' ? '2-3' : profileDetails.experienceLevel === 'intermediário' || profileDetails.experienceLevel === 'intermediario' ? '3-4' : '3-5'}
• Repetições adequadas ao objetivo
• Tempos de descanso personalizados

🏋️ PESO SUGERIDO PERSONALIZADO OBRIGATÓRIO:
• CALCULE o peso específico baseado em: ${profileDetails.weight}kg (peso corporal), ${profileDetails.gender} (gênero), ${profileDetails.experienceLevel} (experiência), ${profileDetails.age} anos (idade)
• FÓRMULAS por exercício:
  - Supino: ${profileDetails.gender === 'feminino' ? '40-60%' : '50-80%'} do peso corporal
  - Agachamento: ${profileDetails.gender === 'feminino' ? '50-80%' : '60-120%'} do peso corporal  
  - Bíceps/Rosca: ${profileDetails.gender === 'feminino' ? '10-20%' : '15-25%'} do peso corporal
  - Peso corporal: Para flexões, barras → "Peso corporal" ou "Assistida"
• EXEMPLOS OBRIGATÓRIOS: "45-60kg", "Peso corporal + 15kg", "Assistida ou elástico"
• NUNCA use valores genéricos como "moderado" ou "conforme capacidade"

📅 CRIAR EXATAMENTE ${profileDetails.workoutDaysPerWeek} TREINOS DISTINTOS

FORMATO JSON OBRIGATÓRIO (RESPONDA APENAS JSON VÁLIDO):
{
  "goal": "${profileDetails.fitnessGoal}",
  "difficulty": "${profileDetails.experienceLevel}",
  "workoutDaysPerWeek": ${profileDetails.workoutDaysPerWeek},
  "estimatedCalories": ${needsCardio && cardioPercentage >= 40 ? 450 : 350},
  "weekNumber": 1,
  "qualityScore": 95,
  "bmiAnalysis": {
    "bmi": ${profileDetails.bmi},
    "category": "${profileDetails.bmiCategory}",
    "cardioNecessity": "${profileDetails.cardioNecessity}",
    "cardioPercentage": ${cardioPercentage}
  },
  "workoutDays": [
    {
      "title": "Treino A - [Nome Específico + Cardio${needsCardio ? ' Integrado' : ''}]",
      "focus": "[Grupos musculares principais${needsCardio ? ' + Condicionamento Cardiovascular' : ''}]",
      "exercises": [
        ${needsCardio ? `{
          "name": "[EXERCÍCIO CARDIOVASCULAR ESPECÍFICO]",
          "sets": "1",
          "reps": "${cardioPercentage >= 50 ? '15-20 min' : '10-15 min'}",
          "rest": "2-3min",
          "estimatedCalories": ${cardioPercentage >= 50 ? 80 : 60},
          "muscleGroup": "Cardiovascular",
          "exerciseType": "cardio",
          "instructions": "1️⃣ Aquecimento: [protocolo específico] 2️⃣ Intensidade: [zona alvo de FC] 3️⃣ Progressão: [como aumentar dificuldade] 4️⃣ Finalização: [cool down]",
          "tips": "[Dica específica de intensidade e segurança cardiovascular]",
          "equipment": "[Equipamento cardio específico]",
          "intensity": "${bmi >= 30 ? 'Alta - 75-85% FCmáx' : bmi >= 25 ? 'Moderada-Alta - 70-80% FCmáx' : 'Moderada - 65-75% FCmáx'}"
        },` : ''}
        {
          "name": "[Nome ESPECÍFICO e DETALHADO do exercício de MUSCULAÇÃO]",
          "sets": "3",
          "reps": "8-12",
          "rest": "60s",
          "estimatedCalories": 35,
          "muscleGroup": "[Grupo muscular]",
          "exerciseType": "strength",
          "instructions": "1️⃣ Posicionamento: [posição inicial detalhada] 2️⃣ Execução: [movimento completo passo-a-passo] 3️⃣ Respiração: [coordenação respiratória] 4️⃣ Finalização: [posição final e controle]",
          "tips": "[Dica importante de técnica ou segurança]",
          "equipment": "[Equipamento necessário]",
          "suggestedWeight": "[PESO PERSONALIZADO baseado no perfil]"
        }
      ]
    }
  ]
}

🚨 REGRAS ABSOLUTAS:
✅ Use nomes ESPECÍFICOS (ex: "Supino reto com halteres", "HIIT na esteira com inclinação")
${needsCardio ? `✅ CARDIO OBRIGATÓRIO: ${cardioPercentage >= 40 ? '3-4' : '2-3'} exercícios cardiovasculares por treino` : ''}
✅ VARIE COMPLETAMENTE exercícios entre treinos (cardio E musculação)
✅ INSTRUÇÕES TÉCNICAS DETALHADAS (mínimo 100 caracteres, estrutura 1️⃣2️⃣3️⃣4️⃣)
✅ TOTAL de exercícios por treino: ${profileDetails.experienceLevel === 'iniciante' ? '4-6' : 
    profileDetails.experienceLevel === 'intermediário' || profileDetails.experienceLevel === 'intermediario' ? '6-8' : 
    '7-9'}
✅ Adapte intensidade ao nível de experiência E necessidade cardiovascular
✅ ZERO INSTRUÇÕES GENÉRICAS - Cada exercício DEVE ter instruções específicas únicas
✅ FIELD "exerciseType": "cardio" ou "strength" para classificação
✅ RESPONDA APENAS JSON VÁLIDO, SEM TEXTO ADICIONAL

⛔ INSTRUÇÕES PROIBIDAS (PENALIZAÇÃO -100 PONTOS):
❌ "Execute com técnica adequada"
❌ "Mantenha a postura correta"
❌ "Controle o movimento"
❌ "Respiração adequada"
❌ Qualquer instrução < 80 caracteres
❌ Instruções repetidas entre exercícios
${needsCardio ? `❌ TREINOS SEM CARDIO para usuários com IMC ≥ 25 ou objetivo de perda de peso
❌ Cardio genérico - especifique modalidade, intensidade e duração` : ''}

🚀 GEMINI 2.5 PRO: MÁXIMA POTÊNCIA PARA TREINO PERFEITO!`;

  const prompt = arguments[0]; // Referenciar o prompt construído acima
  
  console.log('🚀 PROMPT CRÍTICO COM CARDIO PERSONALIZADO PARA GEMINI 2.5 PRO:', {
    tamanho: prompt.length,
    genero: profileDetails.gender,
    nivel: profileDetails.experienceLevel,
    objetivo: profileDetails.fitnessGoal,
    dias: profileDetails.workoutDaysPerWeek,
    bmi: profileDetails.bmi,
    bmiCategory: profileDetails.bmiCategory,
    needsCardio,
    cardioPercentage,
    exerciseRange,
    geminiVersion: 'Gemini 2.5 Pro - MÁXIMA POTÊNCIA COM CARDIO',
    recursos: '32K tokens + 5min timeout + JSON forçado + Análise IMC',
    optimization: 'CRÍTICO: Cardio obrigatório baseado em IMC + Personalização máxima'
  });

  return prompt;
};

// ✅ FUNÇÃO AUXILIAR PARA DETERMINAR FAIXA DE EXERCÍCIOS
const getExerciseRangeForLevel = (level: string): string => {
  switch (level?.toLowerCase()) {
    case 'iniciante':
      return '3-5';
    case 'avancado':
    case 'avançado':
      return '6-8';
    case 'intermediario':
    case 'intermediário':
    default:
      return '5-7';
  }
};
