
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, Dumbbell, Info } from 'lucide-react';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  weight?: string;
  muscleGroup: string;
  difficulty?: string;
  instructions: string;
  commonMistakes?: string;
  alternatives?: string;
  videoKeywords?: string;
  tips?: string;
}

interface ModernExerciseCardProps {
  exercise: Exercise;
  isCompleted: boolean;
  exerciseIndex: number;
  onToggleComplete: () => void;
  onViewDetails?: () => void;
}

export const ModernExerciseCard: React.FC<ModernExerciseCardProps> = ({
  exercise,
  isCompleted,
  exerciseIndex,
  onToggleComplete,
  onViewDetails
}) => {
  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors = {
      'Peitoral': 'bg-red-100 text-red-800 border-red-300',
      'Costas': 'bg-blue-100 text-blue-800 border-blue-300',
      'Pernas': 'bg-green-100 text-green-800 border-green-300',
      'Ombros': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Braços': 'bg-purple-100 text-purple-800 border-purple-300',
      'Core': 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[muscleGroup as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02]
      ${isCompleted 
        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg' 
        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
      }
    `}>
      {/* Exercise number badge */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">{exerciseIndex}</span>
      </div>

      {/* Completed indicator */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="space-y-3">
        {/* Exercise name and muscle group */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
              {exercise.name}
            </h3>
            <Badge variant="outline" className={getMuscleGroupColor(exercise.muscleGroup)}>
              {exercise.muscleGroup}
            </Badge>
          </div>
        </div>

        {/* Exercise details */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-600">{exercise.sets}</div>
            <div className="text-xs text-blue-600 font-medium uppercase">Séries</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dumbbell className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-purple-600">{exercise.reps}</div>
            <div className="text-xs text-purple-600 font-medium uppercase">Reps</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-sm font-bold text-orange-600">{exercise.rest}</div>
            <div className="text-xs text-orange-600 font-medium uppercase">Descanso</div>
          </div>
        </div>

        {/* Instructions preview */}
        {exercise.instructions && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 line-clamp-2">
              {exercise.instructions}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onToggleComplete}
            className={`flex-1 h-12 font-semibold transition-all duration-300 ${
              isCompleted
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {isCompleted ? 'Concluído' : 'Marcar como Concluído'}
          </Button>
          
          {onViewDetails && (
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="px-4 h-12 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
            >
              <Info className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
