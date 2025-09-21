
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Trash2,
  List,
  Zap
} from 'lucide-react';
import { 
  findExerciseGif, 
  clearGifCache, 
  getGifSystemStats, 
  getAvailableExercises 
} from '@/utils/gif';

interface TestResult {
  exerciseName: string;
  found: boolean;
  gifUrl: string | null;
  processingTime: number;
  timestamp: string;
}

export const GifTestButton: React.FC = () => {
  const [testExercise, setTestExercise] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);

  // Exercícios de teste rápido
  const quickTests = [
    'Stiff',
    'Agachamento',
    'Supino Reto',
    'Pulldown',
    'Rosca Direta',
    'Flexão',
    'Burpee',
    'Prancha'
  ];

  const testSingleExercise = async (exerciseName: string) => {
    const startTime = Date.now();
    
    try {
      const gifUrl = await findExerciseGif(exerciseName);
      const processingTime = Date.now() - startTime;
      
      const result: TestResult = {
        exerciseName,
        found: !!gifUrl,
        gifUrl,
        processingTime,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setResults(prev => [result, ...prev.slice(0, 19)]);
      return result;
    } catch (error) {
      console.error('Erro ao testar exercício:', error);
      return null;
    }
  };

  const handleQuickTest = async (exerciseName: string) => {
    setIsLoading(true);
    await testSingleExercise(exerciseName);
    setIsLoading(false);
  };

  const handleCustomTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testExercise.trim()) return;
    
    setIsLoading(true);
    await testSingleExercise(testExercise.trim());
    setIsLoading(false);
    setTestExercise('');
  };

  const runBatchTest = async () => {
    setIsLoading(true);
    setResults([]);
    
    for (const exercise of quickTests) {
      await testSingleExercise(exercise);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsLoading(false);
  };

  const clearCache = () => {
    clearGifCache();
    setResults([]);
    alert('Cache limpo com sucesso!');
  };

  const showSystemStats = () => {
    const stats = getGifSystemStats();
    setShowStats(!showStats);
    console.log('📊 Estatísticas completas:', stats);
  };

  const loadAvailableExercises = () => {
    const exercises = getAvailableExercises();
    setAvailableExercises(exercises);
    console.log('📋 Exercícios disponíveis:', exercises);
  };

  const successRate = results.length > 0 
    ? (results.filter(r => r.found).length / results.length * 100).toFixed(1)
    : 0;

  const avgTime = results.length > 0
    ? (results.reduce((sum, r) => sum + r.processingTime, 0) / results.length).toFixed(0)
    : 0;

  return (
    <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Zap className="w-5 h-5" />
          Sistema de GIFs V2 - Teste Completo
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controles principais */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runBatchTest}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <TestTube className="w-4 h-4 mr-1" />}
            Teste Rápido (8 exercícios)
          </Button>
          
          <Button 
            onClick={clearCache}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar Cache
          </Button>
          
          <Button 
            onClick={showSystemStats}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Search className="w-4 h-4 mr-1" />
            {showStats ? 'Ocultar' : 'Ver'} Estatísticas
          </Button>
          
          <Button 
            onClick={loadAvailableExercises}
            variant="outline"
            className="border-green-200 text-green-600 hover:bg-green-50"
          >
            <List className="w-4 h-4 mr-1" />
            Lista Completa ({getAvailableExercises().length})
          </Button>
        </div>

        {/* Teste personalizado */}
        <form onSubmit={handleCustomTest} className="flex gap-2">
          <Input
            type="text"
            value={testExercise}
            onChange={(e) => setTestExercise(e.target.value)}
            placeholder="Digite o nome do exercício para testar..."
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading} variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Testes rápidos */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Testes Rápidos:</p>
          <div className="flex flex-wrap gap-2">
            {quickTests.map((exercise) => (
              <Button
                key={exercise}
                onClick={() => handleQuickTest(exercise)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {exercise}
              </Button>
            ))}
          </div>
        </div>

        {/* Estatísticas em tempo real */}
        {results.length > 0 && (
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex gap-4 text-sm">
              <Badge variant="default" className="bg-green-100 text-green-700">
                Taxa de Sucesso: {successRate}%
              </Badge>
              <Badge variant="outline">
                Testados: {results.length}
              </Badge>
              <Badge variant="outline">
                Tempo Médio: {avgTime}ms
              </Badge>
              <Badge variant="outline">
                Encontrados: {results.filter(r => r.found).length}
              </Badge>
            </div>
          </div>
        )}

        {/* Lista de exercícios disponíveis */}
        {availableExercises.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium mb-2 text-blue-800">
              Exercícios Disponíveis ({availableExercises.length}):
            </p>
            <div className="max-h-32 overflow-y-auto text-xs text-blue-700">
              {availableExercises.map((exercise, idx) => (
                <span key={idx} className="inline-block mr-2 mb-1">
                  {exercise}{idx < availableExercises.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resultados dos testes */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Últimos Resultados:</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.slice(0, 8).map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
                  {result.found ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  
                  <span className="font-medium flex-1 min-w-0 truncate">
                    {result.exerciseName}
                  </span>
                  
                  <Badge variant={result.found ? "default" : "secondary"} className="text-xs">
                    {result.found ? "✓" : "✗"}
                  </Badge>
                  
                  <span className="text-xs text-gray-500">
                    {result.processingTime}ms
                  </span>
                  
                  <span className="text-xs text-gray-400">
                    {result.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
