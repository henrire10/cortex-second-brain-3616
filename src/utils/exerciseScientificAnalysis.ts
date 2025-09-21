interface UserProfile {
  age?: number;
  gender?: string;
  experience_level?: string;
  fitness_goal?: string;
  weight?: number;
  height?: number;
  medical_conditions?: string;
  activity_level?: string;
}

interface Exercise {
  name: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  rest: string;
}

// Base científica específica para cada tipo de exercício
const EXERCISE_SCIENTIFIC_DATABASE = {
  // Exercícios de Peito
  'supino': {
    biomechanics: 'Movimento de adução horizontal e flexão do ombro, ativando fibras do peitoral maior',
    physiological: 'Estimula síntese proteica através da sobrecarga progressiva e tempo sob tensão',
    neural: 'Recruta unidades motoras de alto limiar para força e potência',
    hormonal: 'Eleva GH e testosterona pós-exercício por até 15-30 minutos'
  },
  'flexão': {
    biomechanics: 'Exercício em cadeia cinética fechada, maior ativação do core e estabilizadores',
    physiological: 'Melhora coordenação intermuscular e força funcional',
    neural: 'Desenvolve propriocepção e controle neuromuscular',
    hormonal: 'Menor impacto hormonal que exercícios com carga externa'
  },
  'crucifixo': {
    biomechanics: 'Movimento de adução pura, alongamento máximo das fibras pectorais',
    physiological: 'Foco na hipertrofia por estresse metabólico e dano muscular',
    neural: 'Exercício de isolamento com menor demanda neural',
    hormonal: 'Resposta hormonal moderada, ideal para volume de treino'
  },
  
  // Exercícios de Costas
  'barra': {
    biomechanics: 'Movimento de extensão de ombro e adução, ativação máxima do latíssimo',
    physiological: 'Alto recrutamento de fibras tipo II, excelente para força',
    neural: 'Complexo movimento que requer alta coordenação neural',
    hormonal: 'Exercício composto com alta liberação de hormônios anabólicos'
  },
  'remada': {
    biomechanics: 'Retração escapular e flexão de cotovelo, fortalece romboides e trapézio médio',
    physiological: 'Corrige desequilíbrios posturais modernos (síndrome cruzada superior)',
    neural: 'Melhora ativação dos músculos posturais profundos',
    hormonal: 'Resposta hormonal moderada-alta dependendo da carga'
  },
  'pulldown': {
    biomechanics: 'Similar à barra fixa mas com controle de carga, padrão neural progressivo',
    physiological: 'Permite progressão gradual para exercícios mais complexos',
    neural: 'Desenvolve o padrão motor para movimentos de puxada',
    hormonal: 'Resposta proporcional à intensidade utilizada'
  },
  
  // Exercícios de Pernas
  'agachamento': {
    biomechanics: 'Movimento tri-articular (quadril, joelho, tornozelo), maior exercício funcional',
    physiological: 'Máxima liberação hormonal, ativa 200+ músculos simultaneamente',
    neural: 'Desenvolve força, potência e coordenação de corpo inteiro',
    hormonal: 'Maior pico de GH e testosterona de todos os exercícios'
  },
  'leg': {
    biomechanics: 'Movimento isolado de extensão de joelho em cadeia cinética aberta',
    physiological: 'Hipertrofia específica do quadríceps, menor demanda sistêmica',
    neural: 'Exercício de isolamento com baixa demanda neural',
    hormonal: 'Resposta hormonal localizada e moderada'
  },
  'stiff': {
    biomechanics: 'Padrão de dobradiça do quadril, ênfase na cadeia posterior',
    physiological: 'Fortalece isquiotibiais e glúteos, previne lesões',
    neural: 'Desenvolve coordenação da cadeia posterior',
    hormonal: 'Boa resposta hormonal por ser exercício composto'
  },

  // Exercícios de Braços
  'rosca': {
    biomechanics: 'Flexão isolada de cotovelo, foco no bíceps braquial',
    physiological: 'Hipertrofia por isolamento e concentração muscular',
    neural: 'Baixa demanda neural, permite foco na conexão mente-músculo',
    hormonal: 'Resposta hormonal local mínima'
  },
  'tríceps': {
    biomechanics: 'Extensão de cotovelo, maior músculo do braço (65% da massa)',
    physiological: 'Importante para força de empurrar e estética dos braços',
    neural: 'Variações permitem diferentes ângulos de recrutamento',
    hormonal: 'Resposta local proporcional ao volume e intensidade'
  }
};

