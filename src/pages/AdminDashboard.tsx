
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Clock, AlertTriangle, DollarSign, BarChart3, CreditCard, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AdminDashboard = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  // Buscar dados dos KPIs
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Usuários totais
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Novos usuários (30 dias)
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Treinos aguardando aprovação
      const { count: pendingWorkouts } = await supabase
        .from('daily_workouts')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending_approval');

      // Erros nas últimas 24h
      const { count: systemErrors } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .eq('log_level', 'ERROR')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      // Faturamento mensal (simulado - futura integração com Stripe)
      const { data: subscriptions } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscribed', true);

      const monthlyRevenue = (subscriptions?.length || 0) * 29.90; // Valor exemplo

      // Dados de engajamento para o gráfico
      const { data: workoutsData } = await supabase
        .from('daily_workouts')
        .select('status')
        .gte('created_at', startOfMonth);

      const completedWorkouts = workoutsData?.filter(w => w.status === 'completed').length || 0;
      const sentWorkouts = workoutsData?.filter(w => w.status === 'sent').length || 0;
      const pendingWorkoutsChart = workoutsData?.filter(w => w.status === 'pending').length || 0;

      const engagementData = [
        { name: 'Concluídos', value: completedWorkouts, color: '#22c55e' },
        { name: 'Enviados', value: sentWorkouts, color: '#f59e0b' },
        { name: 'Pendentes', value: pendingWorkoutsChart, color: '#ef4444' }
      ];

      return {
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        pendingWorkouts: pendingWorkouts || 0,
        systemErrors: systemErrors || 0,
        monthlyRevenue,
        engagementData
      };
    },
    enabled: isAdmin
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de Comando Administrativo</h1>
              <p className="text-gray-600">Painel de controle completo da plataforma</p>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium"
              >
                Gerenciar Usuários
              </button>
              <button
                onClick={() => navigate('/admin/approvals')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium"
              >
                Aprovações
              </button>
              <button
                onClick={() => navigate('/admin/notifications')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium"
              >
                Notificações
              </button>
              <button
                onClick={() => navigate('/admin/payments')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <CreditCard className="h-4 w-4" />
                Pagamentos
              </button>
              <button
                onClick={() => navigate('/admin/logs')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium"
              >
                Logs do Sistema
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Faturamento Mensal */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Faturamento Mensal (MRR)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 bg-green-400" />
              ) : (
                <div className="text-2xl font-bold">
                  R$ {dashboardData?.monthlyRevenue?.toFixed(2).replace('.', ',') || '0,00'}
                </div>
              )}
              <p className="text-xs text-green-100">
                Receita recorrente mensal
              </p>
            </CardContent>
          </Card>

          {/* Novos Usuários */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Novos Usuários (Mês)</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-blue-400" />
              ) : (
                <div className="text-2xl font-bold">{dashboardData?.newUsers}</div>
              )}
              <p className="text-xs text-blue-100">
                Crescimento nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          {/* Treinos Aguardando */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            onClick={() => navigate('/admin/approvals')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Aguardando Aprovação</CardTitle>
              <Clock className="h-4 w-4 text-orange-200" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-orange-400" />
              ) : (
                <div className="text-2xl font-bold">{dashboardData?.pendingWorkouts}</div>
              )}
              <p className="text-xs text-orange-100">
                Clique para gerenciar
              </p>
            </CardContent>
          </Card>

          {/* Erros do Sistema */}
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">Erros (24h)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-200" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-red-400" />
              ) : (
                <div className="text-2xl font-bold">{dashboardData?.systemErrors}</div>
              )}
              <p className="text-xs text-red-100">
                Erros nas últimas 24 horas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Engajamento e Navegação Rápida */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Engajamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Engajamento dos Alunos
              </CardTitle>
              <CardDescription>
                Distribuição do status dos treinos enviados este mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.engagementData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData?.engagementData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cards de Navegação Rápida */}
          <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gerenciar Usuários
                </CardTitle>
                <CardDescription>
                  Visualizar, buscar e gerenciar todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/approvals')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aprovar Treinos
                </CardTitle>
                <CardDescription>
                  Revisar e aprovar treinos aguardando aprovação
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/notifications')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Enviar Notificação Global
                </CardTitle>
                <CardDescription>
                  Enviar push para todos os usuários opt-in
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/logs')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Logs do Sistema
                </CardTitle>
                <CardDescription>
                  Monitorar logs e depurar problemas do sistema
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Métricas Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Operação</CardTitle>
            <CardDescription>
              Estatísticas gerais da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData?.totalUsers || 0}
                </div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData?.engagementData?.reduce((sum, item) => sum + item.value, 0) || 0}
                </div>
                <p className="text-sm text-gray-600">Treinos Este Mês</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData?.pendingWorkouts || 0}
                </div>
                <p className="text-sm text-gray-600">Aguardando Ação</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData?.engagementData?.find(item => item.name === 'Concluídos')?.value || 0}
                </div>
                <p className="text-sm text-gray-600">Treinos Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
