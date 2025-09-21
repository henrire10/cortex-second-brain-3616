// Calculadora de gordura corporal usando fórmulas científicas

export interface BodyFatMeasurements {
  gender: 'masculino' | 'feminino' | 'outro';
  height: number; // cm
  weight: number; // kg
  neck?: number; // cm
  waist?: number; // cm (cintura na altura do umbigo)
  hips?: number; // cm (apenas para mulheres)
  abdomen?: number; // cm (para homens)
}

/**
 * Calcula a porcentagem de gordura corporal usando a fórmula da Marinha Americana (US Navy)
 * Mais precisa que apenas BMI
 */
export const calculateBodyFat = (measurements: BodyFatMeasurements): number | null => {
  const { gender, height, neck, waist, hips, abdomen } = measurements;

  console.log('🧮 calculateBodyFat - Iniciando cálculo com dados:', measurements);
  console.log('🔍 DEBUG DETALHADO:');
  console.log('  - gender:', gender, '(tipo:', typeof gender, ')');
  console.log('  - height:', height, '(tipo:', typeof height, ')');
  console.log('  - neck:', neck, '(tipo:', typeof neck, ', é número?', typeof neck === 'number', ', valor > 0?', neck > 0, ')');
  console.log('  - waist:', waist, '(tipo:', typeof waist, ', é número?', typeof waist === 'number', ', valor > 0?', waist > 0, ')');
  console.log('  - hips:', hips, '(tipo:', typeof hips, ', é número?', typeof hips === 'number', ', valor > 0?', hips > 0, ')');
  console.log('  - abdomen:', abdomen, '(tipo:', typeof abdomen, ', é número?', typeof abdomen === 'number', ', valor > 0?', abdomen > 0, ')');

  // Converter altura para metros se necessário para cálculos
  const heightCm = height;

  if (gender === 'masculino') {
    console.log('👨 Fórmula masculina selecionada');
    
    // Fórmula para homens: precisa de altura, pescoço e abdômen/cintura
    if (!neck || neck <= 0 || (!abdomen && !waist)) {
      console.log('❌ Dados insuficientes para fórmula masculina:');
      console.log('  - neck válido?', !!(neck && neck > 0));
      console.log('  - abdomen válido?', !!(abdomen && abdomen > 0));
      console.log('  - waist válido?', !!(waist && waist > 0));
      return null;
    }

    const abdominalMeasure = (abdomen && abdomen > 0) ? abdomen : (waist || 0);
    console.log('📐 Medidas utilizadas para cálculo masculino:');
    console.log('  - abdominalMeasure:', abdominalMeasure);
    console.log('  - neck:', neck);
    console.log('  - heightCm:', heightCm);
    
    try {
      // Validar se as medidas são válidas para logaritmo
      if (abdominalMeasure <= neck) {
        console.log('❌ Erro: cintura deve ser maior que pescoço para cálculo válido');
        console.log('  - Cintura:', abdominalMeasure);
        console.log('  - Pescoço:', neck);
        return null;
      }

      // Fórmula US Navy para homens
      const bodyFat = 86.010 * Math.log10(abdominalMeasure - neck) - 70.041 * Math.log10(heightCm) + 36.76;
      console.log('📊 Resultado do cálculo masculino:', bodyFat);
      
      // Validar resultado (3-50% é um range realista)
      if (bodyFat < 3 || bodyFat > 50 || isNaN(bodyFat)) {
        console.log('⚠️ Resultado fora do range válido ou inválido:', bodyFat);
        return null;
      }
      
      const result = Math.round(bodyFat * 10) / 10;
      console.log('✅ Gordura corporal calculada (masculino):', result, '%');
      return result;
    } catch (error) {
      console.error('❌ Erro no cálculo de gordura corporal para homens:', error);
      return null;
    }
  } 
  
  if (gender === 'feminino') {
    console.log('👩 Fórmula feminina selecionada');
    
    // Fórmula para mulheres: precisa de altura, pescoço, cintura e quadril
    if (!neck || neck <= 0 || !waist || waist <= 0 || !hips || hips <= 0) {
      console.log('❌ Dados insuficientes para fórmula feminina:');
      console.log('  - neck válido?', !!(neck && neck > 0));
      console.log('  - waist válido?', !!(waist && waist > 0));
      console.log('  - hips válido?', !!(hips && hips > 0));
      return null;
    }

    console.log('📐 Medidas utilizadas para cálculo feminino:');
    console.log('  - waist:', waist);
    console.log('  - hips:', hips);
    console.log('  - neck:', neck);
    console.log('  - heightCm:', heightCm);

    try {
      // Validar se as medidas são válidas para logaritmo
      if ((waist + hips - neck) <= 0) {
        console.log('❌ Erro: soma cintura + quadril deve ser maior que pescoço');
        console.log('  - Cintura + Quadril:', waist + hips);
        console.log('  - Pescoço:', neck);
        return null;
      }

      // Fórmula US Navy para mulheres
      const bodyFat = 163.205 * Math.log10(waist + hips - neck) - 97.684 * Math.log10(heightCm) - 78.387;
      console.log('📊 Resultado do cálculo feminino:', bodyFat);
      
      // Validar resultado (8-50% é um range realista)
      if (bodyFat < 8 || bodyFat > 50 || isNaN(bodyFat)) {
        console.log('⚠️ Resultado fora do range válido ou inválido:', bodyFat);
        return null;
      }
      
      const result = Math.round(bodyFat * 10) / 10;
      console.log('✅ Gordura corporal calculada (feminino):', result, '%');
      return result;
    } catch (error) {
      console.error('❌ Erro no cálculo de gordura corporal para mulheres:', error);
      return null;
    }
  }

  // Para 'outro' gênero, usar a fórmula masculina como padrão
  if (gender === 'outro') {
    console.log('⚧ Fórmula padrão (masculina) para outro gênero');
    
    if (!neck || neck <= 0 || (!abdomen && !waist)) {
      console.log('❌ Dados insuficientes para fórmula padrão:');
      console.log('  - neck válido?', !!(neck && neck > 0));
      console.log('  - abdomen válido?', !!(abdomen && abdomen > 0));
      console.log('  - waist válido?', !!(waist && waist > 0));
      return null;
    }

    const abdominalMeasure = (abdomen && abdomen > 0) ? abdomen : (waist || 0);
    
    try {
      if (abdominalMeasure <= neck) {
        console.log('❌ Erro: cintura deve ser maior que pescoço');
        return null;
      }

      const bodyFat = 86.010 * Math.log10(abdominalMeasure - neck) - 70.041 * Math.log10(heightCm) + 36.76;
      console.log('📊 Resultado do cálculo (outro gênero):', bodyFat);
      
      if (bodyFat < 3 || bodyFat > 50 || isNaN(bodyFat)) {
        console.log('⚠️ Resultado fora do range válido:', bodyFat);
        return null;
      }
      
      const result = Math.round(bodyFat * 10) / 10;
      console.log('✅ Gordura corporal calculada (outro):', result, '%');
      return result;
    } catch (error) {
      console.error('❌ Erro no cálculo de gordura corporal:', error);
      return null;
    }
  }

  console.log('❌ Gênero não reconhecido:', gender);
  return null;
};

