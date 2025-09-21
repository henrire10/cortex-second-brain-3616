
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Clock, AlertTriangle, Lightbulb, Flame, CheckCircle } from 'lucide-react';
import { ExerciseGifDisplay } from './ExerciseGifDisplay';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  weight?: string;
  muscleGroup: string;
  difficulty?: string;
  instructions: string;
  suggestedWeight?: string;
  estimatedCalories?: number;
  commonMistakes?: string;
  alternatives?: string;
  videoKeywords?: string;
  tips?: string;
}

interface ExerciseDetailModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onComplete
}) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Fácil': return 'bg-green-100 text-green-800 border-green-300';
      case 'Médio': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Difícil': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-600" />
            {exercise.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exercise Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Informações do Exercício
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Grupo Muscular:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {exercise.muscleGroup}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Dificuldade:</span>
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty || 'Não especificado'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Séries:</span>
                  <span className="font-bold text-purple-600">{exercise.sets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Repetições:</span>
                  <span className="font-bold text-purple-600">{exercise.reps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Descanso:</span>
                  <span className="font-bold text-orange-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exercise.rest}
                  </span>
                </div>
                {exercise.suggestedWeight && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Peso Sugerido:</span>
                    <span className="font-bold text-green-600">{exercise.suggestedWeight}</span>
                  </div>
                )}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Calorias Estimadas:</span>
                    <span className="font-bold text-red-600 flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {exercise.estimatedCalories && exercise.estimatedCalories > 0 
                        ? `${exercise.estimatedCalories} kcal`
                        : 'Calculando...'
                      }
                    </span>
                  </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Demonstração do Exercício
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ExerciseGifDisplay
                  exerciseName={exercise.name}
                  videoKeywords={exercise.videoKeywords}
                  className="mb-4"
                />
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Como Executar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {exercise.instructions && exercise.instructions.length > 50 ? (
                <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-blue-50 p-3 rounded-lg border border-blue-200">
                  {exercise.instructions}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-700 text-sm">
                      🤖 Instruções específicas sendo aprimoradas pela IA para melhor experiência
                    </p>
                  </div>
                  <div className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border">
                    Execute {exercise.name} com técnica adequada, mantendo controle total do movimento e respiração coordenada. 
                    Consulte as instruções detalhadas na visualização expandida para orientações específicas.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips and Common Mistakes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercise.tips && (
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    Dicas Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700">{exercise.tips}</p>
                </CardContent>
              </Card>
            )}

            {exercise.commonMistakes && (
              <Card className="border-2 border-red-200">
                <CardHeader className="bg-red-50 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Erros Comuns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700">{exercise.commonMistakes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Alternatives */}
          {exercise.alternatives && (
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-purple-50 pb-3">
                <CardTitle className="text-base">Exercícios Alternativos</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">{exercise.alternatives}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como Concluído
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
