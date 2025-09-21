
// Sistema unificado V4 - redirecionamento para novo sistema corrigido
export { 
  findExerciseGif,
  normalizeExerciseName,
  clearGifCache,
  getGifSystemStats,
  getAvailableExercises,
  debugGifSearch
} from './gif';

// Função legada mantida para compatibilidade
export const getExerciseGifUrl = (exerciseName: string): string => {
  console.warn('⚠️ getExerciseGifUrl está deprecated. Use findExerciseGif() para busca direta.');
  return '';
};

export const checkIfGifExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
