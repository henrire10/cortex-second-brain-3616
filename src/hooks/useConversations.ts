import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';

interface Conversation {
  id: string;
  user_id: string;
  personal_trainer_id: string;
  is_active: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Populated fields
  user_name?: string;
  trainer_name?: string;
  last_message?: string;
  unread_count?: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isPersonalTrainer } = usePersonalTrainer();

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Different queries for user vs personal trainer
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (isPersonalTrainer) {
        query = query.eq('personal_trainer_id', user.id);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // Enrich conversations with additional data
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv: any) => {
          // Get user and trainer names
          const [{ data: userData }, { data: trainerData }] = await Promise.all([
            supabase.from('profiles').select('name').eq('id', conv.user_id).single(),
            supabase.from('profiles').select('name').eq('id', conv.personal_trainer_id).single()
          ]);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('direct_messages')
            .select('message_content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count for current user
          const { data: unreadMessages } = await supabase
            .from('direct_messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            user_name: userData?.name,
            trainer_name: trainerData?.name,
            last_message: lastMessage?.message_content,
            unread_count: unreadMessages?.length || 0
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (otherUserId: string) => {
    console.log('🔄 Criando conversa com usuário:', otherUserId);
    if (!user) {
      console.log('❌ Usuário não encontrado na criação');
      return null;
    }

    try {
      console.log('🔍 Verificando se conversa já existe...');
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', isPersonalTrainer ? otherUserId : user.id)
        .eq('personal_trainer_id', isPersonalTrainer ? user.id : otherUserId)
        .maybeSingle();

      console.log('📋 Conversa existente:', existingConversation);
      if (existingConversation) {
        return existingConversation;
      }

      const conversationData = isPersonalTrainer
        ? { user_id: otherUserId, personal_trainer_id: user.id }
        : { user_id: user.id, personal_trainer_id: otherUserId };

      console.log('📤 Dados da nova conversa:', conversationData);

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar conversa:', error);
        return null;
      }

      console.log('✅ Conversa criada com sucesso:', data);
      await fetchConversations();
      return data;
    } catch (error) {
      console.error('❌ Erro geral na criação da conversa:', error);
      return null;
    }
  };

  // Ensure conversation exists for any user type
  const ensureConversationExists = async () => {
    console.log('🔍 Verificando se conversa existe...');
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return null;
    }

    console.log('👤 Usuário atual:', { id: user.id, email: user.email });

    if (isPersonalTrainer) {
      console.log('👨‍🏫 Usuário é personal trainer');
      // For personal trainers, get all their students and let them choose
      const { data: students } = await supabase
        .from('profiles')
        .select('id, name')
        .neq('id', user.id)
        .limit(10);

      console.log('🎓 Estudantes encontrados:', students);
      if (students && students.length > 0) {
        // For now, create conversation with first student
        // TODO: Add UI to select student
        return await createConversation(students[0].id);
      }
      return null;
    } else {
      console.log('👤 Usuário regular');
      // For regular users, check if conversation exists
      const { data: existingConversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      console.log('📝 Consulta conversas resultado:', { data: existingConversations, error: convError });
      if (existingConversations && existingConversations.length > 0) {
        console.log('✅ Conversa existente encontrada:', existingConversations[0]);
        return existingConversations[0];
      }

      console.log('🔍 Buscando personal trainers...');
      // Get first available personal trainer
      const { data: trainers, error: trainerError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('role', 'personal_trainer')
        .limit(1);

      console.log('👨‍🏫 Consulta trainers resultado:', { data: trainers, error: trainerError });
      if (trainers && trainers.length > 0) {
        console.log('✅ Criando conversa com trainer:', trainers[0].user_id);
        return await createConversation(trainers[0].user_id);
      }

      console.log('❌ Nenhum personal trainer encontrado');
      return null;
    }
  };

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isPersonalTrainer]);

  return {
    conversations,
    loading,
    refreshConversations: fetchConversations,
    createConversation,
    ensureConversationExists
  };
};