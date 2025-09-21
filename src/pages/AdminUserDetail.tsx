
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Settings, Activity, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  profile_status: string;
  created_at: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitness_goal?: string;
  experience_level?: string;
  workout_days_per_week?: number;
  session_duration?: number;
  activity_level?: string;
  exercise_preferences?: string;
  exercise_restrictions?: string;
  medical_conditions?: string;
  water_consumption?: string;
  sleep_quality?: number;
  average_sleep_hours?: number;
  stress_level?: number;
  dietary_restrictions?: string[];
  favorite_foods?: string[];
  disliked_foods?: string[];
  allergies?: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
}

interface WorkoutHistory {
  id: string;
  workout_date: string;
  workout_title: string;
  workout_content: string;
  status: string;
  approval_status: string;
  sent_at?: string;
  completed_at?: string;
}

const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Buscar detalhes do usuário
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as UserDetail;
    },
    enabled: isAdmin && !!userId
  });

  // Buscar role atual do usuário
  const { data: adminUser } = useQuery({
    queryKey: ['admin-user-role', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as AdminUser | null;
    },
    enabled: isAdmin && !!userId
  });

  // Buscar histórico de treinos do usuário
  const { data: workoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-user-workouts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as WorkoutHistory[];
    },
    enabled: isAdmin && !!userId
  });

  // Mutation para atualizar role
  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      if (newRole === 'user') {
        // Remover da tabela admin_users se role for 'user'
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Inserir ou atualizar na tabela admin_users
        const { error } = await supabase
          .from('admin_users')
          .upsert({
            user_id: userId!,
            email: user?.email || '',
            role: newRole as 'admin' | 'personal_trainer'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-role', userId] });
      toast({
        title: "Role atualizado com sucesso!",
        description: "As permissões do usuário foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar role",
        description: "Ocorreu um erro ao tentar atualizar as permissões.",
        variant: "destructive"
      });
      console.error('Erro ao atualizar role:', error);
    }
  });

  const handleRoleUpdate = () => {
    if (selectedRole && selectedRole !== (adminUser?.role || 'user')) {
      updateRoleMutation.mutate(selectedRole);
    }
  };

  const getCurrentRole = () => {
    return adminUser?.role || 'user';
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      admin: { label: 'Administrador', variant: 'destructive' },
      personal_trainer: { label: 'Personal Trainer', variant: 'default' },
      user: { label: 'Usuário', variant: 'outline' }
    };

    const roleInfo = roleMap[role] || { label: role, variant: 'outline' as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'pending_approval') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Aguardando Aprovação</Badge>;
    }
    
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
      completed: { label: 'Concluído', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      sent: { label: 'Enviado', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      pending: { label: 'Pendente', variant: 'outline', icon: <AlertCircle className="w-3 h-3" /> }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const, icon: null };
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) {
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
              <Button variant="ghost" onClick={() => navigate('/admin/users')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Usuários
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Perfil Completo do Usuário</h1>
                <p className="text-gray-600">{user.name} - {user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status do Perfil</label>
                <p className="text-gray-900">{user.profile_status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cadastro</label>
                <p className="text-gray-900">
                  {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
              {user.age && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Idade</label>
                  <p className="text-gray-900">{user.age} anos</p>
                </div>
              )}
              {user.gender && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Gênero</label>
                  <p className="text-gray-900">{user.gender}</p>
                </div>
              )}
              {user.height && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Altura</label>
                  <p className="text-gray-900">{user.height} cm</p>
                </div>
              )}
              {user.weight && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Peso</label>
                  <p className="text-gray-900">{user.weight} kg</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objetivos e Treino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Objetivos e Treino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.fitness_goal && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Objetivo Fitness</label>
                  <p className="text-gray-900">{user.fitness_goal}</p>
                </div>
              )}
              {user.experience_level && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Nível de Experiência</label>
                  <p className="text-gray-900">{user.experience_level}</p>
                </div>
              )}
              {user.workout_days_per_week && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Dias de Treino/Semana</label>
                  <p className="text-gray-900">{user.workout_days_per_week} dias</p>
                </div>
              )}
              {user.session_duration && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Duração da Sessão</label>
                  <p className="text-gray-900">{user.session_duration} minutos</p>
                </div>
              )}
              {user.activity_level && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Nível de Atividade</label>
                  <p className="text-gray-900">{user.activity_level}</p>
                </div>
              )}
              {user.exercise_preferences && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Preferências de Exercício</label>
                  <p className="text-gray-900">{user.exercise_preferences}</p>
                </div>
              )}
              {user.exercise_restrictions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Restrições de Exercício</label>
                  <p className="text-gray-900">{user.exercise_restrictions}</p>
                </div>
              )}
              {user.medical_conditions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Condições Médicas</label>
                  <p className="text-gray-900">{user.medical_conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gerenciamento de Papéis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gerenciamento de Papéis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Role Atual</label>
                <div className="mt-1">
                  {getRoleBadge(getCurrentRole())}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">
                  Alterar Role
                </label>
                <Select value={selectedRole || getCurrentRole()} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="personal_trainer">Personal Trainer</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && selectedRole !== getCurrentRole() && (
                <Button 
                  onClick={handleRoleUpdate}
                  disabled={updateRoleMutation.isPending}
                  className="w-full"
                >
                  {updateRoleMutation.isPending ? 'Atualizando...' : 'Atualizar Role'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Treinos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Treinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando histórico...</p>
              </div>
            ) : workoutHistory && workoutHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {workoutHistory.map((workout) => (
                  <div key={workout.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {workout.workout_title}
                        </h4>
                        {getStatusBadge(workout.status, workout.approval_status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(workout.workout_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {workout.workout_content}
                    </div>
                    
                    <div className="flex gap-4 text-xs text-gray-500">
                      {workout.sent_at && (
                        <span>Enviado: {format(new Date(workout.sent_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                      )}
                      {workout.completed_at && (
                        <span>Concluído: {format(new Date(workout.completed_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum treino encontrado para este usuário.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        {(user.sleep_quality || user.stress_level || user.dietary_restrictions) && (
          <Card>
            <CardHeader>
              <CardTitle>Informações de Saúde e Estilo de Vida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.sleep_quality && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Qualidade do Sono</label>
                    <p className="text-gray-900">{user.sleep_quality}/5</p>
                  </div>
                )}
                {user.average_sleep_hours && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horas de Sono</label>
                    <p className="text-gray-900">{user.average_sleep_hours}h por noite</p>
                  </div>
                )}
                {user.stress_level && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nível de Estresse</label>
                    <p className="text-gray-900">{user.stress_level}/5</p>
                  </div>
                )}
                {user.water_consumption && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Consumo de Água</label>
                    <p className="text-gray-900">{user.water_consumption}</p>
                  </div>
                )}
                {user.dietary_restrictions && user.dietary_restrictions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Restrições Alimentares</label>
                    <p className="text-gray-900">{user.dietary_restrictions.join(', ')}</p>
                  </div>
                )}
                {user.allergies && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alergias</label>
                    <p className="text-gray-900">{user.allergies}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetail;
