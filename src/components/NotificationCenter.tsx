import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { toast } from '@/hooks/use-toast';
import { Bell, MessageCircle, CheckCircle, User } from 'lucide-react';

interface NotificationCenterProps {
  onNotificationReceived?: (count: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  onNotificationReceived 
}) => {
  const { user } = useAuth();
  const { isPersonalTrainer } = usePersonalTrainer();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Initial load
    fetchUnreadCount();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          handleNewMessage(payload.new);
        }
      );

    if (isPersonalTrainer) {
      // Listen for new workout submissions
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_workouts',
          filter: `approval_status=eq.pending_approval`
        },
        (payload) => {
          handleNewWorkoutSubmission(payload.new);
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isPersonalTrainer]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('id', { count: 'exact' })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      const count = data?.length || 0;
      setUnreadCount(count);
      onNotificationReceived?.(count);
    } catch (error) {
      console.error('Error in fetchUnreadCount:', error);
    }
  };

  const handleNewMessage = async (message: any) => {
    // Get sender name
    const { data: senderData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', message.sender_id)
      .single();

    const senderName = senderData?.name || 'Usuário';

    // Update unread count
    setUnreadCount(prev => prev + 1);
    onNotificationReceived?.(unreadCount + 1);

    // Show toast notification
    toast({
      title: "Nova mensagem",
      description: `${senderName} enviou uma mensagem`,
      duration: 5000,
    });

    // Play notification sound (optional)
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  const handleNewWorkoutSubmission = async (workout: any) => {
    if (!isPersonalTrainer) return;

    // Get user name
    const { data: userData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', workout.user_id)
      .single();

    const userName = userData?.name || 'Aluno';

    // Show toast notification
    toast({
      title: "Novo treino para aprovação",
      description: `${userName} enviou um treino para sua análise`,
      duration: 5000,
    });
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      setUnreadCount(0);
      onNotificationReceived?.(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return null; // This is a service component, no UI
};