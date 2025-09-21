import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, Flame, Clock, Dumbbell, Activity, TrendingUp } from 'lucide-react';

interface WorkoutSession {
  id: string;
  title: string;
  focus: string;
  scientificStrategy: string;
  volumeIntensity: string;
  weeklyTiming: string;
  personalAdaptations: string[];
  totalExercises: number;
  estimatedDuration: number;
  primaryMuscleGroups: string[];
  estimatedCalories: number;
  difficultyLevel: string;
}

interface WorkoutSessionAnalysisSectionProps {
  workoutSessions: WorkoutSession[];
}

export const WorkoutSessionAnalysisSection: React.FC<WorkoutSessionAnalysisSectionProps> = ({
  workoutSessions
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'fácil': return 'bg-green-500';
      case 'médio': return 'bg-yellow-500';
      case 'difícil': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getSessionIcon = (title: string) => {
    const letter = title.match(/[ABCDEF]/)?.[0] || 'A';
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
        {letter}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Análise das Sessões de Treino</h3>
      
      {workoutSessions.map((session, index) => (
        <Card key={session.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getSessionIcon(session.title)}
                <div>
                  <CardTitle className="text-base">{session.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{session.focus}</p>
                </div>
              </div>
              <Badge className={`${getDifficultyColor(session.difficultyLevel)} text-white`}>
                {session.difficultyLevel}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-3">
              <div className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                {session.totalExercises} exercícios
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{session.estimatedDuration}min
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                ~{session.estimatedCalories} cal
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {session.primaryMuscleGroups.length} grupos
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Estratégia Científica
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {session.scientificStrategy}
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm text-secondary mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Volume & Intensidade
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {session.volumeIntensity}
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm text-accent mb-2">Adaptações para seu Perfil</h4>
              <div className="flex flex-wrap gap-1">
                {session.personalAdaptations.map((adaptation, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {adaptation}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <strong>Grupos Musculares:</strong> {session.primaryMuscleGroups.join(', ')}
                </div>
                <div>
                  <strong>Posição na Semana:</strong> {session.weeklyTiming}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};