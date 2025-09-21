
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Target, 
  Clock, 
  Weight,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';

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

interface ExerciseSeriesCardProps {
  exercise: Exercise;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onViewDetails: () => void;
}

export const ExerciseSeriesCard: React.FC<ExerciseSeriesCardProps> = ({
  exercise,
  isCompleted,
  onToggleComplete,
  onViewDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`transition-all duration-300 ${
      isCompleted 
        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-lg' 
        : 'bg-white border-gray-200 hover:shadow-md'
    }`}>
      <CardContent className="p-4">
        {/* Main exercise info */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCompleted 
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
              : 'bg-gradient-to-r from-primary to-purple-600 text-white'
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <Target className="w-6 h-6" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 leading-tight">
              {exercise.name}
            </h3>
            <Badge variant="outline" className="text-xs mb-2">
              {exercise.muscleGroup}
            </Badge>
          </div>
        </div>

        {/* Series information - highlighted */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-1">{exercise.sets}</div>
              <div className="text-xs text-blue-600 font-medium">SÉRIES</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-1">{exercise.reps}</div>
              <div className="text-xs text-purple-600 font-medium">REPS</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600 mb-1 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {exercise.rest}
              </div>
              <div className="text-xs text-orange-600 font-medium">DESCANSO</div>
            </div>
          </div>
        </div>

        {/* Weight suggestion if available */}
        {exercise.suggestedWeight && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <Weight className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Peso sugerido: {exercise.suggestedWeight}
            </span>
          </div>
        )}

        {/* Expandable details */}
        {isExpanded && (
          <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Como executar:</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {exercise.instructions || 'Instruções não disponíveis.'}
              </p>
            </div>
            
            {exercise.tips && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Dicas:</h4>
                <p className="text-sm text-gray-700">{exercise.tips}</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Mais detalhes
              </>
            )}
          </Button>
          
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-1" />
            Ver GIF
          </Button>
          
          <Button
            onClick={onToggleComplete}
            className={`flex-1 ${
              isCompleted
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            {isCompleted ? 'Concluído' : 'Marcar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
