import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, ArrowLeft, ShoppingCart, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_real: number;
  price_points: number;
  stock_quantity: number;
}

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    if (profile?.points !== undefined) {
      setUserPoints(profile.points);
    }
  }, [id, profile]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast({
        title: 'Erro',
        description: 'Produto não encontrado.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseWithPoints = async () => {
    if (!product || !user) return;

    if (userPoints < product.price_points) {
      toast({
        title: 'Pontos insuficientes',
        description: `Você precisa de ${product.price_points} pontos para esta compra.`,
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(true);

    try {
      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: product.id,
          purchase_method: 'pontos',
          status: 'pago',
          points_used: product.price_points
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Subtrair pontos do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          points: userPoints - product.price_points 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Compra realizada com sucesso!',
        description: `Você comprou ${product.name} por ${product.price_points} pontos.`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro na compra:', error);
      toast({
        title: 'Erro na compra',
        description: 'Não foi possível processar sua compra. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseWithMoney = async () => {
    if (!product || !user) return;

    setPurchasing(true);

    try {
      // Criar pedido pendente
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: product.id,
          purchase_method: 'dinheiro',
          status: 'pendente',
          amount_paid: product.price_real
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast({
        title: 'Pedido criado!',
        description: 'Seu pedido foi criado. O pagamento será processado em breve.',
      });

      // Aqui você integraria com Stripe ou outro gateway de pagamento
      // Para esta demonstração, vamos simular um pagamento bem-sucedido
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'pago' })
          .eq('id', order.id);

        if (!updateError) {
          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu pagamento foi processado com sucesso.',
          });
        }
      }, 2000);

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro na compra:', error);
      toast({
        title: 'Erro na compra',
        description: 'Não foi possível processar sua compra. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Produto não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar à loja
          </Button>
        </div>
      </div>
    );
  }

  const hasEnoughPoints = userPoints >= product.price_points;
  const isInStock = product.stock_quantity > 0;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header com botão voltar */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Loja
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="p-0">
            <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CardTitle className="text-2xl mb-4">{product.name}</CardTitle>
            <p className="text-muted-foreground mb-6">{product.description}</p>
            
            {/* Informações de preço e estoque */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{product.price_points} pontos</span>
                </div>
                <Badge variant={hasEnoughPoints ? "default" : "destructive"}>
                  {hasEnoughPoints ? "Disponível" : "Pontos insuficientes"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold text-lg">R$ {product.price_real.toFixed(2)}</span>
                <Badge variant="outline">Dinheiro</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Estoque disponível:</span>
                <Badge variant={isInStock ? "default" : "destructive"}>
                  {product.stock_quantity} unidades
                </Badge>
              </div>
            </div>

            {/* Saldo atual do usuário */}
            <Card className="mb-6 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span>Seus pontos atuais:</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{userPoints}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões de compra */}
            <div className="space-y-3">
              <Button
                className="w-full h-12"
                disabled={!hasEnoughPoints || !isInStock || purchasing}
                onClick={handlePurchaseWithPoints}
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                Comprar com {product.price_points} Pontos
              </Button>

              <Button
                variant="outline"
                className="w-full h-12"
                disabled={!isInStock || purchasing}
                onClick={handlePurchaseWithMoney}
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Comprar por R$ {product.price_real.toFixed(2)}
              </Button>
            </div>

            {!isInStock && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                <p className="text-destructive text-center font-medium">
                  Produto esgotado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetailPage;