import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X, Clock, Target, Dumbbell } from 'lucide-react';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  weight?: string;
  muscleGroup: string;
  difficulty?: string;
  instructions: string;
  suggestedWeight?: string;
  estimatedCalories?: number;
  commonMistakes?: string;
  alternatives?: string;
  videoKeywords?: string;
  tips?: string;
}

interface WorkoutDay {
  day: number;
  title: string;
  focus: string;
  duration: string;
  exercises: Exercise[];
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  intensity?: string;
  estimatedCalories?: number;
  isRestDay?: boolean;
  workoutDate: string;
}

interface WorkoutHeaderProps {
  workout: WorkoutDay;
  onClose: () => void;
  completedCount: number;
  totalExercises: number;
  showBackButton?: boolean;
}

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case 'Fácil': return 'bg-emerald-500 hover:bg-emerald-600';
    case 'Médio': return 'bg-amber-500 hover:bg-amber-600';
    case 'Difícil': return 'bg-red-500 hover:bg-red-600';
    default: return 'bg-slate-500 hover:bg-slate-600';
  }
};

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  workout,
  onClose,
  completedCount,
  totalExercises,
  showBackButton = false
}) => {
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-primary/95 via-purple-600/95 to-pink-600/95 backdrop-blur-xl border-b border-white/10">
      <div className="px-4 py-3">
        {/* Header with navigation - More compact */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white truncate leading-tight">{workout.title}</h1>
              <p className="text-xs text-white/80 truncate">{workout.focus}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 h-auto ml-2 flex-shrink-0 transition-all duration-200 z-50 bg-white/10 border border-white/20"
          >
            {showBackButton ? <ArrowLeft className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        {/* Stats cards - More compact inline layout */}
        <div className="flex items-center justify-between mb-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/90" />
            <span className="text-xs font-medium text-white">{workout.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-white/90" />
            <span className="text-xs font-medium text-white">{totalExercises} ex.</span>
          </div>
          <Badge className={`${getDifficultyColor(workout.difficulty)} text-white border-0 text-xs px-2 py-0.5 font-medium`}>
            {workout.difficulty}
          </Badge>
        </div>

        {/* Progress bar - More compact */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-white">
            <span className="font-medium text-white/90">Progresso</span>
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-xs border border-white/30">
              {completedCount}/{totalExercises}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5 backdrop-blur-sm border border-white/30">
            <div 
              className="bg-gradient-to-r from-white via-white/95 to-white/90 h-1.5 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
