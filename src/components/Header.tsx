
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';

export const Header = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { isPersonalTrainer } = usePersonalTrainer();

  return (
    <header className="w-full bg-transparent backdrop-blur-0 border-none sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div 
          className="text-2xl font-bold cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            BetzaFit
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                Olá, {profile?.name || user.email?.split('@')[0] || 'Usuário'}!
              </span>
              <Button 
                onClick={() => navigate(isPersonalTrainer ? '/personal-dashboard' : '/dashboard')} 
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                Voltar
              </Button>
              <Button 
                onClick={logout} 
                variant="ghost" 
                size="sm"
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => navigate('/login')} 
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Cadastrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
