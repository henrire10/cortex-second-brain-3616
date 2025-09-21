import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  points_reward: number;
  earned_at?: string;
}

interface NotificationState {
  achievement: Achievement | null;
  visible: boolean;
}

export const useAchievementNotifications = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState<NotificationState>({
    achievement: null,
    visible: false
  });
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());

  const checkForNewAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get achievements earned since last check
      const { data: newAchievements, error } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements (
            id,
            name,
            description,
            icon_url,
            points_reward
          )
        `)
        .eq('user_id', user.id)
        .gte('earned_at', lastCheckTime.toISOString())
        .order('earned_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao verificar conquistas:', error);
        return;
      }

      // Show notification for the most recent achievement
      if (newAchievements && newAchievements.length > 0) {
        const latestAchievement = newAchievements[0];
        if (latestAchievement.achievements) {
          setNotification({
            achievement: {
              ...latestAchievement.achievements,
              earned_at: latestAchievement.earned_at
            } as Achievement,
            visible: true
          });
        }
      }

      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  }, [user?.id, lastCheckTime]);

  const dismissNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
    setTimeout(() => {
      setNotification({ achievement: null, visible: false });
    }, 300);
  }, []);

  const triggerAchievementCheck = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Trigger the comprehensive achievement check
      const { error } = await supabase.rpc('check_and_award_achievements', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Erro ao verificar conquistas:', error);
      } else {
        // Check for new achievements after a short delay
        setTimeout(() => {
          checkForNewAchievements();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao executar verificação de conquistas:', error);
    }
  }, [user?.id, checkForNewAchievements]);

  // Subscribe to real-time achievement updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Nova conquista detectada:', payload);
          // Check for new achievements when we detect a new user_achievement
          setTimeout(() => {
            checkForNewAchievements();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, checkForNewAchievements]);

  return {
    notification: notification.visible ? notification.achievement : null,
    dismissNotification,
    triggerAchievementCheck,
    checkForNewAchievements
  };
};