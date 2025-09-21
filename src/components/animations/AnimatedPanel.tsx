
import React, { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnimatedPanelProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  isOpen,
  children,
  className = '',
  onClose
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Mobile Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Panel */}
        <div 
          className={`
            fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
            transform transition-all duration-500 ease-out
            ${isOpen 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-full opacity-0 pointer-events-none'
            }
            ${className}
          `}
          style={{ maxHeight: '85vh' }}
        >
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          {children}
        </div>
      </>
    );
  }

  // Desktop Panel
  return (
    <div 
      className={`
        overflow-hidden transition-all duration-500 ease-out transform
        ${isOpen 
          ? 'max-h-[2000px] opacity-100 translate-y-0' 
          : 'max-h-0 opacity-0 -translate-y-4'
        }
        ${className}
      `}
    >
      <div className="mx-2 sm:mx-4 mb-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-100/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {children}
      </div>
    </div>
  );
};
