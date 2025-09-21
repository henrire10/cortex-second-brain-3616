export interface BodyCompositionData {
  weight?: number;
  height?: number;
  waist?: number;
  hips?: number;
  bodyFat?: number;
  gender?: string;
}

export interface BMIClassification {
  category: string;
  description: string;
  color: string;
  bgColor: string;
}

export interface WHtRClassification {
  category: string;
  description: string;
  color: string;
  bgColor: string;
}

// Calculate BMI (Body Mass Index)
export const calculateBMI = (weight: number, height: number): number => {
  // height in cm, convert to meters
  const heightInM = height / 100;
  return weight / (heightInM * heightInM);
};

// Calculate WHtR (Waist to Height Ratio)
export const calculateWHtR = (waist: number, height: number): number => {
  return waist / height;
};

// Calculate WHR (Waist to Hip Ratio)
export const calculateWHR = (waist: number, hips: number): number => {
  return waist / hips;
};

// Calculate fat mass in kg
export const calculateFatMass = (weight: number, bodyFatPercentage: number): number => {
  return (weight * bodyFatPercentage) / 100;
};

// Calculate lean mass in kg
export const calculateLeanMass = (weight: number, bodyFatPercentage: number): number => {
  return weight - calculateFatMass(weight, bodyFatPercentage);
};

// Classify BMI
export const classifyBMI = (bmi: number): BMIClassification => {
  if (bmi < 18.5) {
    return {
      category: 'Baixo Peso',
      description: 'Abaixo do peso ideal',
      color: 'hsl(var(--warning))',
      bgColor: 'hsl(var(--warning) / 0.1)'
    };
  } else if (bmi < 25) {
    return {
      category: 'Normal',
      description: 'Peso saudável',
      color: 'hsl(var(--success))',
      bgColor: 'hsl(var(--success) / 0.1)'
    };
  } else if (bmi < 30) {
    return {
      category: 'Sobrepeso',
      description: 'Acima do peso ideal',
      color: 'hsl(var(--warning))',
      bgColor: 'hsl(var(--warning) / 0.1)'
    };
  } else {
    return {
      category: 'Obesidade',
      description: 'Consulte um profissional',
      color: 'hsl(var(--destructive))',
      bgColor: 'hsl(var(--destructive) / 0.1)'
    };
  }
};

// Classify WHtR by gender
export const classifyWHtR = (whtr: number, gender?: string): WHtRClassification => {
  const isFemale = gender?.toLowerCase() === 'feminino';
  
  if (whtr < 0.4) {
    return {
      category: 'Muito Baixo',
      description: 'Extremamente magro',
      color: 'hsl(var(--warning))',
      bgColor: 'hsl(var(--warning) / 0.1)'
    };
  } else if (whtr < (isFemale ? 0.42 : 0.43)) {
    return {
      category: 'Magro',
      description: 'Baixo risco metabólico',
      color: 'hsl(var(--success))',
      bgColor: 'hsl(var(--success) / 0.1)'
    };
  } else if (whtr < (isFemale ? 0.48 : 0.52)) {
    return {
      category: 'Saudável',
      description: 'Risco metabólico normal',
      color: 'hsl(var(--success))',
      bgColor: 'hsl(var(--success) / 0.1)'
    };
  } else if (whtr < (isFemale ? 0.54 : 0.57)) {
    return {
      category: 'Sobrepeso',
      description: 'Risco metabólico aumentado',
      color: 'hsl(var(--warning))',
      bgColor: 'hsl(var(--warning) / 0.1)'
    };
  } else {
    return {
      category: 'Obesidade',
      description: 'Alto risco metabólico',
      color: 'hsl(var(--destructive))',
      bgColor: 'hsl(var(--destructive) / 0.1)'
    };
  }
};

