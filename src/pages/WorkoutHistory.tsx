import React from 'react';
import { WorkoutHistoryPage } from '@/components/WorkoutHistoryPage';
import { Header } from '@/components/Header';
import { MobileHeader } from '@/components/MobileHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader 
          title="Histórico de Treinos"
          showBackButton={true}
          onBack={handleBack}
        />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Histórico de Treinos
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe todos os seus treinos concluídos e veja seu progresso ao longo do tempo.
            </p>
          </div>
          
          <WorkoutHistoryPage />
        </div>
      </main>
    </div>
  );
};

export default WorkoutHistory;