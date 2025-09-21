import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, BarChart3, RefreshCw, Scale, Zap } from 'lucide-react';

interface WeeklyDistribution {
  frequency: {
    total: number;
    distribution: string;
    rationale: string;
  };
  recovery: {
    restDays: number;
    pattern: string;
    explanation: string;
  };
  progression: {
    weeklyStructure: string;
    intensityPattern: string;
    adaptation: string;
  };
  muscleBalancing: {
    upperLower: string;
    pushPull: string;
    strategy: string;
  };
}

interface WeeklyDistributionSectionProps {
  weeklyDistribution: WeeklyDistribution;
}

export const WeeklyDistributionSection: React.FC<WeeklyDistributionSectionProps> = ({
  weeklyDistribution
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Distribuição Semanal Estratégica</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Frequency Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Frequência de Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Semanal:</span>
              <Badge variant="secondary">{weeklyDistribution.frequency.total}x / semana</Badge>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-1">Distribuição:</h5>
              <p className="text-xs text-muted-foreground">{weeklyDistribution.frequency.distribution}</p>
            </div>
            <div className="bg-muted/50 p-2 rounded text-xs">
              <strong>Científico:</strong> {weeklyDistribution.frequency.rationale}
            </div>
          </CardContent>
        </Card>

        {/* Recovery Pattern */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-secondary" />
              Padrão de Recuperação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dias de Descanso:</span>
              <Badge variant="outline">{weeklyDistribution.recovery.restDays} dias</Badge>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-1">Padrão:</h5>
              <p className="text-xs text-muted-foreground">{weeklyDistribution.recovery.pattern}</p>
            </div>
            <div className="bg-muted/50 p-2 rounded text-xs">
              <strong>Fisiologia:</strong> {weeklyDistribution.recovery.explanation}
            </div>
          </CardContent>
        </Card>

        {/* Progression Strategy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Estratégia de Progressão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h5 className="text-sm font-semibold mb-1">Estrutura Semanal:</h5>
              <p className="text-xs text-muted-foreground">{weeklyDistribution.progression.weeklyStructure}</p>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-1">Padrão de Intensidade:</h5>
              <p className="text-xs text-muted-foreground">{weeklyDistribution.progression.intensityPattern}</p>
            </div>
            <div className="bg-muted/50 p-2 rounded text-xs">
              <strong>Adaptação:</strong> {weeklyDistribution.progression.adaptation}
            </div>
          </CardContent>
        </Card>

        {/* Muscle Balancing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Balanceamento Muscular
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Superior/Inferior:</strong>
                <p className="text-muted-foreground">{weeklyDistribution.muscleBalancing.upperLower}</p>
              </div>
              <div>
                <strong>Empurrar/Puxar:</strong>
                <p className="text-muted-foreground">{weeklyDistribution.muscleBalancing.pushPull}</p>
              </div>
            </div>
            <div className="bg-muted/50 p-2 rounded text-xs">
              <strong>Estratégia:</strong> {weeklyDistribution.muscleBalancing.strategy}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Visão Geral da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
              <div key={day} className="p-2">
                <div className="font-semibold">{day}</div>
                <div className={`mt-1 p-1 rounded text-xs ${index === 0 ? 'bg-muted text-muted-foreground' : index % 2 === 1 ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                  {index === 0 ? 'Descanso' : index % 2 === 1 ? 'Treino A' : 'Treino B'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};