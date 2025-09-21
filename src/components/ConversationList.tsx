import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Plus } from 'lucide-react';

export const ConversationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPersonalTrainer } = usePersonalTrainer();
  const { conversations, loading, ensureConversationExists } = useConversations();

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const handleStartConversation = async () => {
    if (ensureConversationExists) {
      const conversation = await ensureConversationExists();
      if (conversation) {
        navigate(`/messages/${conversation.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma conversa ainda
        </h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
          {isPersonalTrainer 
            ? 'Aguarde seus alunos entrarem em contato ou inicie uma conversa'
            : 'Entre em contato com um personal trainer para tirar suas dúvidas'
          }
        </p>
        {!isPersonalTrainer && (
          <Button onClick={handleStartConversation}>
            Iniciar conversa
          </Button>
        )}
        {isPersonalTrainer && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Conversa
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {conversations.map((conversation) => {
        const otherUserName = isPersonalTrainer 
          ? conversation.user_name 
          : conversation.trainer_name;
        
        const otherUserInitials = otherUserName 
          ? otherUserName.split(' ').map(n => n[0]).join('').toUpperCase()
          : '?';

        const lastMessageTime = conversation.last_message_at 
          ? formatDistanceToNow(new Date(conversation.last_message_at), { 
              addSuffix: true,
              locale: ptBR 
            })
          : null;

        return (
          <div
            key={conversation.id}
            className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {otherUserInitials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-foreground truncate">
                    {otherUserName || 'Usuário'}
                  </h4>
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs px-2 py-0.5">
                      {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {conversation.last_message || 
                      (isPersonalTrainer ? 'Aluno' : 'Personal Trainer')
                    }
                  </p>
                  {lastMessageTime && (
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {lastMessageTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};