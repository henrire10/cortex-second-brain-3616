import React from 'react';

interface TypingIndicatorProps {
  senderName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ senderName = 'Personal Trainer' }) => {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
        {senderName[0]}
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3 max-w-[80%] relative">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-muted-foreground ml-2">digitando...</span>
        </div>
      </div>
    </div>
  );
};