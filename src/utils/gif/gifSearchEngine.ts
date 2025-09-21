
import { findGifFile, findGifFileWithFallbacks, getGifUrl, DIRECT_GIF_MAPPING } from './directMapping';
import { findExerciseWithSmartFallback } from './smartFallbacks';

// Cache simples e eficiente
const searchCache = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

/**
 * Sistema de busca otimizado e direto com fallbacks inteligentes
 */
export const findExerciseGifV2 = async (exerciseName: string): Promise<string | null> => {
  if (!exerciseName?.trim()) return null;
  
  const cacheKey = exerciseName.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  
  // Verificar cache
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🚀 Cache hit: ${exerciseName} -> ${cached.url ? 'encontrado' : 'não encontrado'}`);
    return cached.url;
  }
  
  console.log(`🔍 Buscando GIF para: "${exerciseName}"`);
  
  // 1. Buscar arquivo diretamente no mapeamento
  let fileName = findGifFile(exerciseName);
  
  if (fileName) {
    let url = getGifUrl(fileName);
    console.log(`✅ GIF encontrado (busca direta): ${exerciseName} -> ${fileName}`);
    searchCache.set(cacheKey, { url, timestamp: Date.now() });
    return url;
  }
  
  // 2. Tentar fallbacks inteligentes com variações de estrutura
  fileName = findGifFileWithFallbacks(exerciseName);
  
  if (fileName) {
    let url = getGifUrl(fileName);
    console.log(`✅ GIF encontrado (fallback estrutural): ${exerciseName} -> ${fileName}`);
    searchCache.set(cacheKey, { url, timestamp: Date.now() });
    return url;
  }
  
  // 3. Sistema ultra-inteligente de fallbacks
  fileName = findExerciseWithSmartFallback(exerciseName);
  
  if (fileName) {
    let url = getGifUrl(fileName);
    console.log(`✅ GIF encontrado (smart fallback): ${exerciseName} -> ${fileName}`);
    searchCache.set(cacheKey, { url, timestamp: Date.now() });
    return url;
  }
  
  console.warn(`❌ Nenhum GIF encontrado para: ${exerciseName} (testado: direto, estrutural, smart)`);
  
  // Cache resultado negativo para evitar buscas repetidas
  searchCache.set(cacheKey, { url: null, timestamp: Date.now() });
  return null;
};

/**
 * Limpa o cache de busca
 */
export const clearSearchCache = () => {
  searchCache.clear();
  console.log('🗑️ Cache de busca limpo');
};

/**
 * Estatísticas do sistema de busca
 */
export const getSearchStats = () => {
  const stats = {
    cacheSize: searchCache.size,
    successRate: searchCache.size > 0 
      ? (Array.from(searchCache.values()).filter(v => v.url !== null).length / searchCache.size * 100).toFixed(1) + '%'
      : 'N/A',
    cacheEntries: Array.from(searchCache.entries()).map(([key, value]) => ({
      exercise: key,
      found: !!value.url,
      cachedAt: new Date(value.timestamp).toLocaleString()
    }))
  };
  
  console.log('📊 Estatísticas do Sistema de Busca:', stats);
  return stats;
};

/**
 * Lista de exercícios disponíveis com GIFs
 */
export const getAvailableExercises = (): string[] => {
  return Object.keys(DIRECT_GIF_MAPPING).sort();
};
