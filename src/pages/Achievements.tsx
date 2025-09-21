
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileHeader } from '@/components/MobileHeader';
import { AchievementCard } from '@/components/AchievementCard';
import { AchievementProgressStats } from '@/components/AchievementProgressStats';
import { AchievementNotification } from '@/components/AchievementNotification';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  points_reward: number;
  earned_at?: string;
}

export const Achievements: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    completedWorkouts: 0,
    currentStreak: 0
  });
  
  const { 
    notification, 
    dismissNotification, 
    triggerAchievementCheck 
  } = useAchievementNotifications();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Forçar atualização das conquistas
    const initializeAchievements = async () => {
      await addMoreAchievements();
      await fetchUserStats();
      await fetchAchievements();
      await checkAchievements();
    };
    
    initializeAchievements();
  }, [user, navigate]);

  const checkAchievements = async () => {
    await triggerAchievementCheck();
    // Recarregar dados após verificação
    setTimeout(() => {
      fetchAchievements();
      fetchUserStats();
    }, 1000);
  };

  const addMoreAchievements = async () => {
    try {
      console.log('🏆 Chamando edge function para adicionar conquistas...');
      
      const { data, error } = await supabase.functions.invoke('manage-achievements', {
        body: { action: 'initialize_achievements' }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        toast({
          title: "Erro ao atualizar conquistas",
          description: "Erro na comunicação com o servidor.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Resposta da edge function:', data);
      
      if (data.success && data.added > 0) {
        toast({
          title: "Conquistas atualizadas!",
          description: `${data.added} novas conquistas foram adicionadas.`,
        });
      } else if (data.success && data.added === 0) {
        console.log('✅ Todas as conquistas já existem no banco (sem duplicatas)!');
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao adicionar conquistas:', error);
      toast({
        title: "Erro ao atualizar conquistas",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!user?.id) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points, current_workout_streak')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        const { data: workoutsData } = await supabase
          .from('daily_workouts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        setUserStats({
          totalPoints: profile.points || 0,
          currentStreak: profile.current_workout_streak || 0,
          completedWorkouts: workoutsData?.length || 0
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      if (!user?.id) return;

      // Buscar todas as conquistas disponíveis
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points_reward', { ascending: true });

      if (achievementsError) {
        console.error('Erro ao buscar conquistas:', achievementsError);
        toast({
          title: "Erro ao carregar conquistas",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      // Buscar conquistas ganhas pelo usuário
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id);

      if (userError) {
        console.error('Erro ao buscar conquistas do usuário:', userError);
        toast({
          title: "Erro ao carregar seu progresso",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      // Combinar dados das conquistas com as ganhas pelo usuário
      const combinedAchievements = allAchievements?.map(achievement => {
        const userAchievement = userAchievements?.find(
          ua => ua.achievement_id === achievement.id
        );
        return {
          ...achievement,
          earned_at: userAchievement?.earned_at
        };
      }) || [];

      setAchievements(combinedAchievements);
    } catch (error) {
      console.error('Erro geral ao buscar conquistas:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as conquistas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const earnedAchievements = achievements.filter(a => a.earned_at);
  const lockedAchievements = achievements.filter(a => !a.earned_at);

  // Generate progress data for locked achievements
  const getAchievementProgress = (achievement: Achievement) => {
    const name = achievement.name;
    
    if (name === 'Guerreiro' && userStats.completedWorkouts < 10) {
      return { current: userStats.completedWorkouts, required: 10, unit: 'treinos' };
    }
    if (name === 'Consistente' && userStats.currentStreak < 7) {
      return { current: userStats.currentStreak, required: 7, unit: 'dias seguidos' };
    }
    if (name === 'Máquina de Pontos' && userStats.totalPoints < 1000) {
      return { current: userStats.totalPoints, required: 1000, unit: 'pontos' };
    }
    
    return undefined;
  };

  // Generate next milestones
  const nextMilestones = lockedAchievements
    .map(achievement => {
      const progress = getAchievementProgress(achievement);
      if (progress) {
        return {
          name: achievement.name,
          description: achievement.description,
          progress: progress.current,
          required: progress.required,
          unit: progress.unit
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const progressStats = {
    earnedCount: earnedAchievements.length,
    totalCount: achievements.length,
    totalPoints: userStats.totalPoints,
    completedWorkouts: userStats.completedWorkouts,
    currentStreak: userStats.currentStreak,
    nextMilestones: nextMilestones as any[]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
      <MobileHeader 
        title="Conquistas" 
        showBackButton 
        onBack={() => navigate('/dashboard')}
      />
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader 
        title="Conquistas" 
        showBackButton 
        onBack={() => navigate('/dashboard')}
      />

      {/* Achievement Notification */}
      {notification && (
        <AchievementNotification
          achievement={notification}
          onDismiss={dismissNotification}
        />
      )}
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Enhanced Header with Sparkles */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-secondary p-6 rounded-xl text-primary-foreground">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-300 animate-pulse" />
          <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-orange-300 animate-pulse delay-700" />
          
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 animate-bounce" />
              <h1 className="text-2xl font-bold">Suas Conquistas</h1>
            </div>
            <Button 
              onClick={async () => {
                console.log('🔄 Forçando atualização das conquistas...');
                setIsLoading(true);
                await addMoreAchievements();
                await fetchUserStats();
                await fetchAchievements();
                await checkAchievements();
                setIsLoading(false);
              }}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Progress Stats */}
        <AchievementProgressStats stats={progressStats} />

        {/* Conquistas Ganhas */}
        {earnedAchievements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
              <h2 className="text-xl font-semibold">Desbloqueadas</h2>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {earnedAchievements.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {earnedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isEarned={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Conquistas Bloqueadas */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Em Progresso</h2>
              <Badge variant="outline">{lockedAchievements.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={getAchievementProgress(achievement)}
                  isEarned={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {achievements.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="relative">
              <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <Sparkles className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-6 text-primary animate-bounce" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pronto para começar?</h3>
            <p className="text-muted-foreground mb-4">Complete treinos para desbloquear suas primeiras conquistas!</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              <Trophy className="w-4 h-4 mr-2" />
              Começar a Treinar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
