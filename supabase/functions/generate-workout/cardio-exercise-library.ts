// ✅ BIBLIOTECA COMPLETA DE EXERCÍCIOS CARDIOVASCULARES
// Classificados por intensidade e IMC para personalização máxima

export interface CardioExercise {
  name: string;
  equipment: string;
  duration: string;
  intensity: string;
  targetBMI: string[];
  instructions: string;
  tips: string;
  estimatedCalories: number;
  heartRateZone: string;
}

export const cardioLibrary: CardioExercise[] = [
  // === OBESIDADE (IMC >= 30) - ALTA INTENSIDADE ===
  {
    name: "HIIT na Esteira com Inclinação",
    equipment: "Esteira",
    duration: "20 min",
    intensity: "Alta - 75-85% FCmáx",
    targetBMI: ["obesidade", "sobrepeso"],
    instructions: "1️⃣ Aquecimento: 3 min caminhada leve 4-5 km/h 2️⃣ Intervalos: 1 min corrida intensa 8-10 km/h + inclinação 5%, 2 min caminhada ativa 6 km/h 3️⃣ Repetir: 8-10 ciclos de alta intensidade 4️⃣ Finalização: 5 min caminhada desaceleração gradual",
    tips: "Monitore frequência cardíaca - pare se sentir tontura. Hidrate a cada 5 minutos.",
    estimatedCalories: 120,
    heartRateZone: "75-85% FCmáx"
  },
  {
    name: "Circuito Metabólico Funcional",
    equipment: "Peso corporal + medicine ball",
    duration: "15 min",
    intensity: "Alta - 80-90% FCmáx",
    targetBMI: ["obesidade"],
    instructions: "1️⃣ Aquecimento: Movimentos articulares 2 min 2️⃣ Circuito: 45s trabalho + 15s descanso - burpees modificados, mountain climbers, agachamento jump, prancha dinâmica 3️⃣ Repetir: 4-5 rounds completos 4️⃣ Finalização: Alongamento ativo 3 min",
    tips: "Modifique intensidade conforme capacidade. Foque na queima calórica máxima.",
    estimatedCalories: 100,
    heartRateZone: "80-90% FCmáx"
  },

  // === SOBREPESO (IMC 25-30) - MODERADA-ALTA ===
  {
    name: "Bike Ergométrica Intervalada",
    equipment: "Bicicleta ergométrica",
    duration: "15 min",
    intensity: "Moderada-Alta - 70-80% FCmáx",
    targetBMI: ["sobrepeso"],
    instructions: "1️⃣ Aquecimento: 3 min pedalada leve resistência 3-4 2️⃣ Intervalos: 2 min intensidade moderada resistência 6-7, 1 min recuperação ativa resistência 4 3️⃣ Repetir: 6-8 ciclos de trabalho 4️⃣ Finalização: 3 min pedalada leve com redução gradual",
    tips: "Mantenha cadência 70-80 RPM nos intervalos intensos. Ajuste resistência conforme evolução.",
    estimatedCalories: 85,
    heartRateZone: "70-80% FCmáx"
  },
  {
    name: "Escada Rolante Progressiva",
    equipment: "Escada rolante (stairmaster)",
    duration: "12 min",
    intensity: "Moderada-Alta - 75-80% FCmáx",
    targetBMI: ["sobrepeso", "normal"],
    instructions: "1️⃣ Aquecimento: 2 min velocidade 40-50 steps/min 2️⃣ Progressão: Aumentar 10 steps/min a cada 2 min até máximo confortável 3️⃣ Manutenção: 4 min na intensidade alvo 4️⃣ Finalização: 2 min redução gradual até repouso",
    tips: "Use corrimão apenas para equilíbrio, não para suporte de peso. Postura ereta.",
    estimatedCalories: 75,
    heartRateZone: "75-80% FCmáx"
  },

  // === PESO NORMAL (IMC < 25) - MODERADA ===
  {
    name: "Remo Ergômetro Contínuo",
    equipment: "Remo ergômetro",
    duration: "15 min",
    intensity: "Moderada - 65-75% FCmáx",
    targetBMI: ["normal"],
    instructions: "1️⃣ Aquecimento: 3 min remada leve 20-22 SPM (strokes por minuto) 2️⃣ Trabalho principal: 10 min ritmo constante 24-26 SPM, resistência 4-5 3️⃣ Técnica: Drive com pernas, core, braços - recovery suave 4️⃣ Finalização: 2 min remada recuperação 18-20 SPM",
    tips: "Foque na técnica antes da intensidade. Ratio 1:2 (1s drive, 2s recovery).",
    estimatedCalories: 70,
    heartRateZone: "65-75% FCmáx"
  },
  {
    name: "Elíptico Cross-Training",
    equipment: "Elíptico",
    duration: "18 min",
    intensity: "Moderada - 65-70% FCmáx",
    targetBMI: ["normal"],
    instructions: "1️⃣ Aquecimento: 3 min movimento natural, resistência 3-4 2️⃣ Variação: 2 min frente + 2 min costas + 2 min apenas braços, resistência 5-6 3️⃣ Repetir: 3 ciclos de variação 4️⃣ Finalização: 3 min movimento frente suave, redução gradual",
    tips: "Mude direção e foco muscular para trabalho completo. Não se apoie nos braços.",
    estimatedCalories: 80,
    heartRateZone: "65-70% FCmáx"
  },

  // === EXERCÍCIOS UNIVERSAIS (TODOS OS IMCS) ===
  {
    name: "Caminhada Inclinada Progressiva",
    equipment: "Esteira",
    duration: "20 min",
    intensity: "Leve-Moderada - 60-70% FCmáx",
    targetBMI: ["obesidade", "sobrepeso", "normal"],
    instructions: "1️⃣ Aquecimento: 3 min caminhada plana 4 km/h 2️⃣ Progressão: Aumentar inclinação 2% a cada 3 min, manter velocidade 5-6 km/h 3️⃣ Pico: 4 min na inclinação máxima confortável 4️⃣ Finalização: 5 min redução gradual até plano",
    tips: "Inclinação trabalha mais glúteos e panturrilhas. Postura ereta, passos naturais.",
    estimatedCalories: 90,
    heartRateZone: "60-70% FCmáx"
  },
  {
    name: "Step Aeróbico com Variações",
    equipment: "Step + halteres leves",
    duration: "12 min",
    intensity: "Moderada - 70-75% FCmáx",
    targetBMI: ["sobrepeso", "normal"],
    instructions: "1️⃣ Aquecimento: 2 min step básico sem peso 2️⃣ Sequência: Basic step, step touch, knee up, kick back - 1 min cada com halteres 2-3kg 3️⃣ Intensificação: 4 min combinações rápidas 4️⃣ Finalização: 2 min step básico desaceleração",
    tips: "Pise totalmente no step, desça suave. Coordene braços para maior gasto calórico.",
    estimatedCalories: 65,
    heartRateZone: "70-75% FCmáx"
  },

  // === HIIT AVANÇADO ===
  {
    name: "HIIT Bike + Força Explosiva",
    equipment: "Bike + kettlebell",
    duration: "16 min",
    intensity: "Muito Alta - 85-90% FCmáx",
    targetBMI: ["obesidade", "sobrepeso"],
    instructions: "1️⃣ Aquecimento: 3 min bike leve 2️⃣ Circuito: 30s bike máxima intensidade + 30s kettlebell swings + 60s recuperação ativa 3️⃣ Repetir: 8 rounds de alta intensidade 4️⃣ Finalização: 3 min bike recuperação suave",
    tips: "Protocolo extremo para queima máxima. Monitore sinais de fadiga excessiva.",
    estimatedCalories: 130,
    heartRateZone: "85-90% FCmáx"
  }
];

// ✅ FUNÇÃO PARA SELECIONAR EXERCÍCIOS BASEADO NO IMC
export function selectCardioExercises(bmi: number, count: number = 3): CardioExercise[] {
  let targetCategory: string;
  
  if (bmi >= 30) targetCategory = "obesidade";
  else if (bmi >= 25) targetCategory = "sobrepeso";  
  else targetCategory = "normal";
  
  // Filtrar exercícios adequados para a categoria
  const suitableExercises = cardioLibrary.filter(exercise => 
    exercise.targetBMI.includes(targetCategory)
  );
  
  // Retornar quantidade solicitada de exercícios variados
  const shuffled = suitableExercises.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ✅ FUNÇÃO PARA GERAR INSTRUÇÕES CARDIOVASCULARES ESPECÍFICAS
export function generateCardioInstructions(exercise: CardioExercise): string {
  return `${exercise.instructions} | ZONA FC: ${exercise.heartRateZone} | CALORIAS ESTIMADAS: ${exercise.estimatedCalories}kcal`;
}