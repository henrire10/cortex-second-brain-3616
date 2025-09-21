
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Sparkles, Crown } from 'lucide-react';

interface TrialCounterProps {
  user: any;
  onUpgradeClick?: () => void;
}

export const TrialCounter: React.FC<TrialCounterProps> = ({ user, onUpgradeClick }) => {
  // Simular que o usuário está em teste grátis
  const trialStartDate = new Date(user?.created_at || new Date());
  const trialEndDate = new Date(trialStartDate);
  trialEndDate.setDate(trialStartDate.getDate() + 7);
  
  const currentDate = new Date();
  const timeDiff = trialEndDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  const isTrialActive = daysRemaining > 0;
  const isLastDay = daysRemaining === 1;

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Navigate to home page with plans section
      window.location.href = '/#planos';
    }
  };

  if (!isTrialActive) {
    return (
      <div className="relative overflow-hidden">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 mb-6">
          <CardContent className="p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Teste Grátis Expirado</h3>
                    <p className="text-orange-100">Desbloqueie todo o potencial da Bia Fitness</p>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 font-semibold px-4 py-2 text-sm">
                  <Crown className="w-4 h-4 mr-1" />
                  Premium
                </Badge>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white/90 text-sm mb-3">
                  ✨ Faça upgrade e tenha acesso a treinos ilimitados, análises avançadas e muito mais!
                </p>
                <Button 
                  className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold py-3"
                  onClick={handleUpgradeClick}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Assinar Agora
                </Button>
              </div>
            </div>
            
            {/* Efeito visual de fundo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <Card className={`border-0 shadow-xl mb-6 ${
        isLastDay 
          ? 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-600' 
          : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-600'
      }`}>
        <CardContent className="p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Teste Grátis Ativo</h3>
                  <p className="text-blue-100">
                    {daysRemaining === 1 
                      ? 'Último dia do seu teste gratuito' 
                      : `Aproveite seus ${daysRemaining} dias restantes`
                    }
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/30">
                  <div className="text-3xl font-bold text-white">{daysRemaining}</div>
                  <p className="text-xs text-white/80">{daysRemaining === 1 ? 'dia' : 'dias'}</p>
                </div>
              </div>
            </div>

            {isLastDay && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-900 font-bold text-sm">!</span>
                  </div>
                  <p className="text-white font-medium">
                    Seu teste expira hoje! Não perca o acesso.
                  </p>
                </div>
                <Button 
                  className="w-full bg-white text-purple-600 hover:bg-purple-50 font-semibold py-3"
                  onClick={handleUpgradeClick}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer Upgrade Agora
                </Button>
              </div>
            )}
          </div>
          
          {/* Efeitos visuais de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </CardContent>
      </Card>
    </div>
  );
};
