/**
 * Sistema Unificado de GIFs V4 - Correção Completa
 * Corrige mapeamentos incorretos, URLs e unifica busca
 */

// URL base corrigida do bucket Supabase (alinhado ao sistema legado)
const GIF_BASE_URL = 'https://skvwymuejgimyctfdkve.supabase.co/storage/v1/object/public/exercices/';

/**
 * Cache inteligente com TTL
 */
class GifCache {
  private cache = new Map<string, { url: string | null; timestamp: number; attempts: number }>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutos
  private readonly MAX_ATTEMPTS = 3;

  get(key: string): string | null {
    const cached = this.cache.get(key.toLowerCase());
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key.toLowerCase());
      return null;
    }

    return cached.url;
  }

  set(key: string, url: string | null, failed = false): void {
    const existing = this.cache.get(key.toLowerCase());
    const attempts = failed ? (existing?.attempts || 0) + 1 : 0;

    // Se falhou muitas vezes, não cache por um tempo
    if (attempts >= this.MAX_ATTEMPTS) {
      console.warn(`❌ GIF falhando constantemente: ${key} (${attempts}x)`);
      return;
    }

    this.cache.set(key.toLowerCase(), {
      url,
      timestamp: Date.now(),
      attempts
    });
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache de GIFs limpo');
  }

  getStats() {
    return {
      size: this.cache.size,
      successRate: this.cache.size > 0 
        ? (Array.from(this.cache.values()).filter(v => v.url !== null).length / this.cache.size * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }
}

const gifCache = new GifCache();

/**
 * Exercícios sem GIF disponível (retornar null para evitar mostrar incorreto)
 */
const NO_GIF_EXERCISES = new Set([
  'rosca de punho com halter',
  'wrist curl',
  'extensao de punho',
  'flexao de punho'
]);

/**
 * Mapeamentos CORRETOS - Exercícios do plano do usuário + correções críticas
 */
const CORRECTED_GIF_MAPPING: Record<string, string> = {
  // === CORREÇÕES CRÍTICAS IDENTIFICADAS ===
  
  // ✅ PEITO - Correção da Flexão
  'Flexão': 'peitoral/Flexao.gif', // CORRIGIDO: era mergulho
  'Flexão de Braço': 'peitoral/Flexao.gif',
  'Flexão de Braços com Joelhos Apoiados': 'peitoral/Flexao-de-bracos-com-apoio-nos-joelhos.gif',
  'Flexão de braços na máquina': 'peitoral/Crucifixo-com-halteres.gif', // Peck-deck
  'Flexão de braços na máquina (peck-deck)': 'peitoral/Crucifixo-com-halteres.gif',
  'Push Up': 'peitoral/Flexao.gif',
  'Push Ups': 'peitoral/Flexao.gif',
  'Flexões': 'peitoral/Flexao.gif',
  
  // ✅ SUPINO - Mapeamentos corretos
  'Supino': 'peitoral/Supino.gif',
  'Supino Reto': 'peitoral/Supino.gif',
  'Supino com Barra': 'peitoral/Supino.gif',
  'Supino fechado com barra': 'peitoral/Supino.gif', // Aproximado
  'Supino com Halteres': 'peitoral/Supino-com-Halteres.gif',
  'Supino Inclinado': 'peitoral/Supino-inclinado-com-barra.gif',
  'Supino Inclinado com Halteres': 'peitoral/Supino-Inclinado-com-Halteres.gif',
  'Supino inclinado com halteres': 'peitoral/Supino-Inclinado-com-Halteres.gif',
  
  // ✅ MERGULHO - Mapeamento correto baseado no contexto
  'Mergulho': 'triceps/Tr-ceps-no-Banco.gif', // Padrão: tríceps
  'Mergulho no Banco': 'triceps/Tr-ceps-no-Banco.gif',
  'Mergulho nas paralelas': 'peitoral/Mergulho-de-peito-assistido.gif', // Peito
  'Mergulho nas paralelas (foco em peito)': 'peitoral/Mergulho-de-peito-assistido.gif',
  'Dips': 'triceps/Tr-ceps-no-Banco.gif',
  
  // ✅ POSTERIOR - Glute Ham Raise corrigido
  'Glute Ham Raise': 'Pernas/Mesa-flexora.gif', // CORRIGIDO
  'Flexão Nórdica': 'Pernas/Flexao-Nordica.gif',
  'Nordic Curl': 'Pernas/Flexao-Nordica.gif',
  'Mesa flexora': 'Pernas/Mesa-flexora.gif',
  
  // ✅ OMBROS - Crucifixo Inverso corrigido + exercícios do plano
  'Crucifixo Inverso': 'ombros/Voador-invertido.gif',
  'Reverse Fly': 'ombros/Voador-invertido.gif',
  'Voador Invertido': 'ombros/Voador-invertido.gif',
  'Desenvolvimento militar com barra': 'ombros/Desenvolvimento-militar-com-barra.gif',
  'Desenvolvimento de ombros na máquina articulada': 'ombros/Desenvolvimento-de-ombro-com-barra-sentado.gif',
  'Elevação lateral com halteres': 'ombros/Eleva-o-lateral-de-bra-os-com-halteres.gif',
  'Elevação frontal com anilhas': 'ombros/Eleva-o-Frontal-Alternada-Com-Halteres.gif',
  'Elevação frontal com anilhas (alternada)': 'ombros/Eleva-o-Frontal-Alternada-Com-Halteres.gif',
  'Encolhimento de ombros com halteres': 'trapezio/Encolhimento-com-Halteres.gif',
  'Face Pull': 'Face-pull.gif',
  'face pull': 'Face-pull.gif',
  'Face pull': 'Face-pull.gif',
  
  // === EXERCÍCIOS DO PLANO DO USUÁRIO ===
  
  // PERNAS
  'Agachamento': 'Pernas/Agachamento.gif',
  'Agachamento Livre': 'Pernas/Agachamento.gif',
  'Agachamento livre com barra': 'Pernas/Agachamento.gif',
  'Squat': 'Pernas/Agachamento.gif',
  'Leg Press': 'Pernas/Leg-Press.gif',
  'Leg press 45°': 'Pernas/Leg-Press.gif',
  'Cadeira extensora': 'Pernas/Cadeira-extensora.gif',
  'Cadeira Extensora Unilateral': 'Pernas/Extens-o-de-Perna-Unilateral.gif',
  'Cadeira Adutora': 'Pernas/M-quina-de-Adu-o-de-Quadril.gif',
  'Stiff': 'Pernas/Stiff-com-barra.gif',
  'Stiff com barra': 'Pernas/Stiff-com-barra.gif',
  'Levantamento Terra': 'Pernas/Levantamento-Terra.gif',
  'Levantamento terra convencional': 'Pernas/Levantamento-Terra.gif',
  'Deadlift': 'Pernas/Levantamento-Terra.gif',
  'Afundo': 'Pernas/Afundo-com-Halteres.gif',
  'Afundo com halteres': 'Pernas/Avan-o-com-Halteres.gif',
  'Afundo com halteres (passada)': 'Pernas/Avan-o-com-Halteres.gif',
  'Lunge': 'Pernas/Afundo-com-Halteres.gif',
  'Elevação de panturrilha em pé na máquina': 'Pernas/Eleva-o-de-Panturrilha-em-M-quina-em-p-.gif',
  'Panturrilha': 'Pernas/Panturrilhas-em-P-.gif',
  'Elevação de Panturrilha': 'Pernas/Eleva-o-de-Panturrilhas.gif',
  'Calf Raise': 'Pernas/Panturrilhas-em-P-.gif',
  
  // COSTAS
  'Barra Fixa': 'costas/Barra-fixa.gif',
  'Barra fixa': 'costas/Barra-fixa.gif',
  'Barra fixa (pegada pronada)': 'costas/Barra-fixa.gif',
  'Pull Up': 'costas/Pull-Up.gif',
  'Puxada Alta': 'costas/Puxada-Alta.gif',
  'Puxada frontal na polia': 'costas/Puxada-Alta-Invertida.gif',
  'Puxada frontal na polia (pegada supinada)': 'costas/Puxada-Alta-Invertida.gif',
  'Pulldown': 'costas/Puxada-Alta.gif',
  'Pulldown com braços estendidos na polia': 'costas/Pulldown-com-corda.gif',
  'Remada Baixa': 'costas/Remada-Sentada-com-Cabo.gif',
  'Remada Curvada': 'costas/Remada-Curvada-com-Barra.gif',
  'Remada curvada com barra': 'costas/Remada-Curvada-com-Barra.gif',
  'Remada curvada com barra (pegada pronada)': 'costas/Remada-Curvada-com-Barra.gif',
  'Remada unilateral com halter': 'costas/Serrote.gif',
  'Remada unilateral com halter (serrote)': 'costas/Serrote.gif',
  'Remada na máquina articulada': 'costas/Remada-T-com-alavanca.gif',
  'Remada na máquina articulada (pegada neutra)': 'costas/Remada-Sentada-com-Anilhas.gif',
  'Serrote': 'costas/Serrote.gif',
  
  // OMBROS
  'Desenvolvimento': 'ombros/Desenvolvimento-de-ombro-com-barra-sentado.gif',
  'Elevação Lateral': 'ombros/Eleva-o-lateral-de-bra-os-com-halteres.gif',
  'Elevação Frontal': 'ombros/Levantamento-frontal-com-barra.gif',
  'Arnold Press': 'ombros/Desenvolvimento-Arnold.gif',
  
  // BÍCEPS
  'Rosca Direta': 'bicps/Rosca-Direta-com-Barra.gif',
  'Rosca direta com barra w': 'bicps/Rosca-b-ceps-com-pegada-fechada-na-barra-W.gif',
  'Rosca Direta com Barra W': 'bicps/Rosca-b-ceps-com-pegada-fechada-na-barra-W.gif',
  'Rosca Alternada': 'bicps/Rosca-alternada-com-halteres-sentado.gif',
  'Rosca Martelo': 'bicps/Rosca-martelo.gif',
  'Rosca martelo com halteres': 'bicps/Rosca-martelo.gif',
  'Rosca martelo com halteres (em pé, simultânea)': 'bicps/Rosca-martelo.gif',
  'Rosca Concentrada': 'bicps/Rosca-concentrada.gif',
  
  // ANTEBRAÇOS
  'Rosca de Punho com Barra (sentado)': 'antebracos/Rosca-de-punho-com-barra.gif',
  
  // TRÍCEPS
  'Tríceps Testa': 'triceps/Tr-ceps-testa-com-barra.gif',
  'Tríceps francês com barra w': 'triceps/Tr-ceps-testa-com-barra.gif',
  'Tríceps francês com barra w (deitado)': 'triceps/Tr-ceps-testa-com-barra.gif',
  'Tríceps Pulley': 'triceps/Tr-ceps-pulley-barra.gif',
  'Tríceps na polia alta com corda': 'triceps/Tr-ceps-pulley-corda.gif',
  'Tríceps Francês': 'triceps/Tr-ceps-franc-s-com-barra-W-acima-da-cabe-a-sentado.gif',
  
  // PEITO ADICIONAL
  'Crucifixo reto com halteres': 'peitoral/Crucifixo-com-halteres.gif',
  
  // ABDOMEN
  'Abdominal': 'Abdomen/Abdominal.gif',
  'Abdominal na Roda (Ab Wheel)': 'Roda-abdominal.gif',
  'Prancha': 'Abdomen/Prancha.gif',
  'Plank': 'Abdomen/Prancha.gif',
  'Russian Twist': 'Abdomen/Russian-Twist.gif',
  
  // CARDIO
  'Mountain Climber': 'Cardio/Mountain-Climber.gif',
  'Burpee': 'Cardio/Burpee.gif',
  'Jumping Jack': 'Cardio/Jumping-Jack.gif',
  'High Knees': 'Cardio/High-Knees.gif',
  'Bear Crawl': 'Cardio/Bear-Crawl.gif'
};

/**
 * Normalização melhorada
 */
export const normalizeExerciseName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/°/g, ' graus')
    .replace(/\s+/g, ' ');
};

