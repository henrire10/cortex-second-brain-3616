import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileHeader } from '@/components/MobileHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RankingUser {
  id: string;
  name: string;
  points: number;
  position: number;
}

export const Ranking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchRanking();
  }, [user, navigate]);

  const fetchRanking = async () => {
    try {
      if (!user?.id) return;

      // Buscar ranking geral ordenado por pontos
      const { data: rankingData, error: rankingError } = await supabase
        .from('profiles')
        .select('id, name, points')
        .order('points', { ascending: false })
        .limit(50); // Top 50 usuários

      if (rankingError) {
        console.error('Erro ao buscar ranking:', rankingError);
        toast({
          title: "Erro ao carregar ranking",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      // Adicionar posição aos usuários
      const rankingWithPosition = rankingData?.map((user, index) => ({
        ...user,
        position: index + 1
      })) || [];

      setRanking(rankingWithPosition);

      // Encontrar posição do usuário atual
      const currentUser = rankingWithPosition.find(u => u.id === user.id);
      if (currentUser) {
        setUserPosition(currentUser.position);
        setUserPoints(currentUser.points);
      } else {
        // Se o usuário não está no top 50, buscar sua posição específica
        const { data: allUsers, error: allUsersError } = await supabase
          .from('profiles')
          .select('id, points')
          .order('points', { ascending: false });

        if (!allUsersError && allUsers) {
          const userIndex = allUsers.findIndex(u => u.id === user.id);
          if (userIndex !== -1) {
            setUserPosition(userIndex + 1);
            setUserPoints(allUsers[userIndex].points);
          }
        }
      }
    } catch (error) {
      console.error('Erro geral ao buscar ranking:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar o ranking.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center bg-muted rounded-full text-sm font-bold">{position}</div>;
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return "champion";
    if (position <= 3) return "podium";
    if (position <= 10) return "top10";
    return "default";
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (position === 2) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (position === 3) return "bg-gradient-to-r from-amber-400 to-amber-600";
    return "bg-card";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader 
          title="Ranking" 
          showBackButton 
          onBack={() => navigate('/dashboard')}
          onMenuToggle={() => {}}
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
        title="Ranking" 
        showBackButton 
        onBack={() => navigate('/dashboard')}
        onMenuToggle={() => {}}
      />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Header com posição do usuário */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-xl text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Ranking de Pontos</h1>
          </div>
          
          {userPosition && (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Sua Posição</div>
                  <div className="text-2xl font-bold">#{userPosition}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Seus Pontos</div>
                  <div className="text-2xl font-bold">{userPoints}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pódio (Top 3) */}
        {ranking.length >= 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Pódio</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ranking.slice(0, 3).map((user) => (
                <Card key={user.id} className={`border-2 ${getPositionColor(user.position)} ${user.position === 1 ? 'border-yellow-300' : user.position === 2 ? 'border-gray-300' : 'border-amber-300'}`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {getPositionIcon(user.position)}
                      <div>
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <div className="text-2xl font-bold text-primary">{user.points}</div>
                        <div className="text-sm text-muted-foreground">pontos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Completo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Ranking Completo</h2>
          </div>
          
          <div className="space-y-2">
            {ranking.map((rankUser) => (
              <Card 
                key={rankUser.id} 
                className={`${rankUser.id === user?.id ? 'border-primary bg-primary/5' : ''} transition-colors`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getPositionIcon(rankUser.position)}
                      <div>
                        <h3 className="font-semibold">{rankUser.name}</h3>
                        {rankUser.id === user?.id && (
                          <Badge variant="outline" className="text-xs">Você</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{rankUser.points}</div>
                      <div className="text-sm text-muted-foreground">pontos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Estado vazio */}
        {ranking.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum usuário no ranking</h3>
            <p className="text-muted-foreground">Complete treinos para aparecer no ranking!</p>
          </div>
        )}
      </div>
    </div>
  );
};