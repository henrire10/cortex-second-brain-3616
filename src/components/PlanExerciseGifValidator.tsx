import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { findExerciseGif, getGifSystemStats } from '@/utils/gif';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseValidationResult {
  exerciseName: string;
  found: boolean;
  gifUrl: string | null;
  matchType: 'DIRETO' | 'NORMALIZADO' | 'NOME LIMPO' | 'SIMILARIDADE' | 'FALLBACK' | 'NÃO ENCONTRADO';
  processingTime: number;
}

export const PlanExerciseGifValidator: React.FC = () => {
  const [results, setResults] = useState<ExerciseValidationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Exercícios comuns encontrados em planos de treino
  const commonPlanExercises = [
    "Desenvolvimento militar com barra",
    "Desenvolvimento de ombros na máquina articulada",
    "Mergulho nas paralelas (foco em peito)",
    "Supino fechado com barra",
    "Levantamento terra convencional",
    "Leg press 45°",
    "Elevação frontal com anilhas (alternada)",
    "Elevação lateral com halteres",
    "Mesa flexora",
    "Encolhimento de ombros com halteres",
    "Supino inclinado com halteres",
    "Afundo com halteres (passada)",
    "Elevação de panturrilha em pé na máquina",
    "Remada curvada com barra (pegada pronada)",
    "Puxada frontal na polia (pegada supinada)",
    "Rosca martelo com halteres (em pé, simultânea)",
    "Stiff com barra",
    "Barra fixa (pegada pronada)",
    "Remada unilateral com halter (serrote)",
    "Flexão de braços na máquina (peck-deck)",
    "Crucifixo reto com halteres",
    "Pulldown com braços estendidos na polia",
    "Cadeira extensora",
    "Tríceps francês com barra w (deitado)",
    "Remada na máquina articulada (pegada neutra)",
    "Tríceps na polia alta com corda",
    "Rosca direta com barra w",
    "Agachamento livre com barra",
    "Rosca de punho com barra (sentado)", // Este deveria retornar null
    "Flexão"
  ];

  const testExercise = async (exerciseName: string): Promise<ExerciseValidationResult> => {
    const startTime = Date.now();
    
    // Capturar logs do console para determinar o tipo de match
    const originalConsoleLog = console.log;
    let matchType: ExerciseValidationResult['matchType'] = 'NÃO ENCONTRADO';
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('Match direto:')) matchType = 'DIRETO';
      else if (message.includes('Match normalizado:')) matchType = 'NORMALIZADO';
      else if (message.includes('Match com nome limpo')) matchType = 'NOME LIMPO';
      else if (message.includes('Match por similaridade:')) matchType = 'SIMILARIDADE';
      else if (message.includes('Fallback por categoria:')) matchType = 'FALLBACK';
      
      originalConsoleLog(...args);
    };

    try {
      const gifUrl = await findExerciseGif(exerciseName);
      const processingTime = Date.now() - startTime;
      
      return {
        exerciseName,
        found: !!gifUrl,
        gifUrl,
        matchType,
        processingTime
      };
    } finally {
      console.log = originalConsoleLog;
    }
  };

  const validateAllExercises = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      const validationResults: ExerciseValidationResult[] = [];
      
      for (const exercise of commonPlanExercises) {
        console.log(`\n=== Testando: ${exercise} ===`);
        const result = await testExercise(exercise);
        validationResults.push(result);
        setResults([...validationResults]); // Atualizar em tempo real
      }
      
      // Atualizar estatísticas
      const systemStats = getGifSystemStats();
      setStats(systemStats);
      
    } catch (error) {
      console.error('Erro durante validação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchTypeColor = (matchType: ExerciseValidationResult['matchType']) => {
    switch (matchType) {
      case 'DIRETO': return 'bg-green-500';
      case 'NORMALIZADO': return 'bg-blue-500';
      case 'NOME LIMPO': return 'bg-yellow-500';
      case 'SIMILARIDADE': return 'bg-orange-500';
      case 'FALLBACK': return 'bg-red-400';
      case 'NÃO ENCONTRADO': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuccessRate = () => {
    if (results.length === 0) return 0;
    const successful = results.filter(r => r.found).length;
    return Math.round((successful / results.length) * 100);
  };

  const getAverageTime = () => {
    if (results.length === 0) return 0;
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    return Math.round(totalTime / results.length);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Validador de GIFs - Exercícios do Plano
          <Badge variant="secondary">{results.length}/{commonPlanExercises.length} testados</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex gap-4 items-center">
          <Button 
            onClick={validateAllExercises} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isLoading ? 'Validando...' : 'Validar Exercícios do Plano'}
          </Button>
          
          {results.length > 0 && (
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                Taxa de sucesso: {getSuccessRate()}%
              </Badge>
              <Badge variant="outline">
                Tempo médio: {getAverageTime()}ms
              </Badge>
            </div>
          )}
        </div>
        
        {/* Estatísticas do Sistema */}
        {stats && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Estatísticas do Sistema de GIFs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>Versão: <strong>{stats.version}</strong></div>
              <div>Mapeamentos: <strong>{stats.totalMappings}</strong></div>
              <div>Cache: <strong>{stats.size} itens</strong></div>
              <div>Taxa cache: <strong>{stats.successRate}</strong></div>
            </div>
          </div>
        )}

        <Separator />
        
        {/* Resultados */}
        <div className="space-y-3">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-4 border rounded-lg ${result.found ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.found ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  
                  <div>
                    <div className="font-medium">{result.exerciseName}</div>
                    <div className="text-sm text-gray-600">
                      Tempo: {result.processingTime}ms
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getMatchTypeColor(result.matchType)}>
                    {result.matchType}
                  </Badge>
                  
                  {result.gifUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.gifUrl!, '_blank')}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver GIF
                    </Button>
                  )}
                </div>
              </div>
              
              {result.gifUrl && (
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  URL: {result.gifUrl}
                </div>
              )}
            </div>
          ))}
          
          {isLoading && results.length < commonPlanExercises.length && (
            <div className="p-4 border border-dashed rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Validando exercícios...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};