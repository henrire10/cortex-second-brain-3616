import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle, Target } from 'lucide-react';

interface WorkoutActionsProps {
  isWorkoutComplete: boolean;
  completedCount: number;
  totalExercises: number;
  onCompleteWorkout: () => void;
}

export const WorkoutActions: React.FC<WorkoutActionsProps> = ({
  isWorkoutComplete,
  completedCount,
  totalExercises,
  onCompleteWorkout
}) => {
  return (
    <div className="p-6 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-lg">
      <Button
        onClick={onCompleteWorkout}
        disabled={!isWorkoutComplete}
        className={`w-full h-16 text-lg font-black rounded-2xl transition-all duration-500 transform ${
          isWorkoutComplete
            ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white shadow-2xl shadow-emerald-300/50 hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed shadow-lg'
        }`}
      >
        {isWorkoutComplete ? (
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-7 h-7" />
            <div className="flex flex-col items-start">
              <span>Finalizar Treino Completo</span>
              <span className="text-sm font-medium opacity-90">Parabéns! 🎉</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Target className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span>Complete todos os exercícios</span>
              <span className="text-sm font-medium opacity-90">
                Faltam {totalExercises - completedCount} exercícios
              </span>
            </div>
          </div>
        )}
      </Button>
    </div>
  );
};