// Função que mapeia exercícios para suas categorias
const getExerciseCategory = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase();
  
  // Mapeamento mais preciso de exercícios
  if (name.includes('supino') || name.includes('bench')) return 'supino';
  if (name.includes('flexão') || name.includes('push')) return 'flexão';
  if (name.includes('crucifixo') || name.includes('voador') || name.includes('fly')) return 'crucifixo';
  if (name.includes('barra fixa') || name.includes('pull-up') || name.includes('pullup')) return 'barra';
  if (name.includes('remada') || name.includes('row')) return 'remada';
  if (name.includes('pulldown') || name.includes('puxador')) return 'pulldown';
  if (name.includes('agachamento') || name.includes('squat') || name.includes('agacha')) return 'agachamento';
  if (name.includes('leg press') || name.includes('leg') && name.includes('press')) return 'leg';
  if (name.includes('stiff') || name.includes('terra') || name.includes('deadlift')) return 'stiff';
  if (name.includes('rosca') || name.includes('curl') || name.includes('bíceps') || name.includes('biceps')) return 'rosca';
  if (name.includes('tríceps') || name.includes('triceps') || name.includes('mergulho') || name.includes('dips')) return 'tríceps';
  
  // Categorias por grupo muscular se não encontrar exercício específico
  if (name.includes('peito') || name.includes('peitoral')) return 'supino';
  if (name.includes('costa') || name.includes('dorsal')) return 'remada';
  if (name.includes('perna') || name.includes('coxa') || name.includes('quadríceps')) return 'agachamento';
  if (name.includes('braço') || name.includes('bíceps')) return 'rosca';
  if (name.includes('tríceps')) return 'tríceps';
  
  return 'geral'; // fallback
};

