import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ExpandedUserReview } from '@/components/ExpandedUserReview';
import { 
  Dumbbell, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock,
  LogOut,
  Eye,
  User,
  Target,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Award,
  BarChart3,
  CreditCard,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MessageCircle
} from 'lucide-react';
import { PersonalTrainerChatPanel } from '@/components/PersonalTrainerChatPanel';
import { NotificationCenter } from '@/components/NotificationCenter';

interface PendingWorkout {
  id: string;
  user_id: string;
  workout_date: string;
  workout_title: string;
  workout_content: string;
  approval_status: string;
  user_name: string;
  user_email: string;
  fitness_goal?: string;
  age?: number;
  gender?: string;
  experience_level?: string;
  phone_number: string;
  height?: number;
  weight?: number;
  workout_days_per_week?: number;
  specific_goal?: string;
  activity_level?: string;
  session_duration?: number;
  available_equipment?: string[];
  exercise_preferences?: string;
  exercise_restrictions?: string;
  medical_conditions?: string;
  commitment_level?: string;
  stress_level?: number;
  sleep_quality?: number;
  average_sleep_hours?: number;
}

interface UserBodyData {
  user_id: string;
  user_name: string;
  user_email: string;
  age?: number;
  height?: number;
  weight?: number;
  latest_measurement?: {
    weight?: number;
    body_fat?: number;
    muscle_mass?: number;
    waist_navel?: number;
    chest?: number;
    right_arm_flexed?: number;
    right_thigh_proximal?: number;
    date: string;
  };
}

interface DashboardStats {
  activeStudents: number;
  monthlyReviews: number;
  studentAdherence: number;
  monthlyEarnings: number;
  totalToReceive: number;
  pendingWorkouts: number;
}

