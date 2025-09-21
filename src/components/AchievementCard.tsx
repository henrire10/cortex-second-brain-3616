import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Target } from 'lucide-react';

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    points_reward: number;
    earned_at?: string;
  };
  progress?: {
    current: number;
    required: number;
    unit: string;
  };
  isEarned: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  isEarned
}) => {
  const progressPercentage = progress ? Math.min((progress.current / progress.required) * 100, 100) : 0;
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
        isEarned 
          ? 'border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg' 
          : 'border border-border bg-muted/20 hover:bg-muted/30'
      }`}
    >
      {isEarned && (
        <div className="absolute top-2 right-2">
          <Trophy className="w-6 h-6 text-yellow-600 animate-pulse" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`text-4xl transition-all duration-300 ${!isEarned ? 'grayscale opacity-50' : ''}`}>
            {achievement.icon_url}
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className={`font-bold text-lg ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
              {achievement.name}
            </h3>
            
            <p className={`text-sm ${isEarned ? 'text-muted-foreground' : 'text-muted-foreground opacity-75'}`}>
              {achievement.description}
            </p>
            
            {/* Progress Bar for Locked Achievements */}
            {!isEarned && progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progress.current} / {progress.required} {progress.unit}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4">
              <Badge 
                className={isEarned 
                  ? 'bg-yellow-500 text-yellow-950 hover:bg-yellow-600' 
                  : 'bg-muted text-muted-foreground'
                }
              >
                +{achievement.points_reward} pontos
              </Badge>
              
              {isEarned && achievement.earned_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};