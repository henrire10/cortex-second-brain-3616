import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, ShoppingCart, Sparkles, Star, Hexagon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_real: number | null;
  price_points: number;
  stock_quantity: number;
  product_type: 'physical' | 'digital';
}

const EnergyCore = ({ points }: { points: number }) => {
  return (
    <div className="relative flex flex-col items-center mb-12">
      <div className="relative">
        {/* Outer energy rings */}
        <div className="w-40 h-40 rounded-full border-4 border-primary/30 animate-pulse">
          <div className="w-full h-full rounded-full border-2 border-primary/50 animate-spin" style={{ animationDuration: '8s' }}>
            <div className="w-full h-full rounded-full bg-gradient-primary/20 flex items-center justify-center backdrop-blur-sm">
              {/* Inner core */}
              <div className="w-24 h-24 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center animate-pulse">
                <Zap className="w-10 h-10 text-primary-foreground animate-bounce" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating energy particles */}
        <div className="absolute inset-0">
          <Sparkles className="absolute top-3 right-3 w-5 h-5 text-primary animate-pulse" />
          <Sparkles className="absolute bottom-3 left-3 w-4 h-4 text-secondary animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute top-6 left-6 w-4 h-4 text-primary animate-pulse" style={{ animationDelay: '1s' }} />
          <Sparkles className="absolute bottom-6 right-6 w-3 h-3 text-secondary animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-primary mb-2">
          {points.toLocaleString()}
        </div>
        <div className="text-primary/80 text-sm uppercase tracking-wider font-medium">
          Energia Acumulada
        </div>
      </div>
    </div>
  );
};

const HolographicProductCard = ({ 
  product, 
  userPoints, 
  purchasing, 
  onPurchaseWithPoints, 
  onPurchaseWithMoney 
}: {
  product: Product;
  userPoints: number;
  purchasing: string | null;
  onPurchaseWithPoints: (product: Product) => void;
  onPurchaseWithMoney: (product: Product) => void;
}) => {
  const canAfford = userPoints >= product.price_points;
  const isPurchasing = purchasing === product.id;

  return (
    <div className="relative group">
      {/* Main card with holographic effect */}
      <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 ${
        product.product_type === 'digital' 
          ? 'bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/30 hover:border-primary/60' 
          : 'bg-card hover:shadow-glow'
      }`}>
        
        {/* Digital product badge */}
        {product.product_type === 'digital' && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-primary text-primary-foreground border-0 shadow-glow">
              <Hexagon className="w-3 h-3 mr-1" />
              Digital
            </Badge>
          </div>
        )}
        
        {/* Product image with effects */}
        <div className="aspect-square relative bg-gradient-to-br from-muted/50 to-muted rounded-t-2xl overflow-hidden">
          {product.product_type === 'digital' ? (
            <img
              src="https://skvwymuejgimyctfdkve.supabase.co/storage/v1/object/public/iagens%20aleatorio/Gemini_Generated_Image_dqcvtedqcv.png"
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Holographic overlay for digital products */}
          {product.product_type === 'digital' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/10 to-transparent"></div>
              
              {/* Holographic image overlay */}
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src="https://skvwymuejgimyctfdkve.supabase.co/storage/v1/object/public/iagens%20aleatorio/Gemini_Generated_Image_dqcvtedqcvtedqcv.png"
                  alt="Holographic effect"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 animate-pulse"
                />
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan"></div>
              </div>
            </>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {product.description}
            </p>
          </div>
          
          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-bold text-lg text-primary">{product.price_points.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">pontos</span>
              </div>
              <Badge variant={canAfford ? "default" : "outline"} className={canAfford ? "shadow-glow" : ""}>
                {canAfford ? "✓ Disponível" : "⚠️ Insuficiente"}
              </Badge>
            </div>
            
            {product.price_real && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg text-muted-foreground">
                  R$ {product.price_real.toFixed(2)}
                </span>
                <Badge variant="outline">Dinheiro</Badge>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              className={`w-full relative overflow-hidden transition-all duration-300 ${
                canAfford && !isPurchasing
                  ? 'bg-gradient-primary hover:shadow-glow' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={!canAfford || isPurchasing}
              onClick={() => onPurchaseWithPoints(product)}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse"></div>
                </>
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {product.product_type === 'digital' ? 'Forjar' : 'Comprar'} com {product.price_points.toLocaleString()} Pontos
            </Button>
            
            {product.price_real && (
              <Button 
                variant="outline" 
                className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => onPurchaseWithMoney(product)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Desbloquear por R$ {product.price_real.toFixed(2)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating energy particles for affordable products */}
      {canAfford && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-float opacity-60"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StorePage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    if (profile?.points !== undefined) {
      setUserPoints(profile.points);
    }
  }, [profile]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('product_type', ['physical', 'digital'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion for product_type
      const typedProducts = (data || []).map(product => ({
        ...product,
        product_type: product.product_type as 'physical' | 'digital'
      }));
      
      setProducts(typedProducts);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseWithPoints = async (product: Product) => {
    if (!user || userPoints < product.price_points) {
      toast({
        title: 'Pontos Insuficientes',
        description: `Você precisa de ${product.price_points} pontos para comprar este produto.`,
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(product.id);
    
    try {
      // 1. Subtract points from user
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ 
          points: userPoints - product.price_points,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (pointsError) throw pointsError;

      // 2. Create order record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: product.id,
          purchase_method: 'pontos',
          points_used: product.price_points,
          amount_paid: null,
          status: 'pago'
        });

      if (orderError) throw orderError;

      // 3. For digital products, create active service
      if (product.product_type === 'digital' && product.name.includes('Robô de Calorias')) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

        const { error: serviceError } = await supabase
          .from('user_active_services')
          .insert({
            user_id: user.id,
            service_name: 'calorie_bot',
            expires_at: expiresAt.toISOString()
          });

        if (serviceError) throw serviceError;
      }

      // Update local state
      setUserPoints(prev => prev - product.price_points);
      
      toast({
        title: '🔥 Forjado com Sucesso!',
        description: product.product_type === 'digital' 
          ? 'Módulo de Nutrição ativado com sucesso por 30 dias!'
          : 'Produto adquirido com sucesso!',
      });

    } catch (error) {
      console.error('Erro na compra:', error);
      toast({
        title: 'Erro na Forja',
        description: 'Não foi possível processar sua compra. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseWithMoney = async (product: Product) => {
    toast({
      title: 'Funcionalidade em Desenvolvimento',
      description: 'Pagamento com dinheiro estará disponível em breve.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-primary/80">Carregando a Loja Futurista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden pb-24">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6">
        {/* Futuristic header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-primary mb-3">
            Loja Futurista
          </h1>
          <p className="text-primary/80 text-lg">
            Transforme sua energia em conquistas épicas
          </p>
        </div>

        {/* Energy Core */}
        <EnergyCore points={userPoints} />

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {products.map((product) => (
            <HolographicProductCard
              key={product.id}
              product={product}
              userPoints={userPoints}
              purchasing={purchasing}
              onPurchaseWithPoints={handlePurchaseWithPoints}
              onPurchaseWithMoney={handlePurchaseWithMoney}
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16">
            <Zap className="w-20 h-20 mx-auto text-primary/50 mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-3">
              Loja em Manutenção
            </h3>
            <p className="text-primary/70 text-lg">
              Novos produtos futuristas aparecerão aqui em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;