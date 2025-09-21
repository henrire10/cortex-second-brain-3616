/**
 * Sistema de fallbacks inteligentes V3
 * Busca automática com remoção de especificações técnicas e auto-aprendizado
 */

import { normalizeExerciseName, DIRECT_GIF_MAPPING } from './directMapping';

// Cache de fallbacks para performance
const fallbackCache = new Map<string, string | null>();
const learningLog = new Map<string, number>(); // Log de exercícios não encontrados

/**
 * Remove especificações técnicas do nome do exercício
 */
export const removeEquipmentSpecs = (exerciseName: string): string => {
  const specs = [
    // Equipamentos
    'com barra', 'com halteres', 'com halter', 'com cabo', 'com corda',
    'na máquina', 'na smith', 'no smith', 'na polia', 'no pulley',
    'com barra ez', 'com barra w', 'barra livre', 'peso livre',
    'na esteira', 'no elíptico', 'na bike', 'assistido', 'unilateral',
    
    // Especificações de pegada
    'pegada supinada', 'pegada pronada', 'pegada fechada', 'pegada aberta',
    'pegada neutra', 'pegada alternada', 
    
    // Ângulos e posições
    '45°', '45 graus', 'inclinado', 'declinado', 'reto', 'sentado', 'em pé',
    'deitado', 'curvado', 'frontal', 'lateral', 'invertido', 'bilateral',
    
    // Variações de intensidade
    'com inclinação', 'alta intensidade', 'baixa intensidade',
    'intervalo', 'intervalado', 'contínuo'
  ];
  
  let cleaned = exerciseName.toLowerCase().trim();
  
  // Remove especificações entre parênteses
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim();
  
  // Remove especificações comuns
  for (const spec of specs) {
    cleaned = cleaned.replace(new RegExp(spec, 'gi'), '').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Remove espaços extras
  }
  
  // Remove preposições soltas no final
  cleaned = cleaned.replace(/\s+(com|no|na|de|do|da|em)$/, '');
  
  return cleaned;
};

/**
 * Busca exercícios por similaridade usando algoritmo de distância
 */
export const findSimilarExercise = (exerciseName: string): string | null => {
  const normalized = normalizeExerciseName(exerciseName);
  const words = normalized.split(' ').filter(w => w.length > 2);
  
  if (words.length === 0) return null;
  
  const exercises = Object.keys(DIRECT_GIF_MAPPING);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const exercise of exercises) {
    const exerciseNormalized = normalizeExerciseName(exercise);
    const exerciseWords = exerciseNormalized.split(' ').filter(w => w.length > 2);
    
    // Calcula score de similaridade baseado em palavras compartilhadas
    const sharedWords = words.filter(word => 
      exerciseWords.some(exerciseWord => 
        exerciseWord.includes(word) || word.includes(exerciseWord)
      )
    );
    
    if (sharedWords.length > 0) {
      // Score baseado na proporção de palavras compartilhadas e comprimento das palavras
      const score = sharedWords.reduce((acc, word) => acc + word.length, 0) / 
                   Math.max(words.length, exerciseWords.length);
      
      if (score > bestScore && score > 0.3) { // Threshold mínimo de 30%
        bestScore = score;
        bestMatch = exercise;
      }
    }
  }
  
  return bestMatch ? DIRECT_GIF_MAPPING[bestMatch] : null;
};

/**
 * Sistema de categorização automática por grupo muscular
 */
