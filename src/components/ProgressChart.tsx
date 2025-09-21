
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ProgressChartProps {
  workoutStats: {
    totalWorkouts: number;
    currentStreak: number;
    weeklyGoal: number;
    completedThisWeek: number;
  };
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ workoutStats }) => {
  const weeklyData = [
    { day: 'Seg', treinos: 1, meta: 1 },
    { day: 'Ter', treinos: 0, meta: 1 },
    { day: 'Qua', treinos: 1, meta: 1 },
    { day: 'Qui', treinos: 1, meta: 1 },
    { day: 'Sex', treinos: 0, meta: 1 },
    { day: 'Sáb', treinos: 1, meta: 1 },
    { day: 'Dom', treinos: 0, meta: 0 }
  ];

  const progressData = [
    { semana: 'Sem 1', peso: 70, bf: 18 },
    { semana: 'Sem 2', peso: 69.5, bf: 17.5 },
    { semana: 'Sem 3', peso: 69.2, bf: 17.2 },
    { semana: 'Sem 4', peso: 68.8, bf: 16.8 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="treinos" fill="#8b5cf6" name="Treinos Realizados" />
              <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Corporal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="#8b5cf6" strokeWidth={2} name="Peso (kg)" />
              <Line type="monotone" dataKey="bf" stroke="#06b6d4" strokeWidth={2} name="% Gordura" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
