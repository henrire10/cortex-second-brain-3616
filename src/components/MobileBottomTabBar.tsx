import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MobileBottomTabBarProps {
  activeKey: 'calendar' | 'store' | 'activity' | 'ranking' | 'edit-profile';
  onSelect: (key: 'calendar' | 'store' | 'activity' | 'ranking' | 'edit-profile') => void;
  avatarUrl?: string | null;
}

export const MobileBottomTabBar: React.FC<MobileBottomTabBarProps> = ({
  activeKey,
  onSelect,
  avatarUrl,
}) => {
  const navigate = useNavigate();
  const items: { key: string; label: string; type: 'emoji' | 'avatar'; icon?: string }[] = [
    { key: 'calendar', label: 'Home', type: 'emoji', icon: '🏠' },
    { key: 'measurements', label: 'Medidas', type: 'emoji', icon: '📏' },
    { key: 'store', label: 'Loja', type: 'emoji', icon: '🛒' },
    { key: 'activity', label: 'Correr', type: 'emoji', icon: '🏃' },
    { key: 'edit-profile', label: 'Perfil', type: 'avatar' },
  ];

  const [activeActivity, setActiveActivity] = useState(false);

  useEffect(() => {
    const read = () => setActiveActivity(localStorage.getItem('activity:isTracking') === 'true');
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'activity:isTracking') read();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="Navegação rápida"
    >
      <div className="mx-auto max-w-screen-sm">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const isActive = activeKey === item.key;
            const showPulse = item.key === 'activity' && activeActivity;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.key === 'measurements') {
                      navigate('/measurements');
                    } else {
                      onSelect(item.key as 'calendar' | 'store' | 'activity' | 'ranking' | 'edit-profile');
                    }
                  }}
                  className={cn(
                    'w-full h-16 px-2 flex flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <div className="relative flex items-center justify-center">
                    {item.type === 'emoji' ? (
                      <span className="text-xl leading-none" aria-hidden>
                        {item.icon}
                      </span>
                    ) : (
                      <div className={cn(
                        'w-7 h-7 rounded-full overflow-hidden ring-2',
                        isActive ? 'ring-primary' : 'ring-transparent'
                      )}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-lg">👤</div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] flex items-center gap-1">
                    {item.label}
                    {showPulse && <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning animate-pulse" aria-label="Atividade ativa" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
};
