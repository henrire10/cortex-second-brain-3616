import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Target, Award, Settings, User, CreditCard, X, LogOut, MessageCircle, Ruler, UserCog, History, TrendingUp, Camera, Trophy } from 'lucide-react';

interface MobileDashboardSidebarProps {
  onItemSelect: (item: string) => void;
  activeItem: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDashboardSidebar: React.FC<MobileDashboardSidebarProps> = ({
  onItemSelect,
  activeItem,
  isOpen,
  onClose
}) => {
  const {
    workoutStats,
    logout,
    points,
    refreshProfile
  } = useAuth();
  const navigate = useNavigate();

  // Forçar atualização dos pontos quando o componente montar
  React.useEffect(() => {
    if (isOpen) {
      refreshProfile();
    }
  }, [isOpen, refreshProfile]);

  const getLevel = (points: number) => {
    if (points < 100) return {
      level: 1,
      name: 'Iniciante'
    };
    if (points < 500) return {
      level: 2,
      name: 'Dedicado'
    };
    if (points < 1000) return {
      level: 3,
      name: 'Comprometido'
    };
    if (points < 2000) return {
      level: 4,
      name: 'Experiente'
    };
    if (points < 5000) return {
      level: 5,
      name: 'Avançado'
    };
    return {
      level: 6,
      name: 'Mestre'
    };
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 MOBILE: Iniciando logout...');

      // Fechar o sidebar primeiro
      onClose();

      // Fazer logout
      await logout();

      // Redirecionar para a página inicial
      navigate('/', {
        replace: true
      });
      console.log('✅ MOBILE: Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ MOBILE: Erro no logout:', error);
    }
  };

  // BLOCO 1: AÇÕES PRINCIPAIS
  const mainActionsItems = [{
    id: 'calendar',
    label: 'Calendário',
    icon: Calendar
  }];

  // BLOCO 2: ACOMPANHAMENTO E ENGAJAMENTO
  const progressItems = [{
    id: 'evolution',
    label: 'Minha Evolução',
    icon: TrendingUp
  }, {
    id: 'photo-evolution',
    label: 'Fotos de Progresso',
    icon: Camera
  }, {
    id: 'measurements',
    label: 'Medidas',
    icon: Ruler
  }, {
    id: 'goals',
    label: 'Metas',
    icon: Target
  }, {
    id: 'achievements',
    label: 'Conquistas',
    icon: Award
  }, {
    id: 'ranking',
    label: 'Ranking',
    icon: Trophy
  }, {
    id: 'workout-history',
    label: 'Histórico de Treinos',
    icon: History
  }];

  // BLOCO 3: CONTA E CONFIGURAÇÕES
  const accountItems = [{
    id: 'edit-profile',
    label: 'Editar Perfil',
    icon: UserCog
  }, {
    id: 'whatsapp',
    label: 'Conexão WhatsApp',
    icon: MessageCircle
  }, {
    id: 'subscription',
    label: 'Assinatura',
    icon: CreditCard
  }];

  if (!isOpen) return null;

  return <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose}>
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/4745fb8b-778e-40d1-8e34-8f36ad496e04.png" 
                alt="Betzafit Logo" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="font-bold text-gray-800 text-lg">Betzafit</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Status do Usuário */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{points}</div>
              <div className="text-sm text-gray-600">pontos</div>
              <Badge variant="secondary" className="mt-2">
                {getLevel(points).name}
              </Badge>
            </div>
          </Card>

          {/* Menu Items */}
          <nav className="space-y-6">
            {/* BLOCO 1: AÇÕES PRINCIPAIS */}
            <div>
              {mainActionsItems.map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return <Button key={item.id} variant={isActive ? "default" : "ghost"} className={`w-full justify-start h-12 mb-2 ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-700 hover:bg-purple-50'}`} onClick={() => {
                console.log('🔥 SIDEBAR: Item clicado:', item.id);
                onItemSelect(item.id);
                onClose();
              }}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>;
            })}
            </div>

            {/* BLOCO 2: ACOMPANHAMENTO E ENGAJAMENTO */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-3">
                Meu Progresso
              </div>
              {progressItems.map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return <Button key={item.id} variant={isActive ? "default" : "ghost"} className={`w-full justify-start h-12 mb-2 ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-700 hover:bg-purple-50'}`} onClick={() => {
                console.log('🔥 SIDEBAR: Item clicado:', item.id);
                if (item.id === 'measurements') {
                  navigate('/measurements');
                } else if (item.id === 'achievements') {
                  navigate('/achievements');
                } else if (item.id === 'workout-history') {
                  navigate('/workout-history');
                } else {
                  onItemSelect(item.id);
                }
                onClose();
              }}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>;
            })}
            </div>

            {/* BLOCO 3: CONTA E CONFIGURAÇÕES */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-3">
                Minha Conta
              </div>
              {accountItems.map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return <Button key={item.id} variant={isActive ? "default" : "ghost"} className={`w-full justify-start h-12 mb-2 ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-700 hover:bg-purple-50'}`} onClick={() => {
                console.log('🔥 SIDEBAR: Item clicado:', item.id);
                onItemSelect(item.id);
                onClose();
              }}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>;
            })}
            </div>
          </nav>
        </div>

        {/* Botão Sair */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" className="w-full justify-start h-12 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </div>
    </div>;
};
