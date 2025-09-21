import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_real: number;
  price_points: number;
  stock_quantity: number;
}

const EnergyCore = ({ points }: { points: number }) => {
  return (
    <div className="relative flex flex-col items-center mb-8">
      <div className="relative">
        {/* Outer energy ring */}
        <div className="w-32 h-32 rounded-full border-4 border-cyan-400/30 animate-pulse">
          <div className="w-full h-full rounded-full border-2 border-cyan-300/50 animate-spin">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center backdrop-blur-sm">
              {/* Inner core */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-400/50 flex items-center justify-center animate-pulse">
                <Zap className="w-8 h-8 text-white animate-bounce" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 animate-ping">
          <Sparkles className="absolute top-2 right-2 w-4 h-4 text-cyan-300 animate-pulse" />
          <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute top-4 left-4 w-3 h-3 text-cyan-300 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold text-cyan-400 mb-1">
          {points.toLocaleString()}
        </div>
        <div className="text-cyan-300/80 text-sm uppercase tracking-wider">
          Energia Acumulada
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, isActive }: { product: Product; isActive: boolean }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
      isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
    }`}>
      {/* Product Image with Holographic Effect */}
      <div className="aspect-square relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10"></div>
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover mix-blend-overlay"
        />
        
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse"></div>
        
        {/* Scanning line animation */}
        {isActive && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
          </div>
        )}
      </div>
      
      {/* Floating particles around active product */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RewardForgePage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isForging, setIsForging] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (profile?.points !== undefined) {
      setUserPoints(profile.points);
    }
  }, [profile]);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos da Forja.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgeWithPoints = async (product: Product) => {
    if (userPoints < product.price_points) return;

    setIsForging(true);
    
    try {
      // Animation delay to show forge effect
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user points
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ points: userPoints - product.price_points })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Create order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          product_id: product.id,
          purchase_method: 'pontos',
          points_used: product.price_points,
          status: 'pago'
        });

      if (orderError) throw orderError;

      setUserPoints(prev => prev - product.price_points);
      
      toast({
        title: '🔥 Forjado com Sucesso!',
        description: `${product.name} foi forjado e será enviado em breve!`,
      });

    } catch (error) {
      console.error('Erro ao forjar produto:', error);
      toast({
        title: 'Erro na Forja',
        description: 'Não foi possível completar a forja. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsForging(false);
    }
  };

  const handleUnlockWithMoney = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-300">Carregando a Forja...</p>
        </div>
      </div>
    );
  }

  const currentProduct = products[current];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden pb-24">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
            A Forja de Recompensas
          </h1>
          <p className="text-cyan-300/80">
            Transforme sua energia em recompensas épicas
          </p>
        </div>

        {/* Energy Core */}
        <EnergyCore points={userPoints} />

        {/* Product Carousel */}
        <div className="max-w-md mx-auto mb-8">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {products.map((product, index) => (
                <CarouselItem key={product.id}>
                  <ProductCard 
                    product={product} 
                    isActive={index === current}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Product Info and Actions */}
        {currentProduct && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300 mb-2">
                {currentProduct.name}
              </h2>
              <p className="text-cyan-300/70 text-sm">
                {currentProduct.description}
              </p>
            </div>

            <div className="space-y-4">
              {/* Points Button */}
              <Button
                size="lg"
                disabled={userPoints < currentProduct.price_points || isForging}
                onClick={() => handleForgeWithPoints(currentProduct)}
                className={`w-full py-4 text-lg font-semibold relative overflow-hidden transition-all duration-300 ${
                  userPoints >= currentProduct.price_points && !isForging
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {isForging ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Forjando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Forjar com {currentProduct.price_points.toLocaleString()} Pontos
                  </div>
                )}
                
                {/* Forge animation overlay */}
                {isForging && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 animate-pulse"></div>
                )}
              </Button>

              {/* Money Button */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleUnlockWithMoney(currentProduct)}
                className="w-full py-4 text-lg font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Desbloquear por R$ {currentProduct.price_real.toFixed(2)}
              </Button>
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto text-cyan-400/50 mb-4" />
            <h3 className="text-xl font-semibold text-cyan-300 mb-2">
              A Forja está vazia
            </h3>
            <p className="text-cyan-300/70">
              Novos tesouros aparecerão aqui em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardForgePage;