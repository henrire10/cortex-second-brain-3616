import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const FreemiumPlanPromotion: React.FC = () => {
  const { isPremium, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  // Don't show promotion if user is premium or subscription is loading
  if (isPremium || subscriptionLoading) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Upgrade para Premium
        </CardTitle>
        <Badge variant="outline" className="mx-auto bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 text-purple-700">
          Plano Atual: Gratuito
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">Treinos personalizados ilimitados</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">Análise científica detalhada</span>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">Suporte prioritário</span>
          </div>
        </div>

        <Button
          onClick={() => navigate('/pricing')}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
          size="lg"
        >
          <Crown className="w-4 h-4 mr-2" />
          Ver Planos Premium
        </Button>
      </CardContent>
    </Card>
  );
};