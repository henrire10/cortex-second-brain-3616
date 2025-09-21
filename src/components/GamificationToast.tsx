import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  points_reward: number;
}

interface GamificationNotification {
  id: string;
  type: 'points' | 'achievement';
  points?: number;
  achievement?: Achievement;
  timestamp: Date;
}

export const GamificationToast: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    if (!user?.id) return;

    // Verificar novas conquistas a cada 30 segundos
    const interval = setInterval(checkForNewAchievements, 30000);
    
    // Verificação inicial
    checkForNewAchievements();

    return () => clearInterval(interval);
  }, [user?.id]);

  const checkForNewAchievements = async () => {
    if (!user?.id) return;

    try {
      // Verificar conquistas ganhas recentemente
      const { data: recentAchievements, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_at,
          achievement_id,
          achievements (
            id,
            name,
            description,
            icon_url,
            points_reward
          )
        `)
        .eq('user_id', user.id)
        .gt('earned_at', lastChecked.toISOString())
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Erro ao verificar conquistas:', error);
        return;
      }

      const now = new Date();
      if (recentAchievements && recentAchievements.length > 0) {
        const mapped: GamificationNotification[] = recentAchievements.map(ua => {
          const ach = ua.achievements as Achievement;
          return {
            id: `achievement_${ach.id}`,
            type: 'achievement',
            achievement: ach,
            timestamp: new Date(ua.earned_at)
          };
        });

        setNotifications(prev => {
          // Deduplicate by achievement id
          const existingAchievementIds = new Set(
            prev
              .filter(n => n.type === 'achievement' && n.achievement)
              .map(n => (n.achievement as Achievement).id)
          );

          const seen = new Set<string>();
          const uniqueNew = mapped.filter(n => {
            if (n.type === 'achievement' && n.achievement) {
              const achId = n.achievement.id;
              if (existingAchievementIds.has(achId)) return false;
              if (seen.has(achId)) return false;
              seen.add(achId);
            }
            return true;
          });

          return uniqueNew.length > 0 ? [...uniqueNew, ...prev] : prev;
        });
      }
      setLastChecked(now);
    } catch (error) {
      console.error('Erro ao verificar gamificação:', error);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm md:max-w-sm max-w-[90vw] px-2 md:px-0">
      {notifications.slice(0, 3).map((notification) => (
        <Card key={notification.id} className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg animate-in slide-in-from-right">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {notification.type === 'achievement' && notification.achievement && (
                  <>
                    <div className="text-2xl animate-bounce">
                      {notification.achievement.icon_url}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <span className="font-bold text-sm text-yellow-800">Nova Conquista!</span>
                      </div>
                      <h4 className="font-semibold text-foreground">{notification.achievement.name}</h4>
                      <p className="text-sm text-muted-foreground">{notification.achievement.description}</p>
                      <div className="mt-2">
                        <Badge className="bg-yellow-500 text-yellow-950">
                          <Star className="w-3 h-3 mr-1" />
                          +{notification.achievement.points_reward} pontos
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
                
                {notification.type === 'points' && (
                  <>
                    <div className="text-2xl animate-bounce">🎉</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-sm text-blue-800">Pontos Ganhos!</span>
                      </div>
                      <h4 className="font-semibold text-foreground">+{notification.points} pontos</h4>
                      <p className="text-sm text-muted-foreground">Continue assim!</p>
                    </div>
                  </>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => dismissNotification(notification.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {notifications.length > 3 && (
        <Card className="border border-muted bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-sm text-muted-foreground">
              +{notifications.length - 3} mais notificações
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={dismissAll}
            >
              <Gift className="w-4 h-4 mr-2" />
              Ver todas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};