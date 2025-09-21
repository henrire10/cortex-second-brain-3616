
import { ExerciseSpecifications } from './types.ts';

// ✅ ESPECIFICAÇÕES CORRIGIDAS - FLEXÍVEIS E INTELIGENTES
export const getExerciseSpecifications = (
  experienceLevel: string,
  gender: string
): ExerciseSpecifications => {
  
  console.log('🏋️ ESPECIFICAÇÕES CORRIGIDAS: Calculando limites flexíveis para:', experienceLevel, ', gênero:', gender);
  
  let specs: ExerciseSpecifications;
  
  switch (experienceLevel?.toLowerCase()) {
    case 'iniciante':
      specs = {
        minExercises: 3, // ✅ CORREÇÃO: Reduzido de 4 para 3
        maxExercises: 5, // Mantido
        minSets: 2,
        maxSets: 3,
        restTime: '60-90s'
      };
      break;
    case 'avancado':
    case 'avançado':
      specs = {
        minExercises: 6, // ✅ CORREÇÃO: Atualizado para 6-8 exercícios
        maxExercises: 8, // Mantido
        minSets: 3,
        maxSets: 5,
        restTime: '45-120s'
      };
      break;
    case 'intermediario':
    case 'intermediário':
    default:
      specs = {
        minExercises: 5, // ✅ CORREÇÃO: Atualizado para 5-7 exercícios
        maxExercises: 7, // ✅ CORREÇÃO: Atualizado para 5-7 exercícios
        minSets: 3,
        maxSets: 4,
        restTime: '60-90s'
      };
      break;
  }

  console.log('✅ ESPECIFICAÇÕES CORRIGIDAS APLICADAS:', {
    level: experienceLevel,
    gender: gender,
    exerciseRange: `${specs.minExercises}-${specs.maxExercises}`,
    setsRange: `${specs.minSets}-${specs.maxSets}`,
    restTime: specs.restTime,
    corrections: 'Limites flexibilizados para reduzir rejeições'
  });

  return specs;
};
