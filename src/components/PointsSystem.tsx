
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Flame, Trophy, Target, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PointsSystemProps {
  points?: number;
  todayPoints?: number;
  streak?: number;
}

export const PointsSystem: React.FC<PointsSystemProps> = ({
  points: propPoints,
  todayPoints = 0,
  streak = 0
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState(propPoints || 0);
  const [recentAchievements, setRecentAchievements] = useState<number>(0);
  const [userRanking, setUserRanking] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      // Buscar pontos do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (profile) {
        setPoints(profile.points || 0);
      }

      // Buscar conquistas recentes (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .gte('earned_at', sevenDaysAgo.toISOString());

      setRecentAchievements(achievements?.length || 0);

      // Buscar posição no ranking
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, points')
        .order('points', { ascending: false });

      if (allUsers) {
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          setUserRanking(userIndex + 1);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };
  const getLevel = (points: number) => {
    if (points < 100) return { level: 1, name: 'Iniciante' };
    if (points < 500) return { level: 2, name: 'Dedicado' };
    if (points < 1000) return { level: 3, name: 'Comprometido' };
    if (points < 2000) return { level: 4, name: 'Experiente' };
    if (points < 5000) return { level: 5, name: 'Avançado' };
    return { level: 6, name: 'Mestre' };
  };

  const getNextLevelPoints = (currentLevel: number) => {
    const thresholds = [100, 500, 1000, 2000, 5000];
    return thresholds[currentLevel - 1] || 10000;
  };

  const currentLevel = getLevel(points);
  const nextLevelPoints = getNextLevelPoints(currentLevel.level);
  const progressToNext = currentLevel.level < 6 ? (points / nextLevelPoints) * 100 : 100;

  return (
    <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Sistema de Pontos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-400" />
              {points}
            </div>
            <p className="text-purple-100">pontos totais</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white text-purple-600 font-bold mb-1">
              Nível {currentLevel.level}
            </Badge>
            <p className="text-sm text-purple-100">{currentLevel.name}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {currentLevel.level < 6 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso para o próximo nível</span>
              <span>{Math.round(progressToNext)}%</span>
            </div>
            <div className="w-full bg-purple-400 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
            <p className="text-xs text-purple-100">
              {nextLevelPoints - points} pontos para o próximo nível
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Target className="w-6 h-6 text-green-400" />
              +{todayPoints}
            </div>
            <p className="text-xs text-purple-100">pontos hoje</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Flame className="w-6 h-6 text-orange-400" />
              {streak}
            </div>
            <p className="text-xs text-purple-100">dias seguidos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => navigate('/achievements')}
          >
            <Award className="w-4 h-4 mr-2" />
            Conquistas
            {recentAchievements > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-yellow-950 text-xs px-1 py-0">
                {recentAchievements}
              </Badge>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => navigate('/ranking')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Ranking
            {userRanking && (
              <Badge className="ml-2 bg-white text-purple-600 text-xs px-1 py-0">
                #{userRanking}
              </Badge>
            )}
          </Button>
        </div>

        <div className="text-xs text-purple-100 space-y-1 pt-2">
          <p>• 50 pontos por treino completo</p>
          <p>• Conquistas especiais desbloqueáveis</p>
          <p>• Suba no ranking competindo com outros usuários</p>
        </div>
      </CardContent>
    </Card>
  );
};
