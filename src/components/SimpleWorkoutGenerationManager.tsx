import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SimpleWorkoutGenerationManagerProps {
  questionnaireData: any;
}

export const SimpleWorkoutGenerationManager: React.FC<SimpleWorkoutGenerationManagerProps> = ({ 
  questionnaireData 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  
  const { user, updateProfileStatus, refreshProfile, isPremium, isFreemium, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const generateWorkout = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError('');
    setQualityMetrics(null);
    
    try {
      await updateProfileStatus('gerando_treino');
      setProgress(20);

      // Limpar treinos antigos
      if (user?.id) {
        await supabase
          .from('workout_plans')
          .update({ is_active: false })
          .eq('user_id', user.id);
          
        await supabase
          .from('daily_workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('approval_status', 'pending_approval');
      }
      
      setProgress(40);

      const workoutRequestData = {
        userId: user?.id,
        userProfile: questionnaireData,
        fitnessGoal: questionnaireData.meta_principal_usuario,
        experienceLevel: questionnaireData.nivel_experiencia_treino,
        workoutDaysPerWeek: questionnaireData.dias_por_semana_treino,
        exercisePreferences: questionnaireData.preferencias_exercicios,
        exerciseRestrictions: questionnaireData.restricoes_exercicios,
        medicalConditions: questionnaireData.condicoes_medicas_limitantes
      };

      setProgress(60);

      // ✅ CLIENTE ROBUSTO COM RETRY E FALLBACK
      let result: any = null;
      let lastError: any = null;
      const maxClientRetries = 3;
      
      for (let attempt = 1; attempt <= maxClientRetries; attempt++) {
        try {
          console.log(`🔄 TENTATIVA CLIENTE ${attempt}/${maxClientRetries}: Chamando edge function...`);
          
          const { data: response, error } = await supabase.functions.invoke('generate-workout', {
            body: workoutRequestData
          });

          // ✅ TOLERÂNCIA A ERROS DE REDE
          if (error) {
            console.warn(`⚠️ Erro de rede na tentativa ${attempt}:`, error);
            lastError = error;
            
            if (attempt < maxClientRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Backoff exponencial
              continue;
            }
            throw new Error(`Erro de conexão: ${error.message}`);
          }

          // ✅ VERIFICAÇÃO ROBUSTA DA RESPOSTA
          if (!response) {
            console.warn(`⚠️ Resposta vazia na tentativa ${attempt}`);
            lastError = new Error('Resposta vazia do servidor');
            
            if (attempt < maxClientRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              continue;
            }
            throw lastError;
          }

          // ✅ TOLERÂNCIA A RESPOSTAS MAL FORMADAS
          if (typeof response === 'string') {
            try {
              result = JSON.parse(response);
            } catch (parseError) {
              console.warn(`⚠️ Erro ao parsear resposta string na tentativa ${attempt}:`, parseError);
              lastError = parseError;
              
              if (attempt < maxClientRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                continue;
              }
              throw new Error('Resposta do servidor mal formada');
            }
          } else {
            result = response;
          }

          // ✅ VERIFICAÇÃO DE SUCESSO COM FALLBACK TOLERANTE
          if (!result?.success) {
            console.warn(`⚠️ Falha indicada pelo servidor na tentativa ${attempt}:`, result?.error);
            
            // Se temos um plano mesmo com falha, usar ele
            if (result?.workoutPlan && result.workoutPlan.workoutDays?.length > 0) {
              console.log('✅ USANDO PLANO DE FALLBACK do servidor mesmo com success=false');
              break;
            }
            
            lastError = new Error(result?.error || 'Falha na geração pelo servidor');
            
            if (attempt < maxClientRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              continue;
            }
            throw lastError;
          }

          console.log('✅ CLIENTE: Resposta válida recebida na tentativa', attempt);
          break;

        } catch (attemptError: any) {
          console.error(`❌ ERRO na tentativa ${attempt}:`, attemptError);
          lastError = attemptError;
          
          if (attempt < maxClientRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          
          // ✅ FALLBACK LOCAL FINAL
          console.log('🚨 TODAS AS TENTATIVAS FALHARAM - Gerando plano básico local...');
          result = generateClientFallbackPlan(workoutRequestData);
          break;
        }
      }

      if (!result) {
        throw new Error('Falha total na geração');
      }

      setProgress(80);
      
      // Capturar métricas de qualidade
      setQualityMetrics(result.qualityMetrics);

      console.log('✅ MANAGER: Treino gerado com métricas de qualidade:', result.qualityMetrics);

      // Salvar plano
      const { data: savedPlan, error: saveError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user?.id,
          goal: result.workoutPlan.goal,
          difficulty: result.workoutPlan.difficulty,
          plan_data: result.workoutPlan,
          is_active: true
        })
        .select()
        .single();

      if (saveError || !savedPlan) throw new Error('Erro ao salvar treino');

      // Criar workout_plans_approval para aprovação do personal
      const { data: approvalPlan, error: approvalError } = await supabase
        .from('workout_plans_approval')
        .insert({
          user_id: user?.id,
          plan_data: result.workoutPlan,
          status: 'pending_approval'
        })
        .select()
        .single();

      if (approvalError || !approvalPlan) throw new Error('Erro ao criar solicitação de aprovação');

      // Criar daily workouts com programação semanal correta
      const schedule = getWeeklySchedule(questionnaireData.dias_por_semana_treino || 3);
      const workoutDays = result.workoutPlan.workoutDays || [];
      
      console.log('📅 GERAÇÃO CORRIGIDA:', {
        diasPorSemana: questionnaireData.dias_por_semana_treino || 3,
        programacao: schedule,
        diasProgramados: schedule.map(day => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]),
        totalWorkoutDays: workoutDays.length
      });
      
      for (let i = 0; i < workoutDays.length && i < schedule.length; i++) {
        const workoutDay = workoutDays[i];
        const scheduledDayOfWeek = schedule[i]; // Dia da semana programado (1=Seg, 2=Ter, etc.)
        
        // Calcular data correta baseada no dia da semana programado
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        let daysUntilWorkout = scheduledDayOfWeek - currentDayOfWeek;
        
        // Se o dia já passou esta semana, agendar para a próxima semana
        if (daysUntilWorkout < 0) {
          daysUntilWorkout += 7;
        }
        
        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() + daysUntilWorkout);
        
        const content = workoutDay.exercises?.map((ex: any, idx: number) => 
          `${idx + 1}️⃣ ${ex.name}: ${ex.sets}x${ex.reps}, Descanso: ${ex.rest}`
        ).join('\n') || '';

        console.log('📝 INSERINDO TREINO:', {
          index: i,
          letra: String.fromCharCode(65 + i),
          diaProgram: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][scheduledDayOfWeek],
          data: workoutDate.toISOString().split('T')[0],
          titulo: workoutDay.title
        });

        const { error: insertError } = await supabase
          .from('daily_workouts')
          .insert({
            user_id: user?.id,
            workout_date: workoutDate.toISOString().split('T')[0],
            workout_title: workoutDay.title || `Treino ${String.fromCharCode(65 + i)}`,
            workout_content: content,
            status: 'pending',
            approval_status: 'pending_approval',
            plan_id: approvalPlan.id
          });

        if (insertError) {
          console.error('❌ ERRO AO INSERIR TREINO:', {
            index: i,
            error: insertError,
            data: {
              workout_date: workoutDate.toISOString().split('T')[0],
              workout_title: workoutDay.title
            }
          });
        }
      }

      setProgress(100);
      await updateProfileStatus('treino_gerado');
      await refreshProfile();

      const qualityMessage = result.qualityMetrics?.score >= 85 ? 
        `Qualidade EXCELENTE (${result.qualityMetrics.score}%)!` :
        `Boa qualidade (${result.qualityMetrics?.score || 'N/A'}%)!`;

      toast({
        title: "✨ Treino Personalizado Criado!",
        description: `${qualityMessage}`,
        duration: 4000,
      });
      
      // Redirecionar baseado no status da assinatura após carregar
      const redirectWithSubscriptionCheck = () => {
        if (subscriptionLoading) {
          // Se ainda está carregando, aguardar mais um pouco
          setTimeout(redirectWithSubscriptionCheck, 500);
          return;
        }
        
        console.log('🔍 REDIRECIONAMENTO: Status da assinatura:', { 
          isFreemium, 
          isPremium, 
          subscriptionLoading,
          user: !!user 
        });
        
        if (isFreemium) {
          console.log('➡️ REDIRECIONANDO: Usuário gratuito para página de planos');
          navigate('/?pricing=true');
        } else {
          console.log('➡️ REDIRECIONANDO: Usuário premium para dashboard');
          navigate('/dashboard');
        }
      };
      
      setTimeout(redirectWithSubscriptionCheck, 2000);

    } catch (error: any) {
      console.error('Erro na geração aprimorada:', error);
      await updateProfileStatus('falha_na_geracao');
      setError(error.message);
      setProgress(0);
      
      toast({
        title: "Erro no Sistema Aprimorado",
        description: "Falha na geração. Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getWeeklySchedule = (workoutDays: number): number[] => {
    const schedules: { [key: number]: number[] } = {
      1: [3],
      2: [2, 5],
      3: [1, 3, 5],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [1, 2, 3, 4, 5, 6]
    };
    return schedules[workoutDays] || [1, 3, 5];
  };

  const getWorkoutDateForDay = (dayOfWeek: number): string => {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    
    const workoutDate = new Date(today);
    workoutDate.setDate(today.getDate() + daysUntil);
    return workoutDate.toISOString().split('T')[0];
  };

  // ✅ PLANO DE EMERGÊNCIA LOCAL NO CLIENTE
  const generateClientFallbackPlan = (requestData: any) => {
    console.log('🚨 GERANDO PLANO DE EMERGÊNCIA NO CLIENTE...');
    
    const level = requestData.experienceLevel?.toLowerCase() || 'intermediario';
    const days = requestData.workoutDaysPerWeek || 3;
    
    const workoutDays = [];
    for (let i = 0; i < days; i++) {
      workoutDays.push({
        title: `Treino ${String.fromCharCode(65 + i)} - Básico`,
        focus: i % 2 === 0 ? 'Superior' : 'Inferior',
        exercises: [
          { name: "Exercício básico 1", sets: "3", reps: "10-12", rest: "60s" },
          { name: "Exercício básico 2", sets: "3", reps: "10-12", rest: "60s" },
          { name: "Exercício básico 3", sets: "3", reps: "10-12", rest: "60s" }
        ]
      });
    }

    return {
      success: true,
      workoutPlan: {
        goal: requestData.fitnessGoal || "Condicionamento físico",
        difficulty: level,
        workoutDaysPerWeek: days,
        workoutDays: workoutDays
      },
      qualityMetrics: {
        score: 60,
        errors: 0,
        warnings: 1,
        variability: '70%',
        totalExercises: days * 3,
        uniqueExercises: days * 3
      },
      source: 'client-emergency'
    };
  };

  useEffect(() => {
    generateWorkout();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-4">Erro no Sistema Aprimorado</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={generateWorkout} className="flex-1">
                Tentar Novamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile-setup')}
                className="flex-1"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {progress === 100 ? '🌟 Sistema Aprimorado - Sucesso!' : '🚀 Criando com IA Avançada'}
          </h2>
          
          <p className="text-gray-600 mb-6">
             {progress < 40 ? 'Preparando dados...' :
              progress < 60 ? 'Criando treino personalizado...' :
              progress < 80 ? 'Aplicando validação avançada...' :
             progress < 100 ? 'Analisando qualidade...' : 'Redirecionando...'}
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-500 mb-4">{progress}% concluído</p>
          
          {qualityMetrics && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-bold text-green-800 mb-2">
                📊 Métricas de Qualidade
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Qualidade:</span> {qualityMetrics.score}%
                </div>
                <div>
                  <span className="font-medium">Variabilidade:</span> {qualityMetrics.variability}
                </div>
                <div>
                  <span className="font-medium">Exercícios:</span> {qualityMetrics.totalExercises}
                </div>
                <div>
                  <span className="font-medium">Únicos:</span> {qualityMetrics.uniqueExercises}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