/**
 * Estima a massa muscular baseada no peso e gordura corporal
 */
export const calculateMuscleMass = (weight: number, bodyFatPercentage: number): number => {
  const fatMass = (weight * bodyFatPercentage) / 100;
  const leanMass = weight - fatMass;
  
  // Aproximadamente 40-50% da massa magra é músculo esquelético
  const muscleMass = leanMass * 0.45;
  
  return Math.round(muscleMass * 10) / 10;
};

/**
 * Classifica o nível de gordura corporal
 */
export const classifyBodyFat = (bodyFatPercentage: number, gender: string): {
  category: string;
  description: string;
  color: string;
} => {
  if (gender === 'masculino' || gender === 'outro') {
    if (bodyFatPercentage < 6) {
      return { 
        category: 'Muito Baixo', 
        description: 'Abaixo do saudável - pode afetar funções hormonais',
        color: 'text-red-600'
      };
    } else if (bodyFatPercentage < 14) {
      return { 
        category: 'Atlético', 
        description: 'Excelente definição muscular',
        color: 'text-green-600'
      };
    } else if (bodyFatPercentage < 18) {
      return { 
        category: 'Fitness', 
        description: 'Boa forma física e saúde',
        color: 'text-blue-600'
      };
    } else if (bodyFatPercentage < 25) {
      return { 
        category: 'Saudável', 
        description: 'Dentro da faixa normal',
        color: 'text-yellow-600'
      };
    } else {
      return { 
        category: 'Acima do Ideal', 
        description: 'Considere reduzir para melhor saúde',
        color: 'text-orange-600'
      };
    }
  } else {
    // Feminino
    if (bodyFatPercentage < 16) {
      return { 
        category: 'Muito Baixo', 
        description: 'Abaixo do saudável - pode afetar funções hormonais',
        color: 'text-red-600'
      };
    } else if (bodyFatPercentage < 21) {
      return { 
        category: 'Atlético', 
        description: 'Excelente definição muscular',
        color: 'text-green-600'
      };
    } else if (bodyFatPercentage < 25) {
      return { 
        category: 'Fitness', 
        description: 'Boa forma física e saúde',
        color: 'text-blue-600'
      };
    } else if (bodyFatPercentage < 32) {
      return { 
        category: 'Saudável', 
        description: 'Dentro da faixa normal',
        color: 'text-yellow-600'
      };
    } else {
      return { 
        category: 'Acima do Ideal', 
        description: 'Considere reduzir para melhor saúde',
        color: 'text-orange-600'
      };
    }
  }
};

