import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Copy, Eye, EyeOff, Trash2, RefreshCw, Download, Search, MessageSquare, Bot, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface AILogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'parse_error';
  endpoint: string;
  data: any;
  status?: number;
  error?: string;
  logType?: string;
}

export const DevAILogs: React.FC = () => {
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<AILogEntry[]>([]);

  // Função para adicionar log de forma mais robusta
  const addLog = (logEntry: AILogEntry) => {
    console.log('📝 ADICIONANDO LOG:', logEntry.type, logEntry.endpoint);
    setLogs(prevLogs => {
      const newLogs = [logEntry, ...prevLogs.slice(0, 99)];
      console.log('📊 Total de logs:', newLogs.length);
      return newLogs;
    });
  };

  // Interceptar requisições e logs de forma mais robusta
  useEffect(() => {
    if (!isCapturing) return;

    console.log('🚀 INICIANDO SISTEMA DE LOGS AVANÇADO');

    const originalFetch = window.fetch;
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    // Monitorar todas as requisições fetch
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlString = typeof url === 'string' ? url : url.toString();
      
      console.log('🌐 INTERCEPTANDO FETCH:', urlString);
      
      try {
        // Capturar requisições para geração de treino e OpenAI
        if (urlString.includes('generate-workout') || urlString.includes('openai.com')) {
          console.log('⚡ REQUISIÇÃO RELEVANTE DETECTADA:', urlString);
          
          // Log da requisição
          let requestData = null;
          try {
            if (options?.body) {
              requestData = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
            }
          } catch (e) {
            requestData = options?.body;
          }

          const requestLog: AILogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: 'request',
            endpoint: urlString,
            data: requestData
          };
          
          console.log('📤 ADICIONANDO LOG DE REQUEST');
          addLog(requestLog);
          
          try {
            const response = await originalFetch(...args);
            const responseClone = response.clone();
            
            let responseData;
            try {
              const responseText = await responseClone.text();
              try {
                responseData = JSON.parse(responseText);
              } catch {
                responseData = { rawText: responseText };
              }
            } catch {
              responseData = { error: 'Erro ao ler resposta' };
            }
            
            // Log da resposta
            const responseLog: AILogEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              type: response.ok ? 'response' : 'error',
              endpoint: urlString,
              data: responseData,
              status: response.status
            };
            
            console.log('📥 ADICIONANDO LOG DE RESPONSE:', response.status);
            addLog(responseLog);
            
            return response;
          } catch (networkError) {
            console.error('❌ ERRO DE REDE:', networkError);
            
            const errorLog: AILogEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              type: 'error',
              endpoint: urlString,
              data: { error: networkError.message },
              error: networkError.message
            };
            
            addLog(errorLog);
            throw networkError;
          }
        } else {
          // Para outras requisições, apenas fazer o fetch normal
          return originalFetch(...args);
        }
      } catch (interceptError) {
        console.error('❌ ERRO NO INTERCEPTOR:', interceptError);
        return originalFetch(...args);
      }
    };

    // Interceptar console.log para capturar logs estruturados da edge function
    console.log = (...args: any[]) => {
      originalConsoleLog.apply(console, args);
      
      try {
        const message = args[0];
        if (typeof message === 'string') {
          // Capturar logs estruturados da edge function
          if (message.includes('_LOG:')) {
            const parts = message.split('_LOG:');
            const logType = parts[0].trim();
            const logDataStr = parts[1];
            
            try {
              const logData = JSON.parse(logDataStr);
              const newLog: AILogEntry = {
                ...logData,
                id: logData.id || crypto.randomUUID(),
                timestamp: logData.timestamp || new Date().toISOString(),
                logType: logType.toLowerCase()
              };
              
              console.log('🔄 LOG ESTRUTURADO CAPTURADO:', newLog.type);
              addLog(newLog);
            } catch (parseError) {
              console.error('❌ Erro ao parsear log estruturado:', parseError);
            }
          }
          
          // Capturar logs específicos da geração de treino
          if (message.includes('Generating workout') || 
              message.includes('Raw workout plan') || 
              message.includes('Error parsing')) {
            const contextLog: AILogEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              type: message.includes('Error') ? 'error' : 'response',
              endpoint: '/functions/v1/generate-workout',
              data: { message, context: 'workout_generation' }
            };
            
            addLog(contextLog);
          }
        }
      } catch (error) {
        // Ignorar erros de parsing
      }
    };

    // Interceptar console.error
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      
      try {
        const message = args[0];
        if (typeof message === 'string') {
          if (message.includes('_LOG:')) {
            const parts = message.split('_LOG:');
            const logType = parts[0].trim();
            const logDataStr = parts[1];
            
            try {
              const logData = JSON.parse(logDataStr);
              const newLog: AILogEntry = {
                ...logData,
                id: logData.id || crypto.randomUUID(),
                timestamp: logData.timestamp || new Date().toISOString(),
                logType: logType.toLowerCase()
              };
              
              addLog(newLog);
            } catch (parseError) {
              console.error('❌ Erro ao parsear log de erro:', parseError);
            }
          } else {
            // Log genérico de erro
            const errorLog: AILogEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              type: 'error',
              endpoint: 'console',
              data: { error: message },
              error: message
            };
            
            addLog(errorLog);
          }
        }
      } catch (error) {
        // Ignorar erros de parsing
      }
    };

    console.log('✅ SISTEMA DE LOGS CONFIGURADO E ATIVO');

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      window.fetch = originalFetch;
      console.log('🛑 Sistema de logs desativado');
    };
  }, [isCapturing]);

  // Filtrar logs baseado no termo de busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(log => 
        JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [logs, searchTerm]);

  // Função para simular alguns logs de exemplo com prompt completo
  const addExampleLogs = () => {
    const fullSystemPrompt = `Você é um personal trainer expert especializado em criar treinos COMPLETOS para academia. SEMPRE gere EXATAMENTE 4 treinos com EXATAMENTE 8 exercícios cada. Responda APENAS JSON válido sem formatação markdown. Seja específico e detalhado.

REGRAS OBRIGATÓRIAS:
1. Criar treinos 100% personalizados usando APENAS equipamentos de academia
2. Definir quantidade ideal de exercícios baseada no perfil: Iniciantes (4-6), Intermediários (5-8), Avançados (6-10)
3. Para emagrecimento usar menos exercícios, para hipertrofia usar mais
4. SEMPRE explicar didaticamente o porquê das escolhas
5. Responder APENAS com JSON válido, sem formatação markdown`;

    const fullUserPrompt = `Você é um personal trainer expert. Crie um plano de treino semanal COMPLETO em JSON válido.

**PARÂMETROS OBRIGATÓRIOS:**
- Usuário: Intermediário, Ganhar massa muscular
- Criar EXATAMENTE 4 treinos
- Cada treino DEVE ter EXATAMENTE 8 exercícios
- Todos os exercícios devem ser únicos e específicos para academia

**PERFIL COMPLETO DO USUÁRIO:**
- Idade: 25 anos
- Gênero: masculino
- Peso: 59.9kg
- Altura: 160cm
- Objetivo Principal: Ganhar massa muscular
- Nível de Experiência: Intermediário
- Dias de Treino por Semana: 4 dias
- Exercícios por Sessão: 8 exercícios

**ESTRUTURA JSON OBRIGATÓRIA (responder APENAS JSON):**
{
  "weekNumber": 1,
  "goal": "Ganhar massa muscular",
  "difficulty": "Intermediário",
  "weeklyFrequency": "4 dias por semana",
  "sessionDuration": "60-75 minutos por sessão",
  "estimatedCalories": "1500-2000 calorias totais semanais",
  "aiRecommendation": "Plano criado especificamente para Intermediário com objetivo de ganhar massa muscular, incluindo 8 exercícios por sessão durante 4 dias semanais",
  "workoutDays": [
    {
      "day": 1,
      "title": "Nome do Treino específico",
      "focus": "Grupo muscular principal",
      "duration": "60-75 minutos",
      "intensity": "Baixa/Média/Alta",
      "estimatedCalories": "350-450 calorias",
      "exercises": [
        {
          "name": "Nome do exercício específico para academia",
          "sets": 3,
          "reps": "8-12",
          "rest": "90s",
          "weight": "peso em kg (ex: 40-60kg)",
          "muscleGroup": "Grupo muscular específico",
          "difficulty": "Intermediário",
          "instructions": "Instruções detalhadas de execução - mínimo 50 caracteres",
          "commonMistakes": "Erros comuns específicos deste exercício",
          "alternatives": "Exercícios alternativos válidos",
          "videoKeywords": "palavras-chave para busca de vídeo",
          "tips": "Dicas importantes e específicas"
        }
      ]
    }
  ],
  "weeklyTips": [
    "Dica específica para Ganhar massa muscular",
    "Dica para nível Intermediário",
    "Dica sobre recuperação e progressão"
  ]
}

**REGRAS CRÍTICAS:**
1. CRIAR todos os 4 treinos
2. CADA treino com 8 exercícios únicos
3. Exercícios específicos para academia com equipamentos
4. Pesos realistas em kg para cada exercício
5. Instruções detalhadas (mín. 50 caracteres cada)
6. Responder APENAS JSON válido, sem markdown

IMPORTANTE: Complete TODO o JSON com TODOS os treinos e exercícios!`;

    const exampleResponseData = {
      id: 'chatcmpl-example',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `{
  "weekNumber": 1,
  "goal": "Ganhar massa muscular",
  "difficulty": "Intermediário",
  "weeklyFrequency": "4 dias por semana",
  "sessionDuration": "60-75 minutos por sessão",
  "estimatedCalories": "1500-2000 calorias totais semanais",
  "aiRecommendation": "Como você escolheu treinar 4 dias por semana e é intermediário com objetivo de ganhar massa muscular, criei 8 exercícios por sessão. Essa frequência permite um excelente equilíbrio entre estímulo muscular e recuperação, maximizando a hipertrofia através de um volume adequado de exercícios que trabalham todos os grupos musculares de forma eficiente.",
  "workoutDays": [
    {
      "day": 1,
      "title": "Peito e Tríceps",
      "focus": "Parte superior do corpo",
      "duration": "60-75 minutos",
      "intensity": "Média",
      "estimatedCalories": "350-450 calorias",
      "exercises": [
        {
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "8-12",
          "rest": "90-120s",
          "weight": "60-80kg",
          "muscleGroup": "Peito",
          "difficulty": "Intermediário",
          "instructions": "Deite no banco com os pés firmes no chão. Posicione a barra na altura do peito, desça controladamente até quase tocar o peito e empurre explosivamente de volta à posição inicial.",
          "commonMistakes": "Não rebater no peito, evitar arquear excessivamente as costas, não travar completamente os cotovelos no topo",
          "alternatives": "Supino com halteres, Supino inclinado, Supino na máquina",
          "videoKeywords": "supino reto barra academia técnica",
          "tips": "Mantenha os pés firmes no chão e escápulas retraídas durante todo o movimento"
        },
        {
          "name": "Crucifixo com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rest": "60-90s",
          "weight": "20-30kg cada",
          "muscleGroup": "Peito",
          "difficulty": "Intermediário",
          "instructions": "Deite no banco, segure os halteres com braços ligeiramente flexionados, abra em arco até sentir alongamento no peito e retorne controladamente.",
          "commonMistakes": "Flexionar muito os cotovelos, descer muito rápido, usar peso excessivo",
          "alternatives": "Pec deck, Cross over, Crucifixo no cabo",
          "videoKeywords": "crucifixo halteres peito técnica",
          "tips": "Foque no alongamento e contração do peito, não nos braços"
        }
      ]
    }
  ],
  "weeklyTips": [
    "Foque em movimentos compostos para máximo ganho de massa muscular",
    "Para intermediários, varie a intensidade entre treinos",
    "Descanse adequadamente entre séries para manter a qualidade do treino"
  ]
}`
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 1250,
        completion_tokens: 1850,
        total_tokens: 3100
      }
    };

    const exampleLogs: AILogEntry[] = [
      {
        id: 'demo-1',
        timestamp: new Date().toISOString(),
        type: 'request',
        endpoint: '/functions/v1/generate-workout',
        data: {
          userProfile: { age: 25, gender: 'masculino', height: 160, weight: 59.9 },
          fitnessGoal: 'Ganhar massa muscular',
          experienceLevel: 'experiencia_intermediario'
        }
      },
      {
        id: 'demo-openai-request',
        timestamp: new Date(Date.now() - 500).toISOString(),
        type: 'request',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        data: {
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: fullSystemPrompt
            },
            { 
              role: 'user', 
              content: fullUserPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 16000,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }
      },
      {
        id: 'demo-openai-response',
        timestamp: new Date(Date.now() - 1000).toISOString(),
        type: 'response',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        data: exampleResponseData,
        status: 200
      },
      {
        id: 'demo-2',
        timestamp: new Date(Date.now() - 1500).toISOString(),
        type: 'response',
        endpoint: '/functions/v1/generate-workout',
        data: {
          success: true,
          workoutPlan: JSON.parse(exampleResponseData.choices[0].message.content)
        },
        status: 200
      }
    ];
    
    exampleLogs.forEach(log => addLog(log));
    toast.success('Logs de exemplo com prompts e respostas COMPLETAS adicionados!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
    toast.success('Logs limpos!');
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados!');
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const getLogBadgeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'response':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
      case 'parse_error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getEndpointName = (endpoint: string) => {
    if (endpoint.includes('openai.com')) return 'OpenAI API';
    if (endpoint.includes('generate-workout')) return 'Gerador de Treino';
    if (endpoint === 'console') return 'Console';
    return endpoint;
  };

  const getFilteredLogsByType = (type: string) => {
    if (type === 'all') return filteredLogs;
    return filteredLogs.filter(log => log.type === type);
  };

  // Extrair prompt COMPLETO da IA
  const extractFullAIPrompt = (log: AILogEntry) => {
    if (log.type === 'request' && log.endpoint.includes('openai.com') && log.data?.messages) {
      const systemMessage = log.data.messages.find((msg: any) => msg.role === 'system')?.content || '';
      const userMessage = log.data.messages.find((msg: any) => msg.role === 'user')?.content || '';
      
      return {
        systemPrompt: systemMessage,
        userPrompt: userMessage,
        fullConversation: log.data.messages,
        model: log.data.model,
        temperature: log.data.temperature,
        maxTokens: log.data.max_tokens
      };
    }
    return null;
  };

  // Extrair resposta COMPLETA da IA
  const extractFullAIResponse = (log: AILogEntry) => {
    if (log.type === 'response' && log.endpoint.includes('openai.com') && log.data?.choices) {
      return {
        fullContent: log.data.choices[0]?.message?.content || '',
        finishReason: log.data.choices[0]?.finish_reason,
        usage: log.data.usage,
        model: log.data.model,
        id: log.data.id,
        created: log.data.created
      };
    }
    return null;
  };

  // Extrair informações do treino
  const extractWorkoutInfo = (log: AILogEntry) => {
    if (log.type === 'response' && log.data?.workoutPlan?.workoutDays) {
      const workoutDays = log.data.workoutPlan.workoutDays;
      return {
        totalDays: workoutDays.length,
        goal: log.data.workoutPlan.goal,
        difficulty: log.data.workoutPlan.difficulty,
        exercisesPerDay: workoutDays.map((day: any, index: number) => ({
          day: index + 1,
          title: day.title,
          exerciseCount: day.exercises?.length || 0,
          exercises: day.exercises?.map((ex: any) => ex.name) || []
        }))
      };
    }
    return null;
  };

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">🔍 Logs Completos - IA & Prompts</h2>
        <p className="text-sm text-gray-600">Prompts COMPLETOS → Respostas COMPLETAS da IA → Validações</p>
        {isCapturing && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema ativo - Capturando TUDO sem limitações
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {filteredLogs.length} registros
          </Badge>
          <Badge 
            variant={isCapturing ? "default" : "secondary"} 
            className={`text-sm ${isCapturing ? 'bg-green-500' : ''}`}
          >
            {isCapturing ? '🟢 Capturando' : '⏸️ Pausado'}
          </Badge>
          {logs.length > 0 && (
            <Badge variant="outline" className="text-sm border-blue-500 text-blue-600">
              Último: {new Date(logs[0]?.timestamp).toLocaleTimeString('pt-BR')}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCapturing(!isCapturing)}
            >
              {isCapturing ? '⏸️ Pausar' : '▶️ Capturar'}
            </Button>
            
            {logs.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addExampleLogs}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Code className="w-4 h-4 mr-2" />
                Demo
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="prompts">📝 Prompts COMPLETOS</TabsTrigger>
          <TabsTrigger value="responses">🤖 Respostas COMPLETAS</TabsTrigger>
          <TabsTrigger value="all">Todos ({filteredLogs.length})</TabsTrigger>
          <TabsTrigger value="request">📤 Requests ({getFilteredLogsByType('request').length})</TabsTrigger>
          <TabsTrigger value="response">📥 Responses ({getFilteredLogsByType('response').length})</TabsTrigger>
          <TabsTrigger value="error">🚨 Erros ({getFilteredLogsByType('error').length + getFilteredLogsByType('parse_error').length})</TabsTrigger>
        </TabsList>

        {/* Nova aba específica para prompts COMPLETOS */}
        <TabsContent value="prompts" className="space-y-3">
          <ScrollArea className="h-[700px]">
            {(() => {
              const promptLogs = filteredLogs.filter(log => 
                log.type === 'request' && log.endpoint.includes('openai.com')
              );

              return promptLogs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="space-y-4">
                      <div className="text-4xl">📝</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Nenhum prompt capturado ainda</h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Gere um treino para ver os prompts COMPLETOS enviados para a IA
                        </p>
                      </div>
                      
                      {logs.length === 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <p className="text-sm text-purple-700 font-medium">
                              O que você verá aqui (SEM LIMITAÇÕES):
                            </p>
                          </div>
                          <ul className="text-sm text-purple-700 text-left list-disc list-inside space-y-1">
                            <li>Prompt do sistema COMPLETO (todas as instruções)</li>
                            <li>Prompt do usuário COMPLETO (dados e regras específicas)</li>
                            <li>Estrutura JSON COMPLETA exigida</li>
                            <li>Parâmetros detalhados da requisição</li>
                          </ul>
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        onClick={addExampleLogs}
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Ver Exemplo com Prompts Completos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                promptLogs.map((log, index) => {
                  const promptData = extractFullAIPrompt(log);
                  
                  if (!promptData) return null;
                  
                  return (
                    <Card key={log.id} className="mb-4 border-purple-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <span className="font-semibold">Prompt COMPLETO #{index + 1}</span>
                            <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">
                              {promptData.model}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(`prompt-${log.id}`)}
                          >
                            {expandedLog === `prompt-${log.id}` ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Preview COMPLETO do Prompt do Sistema */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-blue-800">Prompt do Sistema COMPLETO:</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(promptData.systemPrompt)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-blue-700 bg-white p-3 rounded border max-h-40 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {promptData.systemPrompt || 'Não definido'}
                            </pre>
                          </div>
                        </div>

                        {/* Preview COMPLETO do Prompt do Usuário */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-800">Prompt Principal COMPLETO:</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(promptData.userPrompt)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-green-700 bg-white p-3 rounded border max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {promptData.userPrompt || 'Não definido'}
                            </pre>
                          </div>
                        </div>

                        {/* Parâmetros da Requisição */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h5 className="font-semibold text-purple-800 mb-2">⚙️ Parâmetros da Requisição:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white p-2 rounded border">
                              <strong>Modelo:</strong> {promptData.model}
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <strong>Temperatura:</strong> {promptData.temperature}
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <strong>Max Tokens:</strong> {promptData.maxTokens}
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <strong>Mensagens:</strong> {promptData.fullConversation?.length || 0}
                            </div>
                          </div>
                        </div>

                        {/* Detalhes completos quando expandido */}
                        {expandedLog === `prompt-${log.id}` && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-sm">📋 Conversação COMPLETA (JSON):</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(formatJson(promptData.fullConversation))}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Tudo
                              </Button>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto bg-white p-3 rounded border">
                                {formatJson(promptData.fullConversation)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              );
            })()}
          </ScrollArea>
        </TabsContent>

        {/* Nova aba para respostas COMPLETAS da IA */}
        <TabsContent value="responses" className="space-y-3">
          <ScrollArea className="h-[700px]">
            {(() => {
              const responseLogs = filteredLogs.filter(log => 
                log.type === 'response' && log.endpoint.includes('openai.com')
              );

              return responseLogs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="space-y-4">
                      <div className="text-4xl">🤖</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Nenhuma resposta da IA capturada</h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Gere um treino para ver as respostas COMPLETAS da IA
                        </p>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={addExampleLogs}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Ver Exemplo com Respostas Completas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                responseLogs.map((log, index) => {
                  const responseData = extractFullAIResponse(log);
                  
                  if (!responseData) return null;
                  
                  return (
                    <Card key={log.id} className="mb-4 border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-green-500" />
                            <span className="font-semibold">Resposta COMPLETA da IA #{index + 1}</span>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                              {responseData.model}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(`response-${log.id}`)}
                          >
                            {expandedLog === `response-${log.id}` ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Preview da resposta */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-green-800">Conteúdo COMPLETO da Resposta:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(responseData.fullContent)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-green-700 bg-white p-3 rounded border max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {responseData.fullContent.length > 500 && expandedLog !== `response-${log.id}` ?
                                `${responseData.fullContent.substring(0, 500)}...\n\n[Clique no olho para ver TUDO]` :
                                responseData.fullContent
                              }
                            </pre>
                          </div>
                        </div>

                        {/* Informações de uso */}
                        {responseData.usage && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h5 className="font-semibold text-sm text-purple-800 mb-2">💰 Uso de Tokens:</h5>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-white p-2 rounded border">
                                <span className="text-purple-600">Prompt:</span>
                                <span className="ml-1 font-mono font-bold">{responseData.usage.prompt_tokens}</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="text-purple-600">Resposta:</span>
                                <span className="ml-1 font-mono font-bold">{responseData.usage.completion_tokens}</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="text-purple-600">Total:</span>
                                <span className="ml-1 font-mono font-bold">{responseData.usage.total_tokens}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detalhes técnicos */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="font-semibold text-sm text-gray-800 mb-2">🔧 Detalhes Técnicos:</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded border">
                              <strong>ID:</strong> {responseData.id}
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <strong>Finish Reason:</strong> {responseData.finishReason}
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <strong>Created:</strong> {new Date(responseData.created * 1000).toLocaleString()}
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <strong>Tamanho:</strong> {responseData.fullContent.length} chars
                            </div>
                          </div>
                        </div>

                        {/* Resposta completa quando expandido */}
                        {expandedLog === `response-${log.id}` && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-sm">📄 Resposta RAW COMPLETA:</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(formatJson(log.data))}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar RAW
                              </Button>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto bg-white p-3 rounded border">
                                {formatJson(log.data)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              );
            })()}
          </ScrollArea>
        </TabsContent>

        {/* Outras abas existentes mantidas */}
        {['all', 'request', 'response', 'error'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-3">
            <ScrollArea className="h-[600px]">
              {(() => {
                let logsToShow = getFilteredLogsByType(tabValue === 'all' ? 'all' : tabValue);
                
                if (tabValue === 'error') {
                  logsToShow = filteredLogs.filter(log => log.type === 'error' || log.type === 'parse_error');
                }
                
                return logsToShow.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="space-y-4">
                        <div className="text-4xl">
                          {tabValue === 'error' ? '✅' : '📋'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700">
                            {tabValue === 'error' ? 'Nenhum erro registrado' : 'Nenhum log encontrado'}
                          </h3>
                          {searchTerm && (
                            <p className="text-sm text-gray-500 mt-2">
                              Busca por: "{searchTerm}"
                            </p>
                          )}
                          {isCapturing && !searchTerm && (
                            <p className="text-sm text-blue-600 mt-2 font-medium">
                              📡 Sistema ativo - Gere um treino para ver os logs
                            </p>
                          )}
                        </div>
                        
                        {logs.length === 0 && tabValue === 'all' && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <p className="text-sm text-amber-700 font-medium">
                                Nenhum log capturado ainda
                              </p>
                            </div>
                            <p className="text-sm text-amber-700">
                              Clique em "Demo" para adicionar logs de exemplo, ou gere um treino para ver logs reais.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  logsToShow.map((log) => {
                    const workoutInfo = extractWorkoutInfo(log);
                    
                    return (
                      <Card key={log.id} className="mb-3">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getLogBadgeColor(log.type)} text-white`}>
                                {log.type.toUpperCase()}
                              </Badge>
                              
                              <Badge variant="outline" className="text-xs">
                                {getEndpointName(log.endpoint)}
                              </Badge>
                              
                              {log.status && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${log.status >= 400 ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}`}
                                >
                                  {log.status}
                                </Badge>
                              )}
                              
                              {workoutInfo && (
                                <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">
                                  {workoutInfo.totalDays} dias • {workoutInfo.exercisesPerDay.reduce((total, day) => total + day.exerciseCount, 0)} exercícios
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
                            <div className="text-sm text-red-600 font-medium bg-red-100 p-2 rounded mt-2">
                              🚨 {log.error}
                            </div>
                          )}
                        </CardHeader>
                        
                        {/* Preview para treinos gerados */}
                        {workoutInfo && (
                          <CardContent className="pt-0 pb-2">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <h5 className="font-semibold text-sm text-purple-800 mb-2">
                                🏋️ Treino: {workoutInfo.goal} - {workoutInfo.difficulty}
                              </h5>
                              <div className="grid grid-cols-1 gap-2 text-xs">
                                {workoutInfo.exercisesPerDay.map((day) => (
                                  <div key={day.day} className="bg-white p-2 rounded border">
                                    <div className="font-medium text-purple-700">
                                      Dia {day.day}: {day.title} ({day.exerciseCount} exercícios)
                                    </div>
                                    <div className="text-purple-600 mt-1">
                                      {day.exercises.slice(0, 3).join(', ')}
                                      {day.exercises.length > 3 && ` + ${day.exercises.length - 3} outros...`}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                        
                        {expandedLog === log.id && (
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm">Dados Completos:</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(formatJson(log.data))}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar
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
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                );
              })()}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Status do sistema */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          {isCapturing ? 
            '🟢 Monitoramento COMPLETO ativo - Capturando prompts e respostas SEM limitações' : 
            '⏸️ Monitoramento pausado - Clique em "Capturar" para reativar'
          }
        </p>
      </div>
    </div>
  );
};
