
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, TestTube } from 'lucide-react';

interface WorkoutData {
  nome: string;
  dia_semana: string;
  nome_treino: string;
  grupo_muscular: string;
  duracao: string;
  intensidade: string;
  calorias: string;
  link: string;
}

export const WhatsAppMessageTester = () => {
  const [testing, setTesting] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');

  // Dados de exemplo baseados no formato fornecido
  const sampleData: WorkoutData = {
    nome: "João",
    dia_semana: "Segunda-feira",
    nome_treino: "Peito e Tríceps",
    grupo_muscular: "Corpo Superior",
    duracao: "60 minutos",
    intensidade: "Média",
    calorias: "300–420 calorias",
    link: "https://app.suaempresa.com/treino/hoje"
  };

  const generateWhatsAppMessage = (data: WorkoutData): string => {
    return `💪 Olá ${data.nome}! Seu treino de hoje está pronto:

📅 Dia: ${data.dia_semana}
🏋️‍♀️ Treino: ${data.nome_treino}
🔍 Foco: ${data.grupo_muscular}
🕒 Duração: ${data.duracao}
🔥 Intensidade: ${data.intensidade}
⚡ Calorias estimadas: ${data.calorias}

👉 Acesse seu treino aqui: ${data.link}

Bons treinos! 💥`;
  };

  const handleTestMessage = () => {
    setTesting(true);
    
    // Simular processamento
    setTimeout(() => {
      const message = generateWhatsAppMessage(sampleData);
      setGeneratedMessage(message);
      setTesting(false);
      
      toast({
        title: "Mensagem gerada com sucesso! 💬",
        description: "Confira a mensagem de WhatsApp formatada abaixo.",
      });
    }, 1000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast({
      title: "Copiado! 📋",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Teste de Mensagem WhatsApp
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gere e teste mensagens de treino formatadas para WhatsApp
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão de Teste */}
        <Button 
          onClick={handleTestMessage}
          disabled={testing}
          className="w-full"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {testing ? 'Gerando mensagem...' : 'Gerar Mensagem de Teste'}
        </Button>

        {/* Dados de Entrada */}
        <div className="space-y-2">
          <h4 className="font-medium">Dados de Entrada (Exemplo):</h4>
          <div className="bg-muted p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Nome:</strong> {sampleData.nome}</div>
              <div><strong>Dia:</strong> {sampleData.dia_semana}</div>
              <div><strong>Treino:</strong> {sampleData.nome_treino}</div>
              <div><strong>Foco:</strong> {sampleData.grupo_muscular}</div>
              <div><strong>Duração:</strong> {sampleData.duracao}</div>
              <div><strong>Intensidade:</strong> {sampleData.intensidade}</div>
              <div className="col-span-2"><strong>Calorias:</strong> {sampleData.calorias}</div>
            </div>
          </div>
        </div>

        {/* Mensagem Gerada */}
        {generatedMessage && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Mensagem Gerada:</h4>
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  📋 Copiar
                </Button>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generatedMessage}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Instruções */}
        <div className="space-y-2">
          <h4 className="font-medium">Como usar:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Clique em "Gerar Mensagem de Teste" para criar uma mensagem formatada</li>
            <li>• A mensagem seguirá o template especificado com emojis e formatação</li>
            <li>• Use o botão "Copiar" para usar a mensagem em outros locais</li>
            <li>• Este formato pode ser integrado com a função de envio de WhatsApp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
