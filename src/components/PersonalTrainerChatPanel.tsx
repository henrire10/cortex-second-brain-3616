import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export const PersonalTrainerChatPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loading } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const handleViewAllChats = () => {
    navigate('/messages');
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stats
  const totalConversations = conversations.length;
  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const activeToday = conversations.filter(conv => {
    if (!conv.last_message_at) return false;
    const lastMessage = new Date(conv.last_message_at);
    const today = new Date();
    return lastMessage.toDateString() === today.toDateString();
  }).length;

  return (
    <Card className="h-full shadow-elegant border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Chat com Alunos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie suas conversas
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewAllChats}
            className="gap-2"
          >
            Ver Todas
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gradient-primary/10 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-primary">{totalConversations}</div>
            <div className="text-xs text-muted-foreground">Conversas</div>
          </div>
          <div className="bg-destructive/10 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-destructive">{unreadCount}</div>
            <div className="text-xs text-muted-foreground">Não lidas</div>
          </div>
          <div className="bg-success/10 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-success">{activeToday}</div>
            <div className="text-xs text-muted-foreground">Hoje</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-40" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredConversations.slice(0, 8).map((conversation) => {
                const lastMessageTime = conversation.last_message_at 
                  ? formatDistanceToNow(new Date(conversation.last_message_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })
                  : null;

                const userInitials = conversation.user_name
                  ? conversation.user_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : 'A';

                return (
                  <div
                    key={conversation.id}
                    className="p-4 hover:bg-accent/30 cursor-pointer transition-all duration-200 group"
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 relative">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                          {userInitials}
                        </AvatarFallback>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] font-medium border border-background">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </div>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm text-foreground truncate">
                            {conversation.user_name || 'Aluno'}
                          </h5>
                          <div className="flex items-center gap-2">
                            {lastMessageTime && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lastMessageTime}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.last_message || 'Nova conversa'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer with action buttons */}
        {filteredConversations.length > 8 && (
          <div className="p-4 border-t border-border/30">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewAllChats}
              className="w-full gap-2"
            >
              Ver mais {filteredConversations.length - 8} conversas
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};