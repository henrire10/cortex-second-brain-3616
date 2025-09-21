import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageCircle, 
  Search, 
  Users, 
  Clock,
  Plus,
  ChevronRight,
  Bell,
  BellOff
} from 'lucide-react';

export const ModernConversationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPersonalTrainer } = usePersonalTrainer();
  const { conversations, loading, ensureConversationExists } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const handleStartConversation = async () => {
    console.log('🚀 Iniciando conversa...');
    try {
      if (ensureConversationExists) {
        console.log('📞 Chamando ensureConversationExists...');
        const conversation = await ensureConversationExists();
        console.log('💬 Conversa retornada:', conversation);
        if (conversation) {
          console.log('✅ Navegando para:', `/messages/${conversation.id}`);
          navigate(`/messages/${conversation.id}`);
        } else {
          console.error('❌ Nenhuma conversa foi criada');
        }
      } else {
        console.error('❌ ensureConversationExists não está disponível');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar conversa:', error);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.trainer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stats
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const activeToday = conversations.filter(conv => {
    if (!conv.last_message_at) return false;
    const lastMessage = new Date(conv.last_message_at);
    const today = new Date();
    return lastMessage.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-xl">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Header with Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isPersonalTrainer ? 'Chat com Alunos' : 'Mensagens'}
                </h1>
                <p className="text-muted-foreground">
                  {isPersonalTrainer 
                    ? 'Gerencie conversas com seus alunos' 
                    : 'Converse com personal trainers'
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            {conversations.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{conversations.length}</div>
                  <div className="text-xs text-muted-foreground">Conversas</div>
                </div>
                {totalUnread > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-destructive">{totalUnread}</div>
                    <div className="text-xs text-muted-foreground">Não lidas</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-lg font-bold text-success">{activeToday}</div>
                  <div className="text-xs text-muted-foreground">Hoje</div>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center shadow-soft border-border/50">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              {searchTerm ? (
                <Search className="w-10 h-10 text-primary" />
              ) : (
                <MessageCircle className="w-10 h-10 text-primary" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `Nenhuma conversa encontrada para "${searchTerm}"`
                : isPersonalTrainer 
                  ? 'Aguarde seus alunos entrarem em contato ou inicie uma nova conversa'
                  : 'Entre em contato com um personal trainer para tirar suas dúvidas'
              }
            </p>
            {!searchTerm && (
              <div className="flex justify-center gap-3">
                {!isPersonalTrainer ? (
                  <Button onClick={handleStartConversation} className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Iniciar conversa
                  </Button>
                ) : (
                  <Button className="gap-2" variant="outline">
                    <Plus className="w-4 h-4" />
                    Nova Conversa
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
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

              const hasUnreadMessages = conversation.unread_count && conversation.unread_count > 0;

              return (
                <div
                  key={conversation.id}
                  className="bg-card hover:bg-accent/30 cursor-pointer transition-all duration-200 rounded-xl p-4 shadow-soft border border-border/50 hover:border-primary/30 group"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                          {otherUserInitials}
                        </AvatarFallback>
                      </Avatar>
                      {hasUnreadMessages && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center min-w-[24px] font-medium border-2 border-background">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground truncate text-lg">
                          {otherUserName || (isPersonalTrainer ? 'Aluno' : 'Personal Trainer')}
                        </h4>
                        <div className="flex items-center gap-2">
                          {lastMessageTime && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lastMessageTime}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate max-w-[400px]">
                          {conversation.last_message || 'Nova conversa'}
                        </p>
                        <div className="flex items-center gap-2">
                          {hasUnreadMessages && (
                            <Bell className="w-4 h-4 text-destructive" />
                          )}
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        {conversations.length > 0 && (
          <div className="mt-8 text-center">
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                {totalUnread > 0 ? (
                  <>
                    Você tem <span className="font-bold text-destructive">{totalUnread}</span> mensagens não lidas
                  </>
                ) : (
                  'Todas as mensagens foram lidas ✓'
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};