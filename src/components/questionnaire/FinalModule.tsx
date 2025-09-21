
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Target, Calendar, Zap } from 'lucide-react';

interface FinalModuleProps {
  responses: Record<string, any>;
  onComplete: () => void;
}

export const FinalModule: React.FC<FinalModuleProps> = ({ responses }) => {
  const getSummary = () => {
    const objetivo = responses.meta_principal_usuario || 'Não especificado';
    const diasTreino = responses.dias_por_semana_treino || 'Não especificado';
    const experiencia = responses.nivel_experiencia_treino || 'Não especificado';
    
    return { objetivo, diasTreino, experiencia };
  };

  const { objetivo, diasTreino, experiencia } = getSummary();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">
          Parabéns! Você está quase pronto!
        </h2>
        <p className="text-gray-600">
          Agora vamos criar seu plano de treino personalizado baseado nas suas respostas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Resumo do seu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Objetivo</p>
                <p className="text-sm text-gray-600">{objetivo}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Frequência</p>
                <p className="text-sm text-gray-600">{diasTreino} dias/semana</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900">Experiência</p>
                <p className="text-sm text-gray-600">{experiencia}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">O que vem a seguir:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Análise completa do seu perfil e objetivos
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Criação do seu plano de treino personalizado
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Acesso ao seu dashboard de treinos
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Acompanhamento da sua evolução
          </li>
        </ul>
      </div>
    </div>
  );
};
