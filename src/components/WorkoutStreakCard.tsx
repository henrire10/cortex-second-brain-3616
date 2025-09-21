import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, Calendar, Target, Play, Zap, Battery, Heart, 
  Star, Trophy, Crown, Rocket, Award, Gem, Sparkles 
} from 'lucide-react';

interface WorkoutStreakCardProps {
  currentStreak: number;
  className?: string;
}

export const WorkoutStreakCard: React.FC<WorkoutStreakCardProps> = ({
  currentStreak,
  className = ""
}) => {
  // Dynamic background that changes every day
  const getDynamicStreakBackground = (streak: number) => {
    if (streak === 0) return 'from-muted to-muted/80';
    
    // Calculate color progression based on streak day
    const colorPhases = [
      // Days 1-7: Blue progression
      ...Array.from({length: 7}, (_, i) => {
        const intensity = 400 + (i * 100); // 400 to 1000
        return `from-blue-${Math.min(intensity, 900)} to-blue-${Math.min(intensity + 100, 950)}`;
      }),
      // Days 8-14: Green progression  
      ...Array.from({length: 7}, (_, i) => {
        const intensity = 400 + (i * 100);
        return `from-green-${Math.min(intensity, 900)} to-emerald-${Math.min(intensity + 100, 950)}`;
      }),
      // Days 15-21: Yellow/Orange progression
      ...Array.from({length: 7}, (_, i) => {
        const intensity = 400 + (i * 100);
        return `from-yellow-${Math.min(intensity, 900)} to-orange-${Math.min(intensity + 100, 950)}`;
      }),
      // Days 22-30: Red/Pink progression
      ...Array.from({length: 9}, (_, i) => {
        const intensity = 400 + (i * 50);
        return `from-red-${Math.min(intensity, 900)} to-pink-${Math.min(intensity + 100, 950)}`;
      }),
    ];
    
    // For streaks longer than 30 days, use golden progression
    if (streak > 30) {
      const goldenVariant = (streak - 30) % 5;
      const goldenGradients = [
        'from-yellow-400 to-amber-500',
        'from-amber-400 to-orange-500', 
        'from-orange-400 to-yellow-500',
        'from-yellow-500 to-amber-600',
        'from-amber-500 to-yellow-600'
      ];
      return goldenGradients[goldenVariant];
    }
    
    return colorPhases[streak - 1] || colorPhases[colorPhases.length - 1];
  };

  // Dynamic icon that changes based on streak milestones
  const getDynamicStreakIcon = (streak: number) => {
    const iconMap = [
      Play,     // 0-1 days
      Flame,    // 2-3 days  
      Zap,      // 4-6 days
      Battery,  // 7-10 days
      Heart,    // 11-14 days
      Star,     // 15-20 days
      Trophy,   // 21-27 days
      Crown,    // 28-30 days
      Rocket,   // 31-40 days
      Award,    // 41-50 days
      Gem,      // 51-60 days
      Sparkles  // 60+ days
    ];
    
    if (streak === 0) return Play;
    if (streak <= 1) return Flame;
    if (streak <= 3) return Flame;
    if (streak <= 6) return Zap;
    if (streak <= 10) return Battery;
    if (streak <= 14) return Heart;
    if (streak <= 20) return Star;
    if (streak <= 27) return Trophy;
    if (streak <= 30) return Crown;
    if (streak <= 40) return Rocket;
    if (streak <= 50) return Award;
    if (streak <= 60) return Gem;
    return Sparkles;
  };

  // Dynamic text color based on streak
  const getDynamicStreakColor = (streak: number) => {
    if (streak === 0) return 'text-muted-foreground';
    if (streak <= 7) return 'text-primary';
    if (streak <= 14) return 'text-green-500';
    if (streak <= 21) return 'text-yellow-500'; 
    if (streak <= 30) return 'text-red-500';
    return 'text-yellow-600'; // Golden for 30+
  };

  // Animation intensity based on streak
  const getAnimationClass = (streak: number) => {
    if (streak === 0) return '';
    if (streak <= 3) return 'animate-pulse';
    if (streak <= 7) return 'animate-pulse hover:animate-bounce';
    if (streak <= 14) return 'animate-pulse hover:animate-bounce transition-transform hover:scale-110';
    return 'animate-pulse hover:animate-bounce transition-transform hover:scale-110 drop-shadow-lg';
  };

  // Card background evolution
  const getCardBackground = (streak: number) => {
    if (streak === 0) return 'bg-gradient-to-br from-muted/50 to-muted/30';
    if (streak <= 7) return 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30';
    if (streak <= 14) return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/30';
    if (streak <= 21) return 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/20 dark:to-orange-900/30';
    if (streak <= 30) return 'bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950/20 dark:to-pink-900/30';
    return 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-950/30 dark:to-amber-900/40';
  };

  // Progress bar color evolution
  const getProgressBarGradient = (streak: number) => {
    if (streak <= 7) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (streak <= 14) return 'bg-gradient-to-r from-green-400 to-emerald-600';
    if (streak <= 21) return 'bg-gradient-to-r from-yellow-400 to-orange-600';
    if (streak <= 30) return 'bg-gradient-to-r from-red-400 to-pink-600';
    return 'bg-gradient-to-r from-yellow-500 to-amber-600';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 21) return '💪';
    if (streak >= 14) return '🚀';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '🌟';
    return '🔥';
  };

  const getMotivationalText = (streak: number) => {
    if (streak === 0) return 'Comece sua sequência hoje!';
    if (streak === 1) return 'Primeira conquista! Continue!';
    if (streak < 7) return 'Construindo o hábito!';
    if (streak < 14) return 'Uma semana incrível!';
    if (streak < 21) return 'Duas semanas fantásticas!';
    if (streak < 30) return 'Sequência impressionante!';
    return 'Mestre da Consistência! 👑';
  };

  const StreakIcon = getDynamicStreakIcon(currentStreak);

  return (
    <Card className={`relative overflow-hidden ${getCardBackground(currentStreak)} border-2 transition-all duration-300 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getDynamicStreakBackground(currentStreak)} flex items-center justify-center ${getAnimationClass(currentStreak)}`}>
                <StreakIcon className={`w-6 h-6 text-white`} />
              </div>
              {currentStreak > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
                  {getStreakEmoji(currentStreak)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getDynamicStreakColor(currentStreak)}`}>
                  {currentStreak}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentStreak === 1 ? 'dia' : 'dias'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getMotivationalText(currentStreak)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <Badge 
              variant={currentStreak >= 30 ? "default" : "secondary"}
              className="mb-1"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Sequência
            </Badge>
            
            {currentStreak >= 30 && (
              <div className="flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400">
                <Target className="w-3 h-3" />
                <span>Meta mensal! 👑</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator for monthly goal */}
        {currentStreak < 30 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso mensal</span>
              <span>{Math.min(currentStreak, 30)}/30 dias</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`${getProgressBarGradient(currentStreak)} h-2 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min((currentStreak / 30) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};