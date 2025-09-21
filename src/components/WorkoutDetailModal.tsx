
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { WorkoutBottomSheet } from './workout-modal/WorkoutBottomSheet';

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

interface WorkoutDetailModalProps {
  workout: WorkoutDay;
  isOpen: boolean;
  onClose: () => void;
  completedExercises: string[];
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onExerciseComplete: () => void;
  onCompleteWorkout: () => void;
  dailyWorkoutId?: string;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = (props) => {
  const isMobile = useIsMobile();

  // Usar o novo WorkoutBottomSheet para uma experiência moderna
  return <WorkoutBottomSheet {...props} />;
};
