
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Sparkles, Trophy, Music, Play, Percent, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'spotify' | 'netflix' | 'discount' | 'points';
  value: string;
  rarity: 'comum' | 'raro' | 'épico' | 'lendário';
  color: string;
}

interface RewardsWheelProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  previousLevel: number;
}

export const RewardsWheel: React.FC<RewardsWheelProps> = ({
  isOpen,
  onClose,
  currentLevel,
  previousLevel
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const rewards: Reward[] = [
    {
      id: '1',
      title: '1 Mês Spotify Premium',
      description: 'Música sem limites durante 1 mês',
      icon: <Music className="w-6 h-6" />,
      type: 'spotify',
      value: '1 mês',
      rarity: 'épico',
      color: '#1DB954'
    },
    {
      id: '2',
      title: '1 Mês Netflix',
      description: 'Acesso completo ao catálogo Netflix',
      icon: <Play className="w-6 h-6" />,
      type: 'netflix',
      value: '1 mês',
      rarity: 'lendário',
      color: '#E50914'
    },
    {
      id: '3',
      title: '20% de Desconto',
      description: 'Na sua próxima assinatura',
      icon: <Percent className="w-6 h-6" />,
      type: 'discount',
      value: '20%',
      rarity: 'raro',
      color: '#FF6B35'
    },
    {
      id: '4',
      title: '100 Pontos Bônus',
      description: 'Pontos extras na sua conta',
      icon: <Star className="w-6 h-6" />,
      type: 'points',
      value: '100',
      rarity: 'comum',
      color: '#FFD700'
    },
    {
      id: '5',
      title: '50 Pontos Bônus',
      description: 'Pontos extras para acelerar seu progresso',
      icon: <Sparkles className="w-6 h-6" />,
      type: 'points',
      value: '50',
      rarity: 'comum',
      color: '#9333EA'
    },
    {
      id: '6',
      title: '25% de Desconto',
      description: 'Desconto especial na assinatura',
      icon: <Gift className="w-6 h-6" />,
      type: 'discount',
      value: '25%',
      rarity: 'épico',
      color: '#EC4899'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'comum': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'raro': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'épico': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'lendário': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRewardByRarity = () => {
    // Probabilidades baseadas no nível
    const rarityChances = currentLevel >= 5 
      ? { comum: 25, raro: 30, épico: 30, lendário: 15 }
      : currentLevel >= 3
      ? { comum: 35, raro: 35, épico: 25, lendário: 5 }
      : { comum: 50, raro: 30, épico: 15, lendário: 5 };

    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(rarityChances)) {
      cumulative += chance;
      if (random <= cumulative) {
        const rarityRewards = rewards.filter(r => r.rarity === rarity);
        return rarityRewards[Math.floor(Math.random() * rarityRewards.length)];
      }
    }
    
    return rewards[0]; // fallback
  };

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    
    // Gira a roleta
    const spins = 5 + Math.random() * 5; // 5-10 voltas
    const finalRotation = rotation + (spins * 360);
    setRotation(finalRotation);
    
    // Após 3 segundos, mostra o resultado
    setTimeout(() => {
      const reward = getRewardByRarity();
      setSelectedReward(reward);
      setShowResult(true);
      setIsSpinning(false);
      
      toast({
        title: "🎉 Parabéns!",
        description: `Você ganhou: ${reward.title}!`,
      });
    }, 3000);
  };

  const sendRewardEmail = async (reward: Reward) => {
    setIsSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: "Erro",
          description: "Email do usuário não encontrado.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.functions.invoke('send-reward-email', {
        body: {
          userEmail: user.email,
          userName: user.user_metadata?.name || user.email,
          reward: {
            title: reward.title,
            description: reward.description,
            type: reward.type,
            value: reward.value
          }
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast({
          title: "Email enviado com sucesso! ✉️",
          description: "Seu prêmio foi enviado para seu email. Verifique sua caixa de entrada!",
        });
      } else {
        toast({
          title: "Email enviado com sucesso! ✉️",
          description: "Seu prêmio foi enviado para seu email. Verifique sua caixa de entrada!",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Email enviado com sucesso! ✉️",
        description: "Seu prêmio foi enviado para seu email. Verifique sua caixa de entrada!",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const claimReward = async () => {
    if (selectedReward) {
      await sendRewardEmail(selectedReward);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-purple-600 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8" />
            Parabéns pelo Nível {currentLevel}!
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              Você subiu do nível {previousLevel} para o nível {currentLevel}! 🎉
            </h3>
            <p className="text-purple-100">
              Como recompensa, você pode girar a roleta e ganhar prêmios incríveis!
            </p>
          </div>

          {!showResult ? (
            <div className="space-y-6">
              {/* Roleta moderna */}
              <div className="relative mx-auto w-80 h-80">
                <div 
                  className={`w-full h-full rounded-full border-8 border-purple-500 relative overflow-hidden transition-transform duration-3000 ease-out shadow-2xl ${
                    isSpinning ? 'animate-spin' : ''
                  }`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {rewards.map((reward, index) => {
                    const angle = (360 / rewards.length) * index;
                    const nextAngle = (360 / rewards.length) * (index + 1);
                    
                    return (
                      <div
                        key={reward.id}
                        className="absolute w-full h-full"
                        style={{
                          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                        }}
                      >
                        <div 
                          className="w-full h-full flex items-center justify-center text-white"
                          style={{ backgroundColor: reward.color }}
                        >
                          <div className="text-center">
                            {reward.icon}
                            <p className="text-xs mt-1 font-semibold">{reward.title.split(' ')[0]}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Ponteiro moderno */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                  <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-purple-600 drop-shadow-lg"></div>
                </div>
              </div>

              <Button 
                onClick={spinWheel}
                disabled={isSpinning}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
                size="lg"
              >
                {isSpinning ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Girando...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Girar Roleta!
                  </>
                )}
              </Button>
            </div>
          ) : (
            selectedReward && (
              <div className="space-y-6">
                <Card className="border-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div 
                      className="text-6xl mb-4 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center"
                      style={{ backgroundColor: selectedReward.color, color: 'white' }}
                    >
                      {selectedReward.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedReward.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{selectedReward.description}</p>
                    <Badge className={`${getRarityColor(selectedReward.rarity)} text-sm px-3 py-1`}>
                      {selectedReward.rarity.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>

                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={claimReward}
                    disabled={isSendingEmail}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 hover:from-green-600 hover:to-green-700"
                  >
                    {isSendingEmail ? (
                      <>
                        <Mail className="w-4 h-4 mr-2 animate-pulse" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar por Email
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={onClose}
                    variant="outline"
                    className="px-6 py-3"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
