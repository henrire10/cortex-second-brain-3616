import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields
  sender_name?: string;
  // Optimistic update fields
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Get sender names for all messages
      const senderIds = [...new Set((data || []).map(msg => msg.sender_id))];
      const { data: sendersData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', senderIds);

      const sendersMap = (sendersData || []).reduce((acc, sender) => {
        acc[sender.id] = sender.name;
        return acc;
      }, {});

      const enrichedMessages = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: sendersMap[msg.sender_id] || 'Usuário'
      }));

      setMessages(enrichedMessages);

      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = useCallback(async (content: string, recipientId: string) => {
    if (!conversationId || !user || !content.trim()) return false;

    const optimisticId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipientId,
      message_content: content.trim(),
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender_name: 'Você',
      isOptimistic: true,
      status: 'sending'
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipientId,
          message_content: content.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Update optimistic message to error state
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, status: 'error' as const }
            : msg
        ));
        return false;
      }

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...data, sender_name: 'Você', status: 'sent' as const }
          : msg
      ));

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return true;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Update optimistic message to error state
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, status: 'error' as const }
          : msg
      ));
      return false;
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_id !== user?.id) {
            // Only add if it's not from current user (to avoid duplication with optimistic updates)
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) return prev;
              return [...prev, { ...newMessage, sender_name: 'Personal Trainer', status: 'delivered' as const }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return {
    messages,
    loading,
    sendMessage,
    refreshMessages: fetchMessages,
    isTyping
  };
};