import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WelcomeModule } from '@/components/questionnaire/WelcomeModule';
import { ObjectivesModule } from '@/components/questionnaire/ObjectivesModule';
import { PersonalInfoModule } from '@/components/questionnaire/PersonalInfoModule';
import { BodyMeasurementsModule } from '@/components/questionnaire/BodyMeasurementsModule';
import { WorkoutModule } from '@/components/questionnaire/WorkoutModule';
import { LifestyleModule } from '@/components/questionnaire/LifestyleModule';
import { FinalModule } from '@/components/questionnaire/FinalModule';
import { convertQuestionnaireToMeasurement, convertAdvancedToDB } from '@/utils/measurementDataAdapter';
import { scrollToTopSmooth, scrollToTopInstant } from '@/utils/scrollUtils';

export interface QuestionnaireData {
  // Módulo 1: Boas-vindas
  consentimento_inicial: boolean;
  
  // Módulo 2: Objetivos
  meta_principal_usuario: string;
  meta_especifica_texto?: string;
  nivel_comprometimento_objetivo: string;
  
  // Módulo 3: Informações Pessoais
  idade: number;
  genero: string;
  genero_outro_texto?: string;
  altura_cm: number;
  peso_kg: number;
  nivel_atividade_diaria: string;
  
  // Módulo 4: Medidas Corporais
  medidas_peito?: number;
  medidas_barriga?: number;
  medidas_quadril?: number;
  medidas_pescoco?: number; // ✅ ADICIONADO: neck measurement
  medidas_biceps_direito?: number;
  medidas_biceps_esquerdo?: number;
  medidas_antebraco_direito?: number;
  medidas_antebraco_esquerdo?: number;
  medidas_coxa_direita?: number;
  medidas_coxa_esquerda?: number;
  medidas_panturrilha_direita?: number;
  medidas_panturrilha_esquerda?: number;
  
  // Módulo 5: Treino
  nivel_experiencia_treino: string;
  dias_por_semana_treino: number;
  duracao_sessao_treino_minutos: number;
  disponibilidade_equipamentos: string[];
  preferencias_exercicios?: string;
  restricoes_exercicios?: string;
  condicoes_medicas_limitantes?: string;
  
  // Módulo 6: Estilo de Vida (simplificado)
  qualidade_sono_percebida: number;
  media_horas_sono: number;
  nivel_estresse_percebido: number;
}

export interface ProfileData {
  age: number;
  gender: 'masculino' | 'feminino' | 'outro';
  fitnessGoal: string;
  experienceLevel: 'iniciante' | 'intermediario' | 'avancado';
  height: number;
  weight: number;
  waist: number;
  hip: number;
  workoutPreferences: string[];
  createdAt: string;
  hasWorkoutPlan: boolean;
  profileCompleted: boolean;
}