/**
 * Valida se as medidas são suficientes para calcular gordura corporal
 */
export const canCalculateBodyFat = (measurements: BodyFatMeasurements): boolean => {
  const { gender, neck, waist, hips, abdomen } = measurements;

  console.log('🔍 canCalculateBodyFat - Verificando possibilidade de cálculo:', {
    gender,
    neck: !!neck && neck > 0,
    waist: !!waist && waist > 0,
    hips: !!hips && hips > 0,
    abdomen: !!abdomen && abdomen > 0
  });

  console.log('🔍 VALORES EXATOS:');
  console.log('  - neck:', neck, '(válido:', !!(neck && neck > 0), ')');
  console.log('  - waist:', waist, '(válido:', !!(waist && waist > 0), ')');
  console.log('  - hips:', hips, '(válido:', !!(hips && hips > 0), ')');
  console.log('  - abdomen:', abdomen, '(válido:', !!(abdomen && abdomen > 0), ')');

  if (gender === 'masculino' || gender === 'outro') {
    const neckValid = !!(neck && neck > 0);
    const abdominalValid = !!(abdomen && abdomen > 0) || !!(waist && waist > 0);
    const canCalculate = neckValid && abdominalValid;
    console.log('👨 Resultado para masculino/outro:');
    console.log('  - Pescoço válido:', neckValid);
    console.log('  - Medida abdominal válida:', abdominalValid);
    console.log('  - Pode calcular:', canCalculate);
    return canCalculate;
  } else if (gender === 'feminino') {
    const neckValid = !!(neck && neck > 0);
    const waistValid = !!(waist && waist > 0);
    const hipsValid = !!(hips && hips > 0);
    const canCalculate = neckValid && waistValid && hipsValid;
    console.log('👩 Resultado para feminino:');
    console.log('  - Pescoço válido:', neckValid);
    console.log('  - Cintura válida:', waistValid);
    console.log('  - Quadril válido:', hipsValid);
    console.log('  - Pode calcular:', canCalculate);
    return canCalculate;
  }

  console.log('❌ Gênero não reconhecido ou dados insuficientes');
  return false;
};

/**
 * Retorna as medidas obrigatórias para o cálculo baseado no gênero
 */
export const getRequiredMeasurements = (gender: string): string[] => {
  if (gender === 'masculino' || gender === 'outro') {
    return ['neck', 'waist_navel']; // ou abdomen
  } else if (gender === 'feminino') {
    return ['neck', 'waist_navel', 'hips'];
  }
  
  return ['neck', 'waist_navel'];
};
