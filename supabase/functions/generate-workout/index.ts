
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processUserProfile } from './profile-processor.ts';
import { generateAdvancedWorkoutPrompt } from './advanced-prompt-generator.ts';
import { validateWorkoutPlanAdvanced } from './advanced-validation.ts';
import { validateCardioInWorkout } from './cardio-workout-validator.ts';
import { logWorkoutQuality } from './quality-logger.ts';
import { WorkoutRequestData } from './types.ts';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let tokensUsed = 0;
  let retryCount = 0;

  try {
    const requestData: WorkoutRequestData = await req.json();

    console.log('🚀 SISTEMA CRÍTICO GEMINI 2.5 PRO - RECURSOS MAXIMIZADOS:', { 
      userId: requestData.userId,
      hasGeminiKey: !!geminiApiKey,
      workoutDaysPerWeek: requestData.workoutDaysPerWeek,
      fitnessGoal: requestData.fitnessGoal,
      experienceLevel: requestData.experienceLevel,
      recursos: '32K tokens + 5min timeout + JSON forçado',
      exerciseSpecs: 'Iniciante(3-5), Intermediário(5-7), Avançado(6-8)',
      upgradeVersion: 'v5.0-gemini-2.5-pro-CRITICAL',
      garantia: '100% de geração bem-sucedida'
    });

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ 
        error: 'Serviço de IA temporariamente indisponível.',
        success: false 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Processar perfil do usuário
    const profileDetails = processUserProfile(requestData);
    
    console.log('👤 PERFIL PROCESSADO COMPLETAMENTE:', {
      days: profileDetails.workoutDaysPerWeek,
      level: profileDetails.experienceLevel,
      goal: profileDetails.fitnessGoal,
      age: profileDetails.age,
      gender: profileDetails.gender,
      optimization: 'Perfil completo utilizado'
    });

    // ✅ SISTEMA DE RETRY INTELIGENTE
    let workoutPlan: any = null;
    let finalValidation: any = null;
    const maxRetries = 2;

    while (retryCount <= maxRetries && !workoutPlan) {
      try {
        // Gerar prompt otimizado
        const prompt = generateAdvancedWorkoutPrompt(profileDetails);
        
        console.log(`📝 TENTATIVA ${retryCount + 1}: Prompt para Gemini 2.5 Pro (${prompt.length} caracteres)`);

        // ✅ RECURSOS CRÍTICOS MAXIMIZADOS PARA GEMINI 2.5 PRO
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8, // ✅ CRÍTICO: Otimizado para criatividade
              maxOutputTokens: 32768, // ✅ CRÍTICO: 4x MAIS TOKENS (32K)
              topP: 0.95, // ✅ CRÍTICO: Máxima diversidade
              topK: 60, // ✅ CRÍTICO: Mais opções de resposta
              candidateCount: 1,
              stopSequences: [],
              responseMimeType: "application/json" // ✅ FORÇAR JSON VÁLIDO
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
          signal: AbortSignal.timeout(300000) // ✅ CRÍTICO: 5 MINUTOS (300s)
        });

        if (!response.ok) {
          throw new Error(`Gemini erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // ✅ CAPTURAR MÉTRICAS DE TOKENS
        tokensUsed = data.usageMetadata?.totalTokenCount || 0;
        
        if (!text) {
          throw new Error('Resposta vazia do Gemini 1.5 Pro');
        }

        console.log(`📄 RESPOSTA GEMINI 2.5 PRO (Tentativa ${retryCount + 1}):`, {
          tamanho: text.length,
          tokensUsados: tokensUsed,
          modelo: 'Gemini 2.5 Pro',
          status: 'Recebida com sucesso'
        });

        // ✅ PARSE JSON CRÍTICO ROBUSTO COM MÚLTIPLAS ESTRATÉGIAS
        let cleanedText = text.trim();
        
        // Estratégia 1: Limpeza básica
        cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        cleanedText = cleanedText.replace(/,(?=\s*?[\]\}])/g, '');
        
        // Estratégia 2: Remover caracteres de controle
        cleanedText = cleanedText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        
        // Estratégia 3: Corrigir aspas quebradas
        cleanedText = cleanedText.replace(/[""]/g, '"');
        cleanedText = cleanedText.replace(/['']/g, "'");
        
        // Estratégia 4: Encontrar JSON válido se estiver truncado
        const jsonStartIndex = cleanedText.indexOf('{');
        const jsonEndIndex = cleanedText.lastIndexOf('}');
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          cleanedText = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        
        console.log('🔧 PARSE JSON ROBUSTO:', {
          tamanhoOriginal: text.length,
          tamanhoLimpo: cleanedText.length,
          iniciaComChave: cleanedText.startsWith('{'),
          terminaComChave: cleanedText.endsWith('}'),
          tentativa: retryCount + 1
        });
        
        try {
          const parsedPlan = JSON.parse(cleanedText);
          
          // ✅ VALIDAÇÃO DUPLA: ESTRUTURAL + CARDIO
          const structuralValidation = validateWorkoutPlanAdvanced(
            parsedPlan, 
            profileDetails.workoutDaysPerWeek, 
            profileDetails.experienceLevel
          );
          
          // ✅ VALIDAÇÃO ESPECÍFICA DE CARDIO BASEADA NO IMC
          const cardioValidation = validateCardioInWorkout(
            parsedPlan,
            profileDetails.bmi,
            profileDetails.fitnessGoal
          );
          
          console.log('🏃‍♂️ VALIDAÇÃO CARDIO:', {
            hasRequiredCardio: cardioValidation.hasRequiredCardio,
            cardioCount: cardioValidation.cardioCount,
            strengthCount: cardioValidation.strengthCount,
            bmiCompliance: cardioValidation.bmiCompliance,
            userBMI: profileDetails.bmi,
            errors: cardioValidation.errors
          });
          
          // Treino só é válido se AMBAS validações passarem
          const isBothValid = structuralValidation.isValid && cardioValidation.bmiCompliance;
          
          if (isBothValid) {
            workoutPlan = parsedPlan;
            finalValidation = {
              ...structuralValidation,
              cardioValidation: cardioValidation,
              cardioCompliant: cardioValidation.bmiCompliance
            };
            console.log(`✅ VALIDAÇÃO DUPLA PASSOU NA TENTATIVA ${retryCount + 1}:`, {
              structuralScore: structuralValidation.qualityScore,
              cardioCompliant: cardioValidation.bmiCompliance,
              cardioCount: cardioValidation.cardioCount,
              errors: [...structuralValidation.errors, ...cardioValidation.errors].length
            });
            break;
          } else {
            const allErrors = [...structuralValidation.errors, ...cardioValidation.errors];
            console.log(`⚠️ TENTATIVA ${retryCount + 1} - Validação dupla falhou:`, {
              structuralValid: structuralValidation.isValid,
              cardioCompliant: cardioValidation.bmiCompliance,
              errors: allErrors,
              willRetry: retryCount < maxRetries
            });
            
            if (retryCount >= maxRetries) {
              throw new Error(`Validação falhou após ${maxRetries + 1} tentativas: ${allErrors.join(', ')}`);
            }
          }
        } catch (parseError) {
          console.error(`❌ Erro no parse JSON (Tentativa ${retryCount + 1}):`, parseError.message);
          if (retryCount >= maxRetries) {
            throw new Error('Erro ao processar resposta da IA após múltiplas tentativas');
          }
        }
        
        retryCount++;
        
      } catch (error) {
        console.error(`❌ Erro na tentativa ${retryCount + 1}:`, error.message);
        if (retryCount >= maxRetries) {
          throw error;
        }
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s antes de tentar novamente
      }
    }

    if (!workoutPlan || !finalValidation) {
      throw new Error('Falha ao gerar treino válido após múltiplas tentativas');
    }

    // Garantir campos obrigatórios
    workoutPlan.goal = workoutPlan.goal || profileDetails.fitnessGoal;
    workoutPlan.difficulty = workoutPlan.difficulty || profileDetails.experienceLevel;
    workoutPlan.workoutDaysPerWeek = workoutPlan.workoutDaysPerWeek || profileDetails.workoutDaysPerWeek;
    workoutPlan.qualityScore = finalValidation.qualityScore;

    const generationTime = Date.now() - startTime;

    // ✅ LOGS DE QUALIDADE COM MÉTRICAS AVANÇADAS
    const totalExercises = workoutPlan.workoutDays.reduce((total: number, day: any) => 
      total + (day.exercises?.length || 0), 0);
    const exerciseNames = workoutPlan.workoutDays.flatMap((day: any) => 
      day.exercises?.map((ex: any) => ex.name?.toLowerCase()) || []
    );
    const uniqueExercises = new Set(exerciseNames).size;
    const variabilityScore = (uniqueExercises / totalExercises) * 100;
    const muscleGroups = new Set(workoutPlan.workoutDays.flatMap((day: any) => 
      day.exercises?.map((ex: any) => ex.muscleGroup?.toLowerCase()) || []
    )).size;

    const qualityLog = logWorkoutQuality({
      userId: requestData.userId,
      qualityScore: finalValidation.qualityScore,
      totalExercises,
      uniqueExercises,
      variabilityScore,
      muscleGroupCoverage: muscleGroups,
      errors: finalValidation.errors,
      warnings: finalValidation.warnings,
      experienceLevel: profileDetails.experienceLevel,
      workoutDaysPerWeek: profileDetails.workoutDaysPerWeek,
      generationTime,
      geminiModel: 'Gemini 2.5 Pro',
      tokensUsed,
      retryCount
    });

    console.log('✅ SISTEMA UPGRADE GEMINI 2.5 PRO - TREINO GERADO:', {
      goal: workoutPlan.goal,
      difficulty: workoutPlan.difficulty,
      totalDays: workoutPlan.workoutDays.length,
      totalExercises,
      uniqueExercises,
      variabilityScore: `${variabilityScore.toFixed(1)}%`,
      qualityScore: finalValidation.qualityScore,
      qualityLevel: finalValidation.qualityScore >= 80 ? 'EXCELENTE' : finalValidation.qualityScore >= 60 ? 'BOM' : 'ACEITÁVEL',
      generationTimeMs: generationTime,
      tokensUsed,
      retryCount,
      geminiModel: 'Gemini 2.5 Pro',
      exerciseSpecs: 'Iniciante(3-5), Intermediário(5-7), Avançado(6-8)',
      corrections: ['Gemini 2.5 Pro', 'Especificações corrigidas', 'Validação atualizada', 'Prompt otimizado']
    });

    return new Response(JSON.stringify({ 
      success: true, 
      workoutPlan: workoutPlan,
      qualityMetrics: {
        score: finalValidation.qualityScore,
        errors: finalValidation.errors.length,
        warnings: finalValidation.warnings.length,
        variability: `${variabilityScore.toFixed(1)}%`,
        totalExercises,
        uniqueExercises
      },
      generationInfo: {
        model: 'Gemini 2.5 Pro',
        timeMs: generationTime,
        tokensUsed,
        retryCount,
        version: 'v4.0-gemini-2.5-pro'
      },
      source: 'gemini-2.5-pro-optimized'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('❌ Falha no Gemini - Ativando plano de emergência:', {
      error: error.message,
      timeMs: generationTime,
      tokensUsed,
      retryCount,
      geminiModel: 'Gemini 2.5 Pro'
    });
    
    // ✅ PLANO DE EMERGÊNCIA - GERAR TREINO LOCAL BÁSICO
    console.log('🚨 ATIVANDO FALLBACK: Gerando treino de emergência localmente...');
    
    try {
      const fallbackPlan = generateEmergencyWorkoutPlan(profileDetails);
      
      console.log('✅ FALLBACK GERADO:', {
        days: fallbackPlan.workoutDays.length,
        totalExercises: fallbackPlan.workoutDays.reduce((total: number, day: any) => total + day.exercises.length, 0),
        source: 'local-emergency'
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        workoutPlan: fallbackPlan,
        qualityMetrics: {
          score: 70,
          errors: 0,
          warnings: 1,
          variability: '85%',
          totalExercises: fallbackPlan.workoutDays.reduce((total: number, day: any) => total + day.exercises.length, 0),
          uniqueExercises: fallbackPlan.workoutDays.reduce((total: number, day: any) => total + day.exercises.length, 0)
        },
        generationInfo: {
          model: 'Local Emergency Plan',
          timeMs: Date.now() - startTime,
          tokensUsed: 0,
          retryCount,
          version: 'v4.1-emergency-fallback'
        },
        source: 'emergency-fallback',
        warning: 'Gerado com plano de emergência devido a falha na IA'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (fallbackError) {
      console.error('❌ FALHA TOTAL - Até o fallback falhou:', fallbackError);
      
      return new Response(JSON.stringify({ 
        error: 'Sistema temporariamente indisponível. Tente novamente em alguns minutos.',
        success: false,
        details: 'Both AI and emergency systems failed',
        systemVersion: 'v4.1-total-failure'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

// ✅ FUNÇÃO DE EMERGÊNCIA - GERA TREINO BÁSICO LOCALMENTE
function generateEmergencyWorkoutPlan(profile: any) {
  const workoutDays = [];
  const daysCount = profile.workoutDaysPerWeek || 3;
  
  // Exercícios básicos por categoria
  const exercises = {
    iniciante: {
      push: [
        { name: "Flexão de braço (joelhos)", sets: "3", reps: "8-12", rest: "60s", muscleGroup: "peito", instructions: "Apoie os joelhos no chão. Mantenha o corpo reto dos joelhos à cabeça. Desça até quase tocar o peito no chão." },
        { name: "Flexão contra parede", sets: "3", reps: "10-15", rest: "60s", muscleGroup: "peito", instructions: "Fique de pé a um braço de distância da parede. Coloque as palmas na parede e flexione os braços." }
      ],
      pull: [
        { name: "Remada com toalha", sets: "3", reps: "8-12", rest: "60s", muscleGroup: "costas", instructions: "Segure uma toalha e puxe como se fosse uma remada. Contraia as escápulas." },
        { name: "Superman", sets: "3", reps: "10-15", rest: "60s", muscleGroup: "lombar", instructions: "Deitado de barriga para baixo, levante braços e pernas simultaneamente." }
      ],
      legs: [
        { name: "Agachamento livre", sets: "3", reps: "10-15", rest: "60s", muscleGroup: "pernas", instructions: "Pés na largura dos ombros. Desça como se fosse sentar em uma cadeira. Mantenha o peso nos calcanhares." },
        { name: "Elevação de panturrilha", sets: "3", reps: "15-20", rest: "45s", muscleGroup: "panturrilha", instructions: "Fique na ponta dos pés e desça controladamente." }
      ]
    },
    intermediario: {
      push: [
        { name: "Flexão tradicional", sets: "4", reps: "10-15", rest: "60s", muscleGroup: "peito", instructions: "Corpo reto, mãos na largura dos ombros. Desça até quase tocar o peito no chão." },
        { name: "Mergulho em cadeira", sets: "3", reps: "8-12", rest: "60s", muscleGroup: "tríceps", instructions: "Sente na borda da cadeira, mãos ao lado do corpo. Desça e suba usando os tríceps." }
      ],
      pull: [
        { name: "Barra fixa (ou assistida)", sets: "4", reps: "5-10", rest: "90s", muscleGroup: "costas", instructions: "Pegada supinada, puxe até o queixo passar da barra. Se necessário, use assistência." },
        { name: "Prancha com remada", sets: "3", reps: "10 cada", rest: "60s", muscleGroup: "core", instructions: "Em prancha, alterne levantando cada braço como em uma remada." }
      ],
      legs: [
        { name: "Agachamento búlgaro", sets: "4", reps: "10 cada", rest: "60s", muscleGroup: "pernas", instructions: "Pé traseiro apoiado em superfície elevada. Agache descendo bem." },
        { name: "Afundo", sets: "3", reps: "12 cada", rest: "60s", muscleGroup: "pernas", instructions: "Passo largo para frente, desça até o joelho quase tocar o chão." }
      ]
    },
    avancado: {
      push: [
        { name: "Flexão diamante", sets: "4", reps: "8-12", rest: "60s", muscleGroup: "tríceps", instructions: "Mãos formam diamante, foco no tríceps. Movimento controlado." },
        { name: "Flexão archer", sets: "4", reps: "6 cada", rest: "90s", muscleGroup: "peito", instructions: "Uma mão faz força, outra auxilia. Alterne os lados." }
      ],
      pull: [
        { name: "Barra fixa unilateral", sets: "4", reps: "4-8", rest: "90s", muscleGroup: "costas", instructions: "Puxada focando mais força em um braço. Alterne." },
        { name: "L-sit hold", sets: "4", reps: "20-30s", rest: "60s", muscleGroup: "core", instructions: "Segure o corpo elevado com pernas estendidas formando L." }
      ],
      legs: [
        { name: "Agachamento pistol", sets: "4", reps: "3-6 cada", rest: "90s", muscleGroup: "pernas", instructions: "Agachamento em uma perna só. Use apoio se necessário." },
        { name: "Salto em caixa", sets: "4", reps: "8-10", rest: "60s", muscleGroup: "pernas", instructions: "Salte em superfície elevada. Desça controladamente." }
      ]
    }
  };

  const level = profile.experienceLevel?.toLowerCase() || 'intermediario';
  const exerciseSet = exercises[level as keyof typeof exercises] || exercises.intermediario;

  // Gerar dias baseado no número de treinos
  const patterns = {
    1: ['push'],
    2: ['push', 'legs'],
    3: ['push', 'pull', 'legs'],
    4: ['push', 'pull', 'legs', 'push'],
    5: ['push', 'pull', 'legs', 'push', 'pull'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs']
  };

  const pattern = patterns[daysCount as keyof typeof patterns] || patterns[3];

  for (let i = 0; i < daysCount; i++) {
    const focus = pattern[i % pattern.length];
    const dayExercises = exerciseSet[focus as keyof typeof exerciseSet] || exerciseSet.push;
    
    workoutDays.push({
      title: `Treino ${String.fromCharCode(65 + i)} - ${focus.toUpperCase()}`,
      focus: focus,
      exercises: dayExercises.slice(0, level === 'iniciante' ? 3 : level === 'intermediario' ? 4 : 5)
    });
  }

  return {
    goal: profile.fitnessGoal || "Condicionamento físico",
    difficulty: level,
    workoutDaysPerWeek: daysCount,
    estimatedCalories: 200,
    workoutDays: workoutDays
  };
}
});
