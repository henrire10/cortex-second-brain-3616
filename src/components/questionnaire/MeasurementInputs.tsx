
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface MeasurementInputsProps {
  measurements: BodyMeasurements;
  focusedField: string | null;
  onMeasurementChange: (field: keyof BodyMeasurements, value: string) => void;
}

export const MeasurementInputs: React.FC<MeasurementInputsProps> = ({
  measurements,
  focusedField,
  onMeasurementChange
}) => {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Focus input and scroll into view when hotspot is clicked
  useEffect(() => {
    if (focusedField && inputRefs.current[focusedField]) {
      const input = inputRefs.current[focusedField];
      if (input) {
        // Focus the input
        input.focus();
        // Scroll into view smoothly
        input.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [focusedField]);

  const renderInput = (
    id: keyof BodyMeasurements,
    label: string,
    placeholder: string,
    value: number
  ) => (
    <div className="relative">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
      <Input
        ref={(el) => (inputRefs.current[id] = el)}
        id={id}
        type="number"
        step="0.1"
        min="0"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onMeasurementChange(id, e.target.value)}
        className={`mt-1 transition-all duration-200 ${
          focusedField === id 
            ? 'border-purple-400 ring-2 ring-purple-400 ring-opacity-50 shadow-lg' 
            : 'border-purple-200 focus:border-purple-400 focus:ring-purple-400'
        }`}
      />
      {value > 0 && (
        <div className="absolute right-3 top-8 text-green-500 animate-fade-in">
          ✓
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tronco */}
      <Card className="overflow-hidden border-purple-100 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Tronco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4">
            {renderInput('neck', 'Pescoço (cm)', 'Ex: 35.0', measurements.neck)}
            {renderInput('chest', 'Peito (cm)', 'Ex: 95.5', measurements.chest)}
            {renderInput('waist', 'Barriga - Umbigo (cm)', 'Ex: 80.0', measurements.waist)}
            {renderInput('hip', 'Quadril (cm)', 'Ex: 90.0', measurements.hip)}
          </div>
        </CardContent>
      </Card>

      {/* Braços */}
      <Card className="overflow-hidden border-purple-100 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Braços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            {renderInput('rightBicep', 'Bíceps Direito (cm)', 'Ex: 30.0', measurements.rightBicep)}
            {renderInput('leftBicep', 'Bíceps Esquerdo (cm)', 'Ex: 30.0', measurements.leftBicep)}
            {renderInput('rightForearm', 'Antebraço Direito (cm)', 'Ex: 25.0', measurements.rightForearm)}
            {renderInput('leftForearm', 'Antebraço Esquerdo (cm)', 'Ex: 25.0', measurements.leftForearm)}
          </div>
        </CardContent>
      </Card>

      {/* Pernas */}
      <Card className="overflow-hidden border-purple-100 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Pernas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            {renderInput('rightThigh', 'Coxa Direita (cm)', 'Ex: 55.0', measurements.rightThigh)}
            {renderInput('leftThigh', 'Coxa Esquerda (cm)', 'Ex: 55.0', measurements.leftThigh)}
            {renderInput('rightCalf', 'Panturrilha Direita (cm)', 'Ex: 35.0', measurements.rightCalf)}
            {renderInput('leftCalf', 'Panturrilha Esquerda (cm)', 'Ex: 35.0', measurements.leftCalf)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
