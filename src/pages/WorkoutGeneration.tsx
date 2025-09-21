
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleWorkoutGenerationManager } from '@/components/SimpleWorkoutGenerationManager';

const WorkoutGeneration = () => {
  const location = useLocation();
  const { user, profile, isLoading } = useAuth();
  
  const questionnaireData = location.state?.questionnaireData;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!questionnaireData) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  if (profile?.profile_status === 'treino_gerado') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <SimpleWorkoutGenerationManager questionnaireData={questionnaireData} />;
};

export default WorkoutGeneration;