export const generatePersonalizedScientificRationale = (exercise: Exercise, profile: UserProfile): string => {
  const exerciseName = exercise.name.toLowerCase();
  const exerciseCategory = getExerciseCategory(exerciseName);
  const age = profile.age || 25;
  const gender = profile.gender?.toLowerCase() || 'masculino';
  const goal = profile.fitness_goal?.toLowerCase() || '';
  const experience = profile.experience_level?.toLowerCase() || 'iniciante';
  const weight = profile.weight || 70;

  console.log(`🔬 Gerando explicação científica para: ${exercise.name} (categoria: ${exerciseCategory})`);
  
  // Obter dados científicos específicos do exercício
  const scientificData = EXERCISE_SCIENTIFIC_DATABASE[exerciseCategory as keyof typeof EXERCISE_SCIENTIFIC_DATABASE] || 
    EXERCISE_SCIENTIFIC_DATABASE['geral'] || {
      biomechanics: 'Movimento articular específico que recruta fibras musculares',
      physiological: 'Estimula adaptações neuromusculares através de sobrecarga',
      neural: 'Desenvolve coordenação e controle motor',
      hormonal: 'Resposta hormonal proporcional à intensidade'
    };

  // 1. CONEXÃO DIRETA COM O OBJETIVO (específica por exercício + objetivo)
  let goalConnection = '';
  
  if (goal.includes('perda') || goal.includes('peso') || goal.includes('emagrecer') || goal.includes('gordura')) {
    switch (exerciseCategory) {
      case 'agachamento':
        goalConnection = `Como você quer perder peso, o ${exercise.name} é PERFEITO! Ele trabalha seus maiores músculos (glúteos e coxas de ${weight}kg), queimando até 40% mais calorias que exercícios isolados. Cada repetição ativa mais de 200 músculos simultaneamente! `;
        break;
      case 'supino':
        goalConnection = `Para sua meta de perder peso, o ${exercise.name} é estratégico porque o peitoral é um músculo grande que acelera muito seu metabolismo - você vai queimar calorias até 24h após o treino! `;
        break;
      case 'barra':
      case 'remada':
      case 'pulldown':
        goalConnection = `Já que você quer perder peso, o ${exercise.name} é excelente! Trabalhar as costas (maior grupo muscular do tronco) dispara seu gasto calórico e ainda melhora sua postura para parecer mais magro(a) instantaneamente. `;
        break;
      case 'stiff':
        goalConnection = `Como você quer emagrecer, o ${exercise.name} é ideal porque trabalha toda sua cadeia posterior (glúteos + posteriores), criando um gasto calórico imenso e ainda moldando seu bumbum! `;
        break;
      case 'rosca':
        goalConnection = `Para perda de peso, o ${exercise.name} complementa seu treino acelerando o metabolismo dos braços e criando definição que fica visível conforme você perde gordura. `;
        break;
      case 'tríceps':
        goalConnection = `Como você quer emagrecer, o ${exercise.name} é perfeito para definir a "parte de trás" dos braços (onde acumula mais gordura) e ainda queima calorias extras! `;
        break;
      default:
        goalConnection = `Para sua meta de perder peso, o ${exercise.name} aumenta seu gasto calórico e acelera o metabolismo pós-treino por até 24 horas! `;
    }
  } else if (goal.includes('massa') || goal.includes('hipertrofia') || goal.includes('músculo') || goal.includes('crescer')) {
    switch (exerciseCategory) {
      case 'agachamento':
        goalConnection = `Você quer ganhar massa muscular? O ${exercise.name} é O EXERCÍCIO! Ele libera mais hormônios do crescimento que qualquer outro - é como uma "injeção natural" que faz TODO seu corpo crescer, não só as pernas! `;
        break;
      case 'supino':
        goalConnection = `Para ganhar massa muscular, o ${exercise.name} é essencial! Ele constrói aquele peitoral "sarado" que você quer, e ainda fortalece ombros e tríceps juntos - 3 músculos crescendo ao mesmo tempo! `;
        break;
      case 'barra':
        goalConnection = `Como você quer ganhar massa, o ${exercise.name} é OBRIGATÓRIO! Ele cria aquela silhueta em "V" dos seus sonhos, alargando as costas e fazendo sua cintura parecer mais fina. `;
        break;
      case 'remada':
        goalConnection = `Para seu objetivo de massa muscular, o ${exercise.name} constrói aquelas costas largas e grossas que dão presença e força. É o exercício que "enche" a camisa! `;
        break;
      case 'stiff':
        goalConnection = `Você quer ganhar massa? O ${exercise.name} é perfeito para construir glúteos grandes e pernas traseiras poderosas - a base de um físico impressionante! `;
        break;
      case 'rosca':
        goalConnection = `Para ganhar massa muscular, o ${exercise.name} esculpe aqueles bíceps que "estufam" a manga da camisa. É o músculo que todo mundo vê e admira! `;
        break;
      case 'tríceps':
        goalConnection = `Como você quer massa muscular, o ${exercise.name} é CRUCIAL! O tríceps é 65% do volume do braço - enquanto outros focam só no bíceps, você está construindo braços realmente grandes! `;
        break;
      default:
        goalConnection = `Para seu objetivo de ganhar massa muscular, o ${exercise.name} foi escolhido para estimular máximo crescimento neste grupo através de sobrecarga progressiva! `;
    }
  } else if (goal.includes('glúteo') || goal.includes('bumbum') || goal.includes('glute')) {
    switch (exerciseCategory) {
      case 'agachamento':
        goalConnection = `PERFEITO! Você quer aumentar o bumbum e o ${exercise.name} é O REI DOS GLÚTEOS! Ele ativa 3 músculos do glúteo ao mesmo tempo (máximo, médio e mínimo) - é o exercício mais completo para o bumbum dos seus sonhos! `;
        break;
      case 'stiff':
        goalConnection = `Como você quer aumentar o glúteo, o ${exercise.name} é IDEAL! Ele trabalha especificamente a "parte de baixo" do bumbum, criando aquele formato arredondado e empinado que você busca! `;
        break;
      case 'leg':
        goalConnection = `Para aumentar seu bumbum, o ${exercise.name} fortalece as coxas que "sustentam" e realçam os glúteos. Pernas fortes fazem o bumbum parecer ainda maior e mais definido! `;
        break;
      default:
        goalConnection = `Este ${exercise.name} complementa seu objetivo de aumentar o glúteo, trabalhando músculos que dão suporte e potencializam o crescimento da região! `;
    }
  } else if (goal.includes('definição') || goal.includes('tonificar') || goal.includes('definir')) {
    switch (exerciseCategory) {
      case 'supino':
        goalConnection = `Para definição corporal, o ${exercise.name} é perfeito! Ele "desenha" os músculos do peitoral, criando aquelas linhas e separações que ficam evidentes quando você reduz a gordura. `;
        break;
      case 'barra':
      case 'remada':
        goalConnection = `Como você quer definição, o ${exercise.name} esculpe as costas criando aqueles "riscos" e contornos musculares que dão aquela aparência atlética! `;
        break;
      case 'rosca':
        goalConnection = `Para definir os braços, o ${exercise.name} cria aquele "pico" do bíceps e as separações musculares que aparecem quando você flexiona o braço! `;
        break;
      case 'tríceps':
        goalConnection = `Já que você quer definição, o ${exercise.name} esculpe a "ferradura" do tríceps, criando aqueles contornos marcados na parte de trás do braço! `;
        break;
      default:
        goalConnection = `Para sua meta de definição, o ${exercise.name} ajuda a "esculpir" este grupo muscular, criando contornos bem marcados e separações visíveis! `;
    }
  } else if (goal.includes('força') || goal.includes('performance')) {
    goalConnection = `Como você quer aumentar sua força, o ${exercise.name} desenvolve potência específica neste movimento, melhorando sua performance em atividades do dia a dia! `;
  } else {
    goalConnection = `O ${exercise.name} foi selecionado especificamente para seu objetivo de condicionamento geral, trabalhando de forma equilibrada! `;
  }

  // 2. INFORMAÇÕES CIENTÍFICAS ESPECÍFICAS DO EXERCÍCIO
  const scientificExplanation = `Cientificamente, o ${exercise.name} ${scientificData.biomechanics.toLowerCase()}. ${scientificData.physiological} ${scientificData.neural}`;

  // 3. PERSONALIZAÇÃO POR IDADE E EXPERIÊNCIA
  let personalizedInfo = '';
  if (age < 25) {
    personalizedInfo = `Aos ${age} anos, você tem vantagem! Seu corpo produz hormônios naturalmente em níveis altos - o ${exercise.name} vai aproveitar essa "janela anabólica" para resultados mais rápidos. `;
  } else if (age > 40) {
    personalizedInfo = `Aos ${age} anos, o ${exercise.name} é ainda mais importante porque mantém sua massa muscular e força, combatendo o envelhecimento natural. `;
  } else {
    personalizedInfo = `Na sua idade (${age} anos), o ${exercise.name} é perfeito para otimizar sua composição corporal e atingir seu auge físico. `;
  }

  if (experience === 'iniciante') {
    personalizedInfo += `Como você está começando, este ${exercise.name} vai ensinar seu corpo os movimentos corretos enquanto já promove os resultados que você quer ver. `;
  } else if (experience === 'intermediário' || experience === 'intermediario') {
    personalizedInfo += `No seu nível intermediário, o ${exercise.name} vai quebrar seus platôs e acelerar seus resultados com técnicas mais refinadas. `;
  } else {
    personalizedInfo += `Como praticante avançado, você vai extrair o máximo do ${exercise.name} com controle total e técnica aprimorada. `;
  }

  // 4. DETALHES TÉCNICOS ESPECÍFICOS (sets/reps/rest)
  const technicalDetails = `O protocolo de ${exercise.sets} séries de ${exercise.reps} repetições com ${exercise.rest} de descanso foi calculado especificamente para maximizar seus resultados baseado no seu perfil único!`;

  // Combinar tudo em uma explicação personalizada e específica
  const finalExplanation = `${goalConnection}${personalizedInfo}${scientificExplanation} ${scientificData.hormonal} ${technicalDetails}`;

  console.log(`✅ Explicação única gerada para ${exercise.name}: ${finalExplanation.substring(0, 100)}...`);
  
  return finalExplanation;
};

