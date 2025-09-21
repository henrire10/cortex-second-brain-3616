import React, { useState } from 'react';
import { ModernExerciseCard } from './ModernExerciseCard';
import { WorkoutLogModal } from '../WorkoutLogModal';

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

interface ExerciseListViewProps {
  exercises: Exercise[];
  completedExercises: string[];
  onExerciseSelect: (exercise: Exercise) => void;
  onExerciseToggle: (exerciseName: string) => void;
  dailyWorkoutId?: string;
  workoutDate?: string;
}

export const ExerciseListView: React.FC<ExerciseListViewProps> = ({
  exercises,
  completedExercises,
  onExerciseSelect,
  onExerciseToggle,
  dailyWorkoutId,
  workoutDate
}) => {
  const [workoutLogModal, setWorkoutLogModal] = useState<{
    isOpen: boolean;
    exercise: Exercise | null;
  }>({
    isOpen: false,
    exercise: null
  });

  const handleOpenWorkoutLog = (exercise: Exercise) => {
    setWorkoutLogModal({
      isOpen: true,
      exercise
    });
  };

  const handleCloseWorkoutLog = () => {
    setWorkoutLogModal({
      isOpen: false,
      exercise: null
    });
  };

  return (
    <>
      <div 
        className="h-full w-full overflow-y-auto overscroll-contain scrollbar-hide" 
        style={{ 
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        <div className="px-4 py-3 space-y-3 pb-6">
          {exercises.map((exercise, index) => {
            const isCompleted = completedExercises.includes(exercise.name);
            return (
              <ModernExerciseCard
                key={`${exercise.name}-${index}`}
                exercise={exercise}
                isCompleted={isCompleted}
                onToggleComplete={() => onExerciseToggle(exercise.name)}
                onViewDetails={() => onExerciseSelect(exercise)}
                onOpenWorkoutLog={() => handleOpenWorkoutLog(exercise)}
                exerciseIndex={index + 1}
              />
            );
          })}
        </div>
      </div>

      <WorkoutLogModal
        isOpen={workoutLogModal.isOpen}
        onClose={handleCloseWorkoutLog}
        exercise={workoutLogModal.exercise}
        dailyWorkoutId={dailyWorkoutId}
        workoutDate={workoutDate}
      />
    </>
  );
};
