
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Target, TrendingUp, Zap, Activity, Users, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface PersonalizedAnalysisSectionProps {
  analysisData: any;
  profile: any;
}

export const PersonalizedAnalysisSection: React.FC<PersonalizedAnalysisSectionProps> = ({
  analysisData,
  profile
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['quality']);
  const { qualityMetrics, personalizedInsights, muscleDistribution } = analysisData;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getQualityLevel = (score: number) => {
    if (score >= 90) return { 
      label: 'EXCEPCIONAL', 
      color: 'bg-gradient-to-r from-emerald-500 to-green-600', 
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      description: 'Treino de qualidade mundial'
    };
    if (score >= 80) return { 
      label: 'EXCELENTE', 
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      description: 'Qualidade profissional'
    };
    if (score >= 70) return { 
      label: 'MUITO BOM', 
      color: 'bg-gradient-to-r from-purple-500 to-pink-600',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      description: 'Acima da média'
    };
    if (score >= 60) return { 
      label: 'BOM', 
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      description: 'Qualidade satisfatória'
    };
    return { 
      label: 'REGULAR', 
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      description: 'Pode melhorar'
    };
  };

  const qualityLevel = getQualityLevel(qualityMetrics.qualityScore);

  const getPersonalizedRecommendation = () => {
    const age = profile?.age || 25;
    const experience = profile?.experience_level || 'iniciante';
    const goal = profile?.fitness_goal;

    let recommendation = "Seu treino foi ";
    
    if (qualityMetrics.qualityScore >= 85) {
      recommendation += "perfeitamente calibrado para maximizar seus resultados. ";
    } else {
      recommendation += "cuidadosamente ajustado para seu perfil atual. ";
    }

    if (age < 25) {
      recommendation += "Aproveitamos sua alta capacidade de recuperação jovem. ";
    } else if (age > 40) {
      recommendation += "Priorizamos segurança e sustentabilidade a longo prazo. ";
    }

    if (experience === 'iniciante') {
      recommendation += "Cada exercício foi selecionado para construir uma base sólida.";
    } else {
      recommendation += "Exercícios avançados foram incluídos para maximizar seus ganhos.";
    }

    return recommendation;
  };

  return (
    <div className="space-y-4">
      {/* Quality Overview - Enhanced Mobile First */}
      <Card className={`${qualityLevel.bgColor} border-l-4 border-l-primary overflow-hidden`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              Análise de Qualidade IA
            </CardTitle>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Display - Mobile Optimized */}
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {qualityMetrics.qualityScore}
            </div>
            <div className="text-sm text-muted-foreground mb-2">de 100 pontos</div>
            <Badge className={`${qualityLevel.color} text-white font-semibold px-4 py-1 text-sm`}>
              {qualityLevel.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {qualityLevel.description}
            </p>
          </div>
          
          <Progress value={qualityMetrics.qualityScore} className="h-3 rounded-full" />
          
          {/* Personalized Recommendation */}
          <div className="p-4 bg-white/80 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Personalizado para Você
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {getPersonalizedRecommendation()}
            </p>
          </div>

          {/* Stats Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-xl font-bold text-primary">{qualityMetrics.totalExercises}</div>
              <div className="text-xs text-muted-foreground">Exercícios</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-xl font-bold text-secondary">{qualityMetrics.muscleGroupCoverage}</div>
              <div className="text-xs text-muted-foreground">Grupos Musculares</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-xl font-bold text-accent">{qualityMetrics.uniqueExercises}</div>
              <div className="text-xs text-muted-foreground">Únicos</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-xl font-bold text-muted-foreground">{qualityMetrics.variabilityScore.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Variação</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muscle Distribution - Collapsible for Mobile */}
      <Card>
        <Collapsible 
          open={expandedSections.includes('muscles')} 
          onOpenChange={() => toggleSection('muscles')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5" />
                  Distribuição Muscular Inteligente
                </CardTitle>
                {expandedSections.includes('muscles') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Distribuição otimizada para evitar desequilíbrios musculares e maximizar seus resultados.
              </p>
              <div className="space-y-3">
                {Object.entries(muscleDistribution).map(([muscle, count]) => {
                  const percentage = (count as number) / qualityMetrics.totalExercises * 100;
                  return (
                    <div key={muscle} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-medium text-sm">{muscle}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {String(count)} exercícios ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={percentage} 
                          className="h-2 flex-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Insights Personalizados - Enhanced */}
      <Card>
        <Collapsible 
          open={expandedSections.includes('insights')} 
          onOpenChange={() => toggleSection('insights')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Insights Ultra Personalizados
                </CardTitle>
                {expandedSections.includes('insights') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-2">
                    🎂 Otimização por Idade ({profile?.age} anos)
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {personalizedInsights.ageOptimization}
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-sm text-purple-800 mb-2 flex items-center gap-2">
                    🏆 Adaptação por Experiência ({profile?.experience_level})
                  </h4>
                  <p className="text-sm text-purple-700 leading-relaxed">
                    {personalizedInsights.experienceAdaptation}
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm text-green-800 mb-2 flex items-center gap-2">
                    🎯 Alinhamento com Objetivos
                  </h4>
                  <p className="text-sm text-green-700 leading-relaxed">
                    {personalizedInsights.goalAlignment}
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-sm text-orange-800 mb-2 flex items-center gap-2">
                    📐 Biometria Personalizada
                  </h4>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    {personalizedInsights.biometricConsiderations}
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* AI Process - Simplified for Mobile */}
      <Card>
        <Collapsible 
          open={expandedSections.includes('process')} 
          onOpenChange={() => toggleSection('process')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5" />
                  Processo IA Avançado
                </CardTitle>
                {expandedSections.includes('process') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Tempo de Geração:</span>
                    <Badge variant="secondary">
                      {(qualityMetrics.generationTime / 1000).toFixed(1)}s
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Tokens IA:</span>
                    <Badge variant="secondary">{qualityMetrics.tokensUsed || 0}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Tentativas:</span>
                    <Badge variant="secondary">{qualityMetrics.retryCount + 1}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm">Modelo:</span>
                    <Badge className="bg-primary text-primary-foreground">Gemini 2.5 Pro</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
