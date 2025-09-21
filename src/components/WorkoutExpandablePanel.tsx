
import React from 'react';
import { X, Clock, Target, CheckCircle, Play, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExerciseCard } from './ExerciseCard';

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

interface WorkoutExpandablePanelProps {
  workout: WorkoutDay | null;
  isOpen: boolean;
  completedExercises: string[];
  onClose: () => void;
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onCompleteWorkout: () => void;
}

export const WorkoutExpandablePanel: React.FC<WorkoutExpandablePanelProps> = ({
  workout,
  isOpen,
  completedExercises,
  onClose,
  onExerciseToggle,
  onCompleteWorkout
}) => {
  if (!workout) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0';
      case 'Médio':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0';
      case 'Difícil':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0';
    }
  };

  const completedCount = completedExercises.length;
  const totalExercises = workout.exercises.length;
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
  const isWorkoutComplete = completedCount === totalExercises && totalExercises > 0;

  return (
    <div 
      className={`
        overflow-hidden transition-all duration-500 ease-out transform
        ${isOpen ? 'max-h-[2000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}
      `}
    >
      {/* Mobile-optimized container */}
      <div className="mx-2 sm:mx-4 mb-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-100/50 overflow-hidden">
        {/* Mobile-optimized header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 px-4 py-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5 flex-shrink-0" />
                  <h2 className="text-xl font-bold leading-tight">{workout.title}</h2>
                </div>
                <p className="text-purple-100 text-base leading-relaxed">{workout.focus}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 h-auto flex-shrink-0 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile-optimized info badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-2 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{workout.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-2 rounded-full">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">{totalExercises} exercícios</span>
              </div>
              <Badge className={getDifficultyColor(workout.difficulty)}>
                {workout.difficulty}
              </Badge>
            </div>

            {/* Mobile-optimized progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-100">Progresso</span>
                <span className="text-sm font-bold">{completedCount}/{totalExercises}</span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-white/20"
              />
            </div>
          </div>
        </div>

        {/* Mobile-optimized content */}
        <div className="px-4 py-5">
          {workout.isRestDay ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">😴</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dia de Descanso</h3>
              <p className="text-gray-600 text-base">Aproveite para recuperar suas energias!</p>
            </div>
          ) : (
            <>
              {/* Exercises List - Mobile optimized */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-600" />
                  Exercícios
                </h3>
                
                <div className="space-y-3">
                  {workout.exercises.map((exercise, index) => (
                    <ExerciseCard
                      key={`${exercise.name}-${index}`}
                      exercise={exercise}
                      onComplete={() => {
                        const isCurrentlyCompleted = completedExercises.includes(exercise.name);
                        onExerciseToggle(exercise.name, !isCurrentlyCompleted);
                      }}
                      workoutTitle={workout.title}
                      completedExercises={completedExercises}
                      onExerciseToggle={onExerciseToggle}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile-optimized action buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={onCompleteWorkout}
                  disabled={!isWorkoutComplete}
                  className={`
                    w-full h-14 font-semibold transition-all duration-300 text-base touch-manipulation
                    ${isWorkoutComplete 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isWorkoutComplete ? 'Concluir Treino' : `${completedCount}/${totalExercises} Concluídos`}
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full h-12 text-gray-700 border-gray-200 hover:bg-gray-50 text-base touch-manipulation"
                >
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
