import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { AsaasPayment } from '@/components/AsaasPayment';
import { 
  Loader2, 
  Crown, 
  Zap, 
  Users, 
  Star, 
  CheckCircle, 
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

export const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const plans = [
    {
      id: 'monthly',
      name: 'Starter',
      price: 'R$ 79,99',
      period: '/mês',
      description: 'Para começar sua jornada',
      features: [
        { icon: Zap, text: 'Treinos personalizados' },
        { icon: TrendingUp, text: 'Análise de progresso' },
        { icon: CheckCircle, text: 'Suporte no app' }
      ],
      popular: false,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'quarterly',
      name: 'Pro',
      price: 'R$ 69,99',
      period: '/mês',
      totalPrice: 'R$ 209,97 trimestral',
      description: 'Ideal para resultados',
      features: [
        { icon: Crown, text: 'Tudo do Starter' },
        { icon: Sparkles, text: 'Nutrição personalizada' },
        { icon: Award, text: 'Relatórios detalhados' },
        { icon: Users, text: 'Comunidade exclusiva' }
      ],
      popular: true,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      savings: '12% OFF'
    },
    {
      id: 'annual',
      name: 'Elite',
      price: 'R$ 54,99',
      period: '/mês',
      totalPrice: 'R$ 659,88 anual',
      description: 'Máximo resultado',
      features: [
        { icon: Crown, text: 'Tudo do Pro' },
        { icon: Zap, text: 'Consultoria 1:1' },
        { icon: Star, text: 'Acesso antecipado' },
        { icon: CheckCircle, text: 'Preço garantido' }
      ],
      popular: false,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      savings: '31% OFF'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Pagamento Confirmado!",
      description: "Sua assinatura foi ativada com sucesso.",
    });
    setShowPayment(false);
    navigate('/dashboard');
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedPlan('');
  };

  // Show payment component if user selected a plan
  if (showPayment && selectedPlan) {
    return (
      <AsaasPayment
        planType={selectedPlan as 'monthly' | 'quarterly' | 'annual'}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Native Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-50">
        <div className="px-6 py-4 safe-area-inset-top">
          <h1 className="text-2xl font-bold text-center">Escolha seu Plano</h1>
          <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            <span>12.847 usuários</span>
            <Star className="w-4 h-4 ml-3 mr-1 fill-yellow-400 text-yellow-400" />
            <span>4.9/5</span>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="px-4 pt-6 pb-24 space-y-4">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative overflow-hidden border-2 ${plan.popular ? 'border-primary shadow-lg' : 'border-border'} rounded-3xl`}>
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-semibold text-center py-2">
                    <Crown className="w-3 h-3 inline mr-1" />
                    RECOMENDADO
                  </div>
                </div>
              )}

              {/* Savings Badge */}
              {plan.savings && (
                <div className="absolute top-3 right-3">
                  <Badge className={`${plan.bgColor} ${plan.textColor} border-0 rounded-full px-3 py-1`}>
                    {plan.savings}
                  </Badge>
                </div>
              )}

              <CardHeader className={`pb-4 ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                <div className="text-center">
                  <CardTitle className="text-xl font-bold mb-1">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  {plan.totalPrice && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.totalPrice}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${plan.bgColor}`}>
                        <feature.icon className={`w-4 h-4 ${plan.textColor}`} />
                      </div>
                      <span className="text-sm font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className="w-full rounded-2xl h-12 font-semibold"
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.popular ? 'Começar Agora' : 'Selecionar Plano'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 safe-area-inset-bottom">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Cancele a qualquer momento • Dados seguros
          </p>
          <Button
            variant="default"
            size="lg"
            onClick={() => handleSelectPlan('quarterly')}
            disabled={loadingPlan !== null}
            className="w-full max-w-sm mx-auto rounded-2xl h-12 font-bold"
          >
            {loadingPlan ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Crown className="w-4 h-4 mr-2" />
            )}
            Começar com o Plano Pro
          </Button>
        </div>
      </div>
    </div>
  );
};