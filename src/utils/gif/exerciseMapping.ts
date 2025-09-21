
/**
 * Mapeamento direto de nomes de exercícios para arquivos específicos
 * Baseado nos exercícios mais comuns do sistema
 */
export const DIRECT_EXERCISE_MAPPING: Record<string, string> = {
  // Exercícios de peito
  'supino reto': 'supino-reto',
  'supino inclinado': 'supino-inclinado', 
  'supino declinado': 'supino-declinado',
  'flexão': 'flexao',
  'flexão de braço': 'flexao',
  'flexao de braco': 'flexao',
  'push up': 'flexao',
  'crucifixo': 'crucifixo',
  'mergulho': 'mergulho',
  'dips': 'mergulho',
  
  // Exercícios de costas
  'barra fixa': 'barra-fixa',
  'pull up': 'barra-fixa',
  'pulldown': 'pulldown',
  'puxada alta': 'pulldown',
  'remada curvada': 'remada-curvada',
  'remada baixa': 'remada-baixa',
  'remada unilateral': 'remada-unilateral',
  'levantamento terra': 'levantamento-terra',
  'deadlift': 'levantamento-terra',
  
  // Exercícios de pernas
  'agachamento': 'agachamento',
  'squat': 'agachamento',
  'leg press': 'leg-press',
  'cadeira extensora': 'cadeira-extensora',
  'mesa flexora': 'mesa-flexora',
  'panturrilha': 'panturrilha',
  'stiff': 'stiff',
  'afundo': 'afundo',
  'lunge': 'afundo',
  
  // Exercícios de braços
  'rosca direta': 'rosca-direta',
  'rosca alternada': 'rosca-alternada',
  'rosca martelo': 'rosca-martelo',
  'rosca concentrada': 'rosca-concentrada',
  'triceps testa': 'triceps-testa',
  'tríceps testa': 'triceps-testa',
  'triceps pulley': 'triceps-pulley',
  'triceps frances': 'triceps-frances',
  'mergulho banco': 'mergulho-banco',
  
  // Exercícios de ombros
  'desenvolvimento': 'desenvolvimento',
  'elevação lateral': 'elevacao-lateral',
  'elevacao lateral': 'elevacao-lateral',
  'elevação frontal': 'elevacao-frontal',
  'elevacao frontal': 'elevacao-frontal',
  'crucifixo inverso': 'crucifixo-inverso',
  'encolhimento': 'encolhimento',
  'arnold press': 'arnold-press',
  
  // Exercícios de core
  'abdominal': 'abdominal',
  'prancha': 'prancha',
  'plank': 'prancha',
  'russian twist': 'russian-twist',
  'mountain climber': 'mountain-climber',
  'prancha lateral': 'prancha-lateral',
  
  // Exercícios funcionais
  'burpee': 'burpee',
  'jumping jack': 'jumping-jack',
  'high knees': 'high-knees',
  'butt kickers': 'butt-kickers',
  'bear crawl': 'bear-crawl'
};

/**
 * Categorias de exercícios para fallback
 */
export const EXERCISE_CATEGORIES: Record<string, string[]> = {
  'peito': ['supino-reto', 'flexao', 'crucifixo', 'mergulho'],
  'costas': ['barra-fixa', 'pulldown', 'remada-curvada', 'levantamento-terra'],
  'pernas': ['agachamento', 'leg-press', 'afundo', 'panturrilha'],
  'bracos': ['rosca-direta', 'triceps-testa', 'rosca-martelo', 'triceps-pulley'],
  'ombros': ['desenvolvimento', 'elevacao-lateral', 'arnold-press', 'crucifixo-inverso'],
  'core': ['abdominal', 'prancha', 'russian-twist', 'mountain-climber'],
  'funcional': ['burpee', 'jumping-jack', 'bear-crawl', 'high-knees']
};

/**
 * Palavras-chave para identificar categorias de exercícios
 */
export const CATEGORY_KEYWORDS: Record<string, string> = {
  'supino': 'peito',
  'flexao': 'peito',
  'peito': 'peito',
  'chest': 'peito',
  'barra': 'costas',
  'pulldown': 'costas',
  'remada': 'costas',
  'costas': 'costas',
  'back': 'costas',
  'agachamento': 'pernas',
  'squat': 'pernas',
  'leg': 'pernas',
  'pernas': 'pernas',
  'coxa': 'pernas',
  'panturrilha': 'pernas',
  'rosca': 'bracos',
  'triceps': 'bracos',
  'tricep': 'bracos',
  'biceps': 'bracos',
  'bicep': 'bracos',
  'bracos': 'bracos',
  'arms': 'bracos',
  'desenvolvimento': 'ombros',
  'elevacao': 'ombros',
  'ombros': 'ombros',
  'ombro': 'ombros',
  'shoulder': 'ombros',
  'abdominal': 'core',
  'prancha': 'core',
  'abs': 'core',
  'core': 'core',
  'burpee': 'funcional',
  'jumping': 'funcional',
  'mountain': 'funcional'
};