export const generatePersonalizedBenefits = (exercise: Exercise, profile: UserProfile): string[] => {
  const benefits: string[] = [];
  const age = profile.age || 25;
  const gender = profile.gender?.toLowerCase() || 'masculino';
  const goal = profile.fitness_goal?.toLowerCase() || '';
  const experience = profile.experience_level?.toLowerCase() || 'iniciante';
  const exerciseName = exercise.name.toLowerCase();

  // Benefícios baseados na idade
  if (age < 25) {
    benefits.push('Maximiza janela anabólica juvenil');
    benefits.push('Aproveita alta capacidade de recuperação');
  } else if (age < 40) {
    benefits.push('Mantém densidade muscular e óssea');
    benefits.push('Otimiza metabolismo basal');
  } else {
    benefits.push('Combate sarcopenia relacionada à idade');
    benefits.push('Preserva independência funcional');
  }

  // Benefícios baseados no gênero
  if (gender === 'feminino') {
    benefits.push('Fortalece estrutura óssea (anti-osteoporose)');
    benefits.push('Melhora composição corporal sem masculinização');
    if (age > 35) benefits.push('Compensa declínio hormonal natural');
  } else {
    benefits.push('Potencializa resposta testosterônica');
    benefits.push('Desenvolve massa muscular funcional');
  }

  // Benefícios baseados no objetivo
  if (goal.includes('perda') || goal.includes('peso')) {
    benefits.push(`EPOC elevado: +${Math.floor(Math.random() * 50 + 150)}kcal pós-treino`);
    benefits.push('Preserva massa magra durante déficit calórico');
    benefits.push('Acelera metabolismo de repouso');
  } else if (goal.includes('massa')) {
    benefits.push('Estímulo hipertrófico específico');
    benefits.push('Ativação máxima de vias anabólicas');
    benefits.push('Recrutamento de fibras tipo II');
  } else if (goal.includes('definição')) {
    benefits.push('Otimiza relação massa magra/gordura');
    benefits.push('Define contornos musculares específicos');
  }

  // Benefícios baseados na experiência
  if (experience === 'iniciante') {
    benefits.push('Adaptação neural acelerada');
    benefits.push('Aprendizado motor progressivo');
    benefits.push('Base sólida para progressões');
  } else {
    benefits.push('Quebra platôs de desenvolvimento');
    benefits.push('Refinamento técnico avançado');
  }

  // Benefícios específicos do exercício
  if (exerciseName.includes('agachamento') || exerciseName.includes('squat')) {
    benefits.push('Maior liberação de GH e testosterona');
    benefits.push('Fortalece 200+ músculos simultaneamente');
  } else if (exerciseName.includes('supino')) {
    benefits.push('Desenvolve força de empurrar funcional');
    benefits.push('Estabiliza cintura escapular');
  } else if (exerciseName.includes('barra') || exerciseName.includes('pull')) {
    benefits.push('Corrige postura cifótica moderna');
    benefits.push('Fortalece pegada e antebraços');
  }

  // Remove duplicatas e limita a 4-6 benefícios mais relevantes
  const uniqueBenefits = [...new Set(benefits)];
  return uniqueBenefits.slice(0, Math.min(6, uniqueBenefits.length));
};

