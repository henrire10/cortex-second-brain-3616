
// ✅ SISTEMA DE LOGS CORRIGIDO COM MÉTRICAS AVANÇADAS
export const logWorkoutQuality = (data: {
  userId?: string;
  qualityScore: number;
  totalExercises: number;
  uniqueExercises: number;
  variabilityScore: number;
  muscleGroupCoverage: number;
  errors: string[];
  warnings: string[];
  experienceLevel: string;
  workoutDaysPerWeek: number;
  generationTime: number;
  geminiModel: string;
  tokensUsed?: number;
  retryCount?: number;
}) => {
  
  const qualityLevel = data.qualityScore >= 80 ? 'EXCELENTE' : 
                      data.qualityScore >= 60 ? 'BOM' : 
                      data.qualityScore >= 40 ? 'ACEITÁVEL' : 'BAIXA';

  const logData = {
    timestamp: new Date().toISOString(),
    userId: data.userId,
    systemVersion: 'v3.0-fully-optimized',
    qualityMetrics: {
      overallScore: data.qualityScore,
      qualityLevel: qualityLevel,
      totalExercises: data.totalExercises,
      uniqueExercises: data.uniqueExercises,
      variabilityPercentage: data.variabilityScore,
      muscleGroupsCovered: data.muscleGroupCoverage,
      exercisePerDayAvg: (data.totalExercises / data.workoutDaysPerWeek).toFixed(1)
    },
    validationResults: {
      totalErrors: data.errors.length,
      totalWarnings: data.warnings.length,
      errorsList: data.errors,
      warningsList: data.warnings,
      validationStatus: data.errors.length === 0 ? 'APROVADO' : 'REJEITADO'
    },
    generationInfo: {
      experienceLevel: data.experienceLevel,
      workoutDaysPerWeek: data.workoutDaysPerWeek,
      generationTimeMs: data.generationTime,
      aiModel: data.geminiModel,
      tokensUsed: data.tokensUsed || 0,
      retryCount: data.retryCount || 0,
      corrections: [
        'Validação flexível aplicada',
        'Tokens aumentados para 8192', 
        'Timeout expandido para 90s',
        'Gemini 1.5 Pro configurado',
        'Sistema de retry implementado'
      ]
    },
    recommendations: generateOptimizedRecommendations(data)
  };

  console.log('📈 LOG DE QUALIDADE SISTEMA CORRIGIDO:', JSON.stringify(logData, null, 2));

  // ✅ LOGS ESPECÍFICOS POR QUALIDADE
  if (data.qualityScore >= 80) {
    console.log('🌟 TREINO DE ALTA QUALIDADE GERADO COM CORREÇÕES:', {
      score: data.qualityScore,
      variability: `${data.variabilityScore.toFixed(1)}%`,
      tokensUsed: data.tokensUsed,
      retryCount: data.retryCount,
      status: 'APROVADO_AUTOMATICAMENTE'
    });
  } else if (data.qualityScore >= 60) {
    console.log('✅ TREINO DE BOA QUALIDADE COM SISTEMA CORRIGIDO:', {
      score: data.qualityScore,
      warnings: data.warnings.length,
      status: 'APROVADO_COM_RESSALVAS'
    });
  } else if (data.qualityScore < 40) {
    console.log('⚠️ TREINO DE BAIXA QUALIDADE DETECTADO (MESMO COM CORREÇÕES):', {
      score: data.qualityScore,
      errors: data.errors.length,
      warnings: data.warnings.length,
      retryCount: data.retryCount,
      status: 'REQUER_ANÁLISE_MANUAL'
    });
  }

  return logData;
};

const generateOptimizedRecommendations = (data: any): string[] => {
  const recommendations: string[] = [];

  if (data.variabilityScore < 60) {
    recommendations.push('Melhorar variabilidade de exercícios (sistema de retry aplicado)');
  }

  if (data.muscleGroupCoverage < 4 && data.workoutDaysPerWeek >= 3) {
    recommendations.push('Expandir cobertura de grupos musculares');
  }

  if (data.errors.length > 0) {
    recommendations.push('Corrigir erros estruturais identificados');
  }

  if (data.retryCount > 0) {
    recommendations.push(`Sistema de retry foi usado ${data.retryCount}x para melhorar qualidade`);
  }

  if (data.tokensUsed > 7000) {
    recommendations.push('Alto uso de tokens - resposta muito detalhada gerada');
  }

  if (data.qualityScore >= 80) {
    recommendations.push('🌟 Treino de excelente qualidade - sistema corrigido funcionando perfeitamente');
  }

  if (recommendations.length === 0) {
    recommendations.push('Treino dentro dos padrões aceitáveis com correções aplicadas');
  }

  return recommendations;
};
