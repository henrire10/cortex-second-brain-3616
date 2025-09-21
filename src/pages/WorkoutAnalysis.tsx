import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Brain, Loader2, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';
import { MobileHeader } from '@/components/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWorkoutAnalysis } from '@/hooks/useWorkoutAnalysis';
import { PersonalizedAnalysisSection } from '@/components/analysis/PersonalizedAnalysisSection';
import { WorkoutSessionAnalysisSection } from '@/components/analysis/WorkoutSessionAnalysisSection';
import { WeeklyDistributionSection } from '@/components/analysis/WeeklyDistributionSection';
import { ProgressionTimelineSection } from '@/components/analysis/ProgressionTimelineSection';
import { ScientificInsightsSection } from '@/components/analysis/ScientificInsightsSection';
import { InteractiveComparisonSection } from '@/components/analysis/InteractiveComparisonSection';
import { ResultsImpactSection } from '@/components/analysis/ResultsImpactSection';
export default function WorkoutAnalysis() {
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();
  const isMobile = useIsMobile();
  const {
    analysisData,
    isLoading
  } = useWorkoutAnalysis();
  const [activeTab, setActiveTab] = useState('overview');
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <MobileHeader title="Análise Científica" onBack={() => navigate('/dashboard')} onMenuToggle={() => {}} showBackButton={true} />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-secondary animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="text-lg font-semibold">Analisando seu treino...</span>
              <p className="text-sm text-muted-foreground">
                Processando dados científicos personalizados
              </p>
            </div>
          </div>
        </div>
      </div>;
  }
  if (!analysisData || !profile) {
    return <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <MobileHeader title="Análise Científica" onBack={() => navigate('/dashboard')} onMenuToggle={() => {}} showBackButton={true} />
        <div className="p-4 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Dados Insuficientes</h2>
            <p className="text-muted-foreground">
              Para realizar a análise científica personalizada, você precisa ter um plano de treino ativo 
              gerado pela nossa IA.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <MobileHeader title="Análise Científica" onBack={() => navigate('/dashboard')} onMenuToggle={() => {}} showBackButton={true} />
      
      <div className="relative">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-secondary p-3 md:p-4">
          <div className="absolute inset-0 opacity-15">
            <div className="w-full h-full bg-grid-pattern"></div>
          </div>
          
          <div className="relative text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <Brain className="h-5 w-5 text-white" />
              <h1 className="text-lg md:text-xl font-bold text-white">Análise Científica</h1>
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
            <p className="text-white/85 max-w-xl mx-auto text-xs md:text-sm">
              Análise científica do seu treino com IA avançada
            </p>
            
            {/* Profile Quick Stats */}
            <div className="grid grid-cols-4 gap-1.5 md:gap-2 mt-3 max-w-lg mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 md:p-2 text-center">
                <div className="text-xs md:text-sm font-bold text-white">{profile.age || 'N/A'}</div>
                <div className="text-xs text-white/70">Anos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 md:p-2 text-center">
                <div className="text-xs md:text-sm font-bold text-white">{analysisData.qualityMetrics.totalExercises}</div>
                <div className="text-xs text-white/70">Exercícios</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 md:p-2 text-center">
                <div className="text-xs md:text-sm font-bold text-white">{analysisData.qualityMetrics.muscleGroupCoverage}</div>
                <div className="text-xs text-white/70">Músculos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 md:p-2 text-center">
                <div className="text-xs md:text-sm font-bold text-white">{analysisData.qualityMetrics.qualityScore}</div>
                <div className="text-xs text-white/70">Score IA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="w-full min-w-max h-10 md:h-12 p-0.5 md:p-1 bg-muted/50 flex justify-start md:justify-center px-[39px] py-[19px] mx-[4px] my-0">
                <TabsTrigger value="overview" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap flex-shrink-0">
                  <Brain className="h-3 w-3" />
                  <span className="hidden xs:inline">Visão Geral</span>
                  <span className="xs:hidden">Geral</span>
                </TabsTrigger>
                <TabsTrigger value="scientific" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap flex-shrink-0">
                  <Lightbulb className="h-3 w-3" />
                  <span className="hidden xs:inline">Científico</span>
                  <span className="xs:hidden">Ciência</span>
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap flex-shrink-0">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden xs:inline">Comparações</span>
                  <span className="xs:hidden">Compare</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap flex-shrink-0">
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden xs:inline">Resultados</span>
                  <span className="xs:hidden">Result.</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Content Area */}
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 space-y-6 max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="space-y-6">
                <PersonalizedAnalysisSection analysisData={analysisData} profile={profile} />
                <WorkoutSessionAnalysisSection workoutSessions={analysisData.workoutSessions} />
                <WeeklyDistributionSection weeklyDistribution={analysisData.weeklyDistribution} />
              </TabsContent>

              <TabsContent value="scientific" className="space-y-6">
                <ScientificInsightsSection profile={profile} workoutPlan={analysisData.workoutPlan} />
                <ProgressionTimelineSection progressionStrategy={analysisData.progressionStrategy} />
              </TabsContent>

              <TabsContent value="comparison" className="space-y-6">
                <InteractiveComparisonSection profile={profile} workoutPlan={analysisData.workoutPlan} />
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                <ResultsImpactSection profile={profile} workoutPlan={analysisData.workoutPlan} />
              </TabsContent>
            </Tabs>

            {/* Back Button */}
            <div className="pb-6">
              <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Calendário
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>;
}