import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Loader2, 
  QrCode, 
  CheckCircle,
  Copy,
  ExternalLink,
  Settings,
  AlertCircle
} from 'lucide-react';

interface AsaasPaymentProps {
  planType: 'monthly' | 'quarterly' | 'annual';
  onSuccess?: () => void;
}

export const AsaasPayment: React.FC<AsaasPaymentProps> = ({ planType, onSuccess }) => {
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [payment, setPayment] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  
  // Estados para CPF
  const [cpf, setCpf] = useState('');
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [cpfError, setCpfError] = useState('');

  const planPrices = {
    monthly: { value: 69.99, label: 'Mensal - R$ 69,99' },
    quarterly: { value: 149.97, label: 'Trimestral - R$ 149,97' },
    annual: { value: 359.88, label: 'Anual - R$ 359,88' }
  };

  // Função para formatar CPF
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Função para validar CPF
  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) {
      return false;
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) {
      return false;
    }
    
    return true;
  };

  // Handler para mudança no CPF
  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpf(formatted);
    
    if (formatted.length > 0) {
      if (validateCpf(formatted)) {
        setCpfError('');
      } else {
        setCpfError('CPF inválido');
      }
    } else {
      setCpfError('');
    }
  };

  // Verificar se deve mostrar campo CPF quando PIX for selecionado
  useEffect(() => {
    if (paymentMethod === 'PIX') {
      // Verificar se usuário já tem CPF nos metadados
      const userCpf = user?.user_metadata?.cpf;
      if (!userCpf) {
        setShowCpfInput(true);
      } else {
        setCpf(userCpf);
        setShowCpfInput(false);
      }
    } else {
      setShowCpfInput(false);
      setCpf('');
      setCpfError('');
    }
  }, [paymentMethod, user]);

  // 🔍 DIAGNÓSTICO ASAAS
  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('🔍 Executando diagnósticos...');
      
      const response = await supabase.functions.invoke('asaas-diagnostics');
      
      if (response.error) {
        throw new Error(response.error.message || 'Erro ao executar diagnósticos');
      }

      const results = response.data;
      setDiagnosticResults(results);
      setShowDiagnostics(true);
      
      console.log('📊 Resultados do diagnóstico:', results);
      
      if (results.status === 'healthy') {
        toast({
          title: "✅ Configuração OK",
          description: "A integração com Asaas está funcionando corretamente.",
          variant: "default",
        });
      } else if (results.status === 'warning') {
        toast({
          title: "⚠️ Avisos encontrados",
          description: "A integração funciona, mas há alertas na configuração.",
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Problemas detectados",
          description: "Encontrados problemas na configuração do Asaas.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('💥 Erro no diagnóstico:', error);
      toast({
        title: "Erro no diagnóstico",
        description: error.message || 'Não foi possível executar o diagnóstico.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'PIX' && !cpf) {
      toast({
        title: "CPF obrigatório",
        description: "Por favor, informe o CPF para pagamentos PIX",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'PIX' && !validateCpf(cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, verifique o CPF informado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setPayment(null);

    try {
      console.log("🚀 Iniciando criação de pagamento", { planType, paymentMethod, hasCpf: !!cpf });
      
      const { data, error } = await Promise.race([
        supabase.functions.invoke('create-asaas-payment', {
          body: {
            planType,
            billingType: paymentMethod,
            cpf: paymentMethod === 'PIX' ? cpf : undefined
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Operação demorou mais que 15 segundos')), 15000)
        )
      ]) as { data: any; error: any };

      console.log("📊 Resposta completa da edge function:", JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error("❌ Erro na edge function:", error);
        throw new Error(error.message || 'Erro ao criar pagamento');
      }

      if (!data) {
        console.error("❌ Função retornou dados vazios");
        throw new Error('Nenhum dado retornado da função de pagamento');
      }

      console.log("📋 Dados recebidos:", { 
        id: data.id, 
        status: data.status,
        hasPixQr: !!data.pixQrCode,
        hasPixCopy: !!data.pixCopyAndPaste,
        allFields: Object.keys(data)
      });

      // Relaxar validação temporariamente para debug
      if (!data.id && !data.paymentId) {
        console.error("❌ Dados sem ID:", data);
        throw new Error('Dados de pagamento sem identificador');
      }

      console.log("✅ Definindo dados do pagamento...");
      setPayment(data);

      if (paymentMethod === 'PIX') {
        console.log("🔄 Iniciando polling para PIX...");
        startPolling(data.id || data.paymentId);
      }

      toast({
        title: "Pagamento criado!",
        description: paymentMethod === 'PIX' 
          ? "Use o QR Code ou código PIX para efetuar o pagamento" 
          : "Clique no link para efetuar o pagamento",
      });

    } catch (error) {
      console.error("💥 Erro crítico na criação do pagamento:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erro ao criar pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("🏁 Finalizando criação do pagamento, resetando loading...");
      setLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    console.log('🔄 Starting payment polling for:', paymentId);
    
    const poll = async () => {
      try {
        console.log('🔍 Checking payment status for:', paymentId);
        
        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          console.error('❌ No access token found during polling');
          throw new Error('Sessão expirada durante verificação');
        }

        const { data, error } = await supabase.functions.invoke('check-asaas-payment', {
          body: { paymentId }
        });

        console.log('📊 Payment status response:', { 
          data, 
          error,
          status: data?.status 
        });

        if (error) {
          console.error('❌ Error checking payment:', error);
          if (error.message?.includes('Failed to fetch')) {
            throw new Error('Erro de conexão durante verificação');
          }
          throw error;
        }

        if (!data) {
          console.error('❌ No data returned from payment check');
          throw new Error('Erro ao verificar status do pagamento');
        }

        if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
          console.log('✅ Payment confirmed!', data.status);
          setPolling(false);
          await refreshSubscription();
          toast({
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada com sucesso.",
          });
          onSuccess?.();
          return;
        }

        console.log('⏳ Payment still pending, continuing polling...', data.status);
        // Continuar polling se ainda não foi confirmado
        setTimeout(poll, 5000);
      } catch (error) {
        console.error('💥 Erro ao verificar pagamento:', error);
        setPolling(false);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        toast({
          title: "Erro na verificação",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    poll();
  };

  const copyPixCode = () => {
    if (payment?.pixCopyAndPaste) {
      navigator.clipboard.writeText(payment.pixCopyAndPaste);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu app bancário para pagar.",
      });
    }
  };

  const handleCardPayment = async () => {
    // Para cartão de crédito, redirecionar para URL da fatura
    if (payment?.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank');
    }
  };

  // 🔍 MODAL DE DIAGNÓSTICOS
  if (showDiagnostics && diagnosticResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">🔍 Diagnóstico Asaas</h3>
          <Button 
            variant="outline" 
            onClick={() => setShowDiagnostics(false)}
          >
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Badge variant={
                diagnosticResults.status === 'healthy' ? 'default' : 
                diagnosticResults.status === 'warning' ? 'secondary' : 'destructive'
              }>
                {diagnosticResults.status === 'healthy' ? '✅ Saudável' : 
                 diagnosticResults.status === 'warning' ? '⚠️ Avisos' : '❌ Problemas'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Ambiente: {diagnosticResults.environment}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuração */}
            <div>
              <h4 className="font-medium mb-2">📋 Configuração</h4>
              <div className="space-y-1 text-sm">
                <p>✅ API Key: {diagnosticResults.configuration.hasApiKey ? 'Configurada' : '❌ Não configurada'}</p>
                <p>✅ Base URL: {diagnosticResults.configuration.autoDetectedBaseUrl}</p>
                {diagnosticResults.configuration.warnings.map((warning: string, idx: number) => (
                  <p key={idx} className="text-yellow-600">⚠️ {warning}</p>
                ))}
                {diagnosticResults.configuration.fixes.map((fix: string, idx: number) => (
                  <p key={idx} className="text-green-600">🔧 {fix}</p>
                ))}
              </div>
            </div>

            {/* Testes de Conectividade */}
            <Separator />
            <div>
              <h4 className="font-medium mb-2">🧪 Testes de Conectividade</h4>
              <div className="space-y-1 text-sm">
                <p>
                  {diagnosticResults.connectivity.basicAuth.status === 'success' ? '✅' : '❌'} 
                  Autenticação: {diagnosticResults.connectivity.basicAuth.status}
                  {diagnosticResults.connectivity.basicAuth.error && (
                    <span className="text-red-600 ml-2">({diagnosticResults.connectivity.basicAuth.error})</span>
                  )}
                </p>
                <p>
                  {diagnosticResults.connectivity.customerList.status === 'success' ? '✅' : '❌'} 
                  Lista de clientes: {diagnosticResults.connectivity.customerList.status}
                </p>
                <p>
                  {diagnosticResults.connectivity.apiHealth.status === 'success' ? '✅' : '❌'} 
                  Saúde da API: {diagnosticResults.connectivity.apiHealth.status}
                </p>
              </div>
            </div>

            {/* Resumo */}
            <Separator />
            <div>
              <h4 className="font-medium mb-2">📊 Resumo</h4>
              <div className="space-y-1 text-sm">
                <p>Pode criar pagamentos: {diagnosticResults.summary.canCreatePayments ? '✅ Sim' : '❌ Não'}</p>
                <p>Pode verificar pagamentos: {diagnosticResults.summary.canCheckPayments ? '✅ Sim' : '❌ Não'}</p>
              </div>
            </div>

            {/* Recomendações */}
            {diagnosticResults.recommendations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">💡 Recomendações</h4>
                  <ul className="space-y-1 text-sm">
                    {diagnosticResults.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex space-x-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? "Executando..." : "🔄 Executar Novamente"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowDiagnostics(false);
              setDiagnosticResults(null);
            }}
          >
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  // Se já temos um pagamento, mostrar os detalhes
  if (payment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {paymentMethod === 'PIX' && <QrCode className="w-5 h-5 text-green-600" />}
            {paymentMethod === 'CREDIT_CARD' && <CreditCard className="w-5 h-5 text-blue-600" />}
            
            {paymentMethod === 'PIX' && 'Pagamento PIX'}
            {paymentMethod === 'CREDIT_CARD' && 'Cartão de Crédito'}
          </CardTitle>
          <div className="text-center">
            <Badge variant="outline">
              {planPrices[planType].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethod === 'PIX' && (
            <div className="text-center space-y-4">
              {payment.pixQrCode && (
                <div className="bg-white p-4 rounded-lg border">
                  <img src={`data:image/png;base64,${payment.pixQrCode}`} alt="QR Code PIX" className="mx-auto" />
                </div>
              )}
              
              {payment.pixCopyAndPaste && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Código PIX:</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={payment.pixCopyAndPaste} 
                      readOnly 
                      className="text-xs"
                    />
                    <Button onClick={copyPixCode} size="sm" variant="outline">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {polling && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Aguardando pagamento...</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CREDIT_CARD' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Clique no botão abaixo para finalizar o pagamento com cartão de crédito:
              </p>
              <Button onClick={handleCardPayment} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Pagar com Cartão
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Interface inicial de seleção de pagamento
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Finalizar Pagamento</CardTitle>
        <div className="text-center">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {planPrices[planType].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium">Escolha a forma de pagamento:</Label>
          <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)} className="mt-3">
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="PIX" id="pix" />
              <QrCode className="w-5 h-5 text-green-600" />
              <Label htmlFor="pix" className="flex-1 cursor-pointer">
                PIX - Aprovação instantânea
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="CREDIT_CARD" id="credit" />
              <CreditCard className="w-5 h-5 text-blue-600" />
              <Label htmlFor="credit" className="flex-1 cursor-pointer">
                Cartão de Crédito
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Campo CPF para PIX */}
        {showCpfInput && paymentMethod === 'PIX' && (
          <div className="space-y-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-4 h-4" />
              <Label className="text-sm font-medium">CPF necessário para PIX</Label>
            </div>
            <p className="text-xs text-orange-600 mb-2">
              O CPF é obrigatório para gerar pagamentos PIX no Brasil
            </p>
            <div className="space-y-1">
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                maxLength={14}
                className={cpfError ? "border-red-500" : ""}
              />
              {cpfError && (
                <p className="text-xs text-red-500">{cpfError}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={createPayment}
            disabled={loading || (paymentMethod === 'PIX' && showCpfInput && (!cpf || !!cpfError))}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando cobrança...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
          
          {loading && (
            <Button 
              onClick={() => {
                setLoading(false);
                toast({
                  title: "Operação cancelada",
                  description: "Tente novamente se necessário",
                });
              }}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          )}
          
          {!loading && (
            <Button
              variant="outline"
              onClick={runDiagnostics}
              disabled={loading}
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              🔍 Testar Configuração
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};