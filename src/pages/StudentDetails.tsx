
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Target,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText
} from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitness_goal?: string;
  specific_goal?: string;
  experience_level?: string;
  activity_level?: string;
  workout_days_per_week?: number;
  session_duration?: number;
  exercise_preferences?: string;
  exercise_restrictions?: string;
  medical_conditions?: string;
  commitment_level?: string;
  stress_level?: number;
  sleep_quality?: number;
  average_sleep_hours?: number;
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_end?: string;
  subscription_tier?: string;
}

interface WorkoutHistory {
  id: string;
  workout_date: string;
  workout_title: string;
  approval_status: string;
  status: string;
  completed_at?: string;
}

interface BodyMeasurement {
  date: string;
  weight?: number;
  body_fat?: number;
  muscle_mass?: number;
  chest?: number;
  waist_navel?: number;
}

export default function StudentDetails() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const { studentId } = useParams();
  const { user } = useAuth();
  const { isPersonalTrainer, loading: checkingRole } = usePersonalTrainer();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checkingRole && (!user || !isPersonalTrainer)) {
      navigate('/personal-login');
    }
  }, [user, isPersonalTrainer, checkingRole, navigate]);

  useEffect(() => {
    if (isPersonalTrainer && user && studentId) {
      fetchStudentData();
    }
  }, [isPersonalTrainer, user, studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando dados do aluno:', studentId);

      // Buscar perfil do aluno
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      setProfile(profileData);

      // Buscar status de assinatura
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_end, subscription_tier')
        .eq('user_id', studentId)
        .maybeSingle();

      if (!subError && subData) {
        setSubscription(subData);
      }

      // Buscar histórico de treinos
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('daily_workouts')
        .select('id, workout_date, workout_title, approval_status, status, completed_at')
        .eq('user_id', studentId)
        .eq('approved_by', user?.id)
        .order('workout_date', { ascending: false });

      if (!workoutsError && workoutsData) {
        setWorkoutHistory(workoutsData);
      }

      // Buscar medidas corporais
      const { data: measurementsData, error: measurementsError } = await supabase
        .from('body_measurements')
        .select('date, weight, body_fat, muscle_mass, chest, waist_navel')
        .eq('user_id', studentId)
        .order('date', { ascending: true });

      if (!measurementsError && measurementsData) {
        setBodyMeasurements(measurementsData);
      }

      console.log('✅ Dados do aluno carregados com sucesso');

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do aluno:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = () => {
    if (!subscription) {
      return <Badge className="bg-gray-100 text-gray-700">
        <Clock className="w-3 h-3 mr-1" />
        Não Assinante
      </Badge>;
    }

    if (subscription.subscribed && subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      const now = new Date();
      
      if (endDate > now) {
        return <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Assinatura Ativa
        </Badge>;
      } else {
        return <Badge className="bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Assinatura Vencida
        </Badge>;
      }
    }

    if (subscription.subscribed) {
      return <Badge className="bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Assinatura Ativa
      </Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-700">
      <Clock className="w-3 h-3 mr-1" />
      Inativo
    </Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">Aprovado</Badge>;
      case 'sent':
        return <Badge className="bg-yellow-100 text-yellow-700">Enviado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const prepareChartData = () => {
    return bodyMeasurements.map(measurement => ({
      date: formatDate(measurement.date),
      peso: measurement.weight || 0,
      gordura: measurement.body_fat || 0,
      musculo: measurement.muscle_mass || 0
    }));
  };

  if (checkingRole || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aluno não encontrado</h2>
          <p className="text-gray-600 mb-4">Não foi possível carregar os dados do aluno.</p>
          <Button onClick={() => navigate('/my-students')}>
            Voltar para Lista de Alunos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/my-students')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dossiê do Aluno</h1>
                <p className="text-sm text-gray-500">{profile.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Seção 1: Perfil Completo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Perfil Completo do Aluno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Nome: {profile.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Email: {profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Idade: {profile.age || 'N/A'} anos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Gênero: {profile.gender || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Medidas Físicas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Altura: {profile.height || 'N/A'} cm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Peso: {profile.weight || 'N/A'} kg</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Objetivos e Treino</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Objetivo: {profile.fitness_goal || 'N/A'}</span>
                    </div>
                    <div className="text-sm">Meta Específica: {profile.specific_goal || 'N/A'}</div>
                    <div className="text-sm">Experiência: {profile.experience_level || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Dias/semana: {profile.workout_days_per_week || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(profile.exercise_preferences || profile.exercise_restrictions || profile.medical_conditions) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Informações Adicionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {profile.exercise_preferences && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Preferências de Exercício</h4>
                        <p className="text-sm text-gray-600">{profile.exercise_preferences}</p>
                      </div>
                    )}
                    {profile.exercise_restrictions && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Restrições de Exercício</h4>
                        <p className="text-sm text-gray-600">{profile.exercise_restrictions}</p>
                      </div>
                    )}
                    {profile.medical_conditions && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Condições Médicas</h4>
                        <p className="text-sm text-gray-600">{profile.medical_conditions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção 2: Status da Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Status Atual</h3>
                  {getSubscriptionBadge()}
                  {subscription?.subscription_end && (
                    <p className="text-sm text-gray-600 mt-2">
                      Válida até: {formatDate(subscription.subscription_end)}
                    </p>
                  )}
                  {subscription?.subscription_tier && (
                    <p className="text-sm text-gray-600">
                      Plano: {subscription.subscription_tier}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Histórico de Treinos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Histórico de Treinos
              </CardTitle>
              <CardDescription>
                {workoutHistory.length} treino(s) registrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workoutHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum treino encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Data do Treino</th>
                        <th className="text-left py-2">Título do Treino</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Concluído em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workoutHistory.map((workout) => (
                        <tr key={workout.id} className="border-b">
                          <td className="py-3">{formatDate(workout.workout_date)}</td>
                          <td className="py-3">{workout.workout_title}</td>
                          <td className="py-3">{getStatusBadge(workout.status)}</td>
                          <td className="py-3">
                            {workout.completed_at ? formatDate(workout.completed_at) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção 4: Gráficos de Evolução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Gráficos de Evolução
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso das medidas corporais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bodyMeasurements.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem dados de medidas</h3>
                  <p className="text-gray-500">
                    Quando o aluno registrar medidas corporais, os gráficos aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Evolução das Medidas Corporais</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="peso" 
                            stroke="#8884d8" 
                            name="Peso (kg)"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="gordura" 
                            stroke="#82ca9d" 
                            name="Gordura (%)"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="musculo" 
                            stroke="#ffc658" 
                            name="Massa Muscular (kg)"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
