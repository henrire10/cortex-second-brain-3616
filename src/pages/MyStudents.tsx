
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  Dumbbell, 
  Users, 
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Mail
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  total_workouts: number;
  subscription_status: 'active' | 'expired' | 'inactive';
  last_workout_date?: string;
}

export default function MyStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
      fetchStudents();
    }
  }, [isPersonalTrainer, user]);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando alunos do personal trainer...');

      // Buscar todos os usuários que tiveram treinos aprovados por este personal
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('daily_workouts')
        .select(`
          user_id,
          workout_date,
          profiles!inner(
            id,
            name,
            email
          )
        `)
        .eq('approved_by', user?.id)
        .not('user_id', 'is', null);

      if (workoutsError) {
        console.error('Erro ao buscar treinos:', workoutsError);
        throw workoutsError;
      }

      // Processar dados para criar lista única de estudantes
      const studentMap = new Map<string, Student>();

      workoutsData?.forEach(workout => {
        const userId = workout.user_id;
        const profile = workout.profiles;

        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            id: userId,
            name: profile.name,
            email: profile.email,
            total_workouts: 0,
            subscription_status: 'inactive',
            last_workout_date: workout.workout_date
          });
        }

        const student = studentMap.get(userId)!;
        student.total_workouts += 1;
        
        // Atualizar última data de treino se for mais recente
        if (!student.last_workout_date || workout.workout_date > student.last_workout_date) {
          student.last_workout_date = workout.workout_date;
        }
      });

      // Buscar status de assinatura para cada estudante
      const studentIds = Array.from(studentMap.keys());
      if (studentIds.length > 0) {
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from('subscribers')
          .select('user_id, subscribed, subscription_end')
          .in('user_id', studentIds);

        if (!subscriptionsError && subscriptionsData) {
          subscriptionsData.forEach(sub => {
            const student = studentMap.get(sub.user_id);
            if (student) {
              if (sub.subscribed && sub.subscription_end) {
                const endDate = new Date(sub.subscription_end);
                const now = new Date();
                student.subscription_status = endDate > now ? 'active' : 'expired';
              } else if (sub.subscribed) {
                student.subscription_status = 'active';
              } else {
                student.subscription_status = 'inactive';
              }
            }
          });
        }
      }

      const studentsArray = Array.from(studentMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      setStudents(studentsArray);
      setFilteredStudents(studentsArray);

      console.log('✅ Alunos carregados:', studentsArray.length);

    } catch (error: any) {
      console.error('❌ Erro ao carregar alunos:', error);
      toast({
        title: "Erro ao carregar alunos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          <Clock className="w-3 h-3 mr-1" />
          Inativo
        </Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (checkingRole || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando seus alunos...</p>
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
                onClick={() => navigate('/personal-dashboard')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Meus Alunos</h1>
                <p className="text-sm text-gray-500">{students.length} aluno(s) cadastrado(s)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Search Bar */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Alunos
              </CardTitle>
              <CardDescription>
                Pesquise por nome ou email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Digite o nome ou email do aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Alunos</CardTitle>
              <CardDescription>
                {filteredStudents.length} aluno(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Tente ajustar os termos da pesquisa' 
                      : 'Quando você aprovar treinos, os alunos aparecerão aqui'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Status:</span>
                            {getSubscriptionBadge(student.subscription_status)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Treinos:</span>
                            <span className="text-sm font-medium">{student.total_workouts}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Último treino:</span>
                            <span className="text-sm">{formatDate(student.last_workout_date)}</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => navigate(`/student-details/${student.id}`)}
                          className="w-full"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
