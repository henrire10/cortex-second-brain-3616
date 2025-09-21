
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingWorkoutPlan {
  id: string;
  user_id: string;
  start_date: string;
  status: string;
  plan_data: any;
  user_name: string;
  user_email: string;
  fitness_goal: string;
  age: number;
  gender: string;
  experience_level: string;
  phone_number: string;
}

interface TrainerData {
  user_id: string;
  email: string;
}

const AdminApprovals = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ✅ NOVA QUERY: Buscar planos de treino aguardando aprovação
  const { data: workoutPlans, isLoading, refetch } = useQuery({
    queryKey: ['admin-workout-plans-approval', statusFilter, trainerFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('workout_plans_approval')
        .select(`
          *,
          profiles!workout_plans_approval_user_id_fkey(name, email, fitness_goal, age, gender, experience_level),
          user_whatsapp!left(phone_number)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_approval') {
          query = query.eq('status', 'pending_approval');
        }
      }

      if (searchTerm) {
        query = query.or(`profiles.name.ilike.%${searchTerm}%,profiles.email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      return (data || []).map((plan: any) => ({
        id: plan.id,
        user_id: plan.user_id,
        start_date: plan.start_date,
        status: plan.status,
        plan_data: plan.plan_data,
        user_name: plan.profiles?.name || 'N/A',
        user_email: plan.profiles?.email || 'N/A',
        fitness_goal: plan.profiles?.fitness_goal || 'N/A',
        age: plan.profiles?.age || 0,
        gender: plan.profiles?.gender || 'N/A',
        experience_level: plan.profiles?.experience_level || 'N/A',
        phone_number: plan.user_whatsapp?.[0]?.phone_number || 'N/A'
      })) as PendingWorkoutPlan[];
    },
    enabled: isAdmin
  });

  const { data: trainers } = useQuery({
    queryKey: ['admin-trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, email')
        .eq('role', 'personal_trainer');
      
      if (error) throw error;
      return (data || []) as TrainerData[];
    },
    enabled: isAdmin
  });

  const getStatusBadge = (status?: string) => {
    if (status === 'pending_approval') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Aguardando Aprovação
      </Badge>;
    }
    
    return <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle className="w-3 h-3" />
      Processado
    </Badge>;
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTrainerFilter('all');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
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
          <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Planos de Treino</h1>
                <p className="text-gray-600">Aprovações de planos completos de treino</p>
              </div>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Trainer */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Personal Trainer
                </label>
                <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os trainers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os trainers</SelectItem>
                    {trainers?.map((trainer) => (
                      <SelectItem key={trainer.user_id} value={trainer.user_id}>
                        {trainer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Planos de Treino ({workoutPlans?.length || 0} encontrados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando planos...</p>
              </div>
            ) : workoutPlans && workoutPlans.length > 0 ? (
              <div className="space-y-4">
                {workoutPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Plano de Treino - {plan.plan_data?.goal || 'Meta não especificada'}
                          </h4>
                          {getStatusBadge(plan.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="font-medium">{plan.user_name}</p>
                            <p className="text-xs text-gray-400">{plan.user_email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Data de Criação</p>
                            <p className="font-medium">
                              {format(new Date(plan.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Perfil</p>
                            <p className="text-sm">
                              {plan.age} anos, {plan.gender}
                            </p>
                            <p className="text-xs text-gray-500">
                              {plan.experience_level} - {plan.fitness_goal}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <p><strong>Dias de treino:</strong> {plan.plan_data?.workoutDays?.length || 0}</p>
                          <p><strong>Dificuldade:</strong> {plan.plan_data?.difficulty || 'N/A'}</p>
                          {plan.plan_data?.estimatedCalories && (
                            <p><strong>Calorias estimadas:</strong> {plan.plan_data.estimatedCalories}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          onClick={() => navigate(`/admin/user/${plan.user_id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Ver Cliente
                        </Button>
                        {plan.status === 'pending_approval' && (
                          <Button
                            onClick={() => navigate(`/plan-review/${plan.id}`)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Revisar Plano
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {statusFilter === 'all' && !searchTerm
                    ? 'Nenhum plano encontrado.'
                    : 'Nenhum plano encontrado para os filtros aplicados.'
                  }
                </p>
                {(statusFilter !== 'all' || searchTerm) && (
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Limpar Filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminApprovals;
