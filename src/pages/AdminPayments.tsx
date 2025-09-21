
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign, Save, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminPayments = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [defaultRate, setDefaultRate] = useState('5.00');

  // Buscar personal trainers
  const { data: personalTrainers, isLoading } = useQuery({
    queryKey: ['personal-trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          id,
          user_id,
          email,
          role
        `)
        .eq('role', 'personal_trainer');

      if (error) throw error;

      // Buscar os profiles separadamente
      const userIds = data.map(trainer => trainer.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, payout_rate_per_review')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar os dados
      const trainersWithProfiles = data.map(trainer => {
        const profile = profiles.find(p => p.id === trainer.user_id);
        return {
          ...trainer,
          profile: profile
        };
      });

      return trainersWithProfiles;
    },
    enabled: isAdmin
  });

  // Mutation para atualizar taxa de pagamento
  const updatePayoutRateMutation = useMutation({
    mutationFn: async ({ userId, rate }: { userId: string; rate: number }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ payout_rate_per_review: rate })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trainers'] });
      toast({
        title: "Taxa atualizada",
        description: "A taxa de pagamento foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a taxa de pagamento.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateRate = (userId: string, rate: string) => {
    const numericRate = parseFloat(rate);
    if (isNaN(numericRate) || numericRate < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }
    updatePayoutRateMutation.mutate({ userId, rate: numericRate });
  };

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
          <Button onClick={() => navigate('/')}>
            Voltar ao Início
          </Button>
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
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin-dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Controle de Pagamentos</h1>
                <p className="text-gray-600">Gerencie as taxas de pagamento dos personal trainers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuração de Taxa Padrão */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Taxa Padrão para Novos Personal Trainers
            </CardTitle>
            <CardDescription>
              Defina o valor padrão que será aplicado a novos personal trainers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 max-w-md">
              <div className="flex-1">
                <Label htmlFor="defaultRate">Valor por treino aprovado (R$)</Label>
                <Input
                  id="defaultRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  placeholder="5.00"
                />
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Salvar Padrão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Personal Trainers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal Trainers Cadastrados
            </CardTitle>
            <CardDescription>
              Gerencie as taxas individuais de cada personal trainer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            ) : personalTrainers && personalTrainers.length > 0 ? (
              <div className="space-y-4">
                {personalTrainers.map((trainer) => (
                  <div key={trainer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {trainer.profile?.name || 'Nome não informado'}
                      </h3>
                      <p className="text-sm text-gray-600">{trainer.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`rate-${trainer.user_id}`} className="text-sm">
                          R$
                        </Label>
                        <Input
                          id={`rate-${trainer.user_id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={trainer.profile?.payout_rate_per_review || '5.00'}
                          className="w-24"
                          onBlur={(e) => handleUpdateRate(trainer.user_id, e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`rate-${trainer.user_id}`) as HTMLInputElement;
                          handleUpdateRate(trainer.user_id, input.value);
                        }}
                        disabled={updatePayoutRateMutation.isPending}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum personal trainer encontrado
                </h3>
                <p className="text-gray-600">
                  Cadastre personal trainers para gerenciar suas taxas de pagamento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayments;
