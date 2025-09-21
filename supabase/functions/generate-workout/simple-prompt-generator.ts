
import { UserProfile } from './types.ts';

// ✅ GERADOR DE PROMPT SIMPLES E DIRETO
export const generateSimpleWorkoutPrompt = (profileDetails: UserProfile): string => {
  
  const isWoman = profileDetails.gender?.toLowerCase() === 'feminino';
  
  return `Você é um personal trainer experiente. Crie um treino de academia personalizado em JSON válido.

PERFIL COMPLETO DO USUÁRIO:
• Dados Pessoais: ${profileDetails.gender}, ${profileDetails.age} anos, ${profileDetails.weight}kg, ${profileDetails.height}cm
• Nível de Experiência: ${profileDetails.experienceLevel} 
• Objetivo Principal: ${profileDetails.fitnessGoal}
• Frequência Semanal: ${profileDetails.workoutDaysPerWeek} dias por semana
• Duração por Sessão: ${profileDetails.workoutDuration} minutos
• Equipamentos Disponíveis: ${Array.isArray(profileDetails.workoutPreferences) ? profileDetails.workoutPreferences.join(', ') : profileDetails.workoutPreferences || 'Academia completa'}
• Restrições de Exercícios: ${profileDetails.exerciseRestrictions || 'Nenhuma'}
• Condições Médicas: ${profileDetails.medicalConditions || 'Nenhuma'}
• Nível de Atividade Diária: ${profileDetails.activityLevel || 'Moderado'}
• Nível de Comprometimento: ${profileDetails.commitmentLevel || 'Alto'}
• Qualidade do Sono: ${profileDetails.sleepQuality || 4}/5
• Horas de Sono: ${profileDetails.sleepHours || 8} horas
• Nível de Estresse: ${profileDetails.stressLevel || 3}/5

${isWoman ? `
FOCO FEMININO:
• Dar prioridade para glúteos, pernas e core
• Incluir exercícios para modelagem corporal
• Exercícios funcionais e de resistência
` : `
FOCO MASCULINO:
• Equilibrar treino de força para todo o corpo
• Incluir exercícios compostos
• Foco em desenvolvimento muscular
`}

INSTRUÇÕES ESPECÍFICAS:
1. Crie EXATAMENTE ${profileDetails.workoutDaysPerWeek} dias de treino
2. Cada dia deve ter entre 5-8 exercícios
3. Inclua séries, repetições e tempo de descanso
4. Varie os exercícios entre os dias
5. Respeite o nível de experiência do usuário
6. Use exercícios adequados para academia

FORMATO JSON OBRIGATÓRIO (RESPONDA APENAS COM JSON VÁLIDO):
{
  "goal": "${profileDetails.fitnessGoal}",
  "difficulty": "${profileDetails.experienceLevel}",
  "workoutDaysPerWeek": ${profileDetails.workoutDaysPerWeek},
  "estimatedCalories": 300,
  "weekNumber": 1,
  "workoutDays": [
    {
      "title": "Treino A - [Nome do Foco]",
      "focus": "[Grupos musculares trabalhados]",
      "exercises": [
        {
          "name": "[Nome do Exercício]",
          "sets": "3",
          "reps": "8-12",
          "rest": "60s",
          "estimatedCalories": 30,
          "muscleGroup": "[Grupo muscular]",
          "instructions": "[Instruções de execução]"
        }
      ]
    }
  ]
}

RESPONDA APENAS COM O JSON VÁLIDO. NÃO ADICIONE TEXTO ANTES OU DEPOIS.`;

  console.log('📝 PROMPT SIMPLES GERADO:', {
    tamanho: prompt.length,
    genero: profileDetails.gender,
    nivel: profileDetails.experienceLevel,
    objetivo: profileDetails.fitnessGoal,
    dias: profileDetails.workoutDaysPerWeek
  });

  return prompt;
};