export default function PersonalDashboard() {
  const [pendingWorkouts, setPendingWorkouts] = useState<PendingWorkout[]>([]);
  const [groupedWorkouts, setGroupedWorkouts] = useState<Record<string, PendingWorkout[]>>({});
  const [userBodyData, setUserBodyData] = useState<UserBodyData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: 0,
    monthlyReviews: 0,
    studentAdherence: 0,
    monthlyEarnings: 0,
    totalToReceive: 0,
    pendingWorkouts: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [approvedWorkouts, setApprovedWorkouts] = useState<Set<string>>(new Set());

  // ✅ ETAPA 1: Cache e Estado - Função para limpar todos os estados
  const clearAllStates = () => {
    console.log('🧹 LIMPEZA DE ESTADO: Resetando todos os estados locais...');
    setPendingWorkouts([]);
    setGroupedWorkouts({});
    setUserBodyData([]);
    setApprovedWorkouts(new Set());
    setExpandedUserId(null);
    setStats({
      activeStudents: 0,
      monthlyReviews: 0,
      studentAdherence: 0,
      monthlyEarnings: 0,
      totalToReceive: 0,
      pendingWorkouts: 0
    });
    console.log('✅ LIMPEZA DE ESTADO: Estados limpos com sucesso');
  };
  const { user } = useAuth();
  const { isPersonalTrainer, loading: checkingRole } = usePersonalTrainer();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checkingRole && (!user || !isPersonalTrainer)) {
      navigate('/personal-login');
    }
  }, [user, isPersonalTrainer, checkingRole, navigate]);

  useEffect(() => {
    if (isPersonalTrainer && user) {
      fetchDashboardData();
    }
  }, [isPersonalTrainer, user]);

  const fetchDashboardData = async () => {
    try {
      // ✅ ETAPA 1: Limpar cache e estado antes de buscar novos dados
      console.log('🧹 ETAPA 1: Iniciando limpeza de cache e estado...');
      clearAllStates();
      
      setLoading(true);
      console.log('🔍 LIMPEZA COMPLETA: Buscando dados frescos do servidor...');
      console.log('📊 AUDITORIA ESPECÍFICA - Procurando treinos do usuário gg@gmail.com...');
      
      // ✅ OTIMIZAÇÃO: Buscar apenas treinos recentes para evitar sobrecarga
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      console.log('🚀 OTIMIZAÇÃO: Buscando treinos a partir de:', thirtyDaysAgoStr);
      
      // ✅ CORREÇÃO PRINCIPAL: Buscar treinos pendentes direto da tabela daily_workouts 
      const { data: allWorkoutsData, error: workoutsError } = await supabase
        .from('daily_workouts')
        .select(`
          id, user_id, workout_date, workout_title, workout_content, 
          approval_status, created_at, updated_at,
          profiles!inner(name, email, age, gender, fitness_goal, experience_level, height, weight)
        `)
        .eq('approval_status', 'pending_approval')
        .gte('workout_date', thirtyDaysAgoStr)
        .order('created_at', { ascending: false });

      if (workoutsError) {
        console.error('❌ CORREÇÃO: Erro na consulta:', workoutsError);
        throw new Error(`Erro na busca de treinos: ${workoutsError.message}`);
      }

        console.log('✅ CORREÇÃO: Dados encontrados:', allWorkoutsData?.length || 0);

      let filteredWorkouts: PendingWorkout[] = [];
      let reconstructedApprovedWorkouts = new Set<string>();

      // ✅ Log detalhado dos treinos encontrados
      if (allWorkoutsData) {
        console.log('✅ TREINOS ENCONTRADOS:', allWorkoutsData.length);
        allWorkoutsData.forEach((workout, index) => {
          console.log(`🎯 Treino ${index + 1}:`, {
            id: workout.id,
            user_email: workout.profiles?.email,
            user_name: workout.profiles?.name,
            workout_title: workout.workout_title,
            workout_date: workout.workout_date,
            approval_status: workout.approval_status
          });
        });
      }

      if (allWorkoutsData && allWorkoutsData.length > 0) {
        // ✅ CORREÇÃO: Primeiro, identificar usuários que têm pelo menos 1 treino pendente
        const usersWithPendingWorkouts = new Set<string>();
        
        allWorkoutsData.forEach(workout => {
          if (workout.approval_status === 'pending_approval') {
            usersWithPendingWorkouts.add(workout.user_id);
          }
        });

        console.log('🎯 CORREÇÃO: Usuários com treinos pendentes:', usersWithPendingWorkouts.size);

        // ✅ AUDITORIA: Log detalhado para treinos pendentes
        allWorkoutsData.forEach(workout => {
          if (workout.approval_status === 'pending_approval') {
            console.log('🎯 TREINO PENDENTE ENCONTRADO:', {
              id: workout.id,
              user_id: workout.user_id,
              user_name: workout.profiles?.name,
              user_email: workout.profiles?.email,
              workout_title: workout.workout_title,
              workout_date: workout.workout_date,
              approval_status: workout.approval_status
            });
          }
        });

        // ✅ CORREÇÃO: Incluir TODOS os treinos (pendentes + aprovados) APENAS dos usuários que têm pelo menos 1 pendente
        filteredWorkouts = allWorkoutsData
          .filter(workout => usersWithPendingWorkouts.has(workout.user_id))
          .map((workout) => {
            // Reconstruir estado de aprovados baseado no banco
            if (workout.approval_status === 'approved') {
              reconstructedApprovedWorkouts.add(workout.id);
            }
            
            return {
              id: workout.id,
              user_id: workout.user_id,
              workout_date: workout.workout_date,
              workout_title: workout.workout_title || 'Treino sem título',
              workout_content: workout.workout_content || 'Conteúdo não disponível',
              approval_status: workout.approval_status,
              user_name: workout.profiles?.name || 'Nome não disponível',
              user_email: workout.profiles?.email || 'Email não disponível',
              fitness_goal: workout.profiles?.fitness_goal || 'Objetivo não especificado',
              age: workout.profiles?.age || 0,
              gender: workout.profiles?.gender || 'Não especificado',
              experience_level: workout.profiles?.experience_level || 'Não especificado',
              phone_number: 'Não cadastrado',
              height: workout.profiles?.height || undefined,
              weight: workout.profiles?.weight || undefined,
              workout_days_per_week: undefined,
              specific_goal: undefined,
              activity_level: undefined,
              session_duration: undefined,
              available_equipment: undefined,
              exercise_preferences: undefined,
              exercise_restrictions: undefined,
              medical_conditions: undefined,
              commitment_level: undefined,
              stress_level: undefined,
              sleep_quality: undefined,
              average_sleep_hours: undefined
            };
          });

        // ✅ CORREÇÃO: Restaurar estado local baseado nos dados reais
        console.log('🔄 CORREÇÃO: Restaurando estado de treinos aprovados:', reconstructedApprovedWorkouts.size);
        setApprovedWorkouts(reconstructedApprovedWorkouts);

        // ✅ Função para extrair letra do título do treino
        const extractWorkoutLetter = (title: string): string => {
          const match = title.match(/Treino ([A-Z])/);
          return match ? match[1] : 'Z'; // Z para itens sem letra (ficam por último)
        };

        // ✅ CORREÇÃO: Agrupar APENAS os treinos filtrados por usuário
        const grouped = filteredWorkouts.reduce((acc, workout) => {
          const key = workout.user_id;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(workout);
          return acc;
        }, {} as Record<string, PendingWorkout[]>);

        // ✅ ORGANIZAÇÃO ALFABÉTICA: Ordenar treinos de cada usuário pela letra (A → B → C → D → E)
        Object.keys(grouped).forEach(userId => {
          grouped[userId].sort((a, b) => {
            const letterA = extractWorkoutLetter(a.workout_title);
            const letterB = extractWorkoutLetter(b.workout_title);
            return letterA.localeCompare(letterB);
          });
        });

        setGroupedWorkouts(grouped);
        setPendingWorkouts(filteredWorkouts);

        console.log('✅ CORREÇÃO: Dados processados com sucesso:', {
          usuariosComTreinosPendentes: usersWithPendingWorkouts.size,
          totalTreinosFiltrados: filteredWorkouts.length,
          treinosAprovados: reconstructedApprovedWorkouts.size,
          gruposUsuarios: Object.keys(grouped).length
        });
      } else {
        console.log('ℹ️ CORREÇÃO: Nenhum treino encontrado');
        setGroupedWorkouts({});
        setPendingWorkouts([]);
        setApprovedWorkouts(new Set());
      }

      // ✅ BUSCA DE DADOS CORPORAIS usando os mesmos user_ids
      const uniqueUserIds = [...new Set(filteredWorkouts.map(w => w.user_id))];
      let bodyDataArray: UserBodyData[] = [];
      
      if (uniqueUserIds.length > 0) {
        console.log('🔍 CORREÇÃO: Buscando dados corporais para usuários:', uniqueUserIds.length);
        
        const { data: measurementsData, error: measurementsError } = await supabase
          .from('body_measurements')
          .select('user_id, weight, body_fat, muscle_mass, waist_navel, chest, right_arm_flexed, right_thigh_proximal, date')
          .in('user_id', uniqueUserIds)
          .order('date', { ascending: false });

        if (measurementsError) {
          console.warn('⚠️ CORREÇÃO: Erro ao buscar medidas corporais (não crítico):', measurementsError);
        }

        const measurementMap = measurementsData?.reduce((acc, measurement) => {
          if (!acc[measurement.user_id] || new Date(measurement.date) > new Date(acc[measurement.user_id].date)) {
            acc[measurement.user_id] = measurement;
          }
          return acc;
        }, {} as Record<string, any>) || {};

        bodyDataArray = uniqueUserIds.map(userId => {
          const userWorkout = filteredWorkouts.find(w => w.user_id === userId);
          const latestMeasurement = measurementMap[userId];
          
          return {
            user_id: userId,
            user_name: userWorkout?.user_name || 'Nome não disponível',
            user_email: userWorkout?.user_email || 'Email não disponível',
            age: userWorkout?.age,
            height: userWorkout?.height,
            weight: userWorkout?.weight,
            latest_measurement: latestMeasurement ? {
              weight: latestMeasurement.weight,
              body_fat: latestMeasurement.body_fat,
              muscle_mass: latestMeasurement.muscle_mass,
              waist_navel: latestMeasurement.waist_navel,
              chest: latestMeasurement.chest,
              right_arm_flexed: latestMeasurement.right_arm_flexed,
              right_thigh_proximal: latestMeasurement.right_thigh_proximal,
              date: latestMeasurement.date
            } : undefined
          };
        });
      }

      setUserBodyData(bodyDataArray);

      // ✅ CÁLCULO DE ESTATÍSTICAS (mantendo a lógica existente)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();

      // 1. Alunos Ativos
      const { data: activeStudentsData, error: studentsError } = await supabase
        .from('daily_workouts')
        .select('user_id')
        .eq('approved_by', user?.id)
        .not('user_id', 'is', null);

      if (studentsError) {
        console.warn('⚠️ IMPLEMENTAÇÃO UNIFICADA: Erro ao buscar alunos ativos:', studentsError);
      }

      const activeStudents = activeStudentsData ? new Set(activeStudentsData.map(w => w.user_id)).size : 0;

      // 2. Avaliações no Mês
      const { data: monthlyReviewsData, error: reviewsError } = await supabase
        .from('daily_workouts')
        .select('id')
        .eq('approved_by', user?.id)
        .gte('approved_at', startOfMonth)
        .lte('approved_at', endOfMonth);

      if (reviewsError) {
        console.warn('⚠️ IMPLEMENTAÇÃO UNIFICADA: Erro ao buscar avaliações mensais:', reviewsError);
      }

      const monthlyReviews = monthlyReviewsData?.length || 0;

      // 3. Ganhos no Mês
      const { data: earningsData, error: earningsError } = await supabase
        .from('daily_workouts')
        .select('trainer_payout')
        .eq('approved_by', user?.id)
        .gte('approved_at', startOfMonth)
        .lte('approved_at', endOfMonth);

      if (earningsError) {
        console.warn('⚠️ IMPLEMENTAÇÃO UNIFICADA: Erro ao buscar ganhos:', earningsError);
      }

      const monthlyEarnings = earningsData?.reduce((sum, workout) => sum + (workout.trainer_payout || 0), 0) || 0;

      // 4. Total a Receber (treinos aprovados mas ainda não pagos)
      const { data: totalToReceiveData, error: totalToReceiveError } = await supabase
        .from('daily_workouts')
        .select('trainer_payout')
        .eq('approved_by', user?.id)
        .eq('approval_status', 'approved')
        .is('user_completion_payment', null);

      if (totalToReceiveError) {
        console.warn('⚠️ IMPLEMENTAÇÃO UNIFICADA: Erro ao buscar total a receber:', totalToReceiveError);
      }

      const totalToReceive = totalToReceiveData?.reduce((sum, workout) => sum + (workout.trainer_payout || 0), 0) || 0;

      // 5. Adesão dos Alunos
      const { data: sentWorkoutsData, error: adherenceError } = await supabase
        .from('daily_workouts')
        .select('id, status')
        .eq('approved_by', user?.id)
        .gte('workout_date', startOfMonth.split('T')[0])
        .lte('workout_date', endOfMonth.split('T')[0]);

      if (adherenceError) {
        console.warn('⚠️ IMPLEMENTAÇÃO UNIFICADA: Erro ao buscar adesão:', adherenceError);
      }

      const sentWorkouts = sentWorkoutsData?.length || 0;
      const completedWorkouts = sentWorkoutsData?.filter(w => w.status === 'completed').length || 0;
      const studentAdherence = sentWorkouts > 0 ? Math.round((completedWorkouts / sentWorkouts) * 100) : 0;

      setStats({
        activeStudents,
        monthlyReviews,
        studentAdherence,
        monthlyEarnings,
        totalToReceive,
        pendingWorkouts: filteredWorkouts.filter(w => w.approval_status === 'pending_approval').length
      });

      console.log('✅ CORREÇÃO: Dashboard carregado com sucesso!', {
        totalPendingWorkouts: filteredWorkouts.filter(w => w.approval_status === 'pending_approval').length,
        uniqueUsers: Object.keys(groupedWorkouts).length,
        approvedWorkoutsRestored: reconstructedApprovedWorkouts.size,
        stats: {
          activeStudents,
          monthlyReviews,
          studentAdherence,
          monthlyEarnings,
          totalToReceive
        }
      });

    } catch (error: any) {
      console.error('❌ CORREÇÃO: Erro crítico no dashboard:', {
        error,
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Erro ao carregar dashboard",
        description: `Falha na busca de dados: ${error.message}. Tente atualizar a página.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 IMPLEMENTAÇÃO UNIFICADA: Refresh manual iniciado...');
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/personal-login');
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleExpandUser = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const handleWorkoutApproved = (workoutId: string) => {
    console.log('🎯 CORREÇÃO: Marcando treino como aprovado e mantendo visível...', workoutId);
    
    // 1. Adicionar treino ao conjunto de aprovados
    setApprovedWorkouts(prev => {
      const newApproved = new Set([...prev, workoutId]);
      console.log('✅ Treinos aprovados atualizados:', newApproved.size);
      return newApproved;
    });
    
    // 2. ✅ CORREÇÃO: Verificar se TODOS os treinos do usuário foram aprovados (incluindo os já aprovados)
    const workoutToApprove = pendingWorkouts.find(w => w.id === workoutId);
    if (workoutToApprove) {
      const userWorkouts = pendingWorkouts.filter(w => w.user_id === workoutToApprove.user_id);
      const userApprovedCount = userWorkouts.filter(w => 
        approvedWorkouts.has(w.id) || w.id === workoutId || w.approval_status === 'approved'
      ).length;
      
      console.log(`👤 CORREÇÃO: Usuário ${workoutToApprove.user_name}:`, {
        totalTreinos: userWorkouts.length,
        aprovados: userApprovedCount,
        todosAprovados: userApprovedCount === userWorkouts.length
      });
      
      // 3. ✅ CORREÇÃO: Só remover se TODOS os treinos (incluindo já aprovados) foram processados
      const userPendingCount = userWorkouts.filter(w => w.approval_status === 'pending_approval').length;
      const userNewlyApproved = userWorkouts.filter(w => approvedWorkouts.has(w.id) || w.id === workoutId).length;
      
      if (userPendingCount === userNewlyApproved) {
        console.log('🎊 CORREÇÃO: TODOS OS TREINOS PENDENTES APROVADOS! Removendo usuário da lista...');
        
        setPendingWorkouts(prev => prev.filter(w => w.user_id !== workoutToApprove.user_id));
        
        setGroupedWorkouts(prev => {
          const updated = { ...prev };
          delete updated[workoutToApprove.user_id];
          console.log(`👤 Usuário ${workoutToApprove.user_name} removido da lista (todos treinos pendentes aprovados)`);
          return updated;
        });
        
        // Limpar treinos aprovados deste usuário do estado local
        setApprovedWorkouts(prev => {
          const newSet = new Set(prev);
          userWorkouts.forEach(w => newSet.delete(w.id));
          return newSet;
        });
      }
    }
    
    // 4. Atualizar estatísticas localmente
    setStats(prev => {
      const newStats = {
        ...prev,
        monthlyReviews: prev.monthlyReviews + 1,
        monthlyEarnings: prev.monthlyEarnings + 5.0,
        totalToReceive: prev.totalToReceive + 5.0,
        pendingWorkouts: Math.max(0, prev.pendingWorkouts - 1)
      };
      
      console.log('📈 Estatísticas atualizadas localmente:', {
        revisões: `${prev.monthlyReviews} → ${newStats.monthlyReviews}`,
        ganhos: `R$ ${prev.monthlyEarnings.toFixed(2)} → R$ ${newStats.monthlyEarnings.toFixed(2)}`,
        pendentes: `${prev.pendingWorkouts} → ${newStats.pendingWorkouts}`
      });
      
      return newStats;
    });
    
    // 5. Mostrar notificação de sucesso
    toast({
      title: "Treino Aprovado! 🎉",
      description: "Treino marcado como aprovado. Você ganhou R$ 5,00!",
      duration: 3000,
    });
    
    console.log('✅ IMPLEMENTAÇÃO UNIFICADA: Treino aprovado e mantido visível até todos serem aprovados');
  };

  const handleWorkoutRejected = (workoutId: string) => {
    // Implementar lógica de rejeição se necessário
    console.log('Treino rejeitado:', workoutId);
  };

  if (checkingRole || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard profissional...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationCenter />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Profissional</h1>
                <p className="text-sm text-gray-500">BiaFitness Pro - Educador Físico</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/my-students')}
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                <GraduationCap className="w-4 h-4" />
                Meus Alunos
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Alunos Ativos */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Alunos Ativos</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeStudents}</div>
              <p className="text-xs text-blue-100 mt-1">
                Clientes sob sua supervisão
              </p>
            </CardContent>
          </Card>

          {/* Avaliações no Mês */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Treinos Aprovados/Mês</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.monthlyReviews}</div>
              <p className="text-xs text-green-100 mt-1">
                Cada treino = R$ 5,00 (padrão)
              </p>
            </CardContent>
          </Card>

          {/* Adesão dos Alunos */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Adesão dos Alunos</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.studentAdherence}%</div>
              <p className="text-xs text-orange-100 mt-1">
                Taxa de conclusão dos treinos
              </p>
            </CardContent>
          </Card>

          {/* Ganhos no Mês */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Ganhos no Mês (R$)</CardTitle>
              <DollarSign className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {stats.monthlyEarnings.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-purple-100 mt-1">
                Total a Receber: R$ {stats.totalToReceive.toFixed(2).replace('.', ',')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção Principal com 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna 1: Fila de Aprovação Agrupada */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <CardTitle>Fila de Aprovação por Usuário</CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {Object.keys(groupedWorkouts).length} usuários
                    </Badge>
                  </div>
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <CardDescription>
                  Treinos agrupados por usuário aguardando sua revisão e aprovação. Cada treino aprovado = R$ 5,00
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedWorkouts).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Todas as avaliações em dia! 🎉
                    </h3>
                    <p className="text-gray-500">
                      Não há treinos pendentes de aprovação
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedWorkouts).map(([userId, userWorkouts]) => {
                      const firstWorkout = userWorkouts[0];
                      const approvedCount = userWorkouts.filter(w => approvedWorkouts.has(w.id)).length;
                      const pendingCount = userWorkouts.length - approvedCount;
                      const allApproved = approvedCount === userWorkouts.length;
                      const potentialEarnings = userWorkouts.length * 5.0;
                      const earnedAmount = approvedCount * 5.0;
                      const isExpanded = expandedUserId === userId;
                      
                      return (
                        <div key={userId} className="space-y-4">
                          {/* Header do Usuário */}
                          <div className={`border rounded-lg p-4 transition-colors ${
                            allApproved 
                              ? 'border-green-200 bg-green-50' 
                              : approvedCount > 0 
                                ? 'border-blue-200 bg-blue-50' 
                                : 'border-orange-200 hover:bg-orange-50'
                          }`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                allApproved 
                                  ? 'bg-green-100' 
                                  : approvedCount > 0 
                                    ? 'bg-blue-100' 
                                    : 'bg-purple-100'
                              }`}>
                                <User className={`w-5 h-5 ${
                                  allApproved 
                                    ? 'text-green-600' 
                                    : approvedCount > 0 
                                      ? 'text-blue-600' 
                                      : 'text-purple-600'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {firstWorkout.user_name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {firstWorkout.user_email}
                                </p>
                                {firstWorkout.phone_number && firstWorkout.phone_number !== 'Não cadastrado' && (
                                  <p className="text-xs text-blue-600">
                                    📱 {firstWorkout.phone_number}
                                  </p>
                                )}
                              </div>
                              <div className="ml-auto flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {firstWorkout.fitness_goal}
                                </Badge>
                                {approvedCount > 0 && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    ✅ {approvedCount}/{userWorkouts.length}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  R$ {earnedAmount.toFixed(2).replace('.', ',')} / R$ {potentialEarnings.toFixed(2).replace('.', ',')}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Lista de Treinos do Usuário */}
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">
                                {pendingCount > 0 ? `${pendingCount} treino(s) pendente(s)` : 'Todos os treinos aprovados! 🎉'}
                                {approvedCount > 0 && ` - ${approvedCount} já aprovado(s)`}
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {userWorkouts.map((workout, index) => {
                                  const isApproved = approvedWorkouts.has(workout.id);
                                  return (
                                    <div key={workout.id} className={`flex items-center justify-between p-3 rounded border transition-all ${
                                      isApproved 
                                        ? 'bg-green-100 border-green-300' 
                                        : 'bg-white border-gray-200'
                                    }`}>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-sm font-medium ${
                                            isApproved ? 'text-green-700' : 'text-purple-600'
                                          }`}>
                                            Treino {index + 1}:
                                          </span>
                                          <span className="text-sm font-medium">
                                            {workout.workout_title}
                                          </span>
                                          {isApproved && (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          Data: {formatDate(workout.workout_date)}
                                        </p>
                                        {workout.experience_level && workout.experience_level !== 'Não especificado' && (
                                          <p className="text-xs text-blue-600">
                                            Nível: {workout.experience_level}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium ${
                                          isApproved ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                          {isApproved ? '✅ R$ 5,00' : '+R$ 5,00'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Botão de Revisar/Expandir */}
                              <div className="flex justify-center pt-3 border-t">
                                <Button
                                  onClick={() => handleExpandUser(userId)}
                                  variant="outline"
                                  className="w-full"
                                  disabled={allApproved}
                                >
                                  {allApproved ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                      Todos Aprovados
                                    </>
                                  ) : isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4 mr-2" />
                                      Recolher Revisão
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Revisar Treinos
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Seção Expandida */}
                          {isExpanded && !allApproved && (
                            <ExpandedUserReview
                              userWorkouts={userWorkouts}
                              onCollapse={() => setExpandedUserId(null)}
                              onWorkoutApproved={handleWorkoutApproved}
                              onWorkoutRejected={handleWorkoutRejected}
                              approvedWorkouts={approvedWorkouts}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Cards Financeiros e Performance */}
          <div className="space-y-6">

            {/* Card Financeiro Detalhado */}
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <CreditCard className="w-5 h-5" />
                  Sistema de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      💰 Como funciona o pagamento:
                    </p>
                    <p className="text-xs text-blue-700">
                      • Você recebe R$ 5,00 para cada treino que aprovar<br/>
                      • Pagamento é por treino individual, não por usuário<br/>
                      • Quanto mais treinos aprovar, maior sua receita
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Receita deste mês:</span>
                    <span className="font-bold text-lg text-green-600">
                      R$ {stats.monthlyEarnings.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Treinos aprovados:</span>
                    <span className="font-semibold text-purple-600">
                      {stats.monthlyReviews}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total a Receber:</span>
                    <span className="font-bold text-orange-600">
                      R$ {stats.totalToReceive.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Receita média/treino:</span>
                    <span className="font-semibold text-blue-600">
                      R$ {stats.monthlyReviews > 0 ? (stats.monthlyEarnings / stats.monthlyReviews).toFixed(2).replace('.', ',') : '0,00'}
                    </span>
                  </div>
                  
                  <hr className="my-3" />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/personal-dashboard/payments')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Histórico de Pagamentos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modern Chat Panel */}
            <PersonalTrainerChatPanel />

            {/* Card de Performance */}
            <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Award className="w-5 h-5" />
                  Performance dos Alunos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {stats.studentAdherence}%
                    </div>
                    <p className="text-sm text-gray-600">Taxa de Adesão</p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.studentAdherence, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    {stats.studentAdherence >= 80 ? '🎉 Excelente!' : 
                     stats.studentAdherence >= 60 ? '👍 Boa performance!' : 
                     '📈 Há espaço para melhoria'}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>  {/* Closes space-y-6 div from line 925 */}
        </div>    {/* Closes grid div from line 723 */}
      </div>      {/* Closes main content div from line 659 */}
    </div>        {/* Closes min-h-screen div from line 607 */}
    </>
  );
}