export const getCategoryFallback = (exerciseName: string): string | null => {
  const normalized = normalizeExerciseName(exerciseName);
  
  // Categorias musculares com GIFs de fallback
  const muscleGroups = {
    // Pernas
    pernas: ['Pernas/Agachamento.gif', 'Pernas/Leg-Press.gif'],
    quadriceps: ['Pernas/Agachamento.gif', 'Pernas/Cadeira-extensora.gif'],
    posterior: ['Pernas/Stiff-com-barra.gif', 'Pernas/Mesa-flexora.gif'],
    gluteos: ['Pernas/Eleva-o-P-lvica-Com-Barra.gif', 'Pernas/Agachamento.gif'],
    panturrilha: ['Pernas/Panturrilhas-em-P-.gif'],
    
    // Tronco superior
    peito: ['peitoral/Supino.gif', 'peitoral/Flexao.gif'],
    costas: ['costas/Puxada-Alta.gif', 'costas/Remada-Sentada-com-Cabo.gif'],
    ombros: ['ombros/Desenvolvimento-de-ombro-com-barra-sentado.gif'],
    
    // Braços
    biceps: ['bicps/Rosca-Direta-com-Barra.gif', 'bicps/Rosca-alternada-com-halteres-sentado.gif'],
    triceps: ['triceps/Tr-ceps-testa-com-barra.gif', 'triceps/Tr-ceps-pulley-barra.gif'],
    
    // Core
    abdomen: ['Abdomen/Abdominal.gif', 'Abdomen/Prancha.gif'],
    core: ['Abdomen/Prancha.gif', 'Abdomen/Russian-Twist.gif'],
    
    // Cardio
    cardio: ['Cardio/High-Knees.gif', 'Cardio/Burpee.gif'],
    funcional: ['Cardio/Burpee.gif', 'Cardio/Mountain-Climber.gif']
  };
  
  // Palavras-chave para cada categoria
  const keywords = {
    pernas: ['perna', 'coxa', 'quadriceps', 'femoral', 'leg'],
    quadriceps: ['quadriceps', 'extensao', 'cadeira extensora'],
    posterior: ['posterior', 'femoral', 'isquiotibiais', 'flexora'],
    gluteos: ['gluteo', 'bumbum', 'pelve', 'hip', 'ponte'],
    panturrilha: ['panturrilha', 'calf', 'elevacao'],
    peito: ['peito', 'peitoral', 'chest', 'supino', 'flexao'],
    costas: ['costas', 'dorsal', 'back', 'puxada', 'remada', 'barra'],
    ombros: ['ombro', 'deltoid', 'shoulder', 'desenvolvimento', 'elevacao'],
    biceps: ['bicep', 'rosca', 'curl'],
    triceps: ['tricep', 'testa', 'pulley', 'extension'],
    abdomen: ['abdomen', 'abdominal', 'abs', 'barriga'],
    core: ['core', 'prancha', 'plank', 'estabilizacao'],
    cardio: ['cardio', 'corrida', 'esteira', 'bike', 'run'],
    funcional: ['funcional', 'hiit', 'burpee', 'jump', 'functional']
  };
  
  // Busca categoria por palavras-chave
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(keyword => normalized.includes(keyword))) {
      const fallbacks = muscleGroups[category as keyof typeof muscleGroups];
      if (fallbacks && fallbacks.length > 0) {
        console.log(`🎯 Fallback por categoria: ${exerciseName} -> ${category} -> ${fallbacks[0]}`);
        return fallbacks[0];
      }
    }
  }
  
  return null;
};

/**
 * Sistema de auto-aprendizado para exercícios não encontrados
 */
export const logMissingExercise = (exerciseName: string): void => {
  const count = learningLog.get(exerciseName) || 0;
  learningLog.set(exerciseName, count + 1);
  
  if (count === 0) {
    console.warn(`📚 Novo exercício não encontrado: "${exerciseName}"`);
  } else if (count > 0 && count % 5 === 0) {
    console.warn(`🔥 Exercício frequente sem GIF: "${exerciseName}" (${count + 1}x)`);
  }
};

/**
 * Busca ultra-inteligente com múltiplas estratégias
 */
export const findExerciseWithSmartFallback = (exerciseName: string): string | null => {
  if (!exerciseName?.trim()) return null;
  
  const cacheKey = exerciseName.toLowerCase().trim();
  
  // Verificar cache
  if (fallbackCache.has(cacheKey)) {
    return fallbackCache.get(cacheKey);
  }
  
  let result = null;
  
  // 1. Busca direta no mapeamento principal
  if (DIRECT_GIF_MAPPING[exerciseName]) {
    result = DIRECT_GIF_MAPPING[exerciseName];
  }
  
  // 2. Busca com nome limpo (sem especificações técnicas)
  if (!result) {
    const cleanName = removeEquipmentSpecs(exerciseName);
    if (cleanName !== exerciseName.toLowerCase() && DIRECT_GIF_MAPPING[cleanName]) {
      result = DIRECT_GIF_MAPPING[cleanName];
      console.log(`🧹 Match com nome limpo: "${exerciseName}" -> "${cleanName}"`);
    }
  }
  
  // 3. Busca por similaridade
  if (!result) {
    result = findSimilarExercise(exerciseName);
  }
  
  // 4. Fallback por categoria muscular
  if (!result) {
    result = getCategoryFallback(exerciseName);
  }
  
  // 5. Log de exercícios não encontrados para futuras melhorias
  if (!result) {
    logMissingExercise(exerciseName);
  }
  
  // Cache do resultado
  fallbackCache.set(cacheKey, result);
  
  return result;
};

/**
 * Estatísticas do sistema de auto-aprendizado
 */
export const getLearningStats = () => {
  const stats = Array.from(learningLog.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Top 20 exercícios não encontrados
  
  console.log('📊 Top exercícios sem GIF:', stats);
  return {
    totalMissing: learningLog.size,
    topMissing: stats,
    cacheSize: fallbackCache.size
  };
};

/**
 * Limpa caches e logs
 */
export const clearLearningData = () => {
  fallbackCache.clear();
  learningLog.clear();
  console.log('🗑️ Dados de aprendizado limpos');
};