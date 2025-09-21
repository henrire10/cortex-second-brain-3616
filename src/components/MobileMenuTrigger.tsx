
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface MobileMenuTriggerProps {
  onClick: () => void;
}

export const MobileMenuTrigger: React.FC<MobileMenuTriggerProps> = ({ onClick }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden p-2"
      onClick={onClick}
    >
      <Menu className="w-6 h-6" />
    </Button>
  );
};
