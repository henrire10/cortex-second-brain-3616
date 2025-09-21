import React from 'react';
import { Button } from '@/components/ui/button';
import { QuestionnaireData } from '@/pages/ProfileSetup';
import { useAuth } from '@/contexts/AuthContext';

interface WelcomeModuleProps {
  data: QuestionnaireData;
  onUpdateData: (data: Partial<QuestionnaireData>) => void;
  currentStep: number;
}

export const WelcomeModule: React.FC<WelcomeModuleProps> = ({
  data,
  onUpdateData,
  currentStep
}) => {
  const { profile } = useAuth();
  const userName = profile?.name || 'amigo';

  return (
    <div className="text-center space-y-8">
      <div className="relative">
        {/* Mascote/Animação */}
        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-6xl animate-bounce">👋</span>
        </div>
        
        {/* Texto Principal */}
        <h2 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">
          Olá, {userName}! 👋 Que incrível ter você por aqui!
        </h2>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Estamos prontos para criar uma jornada fitness e alimentar sob medida para seus sonhos. 
          Vamos começar?
        </p>
        
        {/* Elementos visuais energéticos */}
        <div className="flex justify-center space-x-4 mb-8">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        {/* Botão de ação */}
        <Button
          onClick={() => onUpdateData({ consentimento_inicial: true })}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl px-12 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          🚀 Vamos Nessa!
        </Button>
        
        {/* Texto motivacional adicional */}
        <p className="text-sm text-gray-500 mt-6">
          ✨ Sua transformação começa agora ✨
        </p>
      </div>
    </div>
  );
};
