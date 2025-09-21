
import React, { useState } from 'react';
import { Ruler, Info } from 'lucide-react';
import { RealisticBodySilhouette } from './RealisticBodySilhouette';
import { MeasurementInputs } from './MeasurementInputs';

interface BodyMeasurements {
  chest: number;
  waist: number;
  hip: number;
  neck: number; // Adicionado campo do pescoço
  rightBicep: number;
  leftBicep: number;
  rightForearm: number;
  leftForearm: number;
  rightThigh: number;
  leftThigh: number;
  rightCalf: number;
  leftCalf: number;
}

interface BodyMeasurementsModuleProps {
  data: any;
  onUpdateData: (data: any) => void;
  currentStep: number;
}

// Mapping from illustration field keys to input field keys
const FIELD_MAPPING = {
  'medidas_peito': 'chest',
  'medidas_barriga': 'waist',
  'medidas_quadril': 'hip',
  'medidas_pescoco': 'neck', // Mapeamento do pescoço
  'medidas_biceps_direito': 'rightBicep',
  'medidas_biceps_esquerdo': 'leftBicep',
  'medidas_antebraco_direito': 'rightForearm',
  'medidas_antebraco_esquerdo': 'leftForearm',
  'medidas_coxa_direita': 'rightThigh',
  'medidas_coxa_esquerda': 'leftThigh',
  'medidas_panturrilha_direita': 'rightCalf',
  'medidas_panturrilha_esquerda': 'leftCalf'
};

export const BodyMeasurementsModule: React.FC<BodyMeasurementsModuleProps> = ({
  data,
  onUpdateData,
  currentStep
}) => {
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    chest: data.medidas_peito || 0,
    waist: data.medidas_barriga || 0,
    hip: data.medidas_quadril || 0,
    neck: data.medidas_pescoco || 0, // Inicializar campo do pescoço
    rightBicep: data.medidas_biceps_direito || 0,
    leftBicep: data.medidas_biceps_esquerdo || 0,
    rightForearm: data.medidas_antebraco_direito || 0,
    leftForearm: data.medidas_antebraco_esquerdo || 0,
    rightThigh: data.medidas_coxa_direita || 0,
    leftThigh: data.medidas_coxa_esquerda || 0,
    rightCalf: data.medidas_panturrilha_direita || 0,
    leftCalf: data.medidas_panturrilha_esquerda || 0
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleMeasurementChange = (field: keyof BodyMeasurements, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newMeasurements = { ...measurements, [field]: numValue };
    setMeasurements(newMeasurements);
    
    // Update parent data
    onUpdateData({
      medidas_peito: newMeasurements.chest,
      medidas_barriga: newMeasurements.waist,
      medidas_quadril: newMeasurements.hip,
      medidas_pescoco: newMeasurements.neck, // Atualizar campo do pescoço
      medidas_biceps_direito: newMeasurements.rightBicep,
      medidas_biceps_esquerdo: newMeasurements.leftBicep,
      medidas_antebraco_direito: newMeasurements.rightForearm,
      medidas_antebraco_esquerdo: newMeasurements.leftForearm,
      medidas_coxa_direita: newMeasurements.rightThigh,
      medidas_coxa_esquerda: newMeasurements.leftThigh,
      medidas_panturrilha_direita: newMeasurements.rightCalf,
      medidas_panturrilha_esquerda: newMeasurements.leftCalf
    });
  };

  const handleFieldFocus = (illustrationField: string) => {
    // Map illustration field to input field
    const inputField = FIELD_MAPPING[illustrationField as keyof typeof FIELD_MAPPING];
    if (inputField) {
      setFocusedField(inputField);
      // Clear focus after a delay for better UX
      setTimeout(() => setFocusedField(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
          <Ruler className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Mapa Antropométrico - Suas Medidas 📏
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Clique nos pontos da figura para focar no campo correspondente
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-semibold text-blue-800 mb-1">Como usar o mapa:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Clique nos pontos azuis na figura anatomica</li>
                <li>• O campo de medida correspondente será destacado</li>
                <li>• Use uma fita métrica flexível em centímetros</li>
                <li>• Todas as medidas são opcionais - pode pular se não tiver fita métrica</li>
                <li>• <strong>Pescoço é importante</strong> para cálculo de gordura corporal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mapa antropométrico realista */}
        <div className="flex justify-center items-start">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-200/50">
            <RealisticBodySilhouette
              focusedField={focusedField}
              onFieldFocus={handleFieldFocus}
            />
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 italic">
                Figura anatômica para localização das medidas
              </p>
            </div>
          </div>
        </div>

        {/* Campos de entrada das medidas */}
        <div className="space-y-6">
          <MeasurementInputs
            measurements={measurements}
            focusedField={focusedField}
            onMeasurementChange={handleMeasurementChange}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          💡 Essas medidas nos ajudam a personalizar ainda mais seu treino e acompanhar sua evolução
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">
            ✅ Não se preocupe se não tiver todas as medidas agora - você pode atualizá-las depois no seu perfil!
          </p>
        </div>
      </div>
    </div>
  );
};
