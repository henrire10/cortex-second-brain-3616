
// ✅ TIPOS SIMPLIFICADOS PARA GERAÇÃO DIRETA

export interface WorkoutRequestData {
  userId?: string;
  userProfile?: any;
  fitnessGoal?: string;
  experienceLevel?: string;
  workoutDaysPerWeek?: number;
  workoutPreferences?: string[];
  exercisePreferences?: string;
  exerciseRestrictions?: string;
  medicalConditions?: string;
  weekNumber?: number;
  forceRegenerate?: boolean;
  source?: string;
}

export interface UserProfile {
  // Dados básicos obrigatórios
  age: number;
  gender: string;
  weight: number;
  height: number;
  
  // Dados de saúde e composição corporal
  bmi: number;
  bmiCategory: string;
  cardioNecessity: string;
  
  // Dados de treino obrigatórios
  workoutDaysPerWeek: number;
  experienceLevel: string;
  fitnessGoal: string;
  workoutDuration: number;
  workoutPreferences: string[];
  
  // Dados de estilo de vida
  activityLevel: string;
  commitmentLevel: string;
  sleepQuality: number;
  sleepHours: number;
  stressLevel: number;
  waterIntake: string;
  
  // Dados de alimentação
  dietaryRestrictions: string[];
  favoriteFoods: string[];
  avoidedFoods: string[];
  mealsPerDay: number;
  
  // Dados específicos de exercício
  exerciseRestrictions: string;
  exercisePreferences: string;
  medicalConditions: string;
  specificGoal: string;
  
  // Dados adicionais opcionais
  culinarySkill?: string;
  cookingTime?: string;
  supplementInterest?: string[];
}

export interface ExerciseSpecifications {
  minExercises: number;
  maxExercises: number;
  minSets: number;
  maxSets: number;
  restTime: string;
}

export interface WorkoutPlan {
  goal: string;
  difficulty: string;
  workoutDaysPerWeek: number;
  estimatedCalories?: number;
  weekNumber?: number;
  workoutDays: WorkoutDay[];
}

export interface WorkoutDay {
  title: string;
  focus: string;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  estimatedCalories?: number;
  muscleGroup?: string;
  instructions?: string;
}
