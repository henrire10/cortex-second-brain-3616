import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  Filter,
  Download,
  TrendingUp,
  Dumbbell
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  workout_date: string;
  approved_at: string;
  workout_title: string;
  trainer_payout: number;
  user_name: string;
  user_email: string;
}

type FilterPeriod = 'this_month' | 'last_month' | 'last_90_days' | 'all_time';

export default function PersonalPaymentHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('this_month');
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
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
      fetchPaymentHistory();
    }
  }, [isPersonalTrainer, user]);

  useEffect(() => {
    filterPaymentsByPeriod();
  }, [payments, filterPeriod]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando histórico de pagamentos...');
      
      // Buscar todos os treinos aprovados pelo personal trainer
      const { data, error } = await supabase
        .from('daily_workouts')
        .select(`
          id,
          workout_date,
          approved_at,
          workout_title,
          trainer_payout,
          user_id
        `)
        .eq('approved_by', user?.id)
        .eq('approval_status', 'approved')
        .not('trainer_payout', 'is', null)
        .order('approved_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        throw error;
      }

      // Buscar informações dos usuários
      const userIds = [...new Set(data?.map(d => d.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.warn('⚠️ Erro ao buscar perfis:', profilesError);
      }

      // Mapear dados
      const profileMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const mappedPayments: PaymentRecord[] = data?.map(payment => ({
        id: payment.id,
        workout_date: payment.workout_date,
        approved_at: payment.approved_at,
        workout_title: payment.workout_title,
        trainer_payout: payment.trainer_payout || 0,
        user_name: profileMap[payment.user_id]?.name || 'Nome não disponível',
        user_email: profileMap[payment.user_id]?.email || 'Email não disponível'
      })) || [];

      setPayments(mappedPayments);
      
      const total = mappedPayments.reduce((sum, payment) => sum + payment.trainer_payout, 0);
      setTotalEarnings(total);

      console.log('✅ Histórico carregado:', { 
        totalPayments: mappedPayments.length, 
        totalEarnings: total 
      });

    } catch (error: any) {
      console.error('❌ Erro ao carregar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPaymentsByPeriod = () => {
    const now = new Date();
    let startDate: Date;

    switch (filterPeriod) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        setFilteredPayments(payments.filter(payment => {
          const paymentDate = new Date(payment.approved_at);
          return paymentDate >= startDate && paymentDate <= endDate;
        }));
        return;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time':
        setFilteredPayments(payments);
        return;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setFilteredPayments(payments.filter(payment => 
      new Date(payment.approved_at) >= startDate
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'this_month': return 'Este Mês';
      case 'last_month': return 'Mês Passado';
      case 'last_90_days': return 'Últimos 90 Dias';
      case 'all_time': return 'Todo o Período';
      default: return 'Este Mês';
    }
  };

  const filteredTotal = filteredPayments.reduce((sum, payment) => sum + payment.trainer_payout, 0);

  if (checkingRole || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando histórico de pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Histórico de Pagamentos</h1>
                <p className="text-sm text-gray-500">Controle financeiro completo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Total do Período</CardTitle>
              <DollarSign className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {filteredTotal.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-green-100 mt-1">
                {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Treinos Aprovados</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredPayments.length}</div>
              <p className="text-xs text-blue-100 mt-1">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Receita Total</CardTitle>
              <Calendar className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {totalEarnings.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-purple-100 mt-1">
                Histórico completo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-600" />
                Filtros de Período
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Período:</label>
                <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">Este Mês</SelectItem>
                    <SelectItem value="last_month">Mês Passado</SelectItem>
                    <SelectItem value="last_90_days">Últimos 90 Dias</SelectItem>
                    <SelectItem value="all_time">Todo o Período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="outline" className="text-sm">
                  {filteredPayments.length} registros encontrados
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Histórico Detalhado - {getPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum pagamento encontrado
                </h3>
                <p className="text-gray-500">
                  Não há registros de pagamentos para o período selecionado
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data da Aprovação</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome do Aluno</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome do Treino</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor Recebido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment, index) => (
                      <tr 
                        key={payment.id} 
                        className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatDateTime(payment.approved_at)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Treino: {formatDate(payment.workout_date)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {payment.user_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.user_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {payment.workout_title}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-bold text-green-600 text-lg">
                            R$ {payment.trainer_payout.toFixed(2).replace('.', ',')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}