/**
 * Remove especificações técnicas avançadas
 */
const cleanExerciseName = (name: string): string => {
  let cleaned = name.toLowerCase();
  
  // Remove conteúdo entre parênteses
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim();
  
  // Remove especificações de equipamento e técnica
  const specs = [
    // Equipamentos
    'com barra', 'com halteres', 'com halter', 'com cabo', 'com corda', 'com anilhas',
    'na máquina', 'na smith', 'na polia', 'máquina articulada', 'nas paralelas',
    'barra w', 'barra reta',
    
    // Posições e orientações
    'inclinado', 'declinado', 'sentado', 'em pé', 'deitado',
    'unilateral', 'bilateral', 'alternado', 'alternada', 'simultânea', 'assistido',
    
    // Pegadas e ângulos
    'pegada pronada', 'pegada supinada', 'pegada neutra', 'pegada fechada', 'pegada aberta',
    '45°', '30°', 'graus',
    
    // Especificações de polia
    'polia alta', 'polia baixa',
    
    // Variações descritivas
    'convencional', 'passada', 'serrote', 'foco em peito', 'foco em triceps',
    'braços estendidos', 'peck-deck'
  ];
  
  // Remove cada especificação
  for (const spec of specs) {
    cleaned = cleaned.replace(new RegExp(`\\b${spec}\\b`, 'gi'), '').trim();
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
};

/**
 * Fallbacks por categoria muscular
 */
const getCategoryFallback = (exerciseName: string): string | null => {
  const normalized = normalizeExerciseName(exerciseName);
  
  const categories = {
    peito: 'peitoral/Supino.gif',
    costas: 'costas/Puxada-Alta.gif',
    ombros: 'ombros/Desenvolvimento-de-ombro-com-barra-sentado.gif',
    biceps: 'bicps/Rosca-Direta-com-Barra.gif',
    triceps: 'triceps/Tr-ceps-pulley-barra.gif',
    pernas: 'Pernas/Agachamento.gif',
    quadriceps: 'Pernas/Agachamento.gif',
    posterior: 'Pernas/Stiff-com-barra.gif',
    gluteos: 'Pernas/Eleva-o-P-lvica-Com-Barra.gif',
    panturrilha: 'Pernas/Panturrilhas-em-P-.gif',
    abdomen: 'Abdomen/Abdominal.gif',
    core: 'Abdomen/Prancha.gif',
    cardio: 'Cardio/Burpee.gif'
  };
  
  const keywords = {
    peito: ['peito', 'chest', 'supino', 'flexao'],
    costas: ['costas', 'back', 'puxada', 'remada', 'barra'],
    ombros: ['ombro', 'shoulder', 'desenvolvimento', 'elevacao'],
    biceps: ['bicep', 'rosca', 'curl'],
    triceps: ['tricep', 'extension', 'pulley', 'testa'],
    pernas: ['perna', 'leg', 'agachamento', 'squat'],
    quadriceps: ['quadriceps', 'extensao'],
    posterior: ['posterior', 'stiff', 'deadlift', 'flexora'],
    gluteos: ['gluteo', 'hip', 'ponte', 'thrust'],
    panturrilha: ['panturrilha', 'calf'],
    abdomen: ['abdominal', 'abs', 'crunch'],
    core: ['core', 'prancha', 'plank'],
    cardio: ['cardio', 'burpee', 'jump', 'mountain']
  };
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => normalized.includes(word))) {
      console.log(`🎯 Fallback por categoria: ${exerciseName} -> ${category}`);
      return categories[category as keyof typeof categories];
    }
  }
  
  return null;
};

