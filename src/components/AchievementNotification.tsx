import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AchievementNotificationProps {
  achievement: {
    name: string;
    description: string;
    icon_url: string;
    points_reward: number;
  };
  onDismiss: () => void;
  autoHideDuration?: number;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  autoHideDuration = 8000
}) => {
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // Animate in
    const timer1 = setTimeout(() => setVisible(true), 100);
    
    // Auto hide
    const timer2 = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setAnimateOut(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className={`
      fixed top-20 left-1/2 transform -translate-x-1/2 z-50 
      transition-all duration-500 ease-out
      ${visible && !animateOut ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95'}
    `}>
      <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-100 to-orange-100 shadow-2xl max-w-sm mx-auto">
        <div className="relative p-6">
          {/* Background sparkles */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <Sparkles className="absolute top-2 left-2 w-4 h-4 text-yellow-500 animate-pulse" />
            <Sparkles className="absolute top-4 right-4 w-3 h-3 text-orange-500 animate-pulse delay-300" />
            <Sparkles className="absolute bottom-3 left-4 w-3 h-3 text-yellow-600 animate-pulse delay-700" />
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <Trophy className="w-8 h-8 text-yellow-600 animate-bounce" />
                <div className="absolute -inset-1 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-yellow-900">🎉 Conquista Desbloqueada!</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon_url}</span>
                <div>
                  <p className="font-semibold text-yellow-800">{achievement.name}</p>
                  <p className="text-sm text-yellow-700">{achievement.description}</p>
                </div>
              </div>
              
              <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600">
                +{achievement.points_reward} pontos ganhos!
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};