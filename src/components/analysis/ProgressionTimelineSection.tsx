
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, CheckCircle, Target } from 'lucide-react';

interface ProgressionTimelineSectionProps {
  progressionStrategy: {
    week1: string;
    week2: string;
    week4: string;
    week8: string;
  };
}

export const ProgressionTimelineSection: React.FC<ProgressionTimelineSectionProps> = ({
  progressionStrategy
}) => {
  const timelineSteps = [
    {
      week: 'Semana 1',
      title: 'Fase de Adaptação',
      description: progressionStrategy.week1,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      week: 'Semana 2',
      title: 'Progressão Inicial',
      description: progressionStrategy.week2,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      week: 'Semana 4',
      title: 'Consolidação',
      description: progressionStrategy.week4,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      week: 'Semana 8',
      title: 'Resultados Visíveis',
      description: progressionStrategy.week8,
      icon: Target,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Timeline de Progressão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineSteps.map((step, index) => (
            <div key={index} className="relative">
              {index < timelineSteps.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-12 bg-border"></div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${step.color} text-white flex-shrink-0`}>
                  <step.icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={step.textColor}>
                      {step.week}
                    </Badge>
                    <h4 className="font-semibold">{step.title}</h4>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">💡 Dica Importante</h4>
          <p className="text-sm text-muted-foreground">
            Esta progressão foi calculada especificamente para seu perfil. Mantenha consistência 
            e ajuste as cargas conforme sua evolução para maximizar os resultados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
