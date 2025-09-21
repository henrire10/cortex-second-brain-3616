import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<boolean>;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    
    try {
      const success = await onSendMessage(message);
      
      if (success) {
        setMessage('');
        // Don't show toast here, let parent handle it
      } else {
        toast({
          title: "Erro ao enviar mensagem",
          description: "Tente novamente em alguns segundos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="resize-none min-h-[40px] max-h-32 transition-all"
          rows={1}
          disabled={sending || disabled}
        />
      </div>
      <Button 
        type="submit" 
        size="icon" 
        disabled={!message.trim() || sending || disabled}
        className="flex-shrink-0 h-10 w-10 transition-all hover:scale-105"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};