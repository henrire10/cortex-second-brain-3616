
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Share2, MessageCircle, Instagram, Facebook, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateStoryImage, shareToInstagramStories, calculateMaxSpeed } from '@/utils/instagramStory';

interface Position {
  lat: number;
  lng: number;
  timestamp?: number;
}

interface ActivitySocialShareProps {
  stats: {
    distance: number;
    duration: number;
    averageSpeed: number;
    calories: number;
  };
  activityType: string;
  date: Date;
  route: Position[];
}

const ActivitySocialShare: React.FC<ActivitySocialShareProps> = ({ stats, activityType, date, route }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const createShareText = () => {
    const dateStr = date.toLocaleDateString('pt-BR');
    const maxSpeed = calculateMaxSpeed(route);
    
    return `🏃‍♂️ ${activityType} - ${dateStr}
    
📊 Estatísticas:
🏁 Distância: ${stats.distance.toFixed(2)} km
⏱️ Tempo: ${formatTime(stats.duration)}
⚡ Velocidade Média: ${stats.averageSpeed.toFixed(1)} km/h
🚀 Velocidade Máxima: ${maxSpeed.toFixed(1)} km/h
🔥 Calorias: ${stats.calories}

💪 Treino concluído com BetzaFit!
#BetzaFit #Corrida #Fitness #Saude`;
  };

  const shareToInstagram = async () => {
    if (route.length < 2) {
      toast({
        title: "Rota insuficiente",
        description: "É necessário um percurso com pelo menos 2 pontos para gerar o mapa.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      toast({
        title: "Gerando imagem...",
        description: "Criando sua imagem personalizada para o Stories"
      });

      const imageDataUrl = await generateStoryImage(route, stats, activityType, date);
      const shareText = createShareText();
      
      const result = await shareToInstagramStories(imageDataUrl, shareText);
      
      if (result.method === 'download') {
        toast({
          title: "Imagem baixada!",
          description: result.instructions || "Abra o Instagram e adicione aos Stories"
        });
      } else {
        toast({
          title: "Compartilhando...",
          description: "Abrindo opções de compartilhamento"
        });
      }
    } catch (error) {
      console.error('Error generating Instagram story:', error);
      toast({
        title: "Erro ao gerar imagem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(createShareText());
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    toast({
      title: "Compartilhando no WhatsApp",
      description: "Redirecionando para o WhatsApp..."
    });
  };

  const shareToFacebook = () => {
    const text = encodeURIComponent(createShareText());
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({
      title: "Compartilhando no Facebook",
      description: "Abrindo janela de compartilhamento..."
    });
  };

  const shareGeneric = async () => {
    const shareData = {
      title: `${activityType} - BetzaFit`,
      text: createShareText(),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Atividade compartilhada!",
          description: "Compartilhamento realizado com sucesso"
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(createShareText()).then(() => {
        toast({
          title: "Texto copiado!",
          description: "Cole onde quiser compartilhar"
        });
      });
    }
  };

  return (
    <Card className="p-4 bg-card border border-border">
      <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Compartilhar Atividade
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={shareToWhatsApp}
          className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={shareToInstagram}
          disabled={isGenerating}
          className="flex items-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50"
        >
          {isGenerating ? (
            <Download className="h-4 w-4 animate-spin" />
          ) : (
            <Instagram className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : 'Instagram Stories'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={shareToFacebook}
          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={shareGeneric}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Mais
        </Button>
      </div>
      
      {/* Preview do texto de compartilhamento */}
      <div className="mt-4 p-3 bg-muted rounded-md">
        <div className="text-xs text-muted-foreground mb-1">Preview:</div>
        <div className="text-xs text-card-foreground whitespace-pre-line">
          {createShareText().substring(0, 150)}...
        </div>
      </div>

      {route.length > 1 && (
        <div className="mt-2 text-xs text-muted-foreground">
          💡 O Instagram Stories incluirá o mapa do seu percurso com todas as estatísticas!
        </div>
      )}
    </Card>
  );
};

export default ActivitySocialShare;