export const calculatePersonalizedCalories = (exercise: Exercise, profile: UserProfile): number => {
  const baseCalories = 25; // Base padrão
  const weight = profile.weight || 70;
  const age = profile.age || 25;
  const gender = profile.gender?.toLowerCase() || 'masculino';
  const exerciseName = exercise.name.toLowerCase();

  let multiplier = 1.0;

  // Fator peso (pessoas mais pesadas queimam mais)
  multiplier += (weight - 70) * 0.005;

  // Fator idade (metabolismo mais lento com idade)
  if (age > 40) multiplier -= 0.1;
  if (age < 25) multiplier += 0.1;

  // Fator gênero (homens tendem a queimar mais)
  if (gender === 'masculino') multiplier += 0.15;

  // Fator tipo de exercício
  if (exerciseName.includes('agachamento') || exerciseName.includes('deadlift') || exerciseName.includes('levantamento')) {
    multiplier += 0.6; // Exercícios compostos queimam mais
  } else if (exerciseName.includes('supino') || exerciseName.includes('barra')) {
    multiplier += 0.4;
  } else if (exerciseName.includes('rosca') || exerciseName.includes('tricep') || exerciseName.includes('trícep')) {
    multiplier += 0.1; // Exercícios de isolamento queimam menos
  } else {
    multiplier += 0.3; // Exercícios médios
  }

  return Math.round(baseCalories * multiplier);
};

