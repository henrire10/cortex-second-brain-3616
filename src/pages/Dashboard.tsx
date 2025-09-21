import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { MobileDashboardContent } from '@/components/MobileDashboardContent';
import { MobileBottomTabBar } from '@/components/MobileBottomTabBar';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileDashboardSidebar } from '@/components/MobileDashboardSidebar';
import { EditProfileModal } from '@/components/EditProfileModal';
import { useWorkoutData } from '@/hooks/useWorkoutData';
import { useWorkoutCompletion } from '@/hooks/useWorkoutCompletion';

// Lazy load the heavy components to avoid hook conflicts
const WorkoutEvolution = lazy(() => import('@/pages/WorkoutEvolution'));
const Activity = lazy(() => import('@/pages/Activity'));
const Ranking = lazy(() => import('@/pages/Ranking').then(module => ({ default: module.Ranking })));
const StorePage = lazy(() => import('@/pages/StorePage'));

const Dashboard = () => {
  // Early return pattern to avoid conditional hooks
  const { user, isLoading, logout, profile } = useAuth();
  const navigate = useNavigate();
  const { isPersonalTrainer, loading: personalTrainerLoading } = usePersonalTrainer();
  const [activeTab, setActiveTab] = useState<'calendar' | 'store' | 'activity' | 'ranking' | 'edit-profile'>('calendar');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const { currentWorkout, refreshWorkout, isGeneratingWorkout: generatingWorkout } = useWorkoutData();
  const { completedWorkouts, completeWorkout } = useWorkoutCompletion();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Handle activeTab changes that require side effects
  useEffect(() => {
    if (activeTab === 'edit-profile') {
      setShowEditProfileModal(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, isLoading]);

  // Personal trainer redirection
  useEffect(() => {
    if (user && !personalTrainerLoading && isPersonalTrainer) {
      console.log('🔄 Redirecionando personal trainer para dashboard profissional');
      navigate('/personal-dashboard', { replace: true });
    }
  }, [user, isPersonalTrainer, personalTrainerLoading, navigate]);

  // Control scroll behavior for activity page
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (activeTab === 'activity') {
        root.classList.add('activity-mode');
      } else {
        root.classList.remove('activity-mode');
      }
    }
    
    // Cleanup on unmount
    return () => {
      const root = document.getElementById('root');
      if (root) {
        root.classList.remove('activity-mode');
      }
    };
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Handlers for workout interactions
  const handleWorkoutSelect = (day: number, workout?: any) => {
    setSelectedDay(day);
    setSelectedWorkout(workout ?? currentWorkout?.workoutDays?.[day] ?? null);
  };

  const handleCloseWorkout = () => {
    setSelectedDay(null);
    setSelectedWorkout(null);
  };

  const handleExerciseToggle = (exerciseName: string, isCompleted: boolean) => {
    setCompletedExercises(prev =>
      isCompleted ? [...prev, exerciseName] : prev.filter(e => e !== exerciseName)
    );
  };

  const handleExerciseComplete = () => {
    console.log('✅ Exercise completed');
  };

  const handleCompleteWorkout = async () => {
    if (!selectedWorkout?.workoutDate) {
      console.error('Missing workout date');
      return;
    }

    const success = await completeWorkout(selectedWorkout.workoutDate, selectedWorkout);
    
    if (success) {
      // Fecha painel/modal
      handleCloseWorkout();
      // Zerar exercícios marcados
      setCompletedExercises([]);
    }
  };

  const handleAddMeasurement = (measurement: any) => {
    console.log('📝 Measurement added', measurement);
  };

  const handleGenerateWorkout = () => {
    refreshWorkout?.();
  };

  const renderContent = () => {
    const LoadingSpinner = () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );

    switch (activeTab) {
      case 'calendar':
        return (
          <MobileDashboardContent 
            activeItem="calendar"
            currentWorkout={currentWorkout}
            selectedDay={selectedDay}
            selectedWorkout={selectedWorkout}
            completedWorkouts={completedWorkouts}
            approvedWorkouts={{}}
            completedExercises={completedExercises}
            measurements={[]}
            isGeneratingWorkout={!!generatingWorkout}
            generationProgress={0}
            workoutStats={{ totalWorkouts: 0, currentStreak: 0, weeklyGoal: 3, completedThisWeek: 0 }}
            onWorkoutSelect={handleWorkoutSelect}
            onExerciseComplete={handleExerciseComplete}
            onExerciseToggle={handleExerciseToggle}
            onCompleteWorkout={handleCompleteWorkout}
            onAddMeasurement={handleAddMeasurement}
            onCloseWorkout={handleCloseWorkout}
            onGenerateWorkout={handleGenerateWorkout}
            shouldShowGenerator={false}
          />
        );
      case 'store':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <StorePage />
          </Suspense>
        );
      case 'activity':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Activity onExit={() => setActiveTab('calendar')} />
          </Suspense>
        );
      case 'ranking':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Ranking />
          </Suspense>
        );
      case 'edit-profile':
        return (
          <MobileDashboardContent 
            activeItem="calendar"
            currentWorkout={currentWorkout}
            selectedDay={selectedDay}
            selectedWorkout={selectedWorkout}
            completedWorkouts={completedWorkouts}
            approvedWorkouts={{}}
            completedExercises={completedExercises}
            measurements={[]}
            isGeneratingWorkout={!!generatingWorkout}
            generationProgress={0}
            workoutStats={{ totalWorkouts: 0, currentStreak: 0, weeklyGoal: 3, completedThisWeek: 0 }}
            onWorkoutSelect={handleWorkoutSelect}
            onExerciseComplete={handleExerciseComplete}
            onExerciseToggle={handleExerciseToggle}
            onCompleteWorkout={handleCompleteWorkout}
            onAddMeasurement={handleAddMeasurement}
            onCloseWorkout={handleCloseWorkout}
            onGenerateWorkout={handleGenerateWorkout}
            shouldShowGenerator={false}
          />
        );
      default:
        return (
          <MobileDashboardContent 
            activeItem="calendar"
            currentWorkout={currentWorkout}
            selectedDay={selectedDay}
            selectedWorkout={selectedWorkout}
            completedWorkouts={completedWorkouts}
            approvedWorkouts={{}}
            completedExercises={completedExercises}
            measurements={[]}
            isGeneratingWorkout={!!generatingWorkout}
            generationProgress={0}
            workoutStats={{ totalWorkouts: 0, currentStreak: 0, weeklyGoal: 3, completedThisWeek: 0 }}
            onWorkoutSelect={handleWorkoutSelect}
            onExerciseComplete={handleExerciseComplete}
            onExerciseToggle={handleExerciseToggle}
            onCompleteWorkout={handleCompleteWorkout}
            onAddMeasurement={handleAddMeasurement}
            onCloseWorkout={handleCloseWorkout}
            onGenerateWorkout={handleGenerateWorkout}
            shouldShowGenerator={false}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check if workout modal is open
  const isWorkoutModalOpen = selectedDay !== null && selectedWorkout !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile - Only show when workout modal is NOT open */}
      {!isWorkoutModalOpen && (
        <MobileHeader 
          onMenuToggle={() => setShowMobileSidebar(!showMobileSidebar)}
          title={activeTab === 'activity' ? 'Corrida' : 'Painel'}
          onBack={activeTab === 'activity' ? () => setActiveTab('calendar') : undefined}
        />
      )}

      {/* Conteúdo Principal */}
      <main className={isWorkoutModalOpen ? "pb-0" : "pb-20"}>
        {renderContent()}
      </main>

      {/* Tab Bar Inferior - Only show when workout modal is NOT open */}
      {!isWorkoutModalOpen && (
        <MobileBottomTabBar
          activeKey={activeTab}
          onSelect={setActiveTab}
          avatarUrl={profile?.profile_picture_url}
        />
      )}

      {/* Modal de Edição de Perfil */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => {
          setShowEditProfileModal(false);
          setActiveTab('calendar');
        }}
      />

      {/* Sidebar Mobile - Only show when workout modal is NOT open */}
      {!isWorkoutModalOpen && (
        <MobileDashboardSidebar
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          activeItem={activeTab}
          onItemSelect={(key) => {
            setShowMobileSidebar(false);
            if (key === 'achievements') {
              navigate('/achievements');
            } else if (key === 'measurements') {
              navigate('/measurements');
            } else if (key === 'calendar' || key === 'store' || key === 'activity' || key === 'ranking' || key === 'edit-profile') {
              setActiveTab(key as 'calendar' | 'store' | 'activity' | 'ranking' | 'edit-profile');
            } else if (key === 'evolution') {
              // Navegação para WorkoutEvolution via lazy load inline
              const WorkoutEvolution = lazy(() => import('@/pages/WorkoutEvolution'));
              navigate('/workout-evolution');
            } else {
              setActiveTab('calendar');
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;