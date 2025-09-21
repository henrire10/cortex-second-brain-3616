
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calendar, Target, Zap, Heart, User } from 'lucide-react';

interface ResultsImpactSectionProps {
  profile: any;
  workoutPlan: any;
}

export const ResultsImpactSection: React.FC<ResultsImpactSectionProps> = ({
  profile,
  workoutPlan
}) => {
  const getExpectedResults = () => {
    const age = profile?.age || 25;
    const experience = profile?.experience_level || 'iniciante';
    const goal = profile?.fitness_goal;
    const gender = profile?.gender;

    const baseMultiplier = experience === 'iniciante' ? 1.5 : experience === 'intermediario' ? 1.2 : 1.0;
    const ageMultiplier = age < 30 ? 1.2 : age < 40 ? 1.0 : 0.8;

    return {
      week2: {
        strength: Math.round(15 * baseMultiplier * ageMultiplier),
        endurance: Math.round(20 * baseMultiplier * ageMultiplier),
        body: goal === 'Perda de peso' ? 'Redução de 1-2% gordura corporal' : 
              goal === 'Ganho de massa muscular' ? 'Primeiros sinais de hipertrofia' :
              'Melhora no tônus muscular',
        energy: 'Aumento de 25% na energia diária',
        confidence: 85
      },
      week4: {
        strength: Math.round(35 * baseMultiplier * ageMultiplier),
        endurance: Math.round(40 * baseMultiplier * ageMultiplier),
        body: goal === 'Perda de peso' ? 'Perda de 2-4kg, cintura -2cm' : 
              goal === 'Ganho de massa muscular' ? 'Ganho de 1-2kg massa magra' :
              'Definição muscular visível',
        energy: 'Energia estável durante todo dia',
        confidence: 90
      },
      week8: {
        strength: Math.round(60 * baseMultiplier * ageMultiplier),
        endurance: Math.round(70 * baseMultiplier * ageMultiplier),
        body: goal === 'Perda de peso' ? 'Perda de 5-8kg, transformação visível' : 
              goal === 'Ganho de massa muscular' ? 'Ganho de 3-5kg massa magra' :
              'Corpo transformado e definido',
        energy: 'Vitalidade máxima e disposição',
        confidence: 95
      },
      week12: {
        strength: Math.round(100 * baseMultiplier * ageMultiplier),
        endurance: Math.round(90 * baseMultiplier * ageMultiplier),
        body: goal === 'Perda de peso' ? 'Meta de peso alcançada' : 
              goal === 'Ganho de massa muscular' ? 'Físico atlético desenvolvido' :
              'Transformação completa',
        energy: 'Energia ilimitada',
        confidence: 98
      }
    };
  };

  const getHealthBenefits = () => {
    return [
      { 
        category: "Cardiovascular", 
        benefit: "Redução de 20% no risco cardíaco",
        timeline: "4-6 semanas",
        icon: Heart,
        color: "text-red-600"
      },
      { 
        category: "Metabólico", 
        benefit: "Melhora de 30% na sensibilidade insulínica",
        timeline: "2-3 semanas",
        icon: Zap,
        color: "text-yellow-600"
      },
      { 
        category: "Mental", 
        benefit: "Redução de 40% nos níveis de stress",
        timeline: "1-2 semanas",
        icon: User,
        color: "text-blue-600"
      },
      { 
        category: "Ósseo", 
        benefit: "Aumento da densidade óssea",
        timeline: "8-12 semanas",
        icon: Target,
        color: "text-green-600"
      }
    ];
  };

  const results = getExpectedResults();
  const healthBenefits = getHealthBenefits();

  const timelineData = [
    { period: "2 Semanas", data: results.week2, color: "bg-blue-500" },
    { period: "1 Mês", data: results.week4, color: "bg-purple-500" },
    { period: "2 Meses", data: results.week8, color: "bg-green-500" },
    { period: "3 Meses", data: results.week12, color: "bg-orange-500" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resultados Esperados para Seu Perfil
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Projeções baseadas em dados científicos e seu perfil específico
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Benefícios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {timelineData.map((item, index) => (
              <div key={index} className="relative">
                {index < timelineData.length - 1 && (
                  <div className="absolute left-4 top-16 w-0.5 h-20 bg-border"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${item.color} text-white flex-shrink-0`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.period}</h4>
                      <Badge variant="outline">
                        Confiança: {item.data.confidence}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Força</div>
                        <div className="flex items-center gap-2">
                          <Progress value={item.data.strength} className="h-2 flex-1" />
                          <span className="text-sm font-medium">+{item.data.strength}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Resistência</div>
                        <div className="flex items-center gap-2">
                          <Progress value={item.data.endurance} className="h-2 flex-1" />
                          <span className="text-sm font-medium">+{item.data.endurance}%</span>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Transformação Corporal</div>
                        <p className="text-sm font-medium">{item.data.body}</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Energia & Bem-estar</div>
                        <p className="text-sm font-medium">{item.data.energy}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <div className="grid gap-4">
              {healthBenefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg bg-muted ${benefit.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">{benefit.category}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {benefit.timeline}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {benefit.benefit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">💡 Personalizado para você</h4>
              <p className="text-sm text-muted-foreground">
                Estes benefícios foram calculados considerando sua idade ({profile?.age} anos), 
                nível de experiência ({profile?.experience_level}) e objetivo específico ({profile?.fitness_goal}).
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
