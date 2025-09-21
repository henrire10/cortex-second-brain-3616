import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MessageNotificationBadge } from './MessageNotificationBadge';
interface MobileHeaderProps {
  onMenuToggle?: () => void;
  onBack?: () => void;
  title?: string;
  showBackButton?: boolean;
}
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuToggle,
  onBack,
  title,
  showBackButton = false
}) => {
  const navigate = useNavigate();
  return <div className="sticky top-0 z-[60] flex items-center justify-between p-4 bg-background border-b border-border md:hidden">
      <div className="flex items-center gap-3">
        {showBackButton && onBack ? <Button onClick={onBack} variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button> : !showBackButton && onMenuToggle ? <Button variant="ghost" size="sm" className="p-2" onClick={onMenuToggle}>
            <Menu className="w-6 h-6" />
          </Button> : null}
        
        {title}
      </div>
      
      {!showBackButton && (
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 relative"
            onClick={() => navigate('/messages')}
          >
            <MessageCircle className="w-5 h-5" />
            <MessageNotificationBadge />
          </Button>
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm">
            <img src="/lovable-uploads/b98a2f79-9b0f-4589-ac12-2776e4b0e245.png" alt="BetzaFit Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>;
};