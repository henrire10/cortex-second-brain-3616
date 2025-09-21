
// Interfaces para tipagem correta dos dados de workout plans
export interface WorkoutPlanData {
  workoutDays: WorkoutDay[];
  goal?: string;
  difficulty?: string;
  estimatedCalories?: string;
  qualityScore?: number;
}

export interface WorkoutDay {
  title: string;
  focus: string;
  duration: string;
  difficulty: string;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  weight?: string;
  instructions?: string;
  muscleGroup?: string;
  difficulty?: string;
  estimatedCalories?: number;
}

export interface ApprovePlanResponse {
  success: boolean;
  plan_payout?: number;
  workouts_updated?: number;
  message?: string;
}

export interface UserCompletionPaymentResponse {
  success: boolean;
  payment_amount?: number;
  workouts_approved?: number;
  message?: string;
}
