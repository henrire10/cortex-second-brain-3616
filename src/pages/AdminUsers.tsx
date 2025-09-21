
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Search, Filter, Eye, Settings, DollarSign, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { approveUserWorkouts } from '@/utils/adminWorkoutApproval';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  profile_completed: boolean;
  questionnaire_completed: boolean;
  age?: number;
  fitness_goal?: string;
  role?: string;
}

const AdminUsers = () => {
  const { isAdmin, loading } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [approving, setApproving] = useState(false);

  const approveSuzanaWorkouts = async () => {
    if (!user) return;
    
    setApproving(true);
    try {
      const result = await approveUserWorkouts('suzanadossantoscosta63@gmail.com', user.id);
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao aprovar treinos:', error);
      toast.error('Erro ao aprovar treinos');
    } finally {
      setApproving(false);
    }
  };

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      console.log('🔍 ADMIN USERS: Buscando usuários com filtros:', { searchTerm, roleFilter });
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          created_at,
          profile_completed,
          questionnaire_completed,
          age,
          fitness_goal
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data: profilesData, error: profilesError } = await query.limit(100);
      if (profilesError) throw profilesError;

      if (!profilesData) return [];

      // Buscar roles dos usuários
      const userIds = profilesData.map(u => u.id);
      const { data: rolesData, error: rolesError } = await supabase
        .from('admin_users')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
      }

      // Combinar dados
      const usersWithRoles = profilesData.map(user => {
        const roleInfo = rolesData?.find(r => r.user_id === user.id);
        return {
          ...user,
          role: roleInfo?.role || 'user'
        };
      });

      // Filtrar por role se necessário
      if (roleFilter !== 'all') {
        return usersWithRoles.filter(user => user.role === roleFilter);
      }

      console.log('✅ ADMIN USERS: Usuários carregados:', {
        total: usersWithRoles.length,
        comRole: usersWithRoles.filter(u => u.role !== 'user').length
      });

      return usersWithRoles;
    },
    enabled: isAdmin
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'personal_trainer':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">Personal Trainer</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
  };

  const deleteUserData = async (email: string) => {
    try {
      console.log('🗑️ Iniciando exclusão de dados para:', email);
      
      // 1. Encontrar o user_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Usuário não encontrado:', email);
        return;
      }

      const userId = profileData.id;
      console.log('🔍 User ID encontrado:', userId);

      // 2. Exclusão em cascata - usando queries diretas para evitar erros de tipo
      const tablesToDelete = [
        'questionnaire_debug_logs',
        'workout_logs',
        'completed_exercises',
        'user_achievements',
        'outdoor_activities',
        'progress_photos',
        'body_measurements',
        'measurement_goals',
        'daily_workouts',
        'workout_plans_approval',
        'workout_plans',
        'whatsapp_messages',
        'whatsapp_schedule',
        'user_whatsapp',
        'push_subscriptions',
        'subscribers',
        'admin_users',
        'profiles'
      ];

      for (const tableName of tablesToDelete) {
        try {
          // Usar delete direto sem RPC para evitar problemas de tipagem
          const { error } = await supabase
            .from(tableName as any)
            .delete()
            .eq('user_id', userId);
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error(`❌ Erro ao deletar de ${tableName}:`, error);
          } else {
            console.log(`✅ Dados removidos de ${tableName}`);
          }
        } catch (err) {
          console.error(`❌ Erro ao processar ${tableName}:`, err);
        }
      }

      // 3. Deletar do auth (admin only)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('❌ Erro ao deletar do auth:', authError);
      } else {
        console.log('✅ Usuário removido do auth');
      }

      console.log('✅ Exclusão completa finalizada para:', email);
      refetch(); // Atualizar lista
      
    } catch (error) {
      console.error('❌ Erro geral na exclusão:', error);
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
                <p className="text-gray-600">Administre todos os usuários da plataforma</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={approveSuzanaWorkouts}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {approving ? 'Aprovando...' : 'Aprovar Treinos Suzana'}
              </Button>
              <Button onClick={() => refetch()} variant="outline">
                Atualizar
              </Button>
            </div>
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
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Role Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Tipo de Usuário
                </label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                    <SelectItem value="personal_trainer">Personal Trainers</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
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

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({users?.length || 0} encontrados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando usuários...</p>
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {user.name}
                          </h4>
                          {getRoleBadge(user.role)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-sm">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Cadastrado</p>
                            <p className="text-sm">
                              {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className="flex gap-1">
                              {user.profile_completed ? (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  Perfil OK
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Perfil Incompleto
                                </Badge>
                              )}
                              {user.questionnaire_completed && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                  Questionário OK
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {user.age && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Idade:</span> {user.age} anos
                            {user.fitness_goal && (
                              <span className="ml-4">
                                <span className="font-medium">Objetivo:</span> {user.fitness_goal}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          onClick={() => navigate(`/admin/user/${user.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        
                        {/* ✅ NOVO: Botão específico para Personal Trainers */}
                        {user.role === 'personal_trainer' && (
                          <Button
                            onClick={() => navigate(`/admin/personal/${user.id}`)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Gerenciar PT
                          </Button>
                        )}
                        
                        {/* Botão de exclusão para irenicemacedo17@gmail.com */}
                        {user.email === 'irenicemacedo17@gmail.com' && (
                          <Button
                            onClick={() => {
                              if (window.confirm(`ATENÇÃO: Isso irá excluir TODOS os dados de ${user.email}. Esta ação é irreversível. Confirma?`)) {
                                deleteUserData(user.email);
                              }
                            }}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Dados
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {roleFilter === 'all' && !searchTerm
                    ? 'Nenhum usuário encontrado.'
                    : 'Nenhum usuário encontrado para os filtros aplicados.'
                  }
                </p>
                {(roleFilter !== 'all' || searchTerm) && (
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

export default AdminUsers;
