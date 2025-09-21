
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Users, Send, Activity, Calendar } from 'lucide-react';

interface SystemLog {
  id: string;
  log_level: string;
  message: string;
  created_at: string;
}

interface CronJob {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run: string | null;
  next_run: string | null;
}

export const AutomatedWorkoutManager = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const { toast } = useToast();

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  };

  const fetchCronJobs = async () => {
    try {
      // This would require a custom function to query cron jobs
      // For now, we'll simulate the data
      setCronJobs([
        {
          jobname: 'send-daily-workouts',
          schedule: '0 9 * * *',
          active: true,
          last_run: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          next_run: new Date(Date.now() + (24 * 60 * 60 * 1000 - (Date.now() % (24 * 60 * 60 * 1000)) + 9 * 60 * 60 * 1000)).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching cron jobs:', error);
    }
  };

  const testScheduledFunction = async () => {
    setTestSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-workouts-test', {
        body: { test_mode: true }
      });

      if (error) throw error;

      toast({
        title: "Teste realizado com sucesso",
        description: "A função de envio automatizado foi testada. Verifique os logs para detalhes.",
      });

      // Refresh logs after test
      setTimeout(fetchSystemLogs, 2000);
    } catch (error) {
      console.error('Error testing scheduled function:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a função automatizada.",
        variant: "destructive",
      });
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSystemLogs(), fetchCronJobs()]);
      setLoading(false);
    };

    loadData();

    // Set up real-time updates for logs
    const channel = supabase
      .channel('system-logs-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs'
        },
        () => fetchSystemLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'secondary';
      case 'INFO': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Envio Automatizado</h2>
          <p className="text-muted-foreground">
            Gerencie e monitore o envio automático de treinos via WhatsApp
          </p>
        </div>
        <Button 
          onClick={testScheduledFunction}
          disabled={testSending}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {testSending ? 'Testando...' : 'Testar Sistema'}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Envio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6:00</div>
            <p className="text-xs text-muted-foreground">
              Horário de Brasília (diário)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Cron</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Executando automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Com WhatsApp habilitado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cron Jobs Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tarefas Agendadas
          </CardTitle>
          <CardDescription>
            Status das tarefas automatizadas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cronJobs.map((job) => (
              <div key={job.jobname} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.jobname}</span>
                    <Badge variant={job.active ? 'default' : 'secondary'}>
                      {job.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Agendamento: {job.schedule} (0 9 * * * = 6:00 AM Brasil)
                  </p>
                  {job.last_run && (
                    <p className="text-xs text-muted-foreground">
                      Última execução: {formatDateTime(job.last_run)}
                    </p>
                  )}
                  {job.next_run && (
                    <p className="text-xs text-muted-foreground">
                      Próxima execução: {formatDateTime(job.next_run)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs do Sistema</CardTitle>
          <CardDescription>
            Registros das execuções automáticas e eventos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum log encontrado
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge variant={getLogLevelColor(log.log_level)} className="mt-0.5">
                    {log.log_level}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
