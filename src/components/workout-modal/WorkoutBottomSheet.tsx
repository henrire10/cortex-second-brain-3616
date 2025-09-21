
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { WorkoutHeader } from './WorkoutHeader';
import { ExerciseListView } from './ExerciseListView';
import { ExerciseDetailView } from './ExerciseDetailView';
import { WorkoutActions } from './WorkoutActions';

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

interface WorkoutBottomSheetProps {
  workout: WorkoutDay;
  isOpen: boolean;
  onClose: () => void;
  completedExercises: string[];
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onExerciseComplete: () => void;
  onCompleteWorkout: () => void;
  dailyWorkoutId?: string;
}

export const WorkoutBottomSheet: React.FC<WorkoutBottomSheetProps> = ({
  workout,
  isOpen,
  onClose,
  completedExercises,
  onExerciseToggle,
  onExerciseComplete,
  onCompleteWorkout,
  dailyWorkoutId
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const completedCount = workout.exercises?.filter(ex => completedExercises.includes(ex.name)).length || 0;
  const totalExercises = workout.exercises?.length || 0;
  const isWorkoutComplete = completedCount === totalExercises && totalExercises > 0;

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
  };

  const handleExerciseToggle = (exerciseName: string) => {
    const isCompleted = completedExercises.includes(exerciseName);
    onExerciseToggle(exerciseName, !isCompleted);
    if (!isCompleted) {
      onExerciseComplete();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-screen max-h-screen w-full p-0 m-0 rounded-t-2xl border-0 bg-gradient-to-b from-background to-background/98 backdrop-blur-xl shadow-2xl flex flex-col"
        style={{ 
          height: '100dvh',
          maxHeight: '100dvh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
        // Disable the default close button to prevent conflicts
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={onClose}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 z-20">
          <WorkoutHeader
            workout={workout}
            onClose={selectedExercise ? handleBackToList : onClose}
            completedCount={completedCount}
            totalExercises={totalExercises}
            showBackButton={!!selectedExercise}
          />
        </div>

        {/* Content - Scrollable with precise height calculation */}
        <div 
          className="flex-1 min-h-0 overflow-hidden"
          style={{ 
            height: selectedExercise 
              ? 'calc(100dvh - 80px)' // Header height
              : 'calc(100dvh - 80px - 100px)' // Header + Actions height
          }}
        >
          {selectedExercise ? (
            <ExerciseDetailView
              exercise={selectedExercise}
              isCompleted={completedExercises.includes(selectedExercise.name)}
              onToggleComplete={() => handleExerciseToggle(selectedExercise.name)}
            />
          ) : (
            <ExerciseListView
              exercises={workout.exercises || []}
              completedExercises={completedExercises}
              onExerciseSelect={handleExerciseSelect}
              onExerciseToggle={handleExerciseToggle}
              dailyWorkoutId={dailyWorkoutId}
              workoutDate={workout.workoutDate}
            />
          )}
        </div>

        {/* Actions - Fixed at bottom */}
        {!selectedExercise && (
          <div className="flex-shrink-0 z-20 bg-background border-t">
            <WorkoutActions
              isWorkoutComplete={isWorkoutComplete}
              completedCount={completedCount}
              totalExercises={totalExercises}
              onCompleteWorkout={() => {
                onCompleteWorkout();
                onClose();
              }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
