import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Scale, Info } from 'lucide-react';

interface BodyMeasurement {
  weight: number;
  height: number;
  body_fat?: number;
  muscle_mass?: number;
  chest?: number;
  waist_navel?: number;
  right_arm_flexed?: number;
  right_thigh_proximal?: number;
  date: string;
}

interface UserProfile {
  height: number;
  weight: number;
}

interface BodyMeasurementsDisplayProps {
  bodyMeasurement: BodyMeasurement | null;
  userProfile: UserProfile | null;
}

export const BodyMeasurementsDisplay: React.FC<BodyMeasurementsDisplayProps> = ({
  bodyMeasurement,
  userProfile
}) => {
  console.log('🔍 BODY MEASUREMENTS DEBUG DEFINITIVO:', {
    bodyMeasurement,
    userProfile,
    hasBodyMeasurement: !!bodyMeasurement,
    hasUserProfile: !!userProfile,
    userProfileHeight: userProfile?.height,
    userProfileWeight: userProfile?.weight,
    bodyMeasurementHeight: bodyMeasurement?.height,
    bodyMeasurementWeight: bodyMeasurement?.weight
  });

  const isValidNumber = (value: any): boolean => {
    return value !== null && value !== undefined && !isNaN(Number(value)) && Number(value) > 0;
  };

  const getDisplayMeasurements = () => {
    let height = 0;
    let weight = 0;
    let source = 'not_available';
    let date = null;

    // Primeiro: verificar body_measurements (dados mais recentes e específicos)
    if (bodyMeasurement && (
      isValidNumber(bodyMeasurement.height) || 
      isValidNumber(bodyMeasurement.weight)
    )) {
      height = isValidNumber(bodyMeasurement.height) ? Number(bodyMeasurement.height) : 0;
      weight = isValidNumber(bodyMeasurement.weight) ? Number(bodyMeasurement.weight) : 0;
      source = 'body_measurements';
      date = bodyMeasurement.date;
      
      console.log('✅ USANDO dados de body_measurements:', {
        height,
        weight,
        date
      });
    }
    // Segundo: verificar dados do perfil
    else if (userProfile && (
      isValidNumber(userProfile.height) || 
      isValidNumber(userProfile.weight)
    )) {
      height = isValidNumber(userProfile.height) ? Number(userProfile.height) : 0;
      weight = isValidNumber(userProfile.weight) ? Number(userProfile.weight) : 0;
      source = 'profile';
      
      console.log('✅ USANDO dados do perfil:', {
        height,
        weight,
        heightOriginal: userProfile.height,
        weightOriginal: userProfile.weight
      });
    }
    // Último recurso: dados não disponíveis
    else {
      height = 0;
      weight = 0;
      source = 'not_available';
      
      console.log('⚠️ NENHUM dado válido disponível:', {
        userProfile,
        bodyMeasurement
      });
    }

    return { height, weight, source, date };
  };

  const displayData = getDisplayMeasurements();

  return (
    <div className="p-4 bg-orange-50 rounded-lg">
      <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4" />
        Medidas Corporais
        {displayData.source === 'body_measurements' && displayData.date && (
          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 text-xs">
            Atualizado em {new Date(displayData.date).toLocaleDateString('pt-BR')}
          </Badge>
        )}
        {displayData.source === 'profile' && (
          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-xs">
            Dados do perfil
          </Badge>
        )}
        {displayData.source === 'not_available' && (
          <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 text-xs">
            Dados não disponíveis
          </Badge>
        )}
      </h4>
      
      {displayData.source === 'not_available' ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-5 h-5 text-red-600" />
            <h5 className="font-medium text-red-800">Medidas corporais não disponíveis</h5>
          </div>
          <p className="text-sm text-red-700 mb-3">
            O usuário ainda não registrou suas medidas corporais no sistema. 
            Algumas informações básicas podem estar disponíveis no perfil, mas dados detalhados 
            como % de gordura e massa muscular não estão disponíveis.
          </p>
          <p className="text-xs text-red-600">
            <strong>Sugestão:</strong> Solicite ao usuário que registre suas medidas na seção "Medidas Corporais" do app.
          </p>
        </div>
      ) : (
        <>
          {/* Medidas básicas sempre visíveis */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs text-orange-600">Altura</Label>
              <p className="text-sm font-medium">
                {displayData.height > 0 ? `${displayData.height} cm` : (
                  <span className="text-red-600">Não informado</span>
                )}
              </p>
            </div>
            <div>
              <Label className="text-xs text-orange-600">Peso</Label>
              <p className="text-sm font-medium">
                {displayData.weight > 0 ? `${displayData.weight} kg` : (
                  <span className="text-red-600">Não informado</span>
                )}
              </p>
            </div>
          </div>

          {/* Medidas detalhadas quando disponíveis */}
          {bodyMeasurement && displayData.source === 'body_measurements' && (
            <>
              <div className="border-t border-orange-200 pt-4">
                <h5 className="text-sm font-semibold text-orange-800 mb-3">Composição Corporal</h5>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {bodyMeasurement.body_fat && bodyMeasurement.body_fat > 0 && (
                    <div>
                      <Label className="text-xs text-orange-600">% Gordura</Label>
                      <p className="text-sm font-medium">{bodyMeasurement.body_fat}%</p>
                    </div>
                  )}
                  {bodyMeasurement.muscle_mass && bodyMeasurement.muscle_mass > 0 && (
                    <div>
                      <Label className="text-xs text-orange-600">Massa Muscular</Label>
                      <p className="text-sm font-medium">{bodyMeasurement.muscle_mass} kg</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-orange-200 pt-4">
                <h5 className="text-sm font-semibold text-orange-800 mb-3">Circunferências</h5>
                <div className="grid grid-cols-2 gap-4">
                  {bodyMeasurement.chest && bodyMeasurement.chest > 0 && (
                    <div>
                      <Label className="text-xs text-orange-600">Peito</Label>
                      <p className="text-sm font-medium">{bodyMeasurement.chest} cm</p>
                    </div>
                  )}
                  {bodyMeasurement.waist_navel && bodyMeasurement.waist_navel > 0 && (
                    <div>
                      <Label className="text-xs text-orange-600">Cintura</Label>
                      <p className="text-sm font-medium">{bodyMeasurement.waist_navel} cm</p>
                    </div>
                  )}
                  {bodyMeasurement.right_arm_flexed && bodyMeasurement.right_arm_flexed > 0 && (
                    <div>
                      <Label className="text-xs text-orange-600">Braço Direito</Label>
                      <p className="text-sm font-medium">{bodyMeasurement.right_arm_flexed} cm</p>
                    </div>
                  )}
                  {bodyMeasurement.right_thigh_proximal && bodyMeasurement.right_thigh_proximal > 0 && (
                    <div>
                      <Label className="text-xs text-orange-600">Coxa Direita</Label>
                      <p className="text-sm font-medium">{bodyMeasurement.right_thigh_proximal} cm</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Fonte dos dados com informação mais clara */}
          <div className="mt-4 p-2 bg-orange-100 rounded text-xs text-orange-700">
            <strong>Fonte dos dados:</strong> {
              displayData.source === 'body_measurements' 
                ? 'Medidas registradas pelo usuário no sistema de medidas corporais' 
                : displayData.source === 'profile'
                ? 'Dados básicos informados durante o cadastro do perfil'
                : 'Dados não disponíveis'
            }
            {displayData.date && (
              <span className="block mt-1">
                <strong>Última atualização:</strong> {new Date(displayData.date).toLocaleDateString('pt-BR')}
              </span>
            )}
            {displayData.source === 'profile' && (
              <span className="block mt-1 text-orange-600">
                <strong>Nota:</strong> Para dados mais detalhados, solicite ao usuário que registre suas medidas corporais no app.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