/**
 * Busca por similaridade
 */
const findSimilarExercise = (exerciseName: string): string | null => {
  const normalized = normalizeExerciseName(exerciseName);
  const words = normalized.split(' ').filter(w => w.length > 2);
  
  if (words.length === 0) return null;
  
  const exercises = Object.keys(CORRECTED_GIF_MAPPING);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const exercise of exercises) {
    const exerciseNormalized = normalizeExerciseName(exercise);
    const exerciseWords = exerciseNormalized.split(' ');
    
    const sharedWords = words.filter(word => 
      exerciseWords.some(exerciseWord => 
        exerciseWord.includes(word) || word.includes(exerciseWord)
      )
    );
    
    if (sharedWords.length > 0) {
      const score = sharedWords.length / Math.max(words.length, exerciseWords.length);
      if (score > bestScore && score > 0.4) {
        bestScore = score;
        bestMatch = exercise;
      }
    }
  }
  
  return bestMatch ? CORRECTED_GIF_MAPPING[bestMatch] : null;
};

/**
 * Valida se URL do GIF existe
 */
const validateGifUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Função principal unificada de busca de GIFs
 */
export const findExerciseGif = async (exerciseName: string): Promise<string | null> => {
  if (!exerciseName?.trim()) return null;
  
  const cacheKey = exerciseName.toLowerCase().trim();
  
  // 0. Verificar lista de exercícios sem GIF
  const exerciseNormalized = normalizeExerciseName(exerciseName);
  if (NO_GIF_EXERCISES.has(exerciseNormalized)) {
    console.log(`🚫 Exercício sem GIF disponível: ${exerciseName}`);
    gifCache.set(cacheKey, null);
    return null;
  }
  
  // 1. Verificar cache primeiro
  const cached = gifCache.get(cacheKey);
  if (cached !== null) {
    console.log(`🚀 Cache hit: ${exerciseName} -> ${cached || 'não encontrado'}`);
    return cached;
  }
  
  console.log(`🔍 Buscando GIF para: "${exerciseName}"`);
  
  let gifPath: string | null = null;
  let matchType = '';
  
  // 2. Busca direta no mapeamento corrigido
  if (CORRECTED_GIF_MAPPING[exerciseName]) {
    gifPath = CORRECTED_GIF_MAPPING[exerciseName];
    matchType = 'DIRETO';
    console.log(`✅ Match direto: ${exerciseName} -> ${gifPath}`);
  }
  
  // 3. Busca normalizada
  if (!gifPath) {
    const normalized = normalizeExerciseName(exerciseName);
    for (const [key, value] of Object.entries(CORRECTED_GIF_MAPPING)) {
      if (normalizeExerciseName(key) === normalized) {
        gifPath = value;
        matchType = 'NORMALIZADO';
        console.log(`✅ Match normalizado: ${exerciseName} -> ${key} -> ${gifPath}`);
        break;
      }
    }
  }
  
  // 4. Busca com nome limpo (sem especificações técnicas)
  if (!gifPath) {
    const cleaned = cleanExerciseName(exerciseName);
    
    // Busca direta com nome limpo
    if (CORRECTED_GIF_MAPPING[cleaned]) {
      gifPath = CORRECTED_GIF_MAPPING[cleaned];
      matchType = 'NOME LIMPO (DIRETO)';
      console.log(`✅ Match com nome limpo direto: ${exerciseName} -> ${cleaned} -> ${gifPath}`);
    } else {
      // Busca normalizada com nome limpo
      const normalizedCleaned = normalizeExerciseName(cleaned);
      for (const [key, value] of Object.entries(CORRECTED_GIF_MAPPING)) {
        if (normalizeExerciseName(key) === normalizedCleaned) {
          gifPath = value;
          matchType = 'NOME LIMPO (NORMALIZADO)';
          console.log(`✅ Match com nome limpo normalizado: ${exerciseName} -> ${cleaned} -> ${key} -> ${gifPath}`);
          break;
        }
      }
    }
  }
  
  // 5. Busca por similaridade
  if (!gifPath) {
    gifPath = findSimilarExercise(exerciseName);
    if (gifPath) {
      matchType = 'SIMILARIDADE';
      console.log(`✅ Match por similaridade: ${exerciseName} -> ${gifPath}`);
    }
  }
  
  // 6. Fallback por categoria
  if (!gifPath) {
    gifPath = getCategoryFallback(exerciseName);
    if (gifPath) {
      matchType = 'FALLBACK CATEGORIA';
      console.log(`⚠️ Fallback por categoria: ${exerciseName} -> ${gifPath}`);
    }
  }
  
  // 7. Construir URL final se encontrou path
  let finalUrl: string | null = null;
  if (gifPath) {
    finalUrl = GIF_BASE_URL + encodeURI(gifPath);
    console.log(`🧩 URL construída para "${exerciseName}" (${matchType}):`, finalUrl);
    
    // Validar URL (opcional - pode ser removido para performance)
    const isValid = await validateGifUrl(finalUrl);
    if (!isValid) {
      console.warn(`⚠️ GIF inválido: ${finalUrl}`);
      finalUrl = null;
      gifCache.set(cacheKey, null, true);
    } else {
      gifCache.set(cacheKey, finalUrl);
    }
  } else {
    console.warn(`❌ Nenhum GIF encontrado para: ${exerciseName}`);
    gifCache.set(cacheKey, null);
  }
  
  return finalUrl;
};

/**
 * Função para limpar cache
 */
export const clearGifCache = (): void => {
  gifCache.clear();
  console.log('🗑️ Cache limpo - Face Pull corrigido');
};

/**
 * Estatísticas do sistema
 */
export const getGifSystemStats = () => {
  return {
    ...gifCache.getStats(),
    totalMappings: Object.keys(CORRECTED_GIF_MAPPING).length,
    version: 'V4-Unified-Corrected',
    lastUpdate: new Date().toISOString()
  };
};

/**
 * Lista exercícios disponíveis
 */
export const getAvailableExercises = (): string[] => {
  return Object.keys(CORRECTED_GIF_MAPPING).sort();
};

/**
 * Função de debug para testar exercícios específicos
 */
export const debugGifSearch = async (exerciseName: string) => {
  console.group(`🔍 Debug GIF Search: ${exerciseName}`);
  
  const result = await findExerciseGif(exerciseName);
  
  console.log('Resultado final:', result);
  console.log('Cache stats:', gifCache.getStats());
  
  console.groupEnd();
  
  return result;
};