
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Calendar, 
  Crown, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const SubscriptionManager = () => {
  const { user, isPremium, isFreemium, subscriptionLoading, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      // Agora vamos verificar direto no profile do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, plan_id, subscription_ends_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setSubscription({
        subscribed: profile.subscription_status === 'active',
        subscription_tier: profile.plan_id,
        subscription_end: profile.subscription_ends_at
      });
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status da assinatura.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    await refreshSubscription();
    await checkSubscription();
    setRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Status da assinatura atualizado com sucesso.",
    });
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setManagingSubscription(true);
    
    try {
      // Para Asaas, vamos simplesmente redirecionar para uma página de contato ou suporte
      // Ou podemos implementar um sistema próprio de gerenciamento
      toast({
        title: "Gerenciamento de Assinatura",
        description: "Entre em contato conosco para alterar ou cancelar sua assinatura.",
      });
      
      // Opcionalmente redirecionar para uma página de contato
      // window.open('mailto:suporte@betzafit.com?subject=Gerenciar Assinatura', '_blank');
    } catch (error) {
      console.error('Erro ao acessar gerenciamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o gerenciamento.",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  useEffect(() => {
    const initializeSubscription = async () => {
      setLoading(subscriptionLoading);
      await checkSubscription();
      setLoading(false);
    };

    if (user) {
      initializeSubscription();
    }
  }, [user, subscriptionLoading]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Verificando assinatura...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Erro ao carregar assinatura</h3>
          <Button onClick={handleRefreshSubscription} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (subscribed: boolean) => {
    return subscribed ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (subscribed: boolean) => {
    return subscribed ? CheckCircle : XCircle;
  };

  const StatusIcon = getStatusIcon(subscription.subscribed);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Minha Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Assinatura */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${getStatusColor(subscription.subscribed)}`} />
            <div>
              <p className="font-medium">
                {subscription.subscribed ? 'Assinatura Ativa' : 'Sem Assinatura Ativa'}
              </p>
              {subscription.subscription_tier && (
                <div className="flex items-center gap-2 mt-1">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    Plano {subscription.subscription_tier}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleRefreshSubscription}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Data de Vencimento */}
        {subscription.subscribed && subscription.subscription_end && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Próxima cobrança:</p>
              <p className="font-medium text-purple-600">
                {formatDate(subscription.subscription_end)}
              </p>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3">
          {subscription.subscribed ? (
            <Button
              onClick={handleManageSubscription}
              className="w-full"
              disabled={managingSubscription}
            >
              {managingSubscription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Gerenciar Assinatura
                </>
              )}
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Você não possui uma assinatura ativa. Escolha um plano para começar!
              </p>
              <Button
                onClick={() => {
                  const planSection = document.getElementById('planos');
                  if (planSection) {
                    planSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Ver Planos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
