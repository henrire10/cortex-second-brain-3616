import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { PaywallModal } from './PaywallModal';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest?: string;
  weight?: string;
}

interface FreemiumWorkoutCardProps {
  workout: {
    title: string;
    exercises: Exercise[];
  };
  isPremium: boolean;
}

export const FreemiumWorkoutCard: React.FC<FreemiumWorkoutCardProps> = ({ workout, isPremium }) => {
  const [showPaywall, setShowPaywall] = useState(false);

  const visibleExercises = isPremium ? workout.exercises : workout.exercises.slice(0, 2);
  const hiddenCount = workout.exercises.length - 2;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{workout.title}</span>
            {!isPremium && (
              <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <Crown className="w-4 h-4" />
                <span>Freemium</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Exercícios visíveis */}
          {visibleExercises.map((exercise, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800">{index + 1}. {exercise.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {exercise.sets} séries × {exercise.reps} repetições
                {exercise.rest && ` • Descanso: ${exercise.rest}`}
                {exercise.weight && exercise.weight !== 'Peso corporal' && ` • Peso: ${exercise.weight}`}
              </p>
            </div>
          ))}

          {/* Exercícios bloqueados (apenas para freemium) */}
          {!isPremium && hiddenCount > 0 && (
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 opacity-60">
                <div className="flex items-center justify-center h-16">
                  <Lock className="w-6 h-6 text-gray-400 mr-2" />
                  <span className="text-gray-500 font-medium">
                    +{hiddenCount} exercícios bloqueados
                  </span>
                </div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <Button 
                  onClick={() => setShowPaywall(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Desbloquear Treino Completo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Treino Completo Bloqueado"
        description="Para ver todos os exercícios do seu treino personalizado, você precisa de uma assinatura premium."
        feature="treinos completos"
      />
    </>
  );
};