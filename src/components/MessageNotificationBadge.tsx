import React from 'react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export const MessageNotificationBadge: React.FC = () => {
  const { unreadCount } = useUnreadMessages();

  if (unreadCount === 0) return null;

  return (
    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] font-medium border-2 border-background">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};