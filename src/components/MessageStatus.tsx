import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface MessageStatusProps {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ status, className = "" }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={`flex items-center justify-end ${className}`}>
      {getStatusIcon()}
    </div>
  );
};