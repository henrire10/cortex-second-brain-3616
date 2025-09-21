import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Eye, EyeOff, Trash2, RefreshCw, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AILogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'parse_error' | 'prompt';
  endpoint: string;
  data: any;
  status?: number;
  error?: string;
  rawResponse?: string;
}

export const AIWorkoutLogs: React.FC = () => {
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);

  // Interceptar console.log para capturar logs da edge function
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    const processLog = (message: string, type: 'log' | 'error') => {
      if (!isCapturing) return;
      
      try {
        // Verificar se é um log estruturado da nossa edge function
        if (message.includes('BIAFITNESS_AI_') && message.includes('_LOG:')) {
          console.log('🎯 Log capturado:', message.substring(0, 100) + '...');
          
          const parts = message.split('_LOG:');
          if (parts.length < 2) return;
          
          const logDataStr = parts[1].trim();
          
          let logData;
          try {
            logData = JSON.parse(logDataStr);
          } catch (parseError) {
            console.error('❌ Erro ao parsear log JSON:', parseError);
            return;
          }
          
          const newLog: AILogEntry = {
            id: logData.id || crypto.randomUUID(),
            timestamp: logData.timestamp || new Date().toISOString(),
            type: logData.type || 'error',
            endpoint: logData.endpoint || 'unknown',
            data: logData.data,
            status: logData.status,
            error: logData.error,
            rawResponse: logData.rawResponse
          };
          
          console.log('✅ Log processado:', newLog.type, newLog.id);
          
          setLogs(prevLogs => {
            // Evitar duplicatas
            const exists = prevLogs.some(log => log.id === newLog.id);
            if (exists) {
              console.log('⚠️ Log duplicado ignorado:', newLog.id);
              return prevLogs;
            }
            
            console.log('📝 Adicionando novo log:', newLog.type);
            return [newLog, ...prevLogs.slice(0, 199)];
          });
        }
      } catch (error) {
        console.error('❌ Erro ao processar log:', error);
      }
    };

    // Interceptar os console.log
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      if (args.length > 0 && typeof args[0] === 'string') {
        processLog(args[0], 'log');
      }
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      if (args.length > 0 && typeof args[0] === 'string') {
        processLog(args[0], 'error');
      }
    };

    // Simular um log de inicialização
    console.log('🚀 Sistema de logs iniciado');

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, [isCapturing]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success('Logs limpos!');
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biafitness-ai-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados!');
  };

  const formatJson = (data: any) => {
    try {
      if (typeof data === 'string') return data;
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <Eye className="w-4 h-4" />;
      case 'response':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'parse_error':
        return <AlertTriangle className="w-4 h-4" />;
      case 'prompt':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getLogBadgeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'response':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'parse_error':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'prompt':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getEndpointName = (endpoint: string) => {
    if (endpoint.includes('openai.com')) return 'OpenAI API';
    if (endpoint.includes('generate-workout')) return 'Workout Generator';
    return endpoint;
  };

  const filteredLogs = (type: string) => {
    if (type === 'all') return logs;
    return logs.filter(log => log.type === type);
  };

  const getLogTypeCount = (type: string) => {
    return logs.filter(log => log.type === type).length;
  };

  const hasErrors = logs.some(log => log.type === 'error' || log.type === 'parse_error');

  const renderPromptContent = (log: AILogEntry) => {
    if (log.type !== 'prompt' || !log.data) return null;

    return (
      <div className="space-y-6">
        {/* Prompt do Sistema */}
        {log.data.systemPrompt && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-purple-800">🔧 Prompt do Sistema (COMPLETO):</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(log.data.systemPrompt)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Sistema
              </Button>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {log.data.systemPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Prompt do Usuário */}
        {log.data.userPrompt && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-blue-800">👤 Prompt do Usuário (COMPLETO):</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(log.data.userPrompt)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Usuário
              </Button>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {log.data.userPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Parâmetros */}
        {log.data.parameters && (
          <div>
            <h4 className="font-semibold text-sm text-green-800 mb-2">⚙️ Parâmetros Calculados:</h4>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {formatJson(log.data.parameters)}
              </pre>
            </div>
          </div>
        )}

        {/* Perfil do Usuário */}
        {log.data.userProfile && (
          <div>
            <h4 className="font-semibold text-sm text-orange-800 mb-2">👤 Perfil do Usuário:</h4>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {formatJson(log.data.userProfile)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResponseContent = (log: AILogEntry) => {
    if (log.type !== 'response' || !log.data) return null;

    const isOpenAIResponse = log.endpoint.includes('openai.com');
    const hasFullResponse = log.data.fullResponse || log.data.choices;

    return (
      <div className="space-y-6">
        {/* Resposta Completa da IA */}
        {isOpenAIResponse && hasFullResponse && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-green-800">🤖 Resposta COMPLETA da IA:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(formatJson(log.data.fullResponse || log.data))}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Completo
              </Button>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {formatJson(log.data.fullResponse || log.data)}
              </pre>
            </div>
          </div>
        )}

        {/* Conteúdo da Mensagem */}
        {isOpenAIResponse && log.data.choices && log.data.choices[0] && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-blue-800">💬 Conteúdo da Mensagem:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(log.data.choices[0].message?.content || '')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Conteúdo
              </Button>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {log.data.choices[0].message?.content || 'Conteúdo não encontrado'}
              </pre>
            </div>
          </div>
        )}

        {/* Uso de Tokens */}
        {isOpenAIResponse && log.data.usage && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h5 className="font-semibold text-sm text-purple-800 mb-2">💰 Uso de Tokens:</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-purple-600">Prompt:</span>
                <span className="ml-1 font-mono font-bold">{log.data.usage.prompt_tokens}</span>
              </div>
              <div>
                <span className="text-purple-600">Resposta:</span>
                <span className="ml-1 font-mono font-bold">{log.data.usage.completion_tokens}</span>
              </div>
              <div>
                <span className="text-purple-600">Total:</span>
                <span className="ml-1 font-mono font-bold">{log.data.usage.total_tokens}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
          🤖 Logs da IA - Sistema BiA Fitness 
          {logs.length > 0 && <Badge className="bg-green-500">✅ {logs.length} logs</Badge>}
          {hasErrors && <AlertTriangle className="w-5 h-5 text-red-500" />}
        </h2>
        <p className="text-sm text-gray-600">
          Monitoramento completo: prompts, requisições, respostas e erros da IA
        </p>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {logs.length} registros totais
          </Badge>
          <Badge 
            variant={isCapturing ? "default" : "secondary"} 
            className={`text-sm ${isCapturing ? 'bg-green-500' : ''}`}
          >
            {isCapturing ? '🟢 Capturando' : '⏸️ Pausado'}
          </Badge>
          {hasErrors && (
            <Badge variant="destructive" className="text-sm">
              ⚠️ {getLogTypeCount('error') + getLogTypeCount('parse_error')} erros
            </Badge>
          )}
          {getLogTypeCount('prompt') > 0 && (
            <Badge className="bg-purple-500 text-sm">
              📝 {getLogTypeCount('prompt')} prompts
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCapturing(!isCapturing)}
          >
            {isCapturing ? '⏸️ Pausar' : '▶️ Capturar'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            Todos ({logs.length})
          </TabsTrigger>
          <TabsTrigger value="prompt">
            📝 Prompts ({getLogTypeCount('prompt')})
          </TabsTrigger>
          <TabsTrigger value="request">
            📤 Requests ({getLogTypeCount('request')})
          </TabsTrigger>
          <TabsTrigger value="response">
            📥 Responses ({getLogTypeCount('response')})
          </TabsTrigger>
          <TabsTrigger value="error">
            🚨 Erros ({getLogTypeCount('error')})
          </TabsTrigger>
          <TabsTrigger value="parse_error">
            ⚠️ Parse ({getLogTypeCount('parse_error')})
          </TabsTrigger>
        </TabsList>

        {['all', 'prompt', 'request', 'response', 'error', 'parse_error'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-3">
            <ScrollArea className="h-[700px]">
              {filteredLogs(tabValue).length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">
                      {tabValue === 'prompt' ? '🎯 Gere um treino novo para ver os prompts capturados!' :
                       tabValue === 'error' ? 'Nenhum erro encontrado ✅' : 
                       tabValue === 'parse_error' ? 'Nenhum erro de parsing encontrado ✅' :
                       'Nenhum log encontrado. Gere um treino para ver os logs!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredLogs(tabValue).map((log) => (
                  <Card key={log.id} className={`mb-3 ${log.type === 'error' || log.type === 'parse_error' ? 'border-red-200 bg-red-50' : log.type === 'prompt' ? 'border-purple-200 bg-purple-50' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getLogBadgeColor(log.type)} text-white flex items-center gap-1`}>
                            {getLogIcon(log.type)}
                            {log.type.toUpperCase().replace('_', ' ')}
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs">
                            {getEndpointName(log.endpoint)}
                          </Badge>
                          
                          {log.status && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${log.status >= 400 ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}`}
                            >
                              Status: {log.status}
                            </Badge>
                          )}

                          {log.error && (
                            <Badge variant="destructive" className="text-xs">
                              ❌ ERRO
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(log.id)}
                          >
                            {expandedLog === log.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 font-mono truncate">
                        {log.endpoint}
                      </div>

                      {log.error && (
                        <div className="text-sm text-red-600 font-medium bg-red-100 p-2 rounded">
                          🚨 {log.error}
                        </div>
                      )}
                    </CardHeader>
                    
                    {expandedLog === log.id && (
                      <CardContent>
                        {log.type === 'prompt' ? renderPromptContent(log) : 
                         log.type === 'response' && log.endpoint.includes('openai.com') ? renderResponseContent(log) :
                         (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-sm">
                                {log.type === 'request' ? '📤 Dados Enviados:' :
                                 log.type === 'response' ? '📥 Resposta Recebida:' :
                                 log.type === 'parse_error' ? '⚠️ Erro de Parsing:' :
                                 '🚨 Erro:'}
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(formatJson(log.data))}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar JSON
                              </Button>
                            </div>
                            
                            <div className={`p-4 rounded-lg border-2 ${
                              log.type === 'error' || log.type === 'parse_error' ? 'bg-red-50 border-red-200' : 
                              log.type === 'request' ? 'bg-blue-50 border-blue-200' :
                              'bg-green-50 border-green-200'
                            }`}>
                              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {formatJson(log.data)}
                              </pre>
                            </div>

                            {log.rawResponse && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-semibold text-sm text-orange-700">📄 Resposta Bruta da IA:</h5>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(log.rawResponse || '')}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copiar Raw
                                  </Button>
                                </div>
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {log.rawResponse}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {logs.length === 0 && (
        <Card className="border-blue-200 bg-blue-50 mt-4">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              ℹ️ Sistema de Logs Ativo - CORRIGIDO
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="space-y-3">
              <p>
                <strong>✅ SISTEMA CORRIGIDO E ATIVO!</strong> Para ver os logs da IA, gere um novo treino.
              </p>
              <div className="bg-blue-100 p-3 rounded">
                <p className="font-semibold">🔧 MELHORIAS IMPLEMENTADAS:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Sistema de captura de logs totalmente reescrito</li>
                  <li>• Prompt otimizado para JSON válido</li>
                  <li>• Validação melhorada de exercícios</li>
                  <li>• IA decide quantidade de exercícios baseada no perfil</li>
                  <li>• Logs detalhados de prompt, resposta e erros</li>
                </ul>
              </div>
              <p className="text-center font-semibold">
                🚀 GERE UM TREINO NOVO PARA VER OS LOGS!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