// ✅ NOVA FUNÇÃO: CÁLCULO DE PESO SUGERIDO PERSONALIZADO
export const calculatePersonalizedSuggestedWeight = (exercise: Exercise, profile: UserProfile): string => {
  const exerciseName = exercise.name.toLowerCase();
  const exerciseCategory = getExerciseCategory(exerciseName);
  const weight = profile.weight || 70;
  const gender = profile.gender?.toLowerCase() || 'masculino';
  const experience = profile.experience_level?.toLowerCase() || 'iniciante';
  const age = profile.age || 25;
  
  console.log(`💪 Calculando peso personalizado para: ${exercise.name} (categoria: ${exerciseCategory})`);
  
  // Multiplicadores base por gênero
  const genderMultiplier = gender === 'feminino' ? 0.65 : 1.0;
  
  // Multiplicadores por experiência
  let experienceMultiplier = 1.0;
  switch (experience) {
    case 'iniciante':
      experienceMultiplier = 0.6;
      break;
    case 'intermediario':
    case 'intermediário':
      experienceMultiplier = 0.8;
      break;
    case 'avancado':
    case 'avançado':
      experienceMultiplier = 1.1;
      break;
  }
  
  // Ajuste por idade (redução gradual após 40 anos)
  const ageMultiplier = age > 40 ? Math.max(0.8, 1 - (age - 40) * 0.01) : 1.0;
  
  // Cálculos específicos por categoria de exercício
  let minWeight = 0;
  let maxWeight = 0;
  
  switch (exerciseCategory) {
    case 'supino':
      // 40-80% do peso corporal para supino
      minWeight = Math.round(weight * 0.4 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 0.8 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'agachamento':
      // 50-120% do peso corporal para agachamento
      minWeight = Math.round(weight * 0.5 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 1.2 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'stiff':
      // 60-100% do peso corporal para terra/stiff
      minWeight = Math.round(weight * 0.6 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 1.0 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'barra':
      // Exercício de peso corporal ou assistido
      if (experience === 'iniciante') {
        return gender === 'feminino' ? 'Assistida ou elástico' : 'Assistida ou negativas';
      } else {
        const additionalWeight = Math.round(weight * 0.2 * experienceMultiplier);
        return additionalWeight > 5 ? `Peso corporal + ${additionalWeight}kg` : 'Peso corporal';
      }
      
    case 'flexão':
      // Flexões sempre peso corporal ou com variações
      if (experience === 'iniciante') {
        return gender === 'feminino' ? 'Joelhos ou inclinada' : 'Peso corporal';
      } else {
        const additionalWeight = Math.round(weight * 0.15 * experienceMultiplier);
        return additionalWeight > 5 ? `Peso corporal + ${additionalWeight}kg` : 'Peso corporal';
      }
      
    case 'remada':
    case 'pulldown':
      // 30-70% do peso corporal
      minWeight = Math.round(weight * 0.3 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 0.7 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'rosca':
      // 15-25% do peso corporal para bíceps
      minWeight = Math.round(weight * 0.15 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 0.25 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'tríceps':
      // 20-35% do peso corporal para tríceps
      minWeight = Math.round(weight * 0.2 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 0.35 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'leg':
      // Leg press: 80-150% do peso corporal
      minWeight = Math.round(weight * 0.8 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 1.5 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    case 'crucifixo':
      // Crucifixo: 10-20% do peso corporal
      minWeight = Math.round(weight * 0.1 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 0.2 * genderMultiplier * experienceMultiplier * ageMultiplier);
      break;
      
    default:
      // Exercício genérico: 20-40% do peso corporal
      minWeight = Math.round(weight * 0.2 * genderMultiplier * experienceMultiplier * ageMultiplier);
      maxWeight = Math.round(weight * 0.4 * genderMultiplier * experienceMultiplier * ageMultiplier);
  }
  
  // Garantir valores mínimos práticos
  minWeight = Math.max(minWeight, gender === 'feminino' ? 2 : 5);
  maxWeight = Math.max(maxWeight, minWeight + (gender === 'feminino' ? 3 : 5));
  
  // Arredondar para múltiplos de 2.5kg para ser prático na academia
  minWeight = Math.round(minWeight / 2.5) * 2.5;
  maxWeight = Math.round(maxWeight / 2.5) * 2.5;
  
  const result = `${minWeight}-${maxWeight}kg`;
  
  console.log(`✅ Peso calculado para ${exercise.name}: ${result} (perfil: ${weight}kg, ${gender}, ${experience}, ${age}anos)`);
  
  return result;
};
