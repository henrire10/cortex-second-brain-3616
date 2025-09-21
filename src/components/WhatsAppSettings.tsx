import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageCircle, Phone, CheckCircle, XCircle, Send, AlertTriangle, Wifi, Bug, TestTube } from 'lucide-react';

interface WhatsAppData {
  phone_number: string;
  opted_in: boolean;
}

interface WhatsAppMessage {
  id: string;
  message_content: string;
  message_type: string;
  status: string;
  created_at: string;
}

export const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  const [whatsAppData, setWhatsAppData] = useState<WhatsAppData | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingHardcoded, setIsSendingHardcoded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchWhatsAppSettings();
      fetchRecentMessages();
      checkApiConnection();
    }
  }, [user]);

  const checkApiConnection = async () => {
    setConnectionStatus('checking');
    setConnectionError('');
    
    try {
      console.log('Testing WhatsApp API connection...');
      
      // Clean up ALL existing test workouts first
      console.log('Cleaning up existing test workouts...');
      await supabase
        .from('daily_workouts')
        .delete()
        .eq('user_id', user?.id)
        .or('workout_title.like.%Teste%,workout_title.like.%Test%,workout_title.like.%test%,workout_title.like.%API%');

      // Generate a truly unique identifier combining multiple random elements
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const microtime = performance.now().toString().replace('.', '');
      const userSuffix = user?.id?.substring(0, 8) || 'user';
      const uniqueId = `connection_test_${timestamp}_${randomId}_${microtime}_${userSuffix}`;
      
      // Create a date far in the future with multiple layers of uniqueness
      const futureDate = new Date();
      futureDate.setFullYear(2050 + Math.floor(Math.random() * 50)); // 2050-2100
      futureDate.setMonth(Math.floor(Math.random() * 12));
      futureDate.setDate(Math.floor(Math.random() * 28) + 1);
      futureDate.setTime(futureDate.getTime() + timestamp + Math.floor(Math.random() * 86400000));
      
      const workoutDate = futureDate.toISOString().split('T')[0];
      
      const testWorkoutData = {
        user_id: user?.id,
        workout_title: `API Connection Test ${uniqueId}`,
        workout_content: `Testing API connectivity - ID: ${uniqueId}`,
        workout_date: workoutDate,
        status: 'pending'
      };

      console.log('Creating unique test workout with date:', workoutDate, 'and ID:', uniqueId);
      
      const { data: testWorkout, error: workoutError } = await supabase
        .from('daily_workouts')
        .insert(testWorkoutData)
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating test workout:', workoutError);
        setConnectionStatus('error');
        setConnectionError('Erro ao criar treino de teste para verificação');
        return;
      }

      console.log('Test workout created successfully, testing API call...');
      
      // Test the API with a dry run
      const { data, error } = await supabase.functions.invoke('send-whatsapp-workout', {
        body: { 
          workout_id: testWorkout.id,
          dry_run: true
        }
      });

      // Always clean up test workout regardless of API test result
      console.log('Cleaning up test workout...');
      await supabase
        .from('daily_workouts')
        .delete()
        .eq('id', testWorkout.id);

      if (error) {
        console.error('API connection test failed:', error);
        setConnectionStatus('error');
        if (error.message?.includes('token') || error.message?.includes('acesso')) {
          setConnectionError('Token de acesso do MelhorZap inválido ou expirado. Verifique as configurações da API.');
        } else if (error.message?.includes('instance')) {
          setConnectionError('Instância do WhatsApp não encontrada ou inativa. Verifique o ID da instância.');
        } else {
          setConnectionError(error.message || 'Erro na conexão com a API');
        }
        return;
      }

      if (data?.error) {
        console.error('API returned error:', data);
        setConnectionStatus('error');
        if (data.error.includes('token') || data.error.includes('acesso')) {
          setConnectionError('Token de acesso do MelhorZap inválido. Verifique as configurações da API.');
        } else if (data.error.includes('instance')) {
          setConnectionError('Instância do WhatsApp inativa ou não encontrada.');
        } else {
          setConnectionError(data.error);
        }
        return;
      }

      console.log('API connection test successful');
      setConnectionStatus('connected');
      
    } catch (error: any) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      setConnectionError(error.message || 'Erro desconhecido na conexão');
    }
  };

  const fetchWhatsAppSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_whatsapp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WhatsApp settings:', error);
        toast.error('Erro ao carregar configurações do WhatsApp');
        return;
      }

      if (data) {
        setWhatsAppData(data);
        setPhoneNumber(data.phone_number);
        setIsOptedIn(data.opted_in);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setRecentMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveWhatsAppSettings = async () => {
    if (!user) return;

    // Validate phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (cleanPhoneNumber.length < 10) {
      toast.error('Por favor, insira um número de telefone válido');
      return;
    }

    setIsSaving(true);
    try {
      if (whatsAppData) {
        // Update existing record
        const { error } = await supabase
          .from('user_whatsapp')
          .update({
            phone_number: cleanPhoneNumber,
            opted_in: isOptedIn,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_whatsapp')
          .insert({
            user_id: user.id,
            phone_number: cleanPhoneNumber,
            opted_in: isOptedIn
          });

        if (error) throw error;
      }

      toast.success('Configurações do WhatsApp salvas com sucesso!');
      fetchWhatsAppSettings();
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Erro ao salvar configurações do WhatsApp');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestMessage = async () => {
    if (!user || !testMessage.trim()) {
      toast.error('Digite uma mensagem de teste');
      return;
    }

    if (!whatsAppData?.opted_in) {
      toast.error('Você precisa ativar o WhatsApp primeiro');
      return;
    }

    setIsSendingTest(true);
    try {
      // Clean up existing test workouts first
      console.log('Cleaning up existing test workouts for message test...');
      await supabase
        .from('daily_workouts')
        .delete()
        .eq('user_id', user.id)
        .or('workout_title.like.%Teste%,workout_title.like.%Test%,workout_title.like.%test%');

      // Generate unique identifier for message test
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const microtime = performance.now().toString().replace('.', '');
      const userSuffix = user.id.substring(0, 8);
      const uniqueId = `message_test_${timestamp}_${randomString}_${microtime}_${userSuffix}`;
      
      // Create unique future date
      const testDate = new Date();
      testDate.setFullYear(2045 + Math.floor(Math.random() * 30)); // 2045-2075
      testDate.setMonth(Math.floor(Math.random() * 12));
      testDate.setDate(Math.floor(Math.random() * 28) + 1);
      testDate.setTime(testDate.getTime() + timestamp + Math.floor(Math.random() * 86400000));
      
      const workoutDate = testDate.toISOString().split('T')[0];
      
      console.log('Creating test workout for message with unique ID:', uniqueId, 'and date:', workoutDate);
      
      const { data: testWorkout, error: workoutError } = await supabase
        .from('daily_workouts')
        .insert({
          user_id: user.id,
          workout_title: `WhatsApp Message Test ${uniqueId}`,
          workout_content: testMessage,
          workout_date: workoutDate,
          status: 'pending'
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating test workout:', workoutError);
        throw new Error(`Erro ao criar treino de teste: ${workoutError.message}`);
      }

      console.log('Test workout created successfully:', testWorkout);

      // Send via edge function
      const { data, error } = await supabase.functions.invoke('send-whatsapp-workout', {
        body: { workout_id: testWorkout.id }
      });

      // Clean up test workout
      console.log('Cleaning up message test workout...');
      await supabase
        .from('daily_workouts')
        .delete()
        .eq('id', testWorkout.id);

      if (error) {
        console.error('Error calling edge function:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.error) {
        console.error('Edge function returned error:', data);
        if (data.error.includes('token') || data.error.includes('acesso')) {
          throw new Error('Token de acesso do MelhorZap inválido. Verifique as configurações da API.');
        } else if (data.error.includes('instance')) {
          throw new Error('Instância do WhatsApp inativa. Verifique o ID da instância.');
        } else {
          throw new Error(data.error);
        }
      }

      toast.success(`Mensagem enviada para ${data.phone || 'seu número'}!`);
      setTestMessage('');
      fetchRecentMessages();

    } catch (error: any) {
      console.error('Error sending test message:', error);
      toast.error(`Erro ao enviar: ${error.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const sendHardcodedTest = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!whatsAppData?.opted_in) {
      toast.error('Você precisa ativar o WhatsApp primeiro');
      return;
    }

    setIsSendingHardcoded(true);
    try {
      // Clean up existing test workouts first
      console.log('Cleaning up existing test workouts for hardcoded test...');
      await supabase
        .from('daily_workouts')
        .delete()
        .eq('user_id', user.id)
        .or('workout_title.like.%Teste%,workout_title.like.%Test%,workout_title.like.%test%,workout_title.like.%Hardcoded%');

      // Generate unique identifier for hardcoded test
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const microtime = performance.now().toString().replace('.', '');
      const userSuffix = user.id.substring(0, 8);
      const uniqueId = `hardcoded_test_${timestamp}_${randomString}_${microtime}_${userSuffix}`;
      
      // Create unique future date
      const testDate = new Date();
      testDate.setFullYear(2055 + Math.floor(Math.random() * 20)); // 2055-2075
      testDate.setMonth(Math.floor(Math.random() * 12));
      testDate.setDate(Math.floor(Math.random() * 28) + 1);
      testDate.setTime(testDate.getTime() + timestamp + Math.floor(Math.random() * 86400000));
      
      const workoutDate = testDate.toISOString().split('T')[0];
      
      console.log('Creating hardcoded test workout with unique ID:', uniqueId, 'and date:', workoutDate);
      
      const { data: testWorkout, error: workoutError } = await supabase
        .from('daily_workouts')
        .insert({
          user_id: user.id,
          workout_title: `Hardcoded Test Workout ${uniqueId}`,
          workout_content: `This is a hardcoded test content - ID: ${uniqueId}`,
          workout_date: workoutDate,
          status: 'pending'
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating hardcoded test workout:', workoutError);
        throw new Error(`Erro ao criar treino de teste: ${workoutError.message}`);
      }

      console.log('Hardcoded test workout created successfully:', testWorkout);

      // Send via edge function with hardcoded flag
      const { data, error } = await supabase.functions.invoke('send-whatsapp-workout', {
        body: { 
          workout_id: testWorkout.id,
          test_hardcoded: true 
        }
      });

      // Clean up test workout
      console.log('Cleaning up hardcoded test workout...');
      await supabase
        .from('daily_workouts')
        .delete()
        .eq('id', testWorkout.id);

      if (error) {
        console.error('Error calling edge function for hardcoded test:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (data?.error) {
        console.error('Edge function returned error for hardcoded test:', data);
        if (data.error.includes('token') || data.error.includes('acesso')) {
          throw new Error('Token de acesso do MelhorZap inválido. Verifique as configurações da API.');
        } else if (data.error.includes('instance')) {
          throw new Error('Instância do WhatsApp inativa. Verifique o ID da instância.');
        } else {
          throw new Error(data.error);
        }
      }

      toast.success(`Teste hardcoded enviado para ${data.phone || 'seu número'}! Verifique os logs para debug.`);
      fetchRecentMessages();

    } catch (error: any) {
      console.error('Error sending hardcoded test:', error);
      toast.error(`Erro ao enviar: ${error.message}`);
    } finally {
      setIsSendingHardcoded(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'workout_notification':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'incoming_response':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'automated_response':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500';
      case 'received':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações do WhatsApp...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Alert */}
      {connectionStatus === 'error' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {connectionError ? `${connectionError}` : 'Problema na conexão com a API do WhatsApp. Algumas funcionalidades podem não estar disponíveis.'}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={checkApiConnection}
            >
              <Wifi className="w-4 h-4 mr-1" />
              Testar Conexão
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'connected' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            API do WhatsApp conectada e funcionando corretamente!
          </AlertDescription>
        </Alert>
      )}

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            Configurações do WhatsApp
            {connectionStatus === 'connected' && (
              <Badge variant="default" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            )}
            {connectionStatus === 'checking' && (
              <Badge variant="secondary" className="ml-2">
                <Wifi className="w-3 h-3 mr-1" />
                Verificando...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formatPhoneNumber(phoneNumber)}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className="text-base"
            />
            <p className="text-sm text-gray-600">
              Digite seu número com DDD (ex: 11999999999)
            </p>
          </div>

          {/* Opt-in Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Receber notificações via WhatsApp</Label>
              <p className="text-sm text-gray-600">
                Receba lembretes de treino e confirme a conclusão via WhatsApp
              </p>
            </div>
            <Switch
              checked={isOptedIn}
              onCheckedChange={setIsOptedIn}
            />
          </div>

          {/* Status Badge */}
          {whatsAppData && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={whatsAppData.opted_in ? "default" : "secondary"}>
                {whatsAppData.opted_in ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativo
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inativo
                  </>
                )}
              </Badge>
            </div>
          )}

          {/* Save Button */}
          <Button 
            onClick={saveWhatsAppSettings} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Message Card */}
      {whatsAppData?.opted_in && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Teste de Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testMessage">Mensagem de Teste</Label>
              <Input
                id="testMessage"
                placeholder="Digite uma mensagem para testar..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={sendTestMessage} 
                disabled={isSendingTest || !testMessage.trim() || connectionStatus === 'error'}
                variant="outline"
              >
                {isSendingTest ? 'Enviando...' : 'Enviar Teste Dinâmico'}
              </Button>
              <Button 
                onClick={sendHardcodedTest} 
                disabled={isSendingHardcoded || connectionStatus === 'error'}
                variant="outline"
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <TestTube className="w-4 h-4 mr-1" />
                {isSendingHardcoded ? 'Enviando...' : 'Teste Hardcoded'}
              </Button>
            </div>
            {connectionStatus === 'error' && (
              <p className="text-sm text-red-600">
                Testes desabilitados devido a problemas de conexão
              </p>
            )}
            <Alert className="border-blue-200 bg-blue-50">
              <Bug className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Debug Info:</strong> Use o "Teste Hardcoded" para isolar problemas de formatação da mensagem. 
                Verifique os logs do console para detalhes completos do debugging.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              Mensagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getMessageTypeIcon(message.message_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">
                        {message.message_type.replace('_', ' ')}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(message.status)} text-white text-xs`}
                      >
                        {message.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {message.message_content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
