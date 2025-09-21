
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Clock, Target, Dumbbell } from 'lucide-react';

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

interface MobileWorkoutHeaderProps {
  workout: WorkoutDay;
  onClose: () => void;
  completedCount: number;
  totalExercises: number;
}

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case 'Fácil': return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white';
    case 'Médio': return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
    case 'Difícil': return 'bg-gradient-to-r from-red-400 to-pink-500 text-white';
    default: return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white';
  }
};

export const MobileWorkoutHeader: React.FC<MobileWorkoutHeaderProps> = ({
  workout,
  onClose,
  completedCount,
  totalExercises
}) => {
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white shadow-lg">
      <div className="px-4 py-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{workout.title}</h1>
              <p className="text-sm text-white/80 truncate">{workout.focus}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 h-auto ml-2 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Clock className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-medium">{workout.duration}</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Target className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-medium">{totalExercises} exercícios</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Badge className={`${getDifficultyColor(workout.difficulty)} text-xs px-2 py-1`}>
              {workout.difficulty}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progresso do Treino</span>
            <span className="font-bold">{completedCount}/{totalExercises}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
