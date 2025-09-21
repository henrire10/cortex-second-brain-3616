import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WeeklyCalendar } from './WeeklyCalendar';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import { WorkoutTimer } from './WorkoutTimer';
import { WorkoutHistoryPage } from './WorkoutHistoryPage';
import { MeasurementsModal } from './MeasurementsModal';
import { GoalsModal } from './GoalsModal';
import { WhatsAppSettings } from './WhatsAppSettings';
import { SubscriptionManager } from './SubscriptionManager';
import { SimpleWorkoutCard } from './SimpleWorkoutCard';
import { ProgressChart } from './ProgressChart';
import { EditProfileModal } from './EditProfileModal';
import { MobileAdvancedBodyMeasurements } from './MobileAdvancedBodyMeasurements';
import { WorkoutStreakCard } from './WorkoutStreakCard';
import { FreemiumPlanPromotion } from './FreemiumPlanPromotion';
import { Button } from './ui/button';
import { Brain, Microscope } from 'lucide-react';
import WorkoutEvolution from '@/pages/WorkoutEvolution';
import { convertDBToAdvanced } from '@/utils/measurementDataAdapter';
import { useAuth } from '@/contexts/AuthContext';

interface MobileDashboardContentProps {
  activeItem: string;
  currentWorkout: any;
  selectedDay: number | null;
  selectedWorkout: any;
  completedWorkouts: { [key: string]: boolean };
  approvedWorkouts: { [key: string]: boolean };
  completedExercises: string[];
  measurements: any[];
  isGeneratingWorkout: boolean;
  generationProgress: number;
  workoutStats: any;
  onWorkoutSelect: (day: number, workout?: any) => void;
  onExerciseComplete: () => void;
  onExerciseToggle: (exerciseName: string, isCompleted: boolean) => void;
  onCompleteWorkout: () => void;
  onAddMeasurement: (measurement: any) => void;
  onCloseWorkout: () => void;
  onGenerateWorkout: () => void;
  shouldShowGenerator: boolean;
}

export const MobileDashboardContent: React.FC<MobileDashboardContentProps> = ({
  activeItem,
  currentWorkout,
  selectedDay,
  selectedWorkout,
  completedWorkouts,
  approvedWorkouts,
  completedExercises,
  measurements,
  isGeneratingWorkout,
  generationProgress,
  workoutStats,
  onWorkoutSelect,
  onExerciseComplete,
  onExerciseToggle,
  onCompleteWorkout,
  onAddMeasurement,
  onCloseWorkout,
  onGenerateWorkout,
  shouldShowGenerator
}) => {
  const navigate = useNavigate();
  const { profile, isFreemium } = useAuth();
  
  console.log('📱 DASHBOARD CONTENT: activeItem atual:', activeItem);

  const renderContent = () => {
    console.log('📱 DASHBOARD CONTENT: Renderizando conteúdo para:', activeItem);
    
    switch (activeItem) {
      case 'calendar':
        return (
          <div className="p-4 space-y-4">
            {/* Workout Streak Card - High engagement gamification */}
            <WorkoutStreakCard 
              currentStreak={profile?.current_workout_streak || 0}
              className="mb-4"
            />

            {/* Show plan promotion for freemium users */}
            {isFreemium && (
              <FreemiumPlanPromotion />
            )}

            {shouldShowGenerator && (
              <SimpleWorkoutCard
                isGenerating={isGeneratingWorkout}
                progress={generationProgress}
                onGenerate={onGenerateWorkout}
              />
            )}
            
            {/* Always render WeeklyCalendar - it has its own data fetching */}
            <WeeklyCalendar
              onWorkoutSelect={onWorkoutSelect}
              completedWorkouts={completedWorkouts}
              approvedWorkouts={approvedWorkouts}
              workoutDays={currentWorkout?.workoutDays || []}
            />
            
            {/* Only show Scientific Analysis button if we have a current workout */}
            {currentWorkout && (
              <div className="mt-4">
                <Button
                  onClick={() => navigate('/workout-analysis')}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                  size="lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Brain className="h-5 w-5" />
                    <div className="text-center">
                      <div className="text-sm font-bold">Análise Científica</div>
                      <div className="text-xs opacity-90">Por que este treino é ideal para você</div>
                    </div>
                    <Microscope className="h-5 w-5" />
                  </div>
                </Button>
              </div>
            )}
            
            {selectedWorkout && selectedDay !== null && (
              <WorkoutDetailModal
                isOpen={!!selectedWorkout}
                onClose={onCloseWorkout}
                workout={selectedWorkout}
                completedExercises={completedExercises}
                onExerciseToggle={onExerciseToggle}
                onExerciseComplete={onExerciseComplete}
                onCompleteWorkout={onCompleteWorkout}
              />
            )}
          </div>
        );

      case 'stats':
        return (
          <div className="p-4">
            <ProgressChart workoutStats={workoutStats} />
          </div>
        );

      case 'timer':
        return (
          <div className="p-4">
            <WorkoutTimer />
          </div>
        );

      case 'measurements':
        return (
          <div className="h-full min-h-0 overflow-visible">
            <MobileAdvancedBodyMeasurements
              measurements={convertDBToAdvanced(measurements, profile?.gender)}
              onAddMeasurement={onAddMeasurement}
            />
          </div>
        );

      case 'goals':
        return (
          <div className="p-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Metas</h2>
              <p className="text-gray-600">Configure suas metas de treino aqui.</p>
            </div>
          </div>
        );

      case 'achievements':
        navigate('/achievements');
        return null;

      case 'ranking':
        navigate('/ranking');
        return null;

      case 'workout-history':
        console.log('📱 DASHBOARD CONTENT: Renderizando WorkoutHistoryPage');
        return (
          <div className="h-full">
            <WorkoutHistoryPage />
          </div>
        );

      case 'whatsapp':
        return (
          <div className="p-4">
            <WhatsAppSettings />
          </div>
        );

      case 'subscription':
        return (
          <div className="p-4">
            <SubscriptionManager />
          </div>
        );

      case 'evolution':
        return (
          <div className="w-full">
            <WorkoutEvolution />
          </div>
        );

      case 'photo-evolution':
        navigate('/photo-evolution');
        return null;

      default:
        return (
          <div className="p-4 space-y-4">
            {/* Show plan promotion for freemium users */}
            {isFreemium && (
              <FreemiumPlanPromotion />
            )}

            {shouldShowGenerator && (
              <SimpleWorkoutCard
                isGenerating={isGeneratingWorkout}
                progress={generationProgress}
                onGenerate={onGenerateWorkout}
              />
            )}
            
            {/* Always render WeeklyCalendar - it has its own data fetching */}
            <WeeklyCalendar
              onWorkoutSelect={onWorkoutSelect}
              completedWorkouts={completedWorkouts}
              approvedWorkouts={approvedWorkouts}
              workoutDays={currentWorkout?.workoutDays || []}
            />
            
            {/* Only show Scientific Analysis button if we have a current workout */}
            {currentWorkout && (
              <div className="mt-4">
                <Button
                  onClick={() => navigate('/workout-analysis')}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                  size="lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Brain className="h-5 w-5" />
                    <div className="text-center">
                      <div className="text-sm font-bold">Análise Científica</div>
                      <div className="text-xs opacity-90">Por que este treino é ideal para você</div>
                    </div>
                    <Microscope className="h-5 w-5" />
                  </div>
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return <div className={`flex-1 h-full min-h-0 ${activeItem === 'measurements' ? 'overflow-y-auto scrollbar-hide [-webkit-overflow-scrolling:touch]' : 'overflow-auto'}`}>{renderContent()}</div>;
};
