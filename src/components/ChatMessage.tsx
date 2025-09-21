import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageStatus } from '@/components/MessageStatus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  message_content: string;
  created_at: string;
  sender_name?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  isOptimistic?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const messageTime = format(new Date(message.created_at), 'HH:mm', { locale: ptBR });
  
  const senderInitials = message.sender_name 
    ? message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className={cn(
      "flex gap-3 max-w-[80%] animate-fade-in",
      isOwnMessage ? "ml-auto flex-row-reverse" : ""
    )}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-xs font-medium",
          isOwnMessage 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        )}>
          {senderInitials}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "rounded-2xl px-4 py-3 max-w-full relative transition-all duration-200",
        isOwnMessage 
          ? "bg-primary text-primary-foreground rounded-br-sm" 
          : "bg-muted text-foreground rounded-bl-sm",
        message.isOptimistic && "opacity-80"
      )}>
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.message_content}
        </p>
        
        <div className={cn(
          "flex items-center gap-2 mt-2 text-xs opacity-70",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          <span>{messageTime}</span>
          {isOwnMessage && (
            <MessageStatus status={message.status} />
          )}
        </div>
      </div>
    </div>
  );
};