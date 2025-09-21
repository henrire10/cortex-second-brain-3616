import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  feature = "esta funcionalidade",
  fallback 
}) => {
  const { isPremium, subscriptionLoading: loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isPremium) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="text-center p-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Conteúdo Premium</h2>
          <p className="text-gray-600 mb-6">
            Para acessar {feature}, você precisa de uma assinatura premium.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Ver Planos Premium
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};