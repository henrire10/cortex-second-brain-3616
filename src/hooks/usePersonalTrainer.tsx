
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePersonalTrainer = () => {
  const { user } = useAuth();
  const [isPersonalTrainer, setIsPersonalTrainer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPersonalTrainerStatus = async () => {
      if (!user) {
        setIsPersonalTrainer(false);
        setLoading(false);
        return;
      }

      try {
        // Use RPC function for better reliability with RLS
        const { data, error } = await supabase.rpc('is_personal_trainer');

        if (error) {
          console.error('Error checking personal trainer status:', error);
          setIsPersonalTrainer(false);
        } else {
          setIsPersonalTrainer(data === true);
        }
      } catch (error) {
        console.error('Error checking personal trainer status:', error);
        setIsPersonalTrainer(false);
      } finally {
        setLoading(false);
      }
    };

    checkPersonalTrainerStatus();
  }, [user]);

  return { isPersonalTrainer, loading };
};
