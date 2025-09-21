import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Conteúdo Premium",
  description = "Esta funcionalidade está disponível apenas para assinantes premium.",
  feature = "esta funcionalidade"
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/?pricing=true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Com o plano Premium você terá:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Treinos completos ilimitados</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Análise nutricional por IA</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-500" />
                <span>Evolução detalhada de progresso</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Continuar Grátis
            </Button>
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Assinar Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};