const ProfileSetup = () => {
  const [currentModule, setCurrentModule] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>({
    consentimento_inicial: false,
    meta_principal_usuario: '',
    nivel_comprometimento_objetivo: '',
    idade: 0,
    genero: '',
    altura_cm: 0,
    peso_kg: 0,
    nivel_atividade_diaria: '',
    nivel_experiencia_treino: '',
    dias_por_semana_treino: 3,
    duracao_sessao_treino_minutos: 60,
    disponibilidade_equipamentos: [],
    qualidade_sono_percebida: 3,
    media_horas_sono: 8,
    nivel_estresse_percebido: 3
  });

  const { user, updateProfile, updateProfileStatus } = useAuth();
  const navigate = useNavigate();

  // Forçar scroll para o topo quando a página carrega
  useEffect(() => {
    scrollToTopInstant();
  }, []);

  // Scroll para o topo quando muda de módulo ou step
  useEffect(() => {
    scrollToTopSmooth();
  }, [currentModule, currentStep]);

  const totalModules = 6; // Simplificado: removidas perguntas de alimentação
  const getStepsForModule = (module: number) => {
    switch (module) {
      case 1: return 1; // Boas-vindas
      case 2: return 3; // Objetivos
      case 3: return 3; // Informações Pessoais
      case 4: return 1; // Medidas Corporais
      case 5: return 4; // Treino
      case 6: return 2; // Estilo de vida (simplificado: sono + estresse)
      default: return 1;
    }
  };

  const updateData = (newData: Partial<QuestionnaireData>) => {
    setQuestionnaireData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    const maxSteps = getStepsForModule(currentModule);
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentModule < totalModules) {
      setCurrentModule(currentModule + 1);
      setCurrentStep(1);
    } else {
      // Último módulo, finalizar
      handleSubmit();
    }
    // Scroll para o topo após mudança
    setTimeout(() => {
      scrollToTopSmooth();
    }, 100);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentModule > 1) {
      setCurrentModule(currentModule - 1);
      setCurrentStep(getStepsForModule(currentModule - 1));
    }
    // Scroll para o topo após mudança
    setTimeout(() => {
      scrollToTopSmooth();
    }, 100);
  };

  const isStepValid = () => {
    console.log('Validating step:', { currentModule, currentStep });
    console.log('Current data:', questionnaireData);
    
    switch (currentModule) {
      case 1:
        const valid1 = questionnaireData.consentimento_inicial;
        console.log('Module 1 validation:', valid1);
        return valid1;
      case 2:
        if (currentStep === 1) {
          const valid2_1 = questionnaireData.meta_principal_usuario !== '';
          console.log('Module 2 Step 1 validation:', valid2_1);
          return valid2_1;
        }
        if (currentStep === 2) {
          const valid2_2 = questionnaireData.meta_especifica_texto && questionnaireData.meta_especifica_texto.trim().length > 10;
          console.log('Module 2 Step 2 validation:', valid2_2);
          return valid2_2;
        }
        if (currentStep === 3) {
          const valid2_3 = questionnaireData.nivel_comprometimento_objetivo !== '';
          console.log('Module 2 Step 3 validation:', valid2_3);
          return valid2_3;
        }
        return true;
      case 3:
        if (currentStep === 1) {
          const valid3_1 = questionnaireData.idade >= 16 && questionnaireData.idade <= 80;
          console.log('Module 3 Step 1 validation:', valid3_1);
          return valid3_1;
        }
        if (currentStep === 2) {
          const valid3_2 = questionnaireData.genero !== '' && 
                 questionnaireData.altura_cm >= 120 && questionnaireData.altura_cm <= 250 && 
                 questionnaireData.peso_kg >= 30 && questionnaireData.peso_kg <= 300;
          console.log('Module 3 Step 2 validation:', valid3_2);
          return valid3_2;
        }
        if (currentStep === 3) {
          const valid3_3 = questionnaireData.nivel_atividade_diaria !== '';
          console.log('Module 3 Step 3 validation:', valid3_3);
          return valid3_3;
        }
        return true;
      case 4: // Módulo de medidas corporais - sempre válido (opcional)
        console.log('Module 4 validation - always valid (body measurements are optional)');
        return true;
      case 5: // Treino
        if (currentStep === 1) {
          const valid5_1 = questionnaireData.nivel_experiencia_treino !== '';
          console.log('Module 5 Step 1 validation:', valid5_1);
          return valid5_1;
        }
        if (currentStep === 2) {
          const valid5_2 = questionnaireData.dias_por_semana_treino >= 1 && 
                 questionnaireData.dias_por_semana_treino <= 7 &&
                 questionnaireData.duracao_sessao_treino_minutos >= 20;
          console.log('Module 5 Step 2 validation:', valid5_2);
          return valid5_2;
        }
        if (currentStep === 3) {
          const valid5_3 = questionnaireData.disponibilidade_equipamentos.length > 0;
          console.log('Module 5 Step 3 validation:', valid5_3);
          return valid5_3;
        }
        return true;
      case 6: // Estilo de vida (simplificado)
        console.log('Module 6 validation - always valid');
        return true;
      default:
        return true;
    }
  };

  const getCurrentProgress = () => {
    let totalSteps = 0;
    let completedSteps = 0;
    
    for (let i = 1; i <= totalModules; i++) {
      const moduleSteps = getStepsForModule(i);
      totalSteps += moduleSteps;
      
      if (i < currentModule) {
        completedSteps += moduleSteps;
      } else if (i === currentModule) {
        completedSteps += currentStep - 1;
      }
    }
    
    return (completedSteps / totalSteps) * 100;
  };

  const renderCurrentModule = () => {
    switch (currentModule) {
      case 1:
        return (
          <WelcomeModule
            data={questionnaireData}
            onUpdateData={updateData}
            currentStep={currentStep}
          />
        );
      case 2:
        return (
          <ObjectivesModule
            data={questionnaireData}
            onUpdateData={updateData}
            currentStep={currentStep}
          />
        );
      case 3:
        return (
          <PersonalInfoModule
            data={questionnaireData}
            onUpdateData={updateData}
            currentStep={currentStep}
          />
        );
      case 4:
        return (
          <BodyMeasurementsModule
            data={questionnaireData}
            onUpdateData={updateData}
            currentStep={currentStep}
          />
        );
      case 5: // Treino
        return (
          <WorkoutModule
            data={questionnaireData}
            onUpdateData={updateData}
            currentStep={currentStep}
          />
        );
      case 6: // Estilo de vida (simplificado)
        return (
          <LifestyleModule
            data={questionnaireData}
            onUpdateData={updateData}
            currentStep={currentStep}
          />
        );
      default:
        return null;
    }
  };

  const handleRetryOrContinue = () => {
    if (hasError) {
      setHasError(false);
      setErrorMessage('');
      setCurrentStep(1);
      setIsProcessing(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      console.error('❌ QUESTIONÁRIO: Usuário não encontrado');
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setHasError(false);
    setErrorMessage('');
    setCurrentStep(2);
    setGenerationProgress(0);
    
    try {
      console.log('🔄 QUESTIONÁRIO: Salvando perfil completo...');
      console.log('📊 QUESTIONÁRIO: Dados do questionário:', questionnaireData);

      // Preparar dados para salvamento na tabela profiles
      const updateData = {
        // Informações básicas
        age: questionnaireData.idade || null,
        gender: questionnaireData.genero || null,
        height: questionnaireData.altura_cm || null,
        weight: questionnaireData.peso_kg || null,
        
        // Objetivos
        fitness_goal: questionnaireData.meta_principal_usuario || null,
        specific_goal: questionnaireData.meta_especifica_texto || null,
        commitment_level: questionnaireData.nivel_comprometimento_objetivo || null,
        
        // Treino
        experience_level: questionnaireData.nivel_experiencia_treino || null,
        workout_days_per_week: questionnaireData.dias_por_semana_treino || 3,
        session_duration: questionnaireData.duracao_sessao_treino_minutos || 60,
        available_equipment: questionnaireData.disponibilidade_equipamentos || [],
        exercise_preferences: questionnaireData.preferencias_exercicios || null,
        exercise_restrictions: questionnaireData.restricoes_exercicios || null,
        medical_conditions: questionnaireData.condicoes_medicas_limitantes || null,
        
        // Estilo de vida (simplificado)
        activity_level: questionnaireData.nivel_atividade_diaria || null,    
        sleep_quality: questionnaireData.qualidade_sono_percebida || 3,
        average_sleep_hours: questionnaireData.media_horas_sono || 8,
        stress_level: questionnaireData.nivel_estresse_percebido || 3,
        
        // Dados completos em JSONB - convertendo para Json
        profile_data: JSON.parse(JSON.stringify(questionnaireData)),
        
        // Status flags
        questionnaire_completed: true,
        profile_completed: true,
        profile_status: 'questionario_concluido' as const,
        updated_at: new Date().toISOString()
        
        // Removidos campos de alimentação - foco apenas em treino
      };

      console.log('💾 QUESTIONÁRIO: Dados preparados para salvamento:', updateData);

      // Salvar no Supabase
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (profileError) {
        console.error('❌ QUESTIONÁRIO: Erro ao salvar no Supabase:', profileError);
        throw profileError;
      }

      console.log('✅ QUESTIONÁRIO: Perfil salvo com sucesso:', updatedProfile);

      // Registrar primeira medição automaticamente a partir do questionário
      try {
        const { data: existingMeasurements, error: existingError } = await supabase
          .from('body_measurements')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (existingError) {
          console.warn('⚠️ QUESTIONÁRIO: Falha ao verificar medições existentes:', existingError);
        }

        if (!existingMeasurements || existingMeasurements.length === 0) {
          const advancedMeasurement = convertQuestionnaireToMeasurement(questionnaireData, questionnaireData.genero);
          const dbMeasurement = convertAdvancedToDB(advancedMeasurement, questionnaireData.genero);

          const { error: measurementError } = await supabase
            .from('body_measurements')
            .insert([{ user_id: user.id, ...dbMeasurement }]);

          if (measurementError) {
            console.error('❌ QUESTIONÁRIO: Erro ao salvar primeira medição:', measurementError);
          } else {
            console.log('✅ QUESTIONÁRIO: Primeira medição criada automaticamente');
          }
        } else {
          console.log('ℹ️ QUESTIONÁRIO: Medição inicial já existe, não criando duplicado');
        }
      } catch (mErr) {
        console.warn('⚠️ QUESTIONÁRIO: Erro não crítico ao criar medição inicial:', mErr);
      }

      // Salvar backup no localStorage
      localStorage.setItem(`biafitness_questionnaire_${user.id}`, JSON.stringify({
        ...questionnaireData,
        timestamp: new Date().toISOString()
      }));

      // Atualizar contexto
      await updateProfileStatus('questionario_concluido');

      // Criar perfil para contexto
      const profile: ProfileData = {
        age: questionnaireData.idade,
        gender: questionnaireData.genero as 'masculino' | 'feminino' | 'outro',
        fitnessGoal: questionnaireData.meta_principal_usuario,
        experienceLevel: questionnaireData.nivel_experiencia_treino as 'iniciante' | 'intermediario' | 'avancado',
        height: questionnaireData.altura_cm,
        weight: questionnaireData.peso_kg,
        waist: 0,
        hip: 0,
        workoutPreferences: questionnaireData.disponibilidade_equipamentos,
        createdAt: new Date().toISOString(),
        hasWorkoutPlan: false,
        profileCompleted: true
      };

      await updateProfile(profile);

      toast({
        title: "Questionário Concluído! 🎉",
        description: "Redirecionando para geração do seu treino personalizado...",
        duration: 3000,
      });

      // Redirecionar para a página de geração de treino
      setTimeout(() => {
        navigate('/workout-generation', { 
          state: { questionnaireData },
          replace: true 
        });
      }, 1500);
      
    } catch (error) {
      console.error('❌ QUESTIONÁRIO: Erro ao processar questionário:', error);
      setHasError(true);
      setErrorMessage('Erro ao salvar questionário. Tente novamente.');
      toast({
        title: "Erro ao processar",
        description: "Problema ao salvar questionário. Tente novamente.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {!hasError ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                
                {generationProgress < 30 ? (
                  <>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">Salvando seu perfil! ✨</h2>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">
                      Salvando todas as suas informações no sistema...
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">Gerando seu treino! 🏋️‍♀️</h2>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">
                      Nossa IA está criando um treino personalizado baseado no seu perfil...
                    </p>
                  </>
                )}
                
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 sm:h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">{generationProgress}% concluído</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-2">Ops! Algo deu errado</h2>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {errorMessage || 'Não foi possível gerar seu treino automaticamente.'}
                </p>
                <p className="text-gray-500 mb-6 text-xs sm:text-sm">
                  Seu perfil foi salvo! Você pode tentar gerar um treino no dashboard.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    onClick={handleRetryOrContinue}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm sm:text-base"
                  >
                    Ir para Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      setHasError(false);
                      setErrorMessage('');
                      setCurrentStep(1);
                      setIsProcessing(false);
                    }}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-2 sm:py-4 md:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-4 px-2">
            Questionário Fitness & Nutrição
          </h1>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 md:h-3 mb-2 sm:mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 sm:h-2 md:h-3 rounded-full transition-all duration-500"
              style={{ width: `${getCurrentProgress()}%` }}
            ></div>
          </div>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 font-medium px-2">
            Módulo {currentModule} de {totalModules} - Passo {currentStep} de {getStepsForModule(currentModule)}
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 md:p-8">
            {renderCurrentModule()}
            
            {!(currentModule === totalModules && currentStep === 2) && (
              <div className="flex justify-between mt-4 sm:mt-6 md:mt-10 pt-3 sm:pt-4 md:pt-6 border-t border-gray-200 gap-2 sm:gap-4">
                <Button
                  onClick={handleBack}
                  disabled={currentModule === 1 && currentStep === 1}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 px-3 sm:px-4 md:px-8 text-xs sm:text-sm md:text-base"
                >
                  ← Voltar
                </Button>
                
                {!(currentModule === totalModules && currentStep === 1) && (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 px-3 sm:px-4 md:px-8 text-xs sm:text-sm md:text-base"
                  >
                    Próximo →
                  </Button>
                )}

                {currentModule === totalModules && currentStep === 1 && (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStepValid() || isProcessing}
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-lg md:text-xl px-4 sm:px-8 md:px-12 py-2 sm:py-3 md:py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Salvando...
                      </>
                    ) : (
                      '🎯 Finalizar Perfil!'
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
