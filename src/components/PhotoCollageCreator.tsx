import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Download, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  date: string;
  photo_type: string;
  created_at: string;
}

interface PhotoCollageCreatorProps {
  photos: ProgressPhoto[];
  selectedPhotos: string[];
  onClearSelection: () => void;
}

export const PhotoCollageCreator: React.FC<PhotoCollageCreatorProps> = ({
  photos,
  selectedPhotos,
  onClearSelection
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);

  const selectedPhotoData = photos.filter(photo => selectedPhotos.includes(photo.id));

  const createCollage = async () => {
    if (selectedPhotos.length < 2) {
      toast({
        title: "Selecione pelo menos 2 fotos",
        description: "Para criar uma collage, você precisa selecionar pelo menos 2 fotos.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Sort photos by date
      const sortedPhotos = selectedPhotoData.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      // Canvas dimensions
      const canvasWidth = 800;
      const canvasHeight = 600;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Load and draw images
      const imagePromises = sortedPhotos.map((photo, index) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const numPhotos = sortedPhotos.length;
            const photosPerRow = Math.ceil(Math.sqrt(numPhotos));
            const photoWidth = canvasWidth / photosPerRow;
            const photoHeight = canvasHeight / Math.ceil(numPhotos / photosPerRow);
            
            const row = Math.floor(index / photosPerRow);
            const col = index % photosPerRow;
            
            const x = col * photoWidth;
            const y = row * photoHeight;
            
            // Draw image with padding
            const padding = 5;
            ctx.drawImage(
              img, 
              x + padding, 
              y + padding, 
              photoWidth - (padding * 2), 
              photoHeight - (padding * 2)
            );
            
            // Add date label
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(
              format(new Date(photo.date), 'dd/MM/yyyy', { locale: ptBR }),
              x + padding + 10,
              y + padding + 25
            );
            
            resolve();
          };
          img.onerror = reject;
          img.src = photo.photo_url;
        });
      });

      await Promise.all(imagePromises);

      // Add title
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Minha Evolução',
        canvasWidth / 2,
        50
      );

      // Add subtitle
      ctx.font = '18px Arial';
      ctx.fillText(
        `${format(new Date(sortedPhotos[0].date), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(sortedPhotos[sortedPhotos.length - 1].date), 'dd/MM/yyyy', { locale: ptBR })}`,
        canvasWidth / 2,
        canvasHeight - 30
      );

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCollageUrl(url);
          
          toast({
            title: "Collage criada com sucesso! 🎉",
            description: `Sua collage com ${selectedPhotos.length} fotos está pronta!`,
          });
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Erro ao criar collage:', error);
      toast({
        title: "Erro ao criar collage",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const downloadCollage = () => {
    if (!collageUrl) return;
    
    const link = document.createElement('a');
    link.href = collageUrl;
    link.download = `evolucao-${format(new Date(), 'yyyy-MM-dd')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(collageUrl);
    setCollageUrl(null);
    onClearSelection();
  };

  if (selectedPhotos.length === 0) return null;

  return (
    <Card className="border-border/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Criar Collage da Evolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {selectedPhotos.length} foto(s) selecionada(s) para a collage
        </div>
        
        {/* Selected photos preview */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {selectedPhotoData.map((photo) => (
            <div key={photo.id} className="flex-shrink-0">
              <img
                src={photo.photo_url}
                alt={photo.date}
                className="w-16 h-16 object-cover rounded border-2 border-primary"
              />
              <p className="text-xs text-center mt-1">
                {format(new Date(photo.date), 'dd/MM', { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>

        {collageUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">
              ✅ Collage criada com sucesso!
            </p>
            <img
              src={collageUrl}
              alt="Collage preview"
              className="w-full max-w-md mx-auto rounded-lg border"
            />
          </div>
        )}

        <div className="flex gap-2">
          {!collageUrl ? (
            <Button
              onClick={createCollage}
              disabled={selectedPhotos.length < 2 || isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Criar Collage
                </>
              )}
            </Button>
          ) : (
            <Button onClick={downloadCollage} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Baixar Collage
            </Button>
          )}
          
          <Button
            onClick={onClearSelection}
            variant="outline"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};