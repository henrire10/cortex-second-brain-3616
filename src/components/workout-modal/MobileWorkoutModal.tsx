
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trophy } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileWorkoutHeader } from './MobileWorkoutHeader';
import { ExerciseSeriesCard } from './ExerciseSeriesCard';
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

interface MobileWorkoutModalProps {
  workout: WorkoutDay;
  isOpen: boolean;
  onClose: () => void;
  completedExercises: string[];
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onExerciseComplete: () => void;
  onCompleteWorkout: () => void;
}

export const MobileWorkoutModal: React.FC<MobileWorkoutModalProps> = ({
  workout,
  isOpen,
  onClose,
  completedExercises,
  onExerciseToggle,
  onExerciseComplete,
  onCompleteWorkout
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const isMobile = useIsMobile();

  const completedCount = workout.exercises?.filter(ex => completedExercises.includes(ex.name)).length || 0;
  const totalExercises = workout.exercises?.length || 0;
  const isWorkoutComplete = completedCount === totalExercises && totalExercises > 0;

  if (selectedExercise) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${isMobile ? 'fixed inset-x-0 bottom-0 top-auto h-screen max-h-screen w-full max-w-none m-0 rounded-t-3xl border-t-4 border-primary/20 animate-in slide-in-from-bottom-full duration-300' : 'max-w-2xl max-h-[90vh] rounded-2xl'} overflow-hidden flex flex-col bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-2xl`}>
          <div className="flex-shrink-0">
            <MobileWorkoutHeader 
              workout={workout}
              onClose={() => setSelectedExercise(null)}
              completedCount={completedCount}
              totalExercises={totalExercises}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedExercise.name}</h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedExercise.sets}</div>
                    <div className="text-xs text-blue-600 font-medium">SÉRIES</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{selectedExercise.reps}</div>
                    <div className="text-xs text-purple-600 font-medium">REPS</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{selectedExercise.rest}</div>
                    <div className="text-xs text-orange-600 font-medium">DESCANSO</div>
                  </div>
                </div>
              </div>
            </div>

            <ExerciseGifDisplay
              exerciseName={selectedExercise.name}
              videoKeywords={selectedExercise.videoKeywords}
              className="mb-4"
            />

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Como executar:</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                {selectedExercise.instructions || 'Instruções não disponíveis.'}
              </p>
            </div>

            {selectedExercise.tips && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Dicas importantes:</h3>
                <p className="text-green-700 text-sm">{selectedExercise.tips}</p>
              </div>
            )}

            {selectedExercise.commonMistakes && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">Erros comuns:</h3>
                <p className="text-red-700 text-sm">{selectedExercise.commonMistakes}</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-4 bg-white border-t">
            <Button
              onClick={() => {
                const isCompleted = completedExercises.includes(selectedExercise.name);
                onExerciseToggle(selectedExercise.name, !isCompleted);
                if (!isCompleted) {
                  onExerciseComplete();
                }
              }}
              className={`w-full h-12 text-base font-semibold rounded-xl ${
                completedExercises.includes(selectedExercise.name)
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {completedExercises.includes(selectedExercise.name) ? 'Concluído' : 'Marcar como Concluído'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'fixed inset-x-0 bottom-0 top-auto h-screen max-h-screen w-full max-w-none m-0 rounded-t-3xl border-t-4 border-primary/20 animate-in slide-in-from-bottom-full duration-300' : 'max-w-4xl max-h-[90vh] rounded-2xl'} overflow-hidden flex flex-col bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-2xl`}>
        <div className="flex-shrink-0">
          <MobileWorkoutHeader 
            workout={workout}
            onClose={onClose}
            completedCount={completedCount}
            totalExercises={totalExercises}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-3">
            {workout.exercises?.map((exercise, index) => {
              const isCompleted = completedExercises.includes(exercise.name);
              return (
                <ExerciseSeriesCard
                  key={`${exercise.name}-${index}`}
                  exercise={exercise}
                  isCompleted={isCompleted}
                  onToggleComplete={() => {
                    onExerciseToggle(exercise.name, !isCompleted);
                    if (!isCompleted) {
                      onExerciseComplete();
                    }
                  }}
                  onViewDetails={() => setSelectedExercise(exercise)}
                />
              );
            })}
          </div>
        </div>

        {/* Fixed bottom action */}
        <div className="flex-shrink-0 p-4 bg-white border-t shadow-lg">
          <Button
            onClick={() => {
              onCompleteWorkout();
              onClose();
            }}
            disabled={!isWorkoutComplete}
            className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
              isWorkoutComplete
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isWorkoutComplete ? (
              <>
                <Trophy className="w-6 h-6 mr-2" />
                Finalizar Treino Completo
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 mr-2" />
                Faltam {totalExercises - completedCount} exercícios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
