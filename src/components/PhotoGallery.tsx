import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  date: string;
  photo_type: string;
  created_at: string;
}

interface PhotoGalleryProps {
  photos: ProgressPhoto[];
  selectedPhotos: string[];
  onPhotoSelect: (photoId: string) => void;
  onDeletePhoto: (photoId: string, photoUrl: string) => void;
  onDownloadPhoto: (photoUrl: string, date: string) => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  selectedPhotos,
  onPhotoSelect,
  onDeletePhoto,
  onDownloadPhoto,
  selectionMode,
  onToggleSelectionMode
}) => {
  const [imageFullscreen, setImageFullscreen] = useState<ProgressPhoto | null>(null);

  const handlePhotoClick = (photo: ProgressPhoto) => {
    if (selectionMode) {
      onPhotoSelect(photo.id);
      // Add haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      setImageFullscreen(photo);
    }
  };

  return (
    <>
      <Card className="border-border/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              📸 Galeria ({photos.length} fotos)
            </CardTitle>
            {photos.length > 0 && (
              <Button
                onClick={onToggleSelectionMode}
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                {selectionMode ? "Cancelar" : "Selecionar"}
              </Button>
            )}
          </div>
          {selectionMode && selectedPhotos.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedPhotos.length} foto(s) selecionada(s)
            </p>
          )}
        </CardHeader>
        
        <CardContent className="p-4">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">
                Nenhuma foto adicionada ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Faça o upload da sua primeira foto!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`
                    relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200
                    ${selectedPhotos.includes(photo.id) 
                      ? 'border-primary ring-2 ring-primary/20 scale-95' 
                      : 'border-transparent hover:border-primary/30'
                    }
                    ${selectionMode ? 'active:scale-95' : ''}
                  `}
                  onClick={() => handlePhotoClick(photo)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={photo.photo_url}
                      alt={`Progresso ${format(new Date(photo.date), 'dd/MM/yyyy', { locale: ptBR })}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Selection Indicator */}
                    {selectionMode && (
                      <div className="absolute top-2 right-2">
                        {selectedPhotos.includes(photo.id) ? (
                          <CheckCircle className="h-6 w-6 text-primary bg-background rounded-full" />
                        ) : (
                          <Circle className="h-6 w-6 text-white bg-black/30 rounded-full" />
                        )}
                      </div>
                    )}
                    
                    {/* Photo Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="text-xs bg-black/50 text-white px-2 py-1 rounded-full">
                        {photo.photo_type}
                      </span>
                    </div>
                    
                    {/* Action Buttons - Only visible when not in selection mode */}
                    {!selectionMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div />
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-white font-medium">
                            {format(new Date(photo.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadPhoto(photo.photo_url, photo.date);
                              }}
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePhoto(photo.id, photo.photo_url);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Image Modal */}
      {imageFullscreen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImageFullscreen(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={imageFullscreen.photo_url}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm font-medium">
                {format(new Date(imageFullscreen.date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-xs opacity-80">{imageFullscreen.photo_type}</p>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setImageFullscreen(null);
              }}
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
};