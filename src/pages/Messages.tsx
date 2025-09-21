import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { ModernConversationList } from '@/components/ModernConversationList';
import { useAuth } from '@/contexts/AuthContext';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <MobileHeader 
        title="Mensagens"
        onBack={() => navigate('/dashboard')}
        showBackButton={true}
      />
      <ModernConversationList />
    </>
  );
};

export default Messages;