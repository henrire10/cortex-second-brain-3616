import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { findExerciseGif, getGifSystemStats } from '@/utils/gif';

interface ValidationResult {
  exerciseName: string;
  expected: string;
  found: string | null;
  isCorrect: boolean;
  wasFixed: boolean;
}

export const GifSystemValidator: React.FC = () => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);

  // Exercícios críticos que foram corrigidos
  const criticalTests = [
    { name: 'Flexão', expectedKeyword: 'Flexao', issue: 'Era mergulho antes' },
    { name: 'Glute Ham Raise', expectedKeyword: 'Mesa-flexora', issue: 'Era flexão nórdica' },
    { name: 'Crucifixo Inverso', expectedKeyword: 'Voador-invertido', issue: 'Mapeamento incorreto' },
    { name: 'Mergulho', expectedKeyword: 'Tr-ceps-no-Banco', issue: 'Deveria ser tríceps' },
    { name: 'Supino', expectedKeyword: 'Supino', issue: 'Validação básica' },
    { name: 'Agachamento', expectedKeyword: 'Agachamento', issue: 'Validação básica' },
    { name: 'Burpee', expectedKeyword: 'Burpee', issue: 'Cardio básico' },
    { name: 'Prancha', expectedKeyword: 'Prancha', issue: 'Core básico' }
  ];

  const validateExercise = async (exerciseName: string, expectedKeyword: string): Promise<ValidationResult> => {
    try {
      const foundUrl = await findExerciseGif(exerciseName);
      const isCorrect = foundUrl ? foundUrl.includes(expectedKeyword) : false;
      
      return {
        exerciseName,
        expected: expectedKeyword,
        found: foundUrl,
        isCorrect,
        wasFixed: true // Assumindo que todos foram parte da correção
      };
    } catch (error) {
      return {
        exerciseName,
        expected: expectedKeyword,
        found: null,
        isCorrect: false,
        wasFixed: false
      };
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    setResults([]);

    const validationResults = [];
    for (const test of criticalTests) {
      const result = await validateExercise(test.name, test.expectedKeyword);
      validationResults.push(result);
      setResults([...validationResults]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Carregar estatísticas do sistema
    const stats = getGifSystemStats();
    setSystemStats(stats);
    
    setIsValidating(false);
  };

  const getStatusIcon = (result: ValidationResult) => {
    if (result.isCorrect) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (result.found) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (result: ValidationResult) => {
    if (result.isCorrect) {
      return 'Correto ✅';
    } else if (result.found) {
      return 'GIF encontrado mas diferente do esperado';
    } else {
      return 'GIF não encontrado';
    }
  };

  const successRate = results.length > 0 
    ? (results.filter(r => r.isCorrect).length / results.length * 100).toFixed(1)
    : 0;

  return (
    <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Zap className="w-5 h-5" />
          Validador de Correções do Sistema de GIFs V4
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runValidation}
            disabled={isValidating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isValidating ? 'Validando...' : 'Validar Correções'}
          </Button>
          
          {results.length > 0 && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Taxa de Sucesso: {successRate}%
            </Badge>
          )}
        </div>

        {systemStats && (
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Estatísticas do Sistema:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Versão:</span>
                <div className="font-semibold">{systemStats.version}</div>
              </div>
              <div>
                <span className="text-gray-600">Mapeamentos:</span>
                <div className="font-semibold">{systemStats.totalMappings}</div>
              </div>
              <div>
                <span className="text-gray-600">Cache:</span>
                <div className="font-semibold">{systemStats.size} items</div>
              </div>
              <div>
                <span className="text-gray-600">Hit Rate:</span>
                <div className="font-semibold">{systemStats.successRate}</div>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Resultados da Validação:</h4>
            
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                {getStatusIcon(result)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{result.exerciseName}</span>
                    <Badge variant={result.isCorrect ? "default" : "secondary"}>
                      {result.isCorrect ? "OK" : "ISSUE"}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Status: {getStatusText(result)}</div>
                    <div>Esperado: contém "{result.expected}"</div>
                    {result.found && (
                      <div className="truncate">Encontrado: {result.found}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Principais Correções Implementadas:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Flexão agora mostra GIF correto (não mais mergulho)</li>
            <li>✅ Glute Ham Raise corrigido para mesa flexora</li>
            <li>✅ Crucifixo Inverso usa voador invertido</li>
            <li>✅ Sistema unificado de busca com cache inteligente</li>
            <li>✅ Validação automática de URLs</li>
            <li>✅ Fallbacks por categoria muscular</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};