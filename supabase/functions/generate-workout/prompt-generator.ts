
import { UserProfile } from './types.ts';

export const generateSystemPrompt = (
  profileDetails: UserProfile,
  exerciseRestrictions: string,
  specs: any,
  weekNumber: number
): string => {
  
  const basePrompt = `Crie um plano de treino em JSON válido.

PERFIL: ${profileDetails.gender}, ${profileDetails.age} anos, ${profileDetails.experienceLevel}, ${profileDetails.fitnessGoal}, ${profileDetails.workoutDaysPerWeek} dias/semana

FORMATO EXATO (copie a estrutura):
{
  "goal": "${profileDetails.fitnessGoal}",
  "difficulty": "${profileDetails.experienceLevel}",
  "workoutDaysPerWeek": ${profileDetails.workoutDaysPerWeek},
  "workoutDays": [
    {
      "title": "Treino A - Peito e Tríceps",
      "focus": "Membros superiores",
      "exercises": [
        {
          "name": "Supino reto",
          "sets": "3",
          "reps": "8-12",
          "rest": "90s",
          "estimatedCalories": 45,
          "muscleGroup": "Peitorais",
          "instructions": "Execute com técnica adequada",
          "tips": "Controle o movimento",
          "commonMistakes": "Não arquear as costas"
        }
      ]
    }
  ]
}

REGRAS:
- EXATAMENTE ${profileDetails.workoutDaysPerWeek} treinos no array workoutDays
- ${specs.minExercises}-${specs.maxExercises} exercícios por treino
- ${specs.minSets}-${specs.maxSets} séries por exercício
- Responda APENAS o JSON válido, sem texto extra`;

  return basePrompt;
};

export const generateUserPrompt = (profileDetails: UserProfile): string => {
  return `Gere agora o plano de treino em JSON válido com ${profileDetails.workoutDaysPerWeek} dias:`;
};
