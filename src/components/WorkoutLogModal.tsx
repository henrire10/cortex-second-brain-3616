import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Weight, Hash, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface WorkoutLogData {
  setNumber: number;
  weight: string;
  reps: string;
}

interface WorkoutLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  dailyWorkoutId?: string;
  workoutDate?: string;
}

export const WorkoutLogModal: React.FC<WorkoutLogModalProps> = ({
  isOpen,
  onClose,
  exercise,
  dailyWorkoutId,
  workoutDate
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logData, setLogData] = useState<WorkoutLogData[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const loadExistingLogs = async () => {
    if (!exercise) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Se temos uma data específica, buscar apenas logs desta data
      let query = supabase
        .from('workout_logs')
        .select('set_number, weight_lifted, reps_performed, workout_date')
        .eq('user_id', user.id)
        .eq('exercise_name', exercise.name);

      if (workoutDate) {
        // Filtrar apenas logs da data específica do treino
        query = query.eq('workout_date', workoutDate);
      }

      const { data: existingLogs, error } = await query
        .order('set_number', { ascending: true });

      if (error) {
        console.error('Erro ao carregar logs:', error);
        return;
      }

      if (existingLogs && existingLogs.length > 0) {
        // Criar mapa dos dados existentes por série
        const logMap = new Map();
        existingLogs.forEach(log => {
          logMap.set(log.set_number, {
            weight: log.weight_lifted.toString(),
            reps: log.reps_performed.toString()
          });
        });

        // Inicializar dados com valores salvos ou vazios
        const initialData = Array.from({ length: exercise.sets }, (_, index) => {
          const setNumber = index + 1;
          const savedData = logMap.get(setNumber);
          return {
            setNumber,
            weight: savedData?.weight || '',
            reps: savedData?.reps || ''
          };
        });

        setLogData(initialData);
        setHasLoadedData(existingLogs.length > 0);
      } else {
        // Sem dados salvos, inicializar vazio
        const initialData = Array.from({ length: exercise.sets }, (_, index) => ({
          setNumber: index + 1,
          weight: '',
          reps: ''
        }));
        setLogData(initialData);
        setHasLoadedData(false);
      }
    } catch (error) {
      console.error('Erro ao carregar logs existentes:', error);
      // Fallback para dados vazios
      const initialData = Array.from({ length: exercise.sets }, (_, index) => ({
        setNumber: index + 1,
        weight: '',
        reps: ''
      }));
      setLogData(initialData);
      setHasLoadedData(false);
    }
  };

  React.useEffect(() => {
    if (exercise && isOpen) {
      loadExistingLogs();
    }
  }, [exercise, isOpen, workoutDate]);

  const handleInputChange = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    setLogData(prev => prev.map((item, index) => 
      index === setIndex ? { ...item, [field]: value } : item
    ));
  };

  const handleSavePerformance = async () => {
    if (!exercise || !workoutDate) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Filtrar apenas séries com dados preenchidos
      const validLogs = logData.filter(log => log.weight && log.reps);
      
      if (validLogs.length === 0) {
        toast({
          title: "Atenção",
          description: "Preencha pelo menos uma série com peso e repetições",
          variant: "destructive",
        });
        return;
      }

      // UPSERT: Deletar registros existentes da data específica e inserir novos
      const { error: deleteError } = await supabase
        .from('workout_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_name', exercise.name)
        .eq('workout_date', workoutDate);

      if (deleteError) throw deleteError;

      // Preparar dados para inserção com workout_date
      const logsToInsert = validLogs.map(log => ({
        user_id: user.id,
        daily_workout_id: dailyWorkoutId || null,
        exercise_name: exercise.name,
        set_number: log.setNumber,
        weight_lifted: parseFloat(log.weight),
        reps_performed: parseInt(log.reps),
        workout_date: workoutDate
      }));

      const { error } = await supabase
        .from('workout_logs')
        .insert(logsToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso! 🎉",
        description: `Performance registrada para ${new Date(workoutDate).toLocaleDateString('pt-BR')}`,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar performance:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar performance. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Weight className="w-5 h-5 text-blue-600" />
            Registrar Performance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exercise Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{exercise.name}</h3>
              <p className="text-sm text-gray-600">{exercise.muscleGroup}</p>
            </CardContent>
          </Card>

          {/* Sets Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Performance por Série</Label>
              {hasLoadedData && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  {workoutDate ? `Dados de ${new Date(workoutDate).toLocaleDateString('pt-BR')}` : 'Dados carregados'}
                </div>
              )}
            </div>
            {logData.map((log, index) => (
              <Card key={log.setNumber} className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                      {log.setNumber}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`weight-${index}`} className="text-xs text-gray-600">
                          Peso (kg)
                        </Label>
                        <div className="relative">
                          <Weight className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            id={`weight-${index}`}
                            type="number"
                            step="0.5"
                            placeholder="0"
                            value={log.weight}
                            onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`reps-${index}`} className="text-xs text-gray-600">
                          Repetições
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            id={`reps-${index}`}
                            type="number"
                            placeholder="0"
                            value={log.reps}
                            onChange={(e) => handleInputChange(index, 'reps', e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSavePerformance}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Performance'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};