import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Weight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkoutLogData {
  id: string;
  exercise_name: string;
  set_number: number;
  weight_lifted: number;
  reps_performed: number;
  logged_at: string;
  workout_date: string;
}

interface ChartData {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

export default function WorkoutEvolution() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar exercícios únicos do usuário
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('workout_logs')
          .select('exercise_name')
          .eq('user_id', user.id)
          .order('exercise_name');

        if (error) throw error;

        const uniqueExercises = [...new Set(data.map(item => item.exercise_name))];
        setExercises(uniqueExercises);
        
        if (uniqueExercises.length > 0 && !selectedExercise) {
          setSelectedExercise(uniqueExercises[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar exercícios",
          variant: "destructive",
        });
      }
    };

    fetchExercises();
  }, [toast, selectedExercise]);

  // Buscar dados do exercício selecionado
  useEffect(() => {
    if (!selectedExercise) return;

    const fetchExerciseData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('exercise_name', selectedExercise)
          .order('workout_date');

        if (error) throw error;

        // Agrupar por data e calcular máximos
        const groupedData = data.reduce((acc: any, log: WorkoutLogData) => {
          const date = new Date(log.workout_date + 'T12:00:00').toLocaleDateString('pt-BR');
          
          if (!acc[date]) {
            acc[date] = {
              date,
              weight: log.weight_lifted,
              reps: log.reps_performed,
              volume: log.weight_lifted * log.reps_performed,
              totalSets: 1
            };
          } else {
            // Pegar o peso máximo e somar o volume total
            acc[date].weight = Math.max(acc[date].weight, log.weight_lifted);
            acc[date].reps = Math.max(acc[date].reps, log.reps_performed);
            acc[date].volume += log.weight_lifted * log.reps_performed;
            acc[date].totalSets += 1;
          }
          
          return acc;
        }, {});

        const processedData = Object.values(groupedData).map((item: any) => ({
          date: item.date,
          weight: item.weight,
          reps: item.reps,
          volume: Math.round(item.volume)
        }));

        setChartData(processedData);
      } catch (error) {
        console.error('Erro ao buscar dados do exercício:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do exercício",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [selectedExercise, toast]);

  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 0;
  const totalWorkouts = chartData.length;
  const averageWeight = chartData.length > 0 ? 
    Math.round(chartData.reduce((sum, d) => sum + d.weight, 0) / chartData.length * 10) / 10 : 0;

  return (
    <div className="min-h-full bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Minha Evolução
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e evolução nos exercícios
          </p>
        </div>

        {/* Exercise Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="w-5 h-5 text-blue-600" />
              Selecionar Exercício
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Escolha um exercício para analisar" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {selectedExercise && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Weight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peso Máximo</p>
                    <p className="text-xl font-bold text-blue-600">{maxWeight} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peso Médio</p>
                    <p className="text-xl font-bold text-green-600">{averageWeight} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Treinos</p>
                    <p className="text-xl font-bold text-purple-600">{totalWorkouts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        {selectedExercise && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Evolução - {selectedExercise}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Carregando dados...</p>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                        label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value} kg`,
                          name === 'weight' ? 'Peso Máximo' : 'Volume Total'
                        ]}
                        labelFormatter={(label) => `Data: ${label}`}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500">Nenhum dado encontrado para este exercício</p>
                    <p className="text-sm text-gray-400">Registre suas performances para ver a evolução</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {exercises.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Comece a Registrar sua Performance
              </h3>
              <p className="text-gray-500 mb-4">
                Para visualizar sua evolução, comece registrando suas performances nos treinos
              </p>
              <p className="text-sm text-gray-400">
                Use o botão 📈 nos cards de exercícios para registrar pesos e repetições
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}