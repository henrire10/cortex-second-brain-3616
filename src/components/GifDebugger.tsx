import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { findExerciseGif, normalizeExerciseName } from '@/utils/exerciseMedia';

interface GifTestResult {
  exerciseName: string;
  normalizedName: string;
  found: boolean;
  gifUrl: string | null;
  processingTime: number;
}

export const GifDebugger: React.FC = () => {
  const [testExercise, setTestExercise] = useState('');
  const [results, setResults] = useState<GifTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Lista de exercícios comuns para testar
  const commonExercises = [
    'Supino reto',
    'Agachamento',
    'Flexão de braço',
    'Rosca direta',
    'Tríceps testa',
    'Levantamento terra',
    'Barra fixa',
    'Desenvolvimento militar',
    'Elevação lateral',
    'Prancha',
    'Burpee',
    'Abdominal',
    'Leg Press',
    'Remada curvada',
    'Crucifixo',
    'Arnold Press',
    'Russian Twist',
    'Mountain Climber',
    'Panturrilha',
    'Mergulho'
  ];

  const testExerciseGif = async (exerciseName: string) => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const gifUrl = await findExerciseGif(exerciseName);
      const processingTime = Date.now() - startTime;
      
      const result: GifTestResult = {
        exerciseName,
        normalizedName: normalizeExerciseName(exerciseName),
        found: !!gifUrl,
        gifUrl,
        processingTime
      };
      
      setResults(prev => [result, ...prev.slice(0, 19)]); // Mantém apenas os últimos 20 resultados
    } catch (error) {
      console.error('Erro ao testar GIF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllCommonExercises = async () => {
    setIsLoading(true);
    setResults([]);
    
    for (const exercise of commonExercises) {
      await testExerciseGif(exercise);
      // Pequeno delay para evitar sobrecarregar o sistema
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (testExercise.trim()) {
      testExerciseGif(testExercise.trim());
    }
  };

  const successRate = results.length > 0 ? (results.filter(r => r.found).length / results.length * 100).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Debugger de GIFs de Exercícios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={testExercise}
              onChange={(e) => setTestExercise(e.target.value)}
              placeholder="Digite o nome do exercício para testar..."
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Testar
            </Button>
          </form>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={testAllCommonExercises}
              disabled={isLoading}
              variant="outline"
            >
              Testar Exercícios Comuns
            </Button>
            <Button 
              onClick={() => setResults([])}
              variant="outline"
            >
              Limpar Resultados
            </Button>
          </div>

          {results.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">
                Taxa de Sucesso: <span className="text-green-600">{successRate}%</span>
                {' '}({results.filter(r => r.found).length}/{results.length} encontrados)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {result.found ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{result.exerciseName}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.normalizedName}
                      </Badge>
                      <Badge variant={result.found ? "default" : "secondary"} className="text-xs">
                        {result.found ? "Encontrado" : "Não encontrado"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {result.processingTime}ms
                      </span>
                    </div>
                  </div>
                  
                  {result.found && result.gifUrl && (
                    <div className="flex-shrink-0">
                      <img 
                        src={result.gifUrl} 
                        alt={result.exerciseName}
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};