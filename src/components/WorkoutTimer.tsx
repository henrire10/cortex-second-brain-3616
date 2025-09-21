
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RotateCcw, Clock } from 'lucide-react';

export const WorkoutTimer: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRestTimer, setIsRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(60); // 60 seconds default

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          if (isRestTimer && prevTime <= 1) {
            setIsRunning(false);
            setIsRestTimer(false);
            // Play notification sound or vibration here
            return 0;
          }
          return isRestTimer ? prevTime - 1 : prevTime + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isRestTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
    setIsRestTimer(false);
  };

  const handleRestTimer = (duration: number) => {
    setTime(duration);
    setRestTime(duration);
    setIsRestTimer(true);
    setIsRunning(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="w-5 h-5 text-blue-600" />
          Cronômetro de Treino
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {formatTime(time)}
          </div>
          <p className="text-sm text-gray-600">
            {isRestTimer ? 'Tempo de descanso' : 'Tempo de treino'}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleStart}
            variant={isRunning ? "destructive" : "default"}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Descanso rápido:</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleRestTimer(30)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              30s
            </Button>
            <Button
              onClick={() => handleRestTimer(60)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              1min
            </Button>
            <Button
              onClick={() => handleRestTimer(90)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              1.5min
            </Button>
          </div>
        </div>

        {isRestTimer && time <= 10 && time > 0 && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-center">
            <p className="text-red-700 font-semibold">
              Descanso terminando em {time}s!
            </p>
          </div>
        )}

        {isRestTimer && time === 0 && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <p className="text-green-700 font-semibold">
              Descanso concluído! 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
