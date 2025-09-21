import React from 'react';
import { WeeklyCalendar } from './WeeklyCalendar';

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

interface ImprovedWorkoutSectionProps {
  currentWorkout: any;
  selectedDay: number | null;
  selectedWorkout: WorkoutDay | null;
  completedWorkouts: { [key: string]: boolean };
  approvedWorkouts: { [key: string]: boolean };
  completedExercises: string[];
  onWorkoutSelect: (day: number, workout?: any) => void;
  onExerciseComplete: () => void;
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onCompleteWorkout: () => void;
  onCloseWorkout: () => void;
  onRegenerateWorkout: () => void;
}

export const ImprovedWorkoutSection: React.FC<ImprovedWorkoutSectionProps> = ({
  currentWorkout,
  selectedDay,
  selectedWorkout,
  completedWorkouts,
  approvedWorkouts,
  completedExercises,
  onWorkoutSelect,
  onExerciseComplete,
  onExerciseToggle,
  onCompleteWorkout,
  onCloseWorkout,
  onRegenerateWorkout
}) => {
  console.log('💪 APROVAÇÃO: ImprovedWorkoutSection renderizando com:', {
    hasCurrentWorkout: !!currentWorkout,
    hasSelectedWorkout: !!selectedWorkout,
    completedWorkoutsCount: Object.keys(completedWorkouts).length,
    approvedWorkoutsCount: Object.keys(approvedWorkouts).length,
    selectedDay
  });

  if (!currentWorkout) {
    console.log('⚠️ APROVAÇÃO: Sem treino atual');
    return null;
  }

  return (
    <div className="space-y-6">
      <WeeklyCalendar
        onWorkoutSelect={onWorkoutSelect}
        completedWorkouts={completedWorkouts}
        approvedWorkouts={approvedWorkouts}
        workoutDays={currentWorkout.workoutDays || []}
        selectedDay={selectedDay}
        selectedWorkout={selectedWorkout}
        completedExercises={completedExercises}
        onExerciseToggle={onExerciseToggle}
        onCompleteWorkout={onCompleteWorkout}
        onCloseWorkout={onCloseWorkout}
      />
    </div>
  );
};
