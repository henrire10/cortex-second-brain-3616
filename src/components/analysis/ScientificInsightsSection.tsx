
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Zap, Heart, Moon, Dumbbell, TrendingUp } from 'lucide-react';

interface ScientificInsightsSectionProps {
  profile: any;
  workoutPlan: any;
}

export const ScientificInsightsSection: React.FC<ScientificInsightsSectionProps> = ({
  profile,
  workoutPlan
}) => {
  const getHormonalInsights = () => {
    const age = profile?.age || 25;
    const gender = profile?.gender || 'masculino';
    const experience = profile?.experience_level || 'iniciante';
    
    if (age < 25) {
      return gender === 'feminino' 
        ? "Seu perfil hormonal jovem permite recuperação rápida. Estrogênio e progesterônio otimizam síntese proteica durante fase folicular."
        : "Altos níveis de testosterona e GH natural permitem treinos intensos com recuperação acelerada. Ideal para ganhos rápidos.";
    } else if (age < 40) {
      return gender === 'feminino'
        ? "Perfil hormonal estável permite treinos consistentes. Variações do ciclo menstrual consideradas no planejamento."
        : "Testosterona ainda elevada, mas requer atenção à recuperação. Cortisol deve ser controlado com descanso adequado.";
    } else {
      return gender === 'feminino'
        ? "Pós-menopausa requer foco em força e densidade óssea. Treinos de resistência otimizam hormônios do crescimento."
        : "Declínio natural de testosterona compensado com treinos de força e intervalos de recuperação otimizados.";
    }
  };

  const getRecoveryOptimization = () => {
    const sleepQuality = profile?.sleep_quality || 3;
    const stressLevel = profile?.stress_level || 3;
    const age = profile?.age || 25;

    let recoveryTime = "24-48h";
    let explanation = "Recuperação padrão baseada em";

    if (sleepQuality >= 4 && stressLevel <= 2 && age < 30) {
      recoveryTime = "18-24h";
      explanation = "Recuperação acelerada devido a excelente qualidade do sono e baixo stress";
    } else if (sleepQuality <= 2 || stressLevel >= 4 || age > 45) {
      recoveryTime = "48-72h";
      explanation = "Recuperação prolongada necessária devido a fatores de stress ou idade";
    }

    return { recoveryTime, explanation };
  };

  const getMetabolicInsights = () => {
    const goal = profile?.fitness_goal;
    const activityLevel = profile?.activity_level;
    const age = profile?.age || 25;

    if (goal === 'Perda de peso') {
      return "Protocolo HIIT + força maximiza EPOC (consumo excessivo de oxigênio pós-exercício), mantendo queima calórica por até 24h.";
    } else if (goal === 'Ganho de massa muscular') {
      return "Foco em sobrecarga progressiva ativa mTOR (mechanistic Target of Rapamycin), principal via de síntese proteica muscular.";
    } else {
      return "Combinação balanceada otimiza tanto queima de gordura quanto preservação/ganho de massa magra.";
    }
  };

  const recovery = getRecoveryOptimization();

  return (
    <div className="space-y-4">
      {/* Hormonal Impact */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-blue-600" />
            Impacto Hormonal Personalizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground mb-4">
            {getHormonalInsights()}
          </p>
          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">{profile?.age || 'N/A'}</div>
              <div className="text-xs text-blue-600">Anos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">{profile?.gender === 'feminino' ? '♀' : '♂'}</div>
              <div className="text-xs text-blue-600">Perfil</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Optimization */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5 text-green-600" />
            Otimização de Recuperação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground mb-4">
            {recovery.explanation} para seu perfil específico.
          </p>
          <div className="grid grid-cols-3 gap-3 p-3 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">{recovery.recoveryTime}</div>
              <div className="text-xs text-green-600">Recuperação</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">{profile?.sleep_quality || 3}/5</div>
              <div className="text-xs text-green-600">Sono</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">{profile?.stress_level || 3}/5</div>
              <div className="text-xs text-green-600">Stress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metabolic Insights */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-orange-600" />
            Otimização Metabólica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground mb-4">
            {getMetabolicInsights()}
          </p>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Personalizado para: {profile?.fitness_goal || 'Condicionamento geral'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
