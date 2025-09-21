
import { listAvailableGifs } from './gifStorage';
import { DIRECT_EXERCISE_MAPPING, EXERCISE_CATEGORIES, CATEGORY_KEYWORDS } from './exerciseMapping';

/**
 * Normaliza string removendo acentos, espaços extras e caracteres especiais
 */
export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Remove especificações técnicas do nome do exercício
 */
export const cleanExerciseName = (name: string): string => {
  return name
    .replace(/\([^)]*\)/g, '') // Remove conteúdo entre parênteses
    .replace(/\s+ou\s+.*/gi, '') // Remove " ou ..." 
    .replace(/\s+(com|usando|na|no|de)\s+.*/gi, '') // Remove especificações
    .replace(/(unilateral|bilateral|assistida?|livre|guiada?)/gi, '') // Remove modalidades
    .trim();
};

/**
 * Calcula similaridade entre duas strings (algoritmo de Levenshtein normalizado)
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1;
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (matrix[str2.length][str1.length] / maxLength);
};

/**
 * Busca exata por nome (case-insensitive)
 */
export const exactSearch = async (exerciseName: string): Promise<string | null> => {
  const normalized = normalizeString(exerciseName);
  const cleaned = cleanExerciseName(normalized);
  
  // Tentar busca direta no mapeamento
  if (DIRECT_EXERCISE_MAPPING[cleaned]) {
    console.log(`🎯 Busca direta: ${exerciseName} -> ${DIRECT_EXERCISE_MAPPING[cleaned]}`);
    return DIRECT_EXERCISE_MAPPING[cleaned];
  }
  
  // Buscar nos arquivos reais disponíveis
  const availableGifs = await listAvailableGifs();
  
  // Busca exata nos arquivos
  const exactMatch = availableGifs.find(gif => 
    normalizeString(gif) === cleaned ||
    normalizeString(gif.replace(/-/g, ' ')) === cleaned
  );
  
  if (exactMatch) {
    console.log(`🎯 Busca exata nos arquivos: ${exerciseName} -> ${exactMatch}`);
    return exactMatch;
  }
  
  return null;
};

/**
 * Busca por palavras-chave parciais
 */
export const partialSearch = async (exerciseName: string): Promise<string | null> => {
  const cleaned = cleanExerciseName(normalizeString(exerciseName));
  const words = cleaned.split(' ').filter(word => word.length > 2);
  
  if (words.length === 0) return null;
  
  const availableGifs = await listAvailableGifs();
  
  // Buscar por cada palavra-chave
  for (const word of words) {
    // Primeiro no mapeamento direto
    const mappingMatch = Object.keys(DIRECT_EXERCISE_MAPPING).find(key =>
      normalizeString(key).includes(word)
    );
    
    if (mappingMatch) {
      console.log(`🔍 Busca parcial no mapeamento: ${exerciseName} -> ${DIRECT_EXERCISE_MAPPING[mappingMatch]} (palavra: ${word})`);
      return DIRECT_EXERCISE_MAPPING[mappingMatch];
    }
    
    // Depois nos arquivos disponíveis
    const fileMatch = availableGifs.find(gif =>
      normalizeString(gif).includes(word) ||
      normalizeString(gif.replace(/-/g, ' ')).includes(word)
    );
    
    if (fileMatch) {
      console.log(`🔍 Busca parcial nos arquivos: ${exerciseName} -> ${fileMatch} (palavra: ${word})`);
      return fileMatch;
    }
  }
  
  return null;
};

/**
 * Busca fuzzy usando similaridade de strings
 */
export const fuzzySearch = async (exerciseName: string, threshold = 0.6): Promise<string | null> => {
  const cleaned = cleanExerciseName(normalizeString(exerciseName));
  const availableGifs = await listAvailableGifs();
  
  let bestMatch = null;
  let bestSimilarity = 0;
  
  // Buscar no mapeamento direto
  for (const [key, value] of Object.entries(DIRECT_EXERCISE_MAPPING)) {
    const similarity = calculateSimilarity(cleaned, normalizeString(key));
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestMatch = value;
      bestSimilarity = similarity;
    }
  }
  
  // Buscar nos arquivos disponíveis
  for (const gif of availableGifs) {
    const similarity = calculateSimilarity(cleaned, normalizeString(gif.replace(/-/g, ' ')));
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestMatch = gif;
      bestSimilarity = similarity;
    }
  }
  
  if (bestMatch) {
    console.log(`🔄 Busca fuzzy: ${exerciseName} -> ${bestMatch} (similaridade: ${(bestSimilarity * 100).toFixed(1)}%)`);
  }
  
  return bestMatch;
};

/**
 * Busca por categoria como fallback
 */
export const categoryFallback = async (exerciseName: string): Promise<string | null> => {
  const cleaned = cleanExerciseName(normalizeString(exerciseName));
  const words = cleaned.split(' ');
  
  // Identificar categoria do exercício
  let category = null;
  for (const word of words) {
    if (CATEGORY_KEYWORDS[word]) {
      category = CATEGORY_KEYWORDS[word];
      break;
    }
  }
  
  if (!category) return null;
  
  const categoryOptions = EXERCISE_CATEGORIES[category];
  if (!categoryOptions) return null;
  
  // Verificar qual opção da categoria está disponível
  const availableGifs = await listAvailableGifs();
  for (const option of categoryOptions) {
    if (availableGifs.includes(option)) {
      console.log(`📂 Fallback por categoria: ${exerciseName} -> ${option} (categoria: ${category})`);
      return option;
    }
  }
  
  return null;
};
