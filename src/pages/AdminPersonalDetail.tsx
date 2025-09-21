
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, User, Save, Eye, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface PersonalTrainer {
  id: string;
  name: string;
  email: string;
  payout_rate_per_review: number;
  created_at: string;
}

interface PayoutStats {
  monthlyEarnings: number;
  monthlyCompletedUsers: number;
  totalEarnings: number;
  totalCompletedUsers: number;
  averagePaymentPerUser: number;
}

const AdminPersonalDetail = () => {
  const { personalId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: checkingAdmin } = useAdmin();
  const [personal, setPersonal] = useState<PersonalTrainer | null>(null);
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({
    monthlyEarnings: 0,
    monthlyCompletedUsers: 0,
    totalEarnings: 0,
    totalCompletedUsers: 0,
    averagePaymentPerUser: 0
  });
  const [payoutRate, setPayoutRate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!checkingAdmin && (!isAdmin)) {
      navigate('/admin-dashboard');
    }
  }, [isAdmin, checkingAdmin, navigate]);

  useEffect(() => {
    if (personalId && isAdmin) {
      fetchPersonalDetails();
      fetchPayoutStats();
    }
  }, [personalId, isAdmin]);

  const fetchPersonalDetails = async () => {
    try {
      console.log('🔍 ADMIN PERSONAL DETAIL: Buscando detalhes do personal:', personalId);
      
      const { data: personalData, error: personalError } = await supabase
        .from('profiles')
        .select('id, name, email, payout_rate_per_review, created_at')
        .eq('id', personalId)
        .maybeSingle();

      if (personalError) {
        console.error('❌ ADMIN PERSONAL DETAIL: Erro na query de profiles:', personalError);
        throw personalError;
      }

      if (!personalData) {
        toast({
          title: "Personal não encontrado",
          description: "O personal trainer não foi encontrado na base de dados.",
          variant: "destructive",
        });
        navigate('/admin/users');
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', personalId)
        .eq('role', 'personal_trainer')
        .maybeSingle();

      if (adminError) {
        console.error('❌ ADMIN PERSONAL DETAIL: Erro na query de admin_users:', adminError);
        throw adminError;
      }

      if (!adminData) {
        toast({
          title: "Acesso negado",
          description: "Este usuário não é um personal trainer cadastrado.",
          variant: "destructive",
        });
        navigate('/admin/users');
        return;
      }

      setPersonal(personalData);
      const currentRate = personalData.payout_rate_per_review?.toString() || '5.00';
      setPayoutRate(currentRate);

      console.log('✅ ADMIN PERSONAL DETAIL: Personal carregado:', {
        name: personalData.name,
        email: personalData.email,
        currentPayoutRate: personalData.payout_rate_per_review,
        formattedRate: currentRate
      });

    } catch (error: any) {
      console.error('❌ ADMIN PERSONAL DETAIL: Erro crítico ao carregar personal:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || 'Erro desconhecido ao buscar dados do personal trainer',
        variant: "destructive",
      });
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutStats = async () => {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();

      console.log('💰 ADMIN PERSONAL DETAIL: Buscando estatísticas de pagamento por usuário completo...', {
        personalId,
        startOfMonth: startOfMonth.split('T')[0],
        endOfMonth: endOfMonth.split('T')[0]
      });

      // Buscar pagamentos por usuário completo (novo sistema)
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('daily_workouts')
        .select('user_completion_payment, user_id')
        .eq('approved_by', personalId)
        .gte('approved_at', startOfMonth)
        .lte('approved_at', endOfMonth)
        .gt('user_completion_payment', 0);

      if (monthlyError) {
        console.error('❌ ADMIN PERSONAL DETAIL: Erro ao buscar dados mensais:', monthlyError);
        throw monthlyError;
      }

      // Calcular ganhos mensais (evitar duplicatas por usuário)
      const monthlyUserPayments = new Map();
      monthlyData?.forEach(payment => {
        if (!monthlyUserPayments.has(payment.user_id)) {
          monthlyUserPayments.set(payment.user_id, payment.user_completion_payment);
        }
      });

      const monthlyEarnings = Array.from(monthlyUserPayments.values()).reduce((sum: number, payment: number) => sum + payment, 0);
      const monthlyCompletedUsers = monthlyUserPayments.size;

      // Buscar ganhos totais
      const { data: totalData, error: totalError } = await supabase
        .from('daily_workouts')
        .select('user_completion_payment, user_id')
        .eq('approved_by', personalId)
        .gt('user_completion_payment', 0);

      if (totalError) {
        console.error('❌ ADMIN PERSONAL DETAIL: Erro ao buscar dados totais:', totalError);
        throw totalError;
      }

      // Calcular ganhos totais (evitar duplicatas por usuário)
      const totalUserPayments = new Map();
      totalData?.forEach(payment => {
        if (!totalUserPayments.has(payment.user_id)) {
          totalUserPayments.set(payment.user_id, payment.user_completion_payment);
        }
      });

      const totalEarnings = Array.from(totalUserPayments.values()).reduce((sum: number, payment: number) => sum + payment, 0);
      const totalCompletedUsers = totalUserPayments.size;
      const averagePaymentPerUser = totalCompletedUsers > 0 ? totalEarnings / totalCompletedUsers : 0;

      setPayoutStats({
        monthlyEarnings,
        monthlyCompletedUsers,
        totalEarnings,
        totalCompletedUsers,
        averagePaymentPerUser
      });

      console.log('✅ ADMIN PERSONAL DETAIL: Estatísticas carregadas (novo sistema):', {
        monthlyEarnings,
        monthlyCompletedUsers,
        totalEarnings,
        totalCompletedUsers,
        averagePaymentPerUser
      });

    } catch (error: any) {
      console.error('❌ ADMIN PERSONAL DETAIL: Erro ao carregar estatísticas:', error);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar todas as estatísticas de pagamento.",
        variant: "default",
      });
    }
  };

  const validatePayoutRate = (value: string): boolean => {
    const rate = parseFloat(value);
    
    if (isNaN(rate)) {
      setValidationError('Digite um valor numérico válido');
      return false;
    }
    
    if (rate < 0) {
      setValidationError('O valor não pode ser negativo');
      return false;
    }
    
    if (rate > 100) {
      setValidationError('Valor muito alto. Considere valores entre R$ 1,00 e R$ 50,00');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handlePayoutRateChange = (value: string) => {
    setPayoutRate(value);
    setSaveSuccess(false);
    
    if (value.trim() !== '') {
      validatePayoutRate(value);
    } else {
      setValidationError('');
    }
  };

  const handleSavePayoutRate = async () => {
    if (!validatePayoutRate(payoutRate)) {
      toast({
        title: "Valor inválido",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const rate = parseFloat(payoutRate);
      
      console.log('💰 ADMIN PERSONAL DETAIL: Salvando nova taxa de pagamento:', {
        personalId,
        personalName: personal?.name,
        oldRate: personal?.payout_rate_per_review,
        newRate: rate,
        difference: rate - (personal?.payout_rate_per_review || 0)
      });

      const { error } = await supabase
        .from('profiles')
        .update({ 
          payout_rate_per_review: rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', personalId);

      if (error) {
        console.error('❌ ADMIN PERSONAL DETAIL: Erro ao salvar no banco:', error);
        throw error;
      }

      setPersonal(prev => prev ? { ...prev, payout_rate_per_review: rate } : null);
      setSaveSuccess(true);

      toast({
        title: "Taxa atualizada com sucesso! ✅",
        description: `Nova remuneração por usuário completo: R$ ${rate.toFixed(2).replace('.', ',')}`,
      });

      console.log('✅ ADMIN PERSONAL DETAIL: Taxa salva com sucesso no banco de dados');

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('❌ ADMIN PERSONAL DETAIL: Erro crítico ao salvar taxa:', error);
      toast({
        title: "Erro ao salvar taxa",
        description: error.message || 'Erro desconhecido ao salvar no banco de dados',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do personal trainer...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !personal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Personal trainer não encontrado ou sem permissão.</p>
          <Button onClick={() => navigate('/admin-dashboard')}>Voltar ao Dashboard</Button>
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
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Personal Trainer</h1>
                <p className="text-gray-600">{personal.name}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Personal Trainer
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Informações do Personal */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                  <p className="font-semibold">{personal.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{personal.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cadastrado em</Label>
                  <p className="text-sm">
                    {new Date(personal.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configuração de Remuneração - ATUALIZADA */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="h-5 w-5" />
                  Configuração de Remuneração
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      💡 Novo Sistema de Pagamento por Usuário Completo:
                    </p>
                    <p className="text-xs text-blue-700">
                      • O personal recebe um valor <strong>por usuário</strong> quando todos os treinos daquele usuário estão aprovados<br/>
                      • Não é mais por treino individual, mas por usuário com treinos completos<br/>
                      • Isso garante pagamento justo e evita pagamentos parciais por trabalho incompleto
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="payout-rate">Valor por Usuário com Treinos Completos (R$)</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="payout-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={payoutRate}
                          onChange={(e) => handlePayoutRateChange(e.target.value)}
                          placeholder="5.00"
                          className={`${validationError ? 'border-red-300 focus:border-red-500' : 'border-gray-300'} ${saveSuccess ? 'border-green-300 bg-green-50' : ''}`}
                        />
                        {validationError && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            <p className="text-xs text-red-600">{validationError}</p>
                          </div>
                        )}
                        {saveSuccess && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <p className="text-xs text-green-600">Taxa salva com sucesso!</p>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleSavePayoutRate}
                        disabled={saving || !!validationError || payoutRate.trim() === ''}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Este valor será pago quando todos os treinos de um usuário estiverem aprovados
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      📊 Valores sugeridos para pagamento por usuário:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button 
                        onClick={() => handlePayoutRateChange('15.00')}
                        className="bg-white border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-100"
                      >
                        R$ 15,00
                      </button>
                      <button 
                        onClick={() => handlePayoutRateChange('25.00')}
                        className="bg-white border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-100"
                      >
                        R$ 25,00
                      </button>
                      <button 
                        onClick={() => handlePayoutRateChange('35.00')}
                        className="bg-white border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-100"
                      >
                        R$ 35,00
                      </button>
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas de Pagamento - ATUALIZADAS */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Pagamento por Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {payoutStats.monthlyEarnings.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-sm text-blue-600">Ganhos no Mês</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                      <Users className="h-5 w-5" />
                      {payoutStats.monthlyCompletedUsers}
                    </div>
                    <p className="text-sm text-green-600">Usuários Completos/Mês</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      R$ {payoutStats.totalEarnings.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-sm text-purple-600">Total de Ganhos</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                      <Users className="h-5 w-5" />
                      {payoutStats.totalCompletedUsers}
                    </div>
                    <p className="text-sm text-orange-600">Total Usuários Completos</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    💰 Métricas do novo sistema:
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      <strong>Pagamento médio por usuário:</strong> R$ {payoutStats.averagePaymentPerUser.toFixed(2).replace('.', ',')}
                    </p>
                    <p>
                      <strong>Projeção mensal com nova taxa:</strong> 
                      {payoutStats.monthlyCompletedUsers > 0 && (
                        <span className="font-bold text-green-600 ml-1">
                          R$ {((payoutStats.monthlyCompletedUsers * parseFloat(payoutRate || '0'))).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      {payoutStats.monthlyCompletedUsers === 0 && (
                        <span className="text-gray-500 ml-1">Aguardando usuários completos</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações Administrativas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/admin/personal/${personalId}/payments`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Histórico de Pagamentos por Usuário
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/admin/personal/${personalId}/workouts`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Usuários com Treinos Aprovados
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100"
                  onClick={() => {
                    console.log('🔍 ADMIN PERSONAL DETAIL: Dados de debug (novo sistema):', {
                      personalId,
                      personalData: personal,
                      payoutStats,
                      currentRate: payoutRate,
                      systemType: 'pagamento_por_usuario_completo'
                    });
                    toast({
                      title: "Debug executado",
                      description: "Informações do novo sistema enviadas para o console.",
                    });
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Debug - Ver Logs no Console
                </Button>
              </CardContent>
            </Card>

            {/* Card informativo sobre o novo sistema */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sistema Atualizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>✅ Implementado:</strong> Pagamento por usuário completo</p>
                  <p><strong>🔄 Mudança:</strong> De pagamento por treino individual para pagamento por usuário com todos os treinos aprovados</p>
                  <p><strong>🎯 Benefício:</strong> Garante remuneração justa pelo trabalho completo realizado</p>
                  <p><strong>💡 Como funciona:</strong> Personal recebe quando todos os treinos de um usuário estão aprovados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPersonalDetail;
