import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && profile) {
      console.log('🎯 REDIRECIONAMENTO: Usuário logado, verificando status:', {
        userId: user.id,
        profileStatus: profile.profile_status,
        userEmail: user.email
      });
      
      // ✅ NOVA LÓGICA: Verificar role do usuário antes de redirecionar
      const redirectBasedOnRole = async () => {
        try {
          // Buscar role do usuário na tabela admin_users
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (adminError && adminError.code !== 'PGRST116') {
            console.error('❌ REDIRECIONAMENTO: Erro ao buscar role:', adminError);
          }

          // Verificar se usuário tem role especial
          if (adminData?.role) {
            console.log('🔑 REDIRECIONAMENTO: Usuário com role especial:', adminData.role);
            
            switch (adminData.role) {
              case 'admin':
                console.log('👑 REDIRECIONAMENTO: Direcionando admin para painel administrativo');
                navigate('/admin-dashboard', { replace: true });
                return;
                
              case 'personal_trainer':
                console.log('💪 REDIRECIONAMENTO: Direcionando personal trainer para seu painel');
                navigate('/personal-dashboard', { replace: true });
                return;
                
              default:
                console.log('❓ REDIRECIONAMENTO: Role desconhecido, direcionando para dashboard padrão');
                break;
            }
          }

          // Se não tem role especial, seguir lógica baseada no profile_status
          console.log('👤 REDIRECIONAMENTO: Usuário normal, verificando status do perfil');
          
          switch (profile.profile_status) {
            case 'iniciando_questionario':
              console.log('📝 REDIRECIONAMENTO: Direcionando para questionário');
              navigate('/profile-setup', { replace: true });
              break;
              
            case 'questionario_concluido':
              console.log('⏳ REDIRECIONAMENTO: Questionário concluído, direcionando para dashboard (geração de treino)');
              navigate('/dashboard', { replace: true });
              break;
              
            case 'treino_gerado':
              console.log('✅ REDIRECIONAMENTO: Treino gerado, direcionando para dashboard principal');
              navigate('/dashboard', { replace: true });
              break;
              
            default:
              console.warn('⚠️ REDIRECIONAMENTO: Status desconhecido, direcionando para questionário:', profile.profile_status);
              navigate('/profile-setup', { replace: true });
          }
          
        } catch (error) {
          console.error('❌ REDIRECIONAMENTO: Erro inesperado:', error);
          // Em caso de erro, redirecionar para dashboard padrão
          navigate('/dashboard', { replace: true });
        }
      };
      
      // Pequeno delay para garantir que tudo foi carregado
      setTimeout(redirectBasedOnRole, 300);
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao BiaFitness.",
      });
      
    } catch (error: any) {
      console.error('❌ LOGIN: Erro no login:', error);
      let errorMessage = "Verifique suas credenciais e tente novamente.";
      
      if (error?.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error?.message?.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login.";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/lovable-uploads/b98a2f79-9b0f-4589-ac12-2776e4b0e245.png" alt="BetzaFit Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold gradient-bia bg-clip-text text-transparent mb-2">
            BetzaFit
          </h1>
          <p className="text-gray-600">Entre na sua conta</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-800">
              Fazer Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-bia text-white hover:opacity-90 transition-opacity"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link to="/signup" className="text-purple-600 hover:underline font-medium">
                  Cadastre-se grátis
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
                ← Voltar para o início
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