// Classify Body Fat Percentage by gender
export const classifyBodyFat = (bodyFat: number, gender?: string): WHtRClassification => {
  const isFemale = gender?.toLowerCase() === 'feminino';
  
  if (isFemale) {
    if (bodyFat < 16) {
      return {
        category: 'Muito Baixo',
        description: 'Abaixo do saudável',
        color: 'hsl(var(--warning))',
        bgColor: 'hsl(var(--warning) / 0.1)'
      };
    } else if (bodyFat < 21) {
      return {
        category: 'Atlético',
        description: 'Excelente definição',
        color: 'hsl(var(--success))',
        bgColor: 'hsl(var(--success) / 0.1)'
      };
    } else if (bodyFat < 25) {
      return {
        category: 'Fitness',
        description: 'Boa forma física',
        color: 'hsl(var(--success))',
        bgColor: 'hsl(var(--success) / 0.1)'
      };
    } else if (bodyFat < 32) {
      return {
        category: 'Saudável',
        description: 'Dentro da faixa normal',
        color: 'hsl(var(--warning))',
        bgColor: 'hsl(var(--warning) / 0.1)'
      };
    } else {
      return {
        category: 'Alto',
        description: 'Considere reduzir',
        color: 'hsl(var(--destructive))',
        bgColor: 'hsl(var(--destructive) / 0.1)'
      };
    }
  } else {
    if (bodyFat < 6) {
      return {
        category: 'Muito Baixo',
        description: 'Abaixo do saudável',
        color: 'hsl(var(--warning))',
        bgColor: 'hsl(var(--warning) / 0.1)'
      };
    } else if (bodyFat < 14) {
      return {
        category: 'Atlético',
        description: 'Excelente definição',
        color: 'hsl(var(--success))',
        bgColor: 'hsl(var(--success) / 0.1)'
      };
    } else if (bodyFat < 18) {
      return {
        category: 'Fitness',
        description: 'Boa forma física',
        color: 'hsl(var(--success))',
        bgColor: 'hsl(var(--success) / 0.1)'
      };
    } else if (bodyFat < 25) {
      return {
        category: 'Saudável',
        description: 'Dentro da faixa normal',
        color: 'hsl(var(--warning))',
        bgColor: 'hsl(var(--warning) / 0.1)'
      };
    } else {
      return {
        category: 'Alto',
        description: 'Considere reduzir',
        color: 'hsl(var(--destructive))',
        bgColor: 'hsl(var(--destructive) / 0.1)'
      };
    }
  }
};

// Generate automatic insights
export const generateInsights = (measurements: any[], gender?: string): string[] => {
  if (measurements.length < 2) return [];
  
  const insights: string[] = [];
  const latest = measurements[0];
  const previous = measurements[1];
  
  // Weight change insight
  if (latest.weight && previous.weight) {
    const weightChange = latest.weight - previous.weight;
    const weightChangePerc = (weightChange / previous.weight) * 100;
    
    if (Math.abs(weightChange) >= 0.5) {
      const direction = weightChange > 0 ? 'aumentou' : 'diminuiu';
      const emoji = weightChange > 0 ? '📈' : '📉';
      insights.push(`${emoji} Peso ${direction} ${Math.abs(weightChange).toFixed(1)} kg (${Math.abs(weightChangePerc).toFixed(1)}%)`);
    }
  }
  
  // Waist change insight (last 30 days)
  const recentMeasurements = measurements.filter(m => {
    const date = new Date(m.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });
  
  if (recentMeasurements.length >= 2) {
    const oldestRecent = recentMeasurements[recentMeasurements.length - 1];
    if (latest.waist_navel && oldestRecent.waist_navel) {
      const waistChange = latest.waist_navel - oldestRecent.waist_navel;
      if (Math.abs(waistChange) >= 1) {
        const direction = waistChange > 0 ? 'aumentou' : 'reduziu';
        const emoji = waistChange > 0 ? '⚠️' : '🎯';
        insights.push(`${emoji} Cintura ${direction} ${Math.abs(waistChange).toFixed(1)} cm nos últimos 30 dias`);
      }
    }
  }
  
  // Body fat insight
  if (latest.body_fat && previous.body_fat) {
    const bodyFatChange = latest.body_fat - previous.body_fat;
    if (Math.abs(bodyFatChange) >= 0.5) {
      const direction = bodyFatChange > 0 ? 'aumentou' : 'diminuiu';
      const emoji = bodyFatChange > 0 ? '📊' : '💪';
      insights.push(`${emoji} Gordura corporal ${direction} ${Math.abs(bodyFatChange).toFixed(1)}%`);
    }
  }
  
  // Consistency insight
  if (measurements.length >= 3) {
    const last30Days = measurements.filter(m => {
      const date = new Date(m.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    });
    
    if (last30Days.length >= 3) {
      insights.push('🏆 Excelente consistência nas medições!');
    }
  }
  
  return insights;
};