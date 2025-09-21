
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Target, 
  Clock, 
  Weight,
  PlayCircle,
  Circle,
  TrendingUp
} from 'lucide-react';
import { calculatePersonalizedSuggestedWeight } from '@/utils/exerciseScientificAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseGifDisplay } from '../ExerciseGifDisplay';

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

interface ModernExerciseCardProps {
  exercise: Exercise;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onViewDetails: () => void;
  onOpenWorkoutLog?: () => void;
  exerciseIndex: number;
}

export const ModernExerciseCard: React.FC<ModernExerciseCardProps> = ({
  exercise,
  isCompleted,
  onToggleComplete,
  onViewDetails,
  onOpenWorkoutLog,
  exerciseIndex
}) => {
  const { profile } = useAuth();

  // Calcular peso personalizado baseado no perfil do usuário (mesma lógica do ExerciseDetailView)
  const personalizedWeight = useMemo(() => {
    if (!profile) return null;
    try {
      const userProfile = {
        weight: profile.weight,
        gender: profile.gender,
        experience_level: profile.experienceLevel || 'iniciante',
        age: profile.age,
        fitness_goal: profile.fitnessGoal
      };
      const exerciseForCalculation = {
        name: exercise.name,
        sets: exercise.sets.toString(),
        reps: exercise.reps,
        rest: exercise.rest,
        muscleGroup: exercise.muscleGroup
      };
      return calculatePersonalizedSuggestedWeight(exerciseForCalculation, userProfile);
    } catch (error) {
      console.error('Erro ao calcular peso personalizado:', error);
      return null;
    }
  }, [exercise, profile]);

  // Determinar o peso a ser exibido (prioridade: personalizado > do exercício > peso corporal)
  const displayWeight = personalizedWeight || exercise.suggestedWeight || exercise.weight || 'Peso corporal';
  return (
    <Card className={`transition-all duration-200 border ${
      isCompleted 
        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
        : 'bg-white border-gray-200 hover:shadow-sm hover:border-gray-300'
    }`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
            isCompleted 
              ? 'bg-emerald-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <span>{exerciseIndex}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
              {exercise.name}
            </h3>
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
              {exercise.muscleGroup}
            </Badge>
          </div>
          
          {/* Workout Log Button */}
          {onOpenWorkoutLog && (
            <Button
              onClick={onOpenWorkoutLog}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* GIF do Exercício */}
        <div className="mb-3">
          <ExerciseGifDisplay 
            exerciseName={exercise.name}
            className="w-full h-40 rounded-lg border"
          />
        </div>

        {/* Exercise Stats */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-600">{exercise.sets}</div>
              <div className="text-xs font-medium text-blue-600">SÉRIES</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-purple-600">{exercise.reps}</div>
              <div className="text-xs font-medium text-purple-600">REPS</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-orange-600 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {exercise.rest}
              </div>
              <div className="text-xs font-medium text-orange-600">DESCANSO</div>
            </div>
          </div>
          
          {displayWeight !== 'Peso corporal' && (
            <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-gray-200 mt-2">
              <Weight className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Peso sugerido:</span>
              <span className="text-sm font-semibold text-primary">{displayWeight}</span>
              {personalizedWeight && (
                <span className="text-xs text-primary/70">✨</span>
              )}
            </div>
          )}
        </div>


        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onViewDetails}
            variant="outline"
            className="flex-1 h-9 text-sm border-gray-200 hover:border-blue-300 hover:bg-blue-50"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            Ver Detalhes
          </Button>
          
          <Button
            onClick={onToggleComplete}
            className={`flex-1 h-9 text-sm font-medium transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Concluído
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 mr-1" />
                Marcar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
