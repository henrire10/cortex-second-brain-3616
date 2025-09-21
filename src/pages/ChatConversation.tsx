import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ChatConversation: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPersonalTrainer } = usePersonalTrainer();
  const { conversations } = useConversations();
  const { messages, loading, sendMessage, isTyping } = useMessages(conversationId || null);
  
  const [conversation, setConversation] = useState<any>(null);
  const [recipientId, setRecipientId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (conversations.length > 0 && conversationId) {
      const conv = conversations.find(c => c.id === conversationId);
      setConversation(conv);
      
      // Determine recipient ID based on user role
      if (conv) {
        const otherUserId = isPersonalTrainer ? conv.user_id : conv.personal_trainer_id;
        setRecipientId(otherUserId);
      }
    }
  }, [conversations, conversationId, isPersonalTrainer]);

  if (!user || !conversationId) {
    navigate('/messages');
    return null;
  }

  const handleSendMessage = async (content: string) => {
    if (!recipientId || isSending) return false;
    
    setIsSending(true);
    try {
      const success = await sendMessage(content, recipientId);
      if (success) {
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso!",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const otherUserName = isPersonalTrainer 
    ? conversation?.user_name 
    : conversation?.trainer_name;

  const otherUserInitials = otherUserName 
    ? otherUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      <div className="sticky top-0 z-[60] flex items-center justify-between p-4 bg-background border-b border-border md:hidden">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/messages')} variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {otherUserInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{otherUserName || 'Carregando...'}</div>
              <div className="text-xs text-muted-foreground">
                {isPersonalTrainer ? 'Aluno' : 'Personal Trainer'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <Card className="flex-1 flex flex-col shadow-soft border-border/50 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons with stagger animation
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-fade-in`} style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {i % 2 === 0 && (
                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      )}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-16 w-48" />
                      </div>
                      {i % 2 === 1 && (
                        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma mensagem ainda
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Envie a primeira mensagem para começar a conversa
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwnMessage={message.sender_id === user.id}
                    />
                  ))}
                  {isTyping && (
                    <TypingIndicator senderName={otherUserName} />
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatConversation;