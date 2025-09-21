import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SimpleWorkoutCardProps {
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
}

export const SimpleWorkoutCard: React.FC<SimpleWorkoutCardProps> = ({
  isGenerating,
  progress,
  onGenerate
}) => {
  if (isGenerating) {
    return (
      <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Gerando seu treino personalizado...
          </h3>
          <p className="text-gray-600 mb-4">
            Nossa IA está criando o treino perfeito para você
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}% concluído</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
      <CardContent className="p-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Pronto para começar?
        </h3>
        <p className="text-gray-600 mb-4">
          Gere seu treino personalizado baseado no seu perfil
        </p>
        <Button
          onClick={onGenerate}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2"
        >
          Gerar Treino Personalizado
        </Button>
      </CardContent>
    </Card>
  );
};