// Adaptador para converter dados entre a tabela body_measurements e o componente AdvancedBodyMeasurements
import { calculateBodyFat, calculateMuscleMass, type BodyFatMeasurements } from './bodyFatCalculator';

export interface BodyMeasurementDB {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  neck?: number;
  chest?: number;
  waist_navel?: number;
  waist_narrowest?: number;
  abdomen?: number;
  hips?: number;
  right_arm_relaxed?: number;
  right_arm_flexed?: number;
  left_arm_relaxed?: number;
  left_arm_flexed?: number;
  right_forearm?: number;
  left_forearm?: number;
  right_thigh_proximal?: number;
  right_thigh_medial?: number;
  left_thigh_proximal?: number;
  left_thigh_medial?: number;
  right_calf?: number;
  left_calf?: number;
  notes?: string;
  measurement_unit?: string;
  created_at: string;
  updated_at: string;
}

export interface AdvancedMeasurement {
  id: string;
  date: string;
  weight: number;
  height: number;
  bodyFat: number;
  muscle: number;
  waist: number;
  chest: number;
  arms: number;
  thighs: number;
  neck?: number;
  hips?: number;
  forearms?: number;
  calves?: number;
  waistNarrowest?: number;
  abdomen?: number;
  notes?: string;
}

// Interface para dados do questionário
export interface QuestionnaireBodyData {
  peso_kg?: number;
  altura_cm?: number;
  genero?: string;
  medidas_peito?: number;
  medidas_barriga?: number;
  medidas_quadril?: number;
  medidas_pescoco?: number; // ✅ ADICIONADO: neck measurement
  medidas_biceps_direito?: number;
  medidas_biceps_esquerdo?: number;
  medidas_antebraco_direito?: number;
  medidas_antebraco_esquerdo?: number;
  medidas_coxa_direita?: number;
  medidas_coxa_esquerda?: number;
  medidas_panturrilha_direita?: number;
  medidas_panturrilha_esquerda?: number;
}

export const convertDBToAdvanced = (dbData: BodyMeasurementDB[], userGender?: string): AdvancedMeasurement[] => {
  return dbData.map(item => {
    // Tentar calcular gordura corporal automaticamente se não estiver salva
    let bodyFat = item.body_fat || 0;
    let muscle = item.muscle_mass || 0;

    if (!bodyFat && item.weight && item.height && item.neck && userGender) {
      const measurements: BodyFatMeasurements = {
        gender: userGender as 'masculino' | 'feminino' | 'outro',
        height: item.height,
        weight: item.weight,
        neck: item.neck,
        waist: item.waist_navel,
        hips: item.hips,
        abdomen: item.abdomen
      };

      const calculatedBodyFat = calculateBodyFat(measurements);
      if (calculatedBodyFat !== null) {
        bodyFat = calculatedBodyFat;
        muscle = calculateMuscleMass(item.weight, bodyFat);
      }
    }

    return {
      id: item.id,
      date: item.date,
      weight: item.weight || 0,
      height: item.height || 0,
      bodyFat,
      muscle,
      waist: item.waist_navel || 0,
      chest: item.chest || 0,
      arms: Math.max(item.right_arm_flexed || 0, item.left_arm_flexed || 0),
      thighs: Math.max(item.right_thigh_proximal || 0, item.left_thigh_proximal || 0),
      neck: item.neck,
      hips: item.hips,
      forearms: Math.max(item.right_forearm || 0, item.left_forearm || 0),
      calves: Math.max(item.right_calf || 0, item.left_calf || 0),
      waistNarrowest: item.waist_narrowest,
      abdomen: item.abdomen,
      notes: item.notes
    };
  });
};

export const convertAdvancedToDB = (measurement: Omit<AdvancedMeasurement, 'date' | 'id'>, userGender?: string) => {
  // Calcular gordura corporal automaticamente se possível
  let bodyFat = measurement.bodyFat;
  let muscle = measurement.muscle;

  if (measurement.weight && measurement.height && measurement.neck && userGender) {
    const measurements: BodyFatMeasurements = {
      gender: userGender as 'masculino' | 'feminino' | 'outro',
      height: measurement.height,
      weight: measurement.weight,
      neck: measurement.neck,
      waist: measurement.waist,
      hips: measurement.hips,
      abdomen: measurement.abdomen
    };

    const calculatedBodyFat = calculateBodyFat(measurements);
    if (calculatedBodyFat !== null) {
      bodyFat = calculatedBodyFat;
      muscle = calculateMuscleMass(measurement.weight, bodyFat);
    }
  }

  return {
    weight: measurement.weight || null,
    height: measurement.height || null,
    body_fat: bodyFat || null,
    muscle_mass: muscle || null,
    neck: measurement.neck || null,
    chest: measurement.chest || null,
    waist_navel: measurement.waist || null,
    waist_narrowest: measurement.waistNarrowest || null,
    abdomen: measurement.abdomen || null,
    hips: measurement.hips || null,
    right_arm_flexed: measurement.arms || null,
    left_arm_flexed: measurement.arms || null,
    right_forearm: measurement.forearms || null,
    left_forearm: measurement.forearms || null,
    right_thigh_proximal: measurement.thighs || null,
    left_thigh_proximal: measurement.thighs || null,
    right_calf: measurement.calves || null,
    left_calf: measurement.calves || null,
    notes: measurement.notes || null,
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * Converte dados do questionário para o formato de medidas corporais
 */
export const convertQuestionnaireToMeasurement = (
  questionnaireData: QuestionnaireBodyData,
  userGender?: string
): Omit<AdvancedMeasurement, 'date' | 'id'> => {
  const measurement = {
    weight: questionnaireData.peso_kg || 0,
    height: questionnaireData.altura_cm || 0,
    bodyFat: 0,
    muscle: 0,
    waist: questionnaireData.medidas_barriga || 0,
    chest: questionnaireData.medidas_peito || 0,
    arms: Math.max(
      questionnaireData.medidas_biceps_direito || 0,
      questionnaireData.medidas_biceps_esquerdo || 0
    ),
    thighs: Math.max(
      questionnaireData.medidas_coxa_direita || 0,
      questionnaireData.medidas_coxa_esquerda || 0
    ),
    neck: questionnaireData.medidas_pescoco, // ✅ ADICIONADO: include neck measurement
    hips: questionnaireData.medidas_quadril,
    forearms: Math.max(
      questionnaireData.medidas_antebraco_direito || 0,
      questionnaireData.medidas_antebraco_esquerdo || 0
    ),
    calves: Math.max(
      questionnaireData.medidas_panturrilha_direita || 0,
      questionnaireData.medidas_panturrilha_esquerda || 0
    )
  };

  // Calcular gordura corporal se houver dados suficientes
  if (measurement.weight && measurement.height && userGender) {
    const measurements: BodyFatMeasurements = {
      gender: (userGender || questionnaireData.genero) as 'masculino' | 'feminino' | 'outro',
      height: measurement.height,
      weight: measurement.weight,
      neck: measurement.neck, // ✅ ADICIONADO: include neck for body fat calculation
      waist: measurement.waist,
      hips: measurement.hips
    };

    const calculatedBodyFat = calculateBodyFat(measurements);
    if (calculatedBodyFat !== null) {
      measurement.bodyFat = calculatedBodyFat;
      measurement.muscle = calculateMuscleMass(measurement.weight, calculatedBodyFat);
    }
  }

  return measurement;
};