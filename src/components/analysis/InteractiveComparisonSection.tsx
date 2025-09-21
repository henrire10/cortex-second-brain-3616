import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';

interface InteractiveComparisonSectionProps {
  profile: any;
  workoutPlan: any;
}

export const InteractiveComparisonSection: React.FC<InteractiveComparisonSectionProps> = ({
  profile,
  workoutPlan
}) => {
  const [activeComparison, setActiveComparison] = useState<string>('frequency');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const comparisons = {
    frequency: {
      title: "Frequência de Treino",
      current: profile?.workoutDaysPerWeek || 3,
      alternatives: [
        { 
          value: 2, 
          label: "2x semana",
          pros: ["Mais tempo para recuperação", "Ideal para iniciantes"],
          cons: ["Progresso mais lento", "Menor estímulo semanal"],
          effectiveness: 60
        },
        { 
          value: 4, 
          label: "4x semana",
          pros: ["Progresso acelerado", "Maior estímulo"],
          cons: ["Requer mais tempo", "Risco de overtraining"],
          effectiveness: 85
        },
        { 
          value: 5, 
          label: "5x semana",
          pros: ["Máximo estímulo", "Resultados rápidos"],
          cons: ["Alta demanda", "Difícil manutenção"],
          effectiveness: 75
        }
      ],
      currentEffectiveness: 90,
      justification: "3x por semana é otimal para seu perfil, balanceando estímulo e recuperação."
    },
    intensity: {
      title: "Intensidade do Treino",
      current: profile?.experience_level === 'iniciante' ? 'Moderada' : 'Alta',
      alternatives: [
        {
          value: 'Baixa',
          label: "Baixa Intensidade",
          pros: ["Baixo risco de lesão", "Sustentável"],
          cons: ["Progresso lento", "Menos desafiador"],
          effectiveness: 45
        },
        {
          value: 'Muito Alta',
          label: "Intensidade Máxima",
          pros: ["Resultados rápidos", "Máximo estímulo"],
          cons: ["Alto risco", "Difícil recuperação"],
          effectiveness: 70
        }
      ],
      currentEffectiveness: 95,
      justification: "Intensidade ajustada ao seu nível de experiência maximiza resultados com segurança."
    },
    duration: {
      title: "Duração das Sessões",
      current: profile?.sessionDuration || 60,
      alternatives: [
        {
          value: 45,
          label: "45 minutos",
          pros: ["Mais prático", "Mantém foco"],
          cons: ["Menos volume", "Sessões corridas"],
          effectiveness: 75
        },
        {
          value: 90,
          label: "90 minutos",
          pros: ["Maior volume", "Mais exercícios"],
          cons: ["Fadiga mental", "Difícil manutenção"],
          effectiveness: 65
        }
      ],
      currentEffectiveness: 90,
      justification: "60 minutos permite volume adequado sem comprometer qualidade e foco."
    }
  };

  const currentComparison = comparisons[activeComparison as keyof typeof comparisons];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Por que Este Treino é o Melhor para Você?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare seu plano personalizado com outras opções populares
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison Tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(comparisons).map(([key, comp]) => (
            <Button
              key={key}
              variant={activeComparison === key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveComparison(key)}
              className="text-xs"
            >
              {comp.title}
            </Button>
          ))}
        </div>

        {/* Current Choice */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-800">Sua Escolha Otimizada</span>
            </div>
            <Badge className="bg-green-600 text-white">
              {currentComparison.currentEffectiveness}% efetivo
            </Badge>
          </div>
          <div className="text-lg font-bold text-green-700 mb-1">
            {typeof currentComparison.current === 'number' 
              ? `${currentComparison.current}${activeComparison === 'duration' ? ' min' : 'x'}`
              : currentComparison.current}
          </div>
          <Progress value={currentComparison.currentEffectiveness} className="h-2 mb-2" />
          <p className="text-sm text-green-700">
            {currentComparison.justification}
          </p>
        </div>

        {/* Alternatives */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Outras opções consideradas:</h4>
          {currentComparison.alternatives.map((alt, index) => (
            <div key={index} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{alt.label}</span>
                </div>
                <Badge variant="outline">
                  {alt.effectiveness}% efetivo
                </Badge>
              </div>
              <Progress value={alt.effectiveness} className="h-1 mb-2" />
              
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={() => setExpandedSection(expandedSection === `${activeComparison}-${index}` ? null : `${activeComparison}-${index}`)}
              >
                {expandedSection === `${activeComparison}-${index}` ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Ocultar detalhes
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Ver prós e contras
                  </>
                )}
              </Button>

              {expandedSection === `${activeComparison}-${index}` && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-green-700 mb-1">✓ Prós</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {alt.pros.map((pro, i) => (
                        <li key={i}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-red-700 mb-1">✗ Contras</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {alt.cons.map((con, i) => (
                        <li key={i}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
