
// Sistema de GIFs V4 - Unificado e Corrigido
export { 
  findExerciseGif,
  clearGifCache,
  getGifSystemStats,
  getAvailableExercises,
  normalizeExerciseName,
  debugGifSearch
} from './unifiedGifSystem';

// Função auxiliar para debug e estatísticas avançadas
export const getGifSystemInfo = () => {
  const { getGifSystemStats } = require('./unifiedGifSystem');
  
  return {
    ...getGifSystemStats(),
    version: 'V4-Unified-Corrected',
    lastUpdate: new Date().toISOString(),
    features: [
      'Sistema unificado de busca',
      'Mapeamentos corrigidos para exercícios do plano',
      'Cache inteligente com TTL',
      'Validação de URLs otimizada', 
      'Fallbacks por categoria',
      'Busca por similaridade melhorada',
      'Lista de exercícios sem GIF',
      'Logging detalhado com tipo de match',
      'Auto-limpeza de cache'
    ],
    corrections: [
      'Flexão: peitoral/Flexao.gif (era mergulho)',
      'Glute Ham Raise: Pernas/Mesa-flexora.gif (era flexão nórdica)', 
      'Crucifixo Inverso: ombros/Voador-invertido.gif',
      'Mergulho: triceps/Tr-ceps-no-Banco.gif (padrão), peitoral para paralelas',
      '+ 40 exercícios do plano do usuário mapeados corretamente'
    ]
  };
};
