import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, Calendar } from 'lucide-react';

interface AchievementProgressStatsProps {
  stats: {
    earnedCount: number;
    totalCount: number;
    totalPoints: number;
    completedWorkouts: number;
    currentStreak: number;
    nextMilestones: Array<{
      name: string;
      description: string;
      progress: number;
      required: number;
      unit: string;
    }>;
  };
}

export const AchievementProgressStats: React.FC<AchievementProgressStatsProps> = ({ stats }) => {
  const completionPercentage = (stats.earnedCount / stats.totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Progresso Geral
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {Math.round(completionPercentage)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.earnedCount}</div>
              <div className="text-sm opacity-90">Desbloqueadas</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.totalCount}</div>
              <div className="text-sm opacity-90">Total</div>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-3 bg-white/20" />
          <div className="text-center text-sm opacity-90">
            {stats.earnedCount} de {stats.totalCount} conquistas desbloqueadas
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <div className="text-sm text-muted-foreground">Pontos Total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stats.completedWorkouts}</div>
            <div className="text-sm text-muted-foreground">Treinos Completos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Dias Seguidos</div>
          </CardContent>
        </Card>
      </div>

      {/* Next Milestones */}
      {stats.nextMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Próximas Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.nextMilestones.map((milestone, index) => {
              const progressPercentage = Math.min((milestone.progress / milestone.required) * 100, 100);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{milestone.name}</h4>
                    <Badge variant="outline">
                      {milestone.progress}/{milestone.required} {milestone.unit}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};