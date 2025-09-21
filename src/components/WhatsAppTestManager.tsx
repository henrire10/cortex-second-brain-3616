
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, CheckCircle, Clock } from 'lucide-react';

export const WhatsAppTestManager = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testScheduledFunction = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('Testando função de envio automatizado...');
      
      const { data, error } = await supabase.functions.invoke('schedule-daily-workouts', {
        body: { test_mode: true }
      });

      if (error) {
        console.error('Erro ao testar função:', error);
        throw error;
      }

      console.log('Resultado do teste:', data);
      setTestResult(data);

      toast({
        title: "Teste realizado com sucesso",
        description: `Processados: ${data?.processed || 0} usuários, Enviados: ${data?.sent || 0} treinos`,
      });

    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a função automatizada.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const testSingleWorkout = async () => {
    setTesting(true);

    try {
      // Buscar um treino de hoje para teste
      const today = new Date().toISOString().split('T')[0];
      
      const { data: workouts, error: workoutError } = await supabase
        .from('daily_workouts')
        .select('*')
        .eq('workout_date', today)
        .limit(1);

      if (workoutError) throw workoutError;

      if (!workouts || workouts.length === 0) {
        toast({
          title: "Nenhum treino encontrado",
          description: "Não há treinos para hoje. Crie um treino primeiro.",
          variant: "destructive",
        });
        return;
      }

      const workout = workouts[0];
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-workout', {
        body: { 
          workout_id: workout.id,
          test_hardcoded: true 
        }
      });

      if (error) throw error;

      toast({
        title: "Teste de WhatsApp enviado",
        description: "Mensagem de teste enviada com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao enviar teste:', error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar o teste via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Testes do Sistema WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Teste as funcionalidades de envio automático e respostas
          </p>
        </div>
      </div>

      {/* Botões de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Teste de Envio Automatizado
            </CardTitle>
            <CardDescription>
              Simula o envio diário automático de treinos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testScheduledFunction}
              disabled={testing}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {testing ? 'Testando...' : 'Testar Envio Automático'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Teste de WhatsApp Individual
            </CardTitle>
            <CardDescription>
              Envia uma mensagem de teste via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testSingleWorkout}
              disabled={testing}
              variant="outline"
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {testing ? 'Enviando...' : 'Enviar Teste WhatsApp'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultado do Teste */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'Sucesso' : 'Erro'}
                </Badge>
              </div>
              {testResult.processed !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Usuários processados:</span>
                  <span className="font-mono">{testResult.processed}</span>
                </div>
              )}
              {testResult.sent !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Treinos enviados:</span>
                  <span className="font-mono">{testResult.sent}</span>
                </div>
              )}
              <Separator />
              <div className="text-sm text-muted-foreground">
                <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Testar as Respostas Automáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Configure seu WhatsApp</h4>
            <p className="text-sm text-muted-foreground">
              Certifique-se de que seu número está cadastrado no sistema e você está inscrito para receber mensagens.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Envie uma mensagem de teste</h4>
            <p className="text-sm text-muted-foreground">
              Use o botão "Enviar Teste WhatsApp" para receber uma mensagem no seu WhatsApp.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Teste as respostas automáticas</h4>
            <p className="text-sm text-muted-foreground">
              Responda com palavras como: <code>feito</code>, <code>concluído</code>, <code>ok</code>, <code>pronto</code> para marcar o treino como completo.
            </p>
            <p className="text-sm text-muted-foreground">
              Ou responda com: <code>não</code>, <code>não consegui</code>, <code>pulei</code> para indicar que não treinou.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">4. Verifique o painel</h4>
            <p className="text-sm text-muted-foreground">
              Após responder, verifique se o status do treino foi atualizado automaticamente no painel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
