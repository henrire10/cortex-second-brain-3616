
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertTriangle, Info, AlertCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SystemLog {
  id: string;
  created_at: string;
  log_level: string;
  message: string;
}

const AdminLogs = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-logs', levelFilter],
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200); // Limitar a 200 logs mais recentes

      if (levelFilter !== 'all') {
        query = query.eq('log_level', levelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SystemLog[];
    },
    enabled: isAdmin
  });

  const getLevelBadge = (level: string) => {
    const levelMap: Record<string, { 
      label: string; 
      variant: 'default' | 'secondary' | 'outline' | 'destructive';
      icon: React.ReactNode;
    }> = {
      ERROR: { 
        label: 'ERROR', 
        variant: 'destructive',
        icon: <AlertTriangle className="h-3 w-3" />
      },
      WARN: { 
        label: 'WARN', 
        variant: 'outline',
        icon: <AlertCircle className="h-3 w-3" />
      },
      INFO: { 
        label: 'INFO', 
        variant: 'secondary',
        icon: <Info className="h-3 w-3" />
      },
      DEBUG: { 
        label: 'DEBUG', 
        variant: 'outline',
        icon: <Info className="h-3 w-3" />
      }
    };

    const levelInfo = levelMap[level] || { 
      label: level, 
      variant: 'outline' as const,
      icon: <Info className="h-3 w-3" />
    };
    
    return (
      <Badge variant={levelInfo.variant} className="flex items-center gap-1">
        {levelInfo.icon}
        {levelInfo.label}
      </Badge>
    );
  };

  const getRowClass = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-50 border-l-4 border-l-red-500';
      case 'WARN':
        return 'bg-yellow-50 border-l-4 border-l-yellow-500';
      case 'INFO':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      case 'DEBUG':
        return 'bg-gray-50 border-l-4 border-l-gray-500';
      default:
        return 'bg-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área.</p>
          <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
                <p className="text-gray-600">Monitorar logs e depurar problemas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Nível do Log
                </label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="ERROR">Apenas Erros</SelectItem>
                    <SelectItem value="WARN">Apenas Avisos</SelectItem>
                    <SelectItem value="INFO">Apenas Info</SelectItem>
                    <SelectItem value="DEBUG">Apenas Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Logs do Sistema ({logs?.length || 0} encontrados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando logs...</p>
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-4 rounded-lg ${getRowClass(log.log_level)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getLevelBadge(log.log_level)}
                          <span className="text-sm text-gray-500">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 break-words">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {levelFilter === 'all' 
                    ? 'Nenhum log encontrado.' 
                    : `Nenhum log de nível ${levelFilter} encontrado.`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogs;
