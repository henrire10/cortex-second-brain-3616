
import React, { useEffect, useState } from 'react';
import { X, Clock, Target, CheckCircle, Play, Dumbbell, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExerciseCard } from './ExerciseCard';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface MobileWorkoutPanelProps {
  workout: WorkoutDay | null;
  isOpen: boolean;
  completedExercises: string[];
  selectedDay: number | null;
  onClose: () => void;
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onCompleteWorkout: () => void;
}

export const MobileWorkoutPanel: React.FC<MobileWorkoutPanelProps> = ({
  workout,
  isOpen,
  completedExercises,
  selectedDay,
  onClose,
  onExerciseToggle,
  onCompleteWorkout
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!workout) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Médio':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Difícil':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const completedCount = completedExercises.length;
  const totalExercises = workout.exercises.length;
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
  const isWorkoutComplete = completedCount === totalExercises && totalExercises > 0;

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = selectedDay !== null ? weekDays[selectedDay] : '';

  return (
    <>
      {/* Backdrop */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{dayName}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{workout.title}</h2>
                  <p className="text-blue-100 text-sm">{workout.focus}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-1.5 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Info Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">{workout.duration}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                <Target className="w-3 h-3" />
                <span className="text-xs font-medium">{totalExercises} exercícios</span>
              </div>
              <Badge variant="outline" className={getDifficultyColor(workout.difficulty)}>
                {workout.difficulty}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-blue-100">Progresso</span>
                <span className="text-xs font-bold">{completedCount}/{totalExercises}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            {workout.isRestDay ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">😴</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Dia de Descanso</h3>
                <p className="text-gray-600">Aproveite para recuperar suas energias!</p>
              </div>
            ) : (
              <>
                {/* Exercises */}
                <div className="space-y-3 mb-4">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Play className="w-4 h-4 text-blue-600" />
                    Exercícios
                  </h3>
                  
                  <div className="space-y-2">
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

                {/* Action Buttons */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <Button
                    onClick={onCompleteWorkout}
                    disabled={!isWorkoutComplete}
                    className={`
                      w-full h-11 font-semibold transition-all duration-200 text-sm
                      ${isWorkoutComplete 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {isWorkoutComplete ? (
                      <>
                        <Trophy className="w-4 h-4 mr-2" />
                        Finalizar Treino
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Faltam {totalExercises - completedCount} exercícios
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full h-10 text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
