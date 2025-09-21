
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Clock, Crown } from 'lucide-react';

interface TrialBannerProps {
  user: any;
  onDismiss?: () => void;
  onUpgradeClick?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ user, onDismiss, onUpgradeClick }) => {
  // Se não há usuário, não mostra o banner
  if (!user) {
    return null;
  }

  // Calcular dias restantes do teste
  const trialStartDate = new Date(user.created_at || new Date());
  const trialEndDate = new Date(trialStartDate);
  trialEndDate.setDate(trialStartDate.getDate() + 7);
  
  const currentDate = new Date();
  const timeDiff = trialEndDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  const isTrialActive = daysRemaining > 0;

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Para mobile, navegar para a seção de assinatura no próprio dashboard
      const mobileMenuItems = document.querySelectorAll('[data-sidebar-menu-button]');
      const subscriptionButton = Array.from(mobileMenuItems).find(button => 
        button.textContent?.includes('Assinatura')
      ) as HTMLButtonElement;
      
      if (subscriptionButton) {
        subscriptionButton.click();
      }
    }
  };

  if (!isTrialActive) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 text-sm relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="font-medium">Teste expirado - Faça upgrade para continuar</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleUpgradeClick}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-7 text-xs"
            >
              Assinar
            </Button>
            {onDismiss && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onDismiss}
                className="text-white hover:bg-white/20 h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 text-sm relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-medium">
            {daysRemaining === 1 ? 'Último dia' : `${daysRemaining} dias`} do teste grátis
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleUpgradeClick}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-7 text-xs"
          >
            Upgrade
          </Button>
          {onDismiss && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDismiss}
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
