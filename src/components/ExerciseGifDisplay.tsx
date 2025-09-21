import React, { useState, useEffect } from 'react';
import { Youtube, Play, AlertCircle, RefreshCw, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { findExerciseGif } from '@/utils/gif';
interface ExerciseGifDisplayProps {
  exerciseName: string;
  videoKeywords?: string;
  className?: string;
}
export const ExerciseGifDisplay: React.FC<ExerciseGifDisplayProps> = ({
  exerciseName,
  videoKeywords,
  className = ""
}) => {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const loadGif = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      console.log(`🎬 Buscando GIF: "${exerciseName}"`);
      const foundUrl = await findExerciseGif(exerciseName);
      if (foundUrl) {
        console.log(`✅ GIF encontrado: ${foundUrl}`);
        setGifUrl(foundUrl);
        setHasError(false);
      } else {
        console.warn(`❌ GIF não encontrado: ${exerciseName}`);
        setGifUrl(null);
        setHasError(true);
      }
    } catch (error) {
      console.error('❌ Erro no sistema de GIFs:', error);
      setGifUrl(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (exerciseName?.trim()) {
      loadGif();
    }
  }, [exerciseName]);
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadGif();
  };
  const generateVideoSearchUrl = (keywords?: string) => {
    if (!keywords) return '#';
    const searchQuery = encodeURIComponent(`${keywords} exercício tutorial`);
    return `https://www.youtube.com/results?search_query=${searchQuery}`;
  };
  if (isLoading) {
    return <div className={`aspect-video bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Carregando demonstração...</p>
          <p className="text-gray-400 text-xs mt-1">"{exerciseName}"</p>
        </div>
      </div>;
  }
  if (gifUrl && !hasError) {
    return <Dialog>
        <DialogTrigger asChild>
          <div className={`aspect-video bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-transform ${className}`}>
            <img src={gifUrl} alt={`Demonstração do exercício: ${exerciseName}`} className="w-full h-full object-contain" onError={e => {
            console.error(`❌ Erro ao carregar imagem: ${gifUrl}`);
            setHasError(true);
          }} onLoad={() => {
            console.log(`✅ Imagem carregada: ${gifUrl}`);
          }} />
            
            {/* Overlay com ícone de expansão */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <Expand className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            
            {/* Overlay com informações */}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              ✅ Clique para expandir
            </div>
            
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl w-full p-4">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 text-center">{exerciseName}</h3>
            <div className="w-full max-h-[70vh] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              <img src={gifUrl} alt={`Demonstração expandida do exercício: ${exerciseName}`} className="max-w-full max-h-full object-contain" />
            </div>
            
            {/* Controles no modal */}
            <div className="flex gap-2 mt-4">
              
              
              <Button onClick={() => window.open(generateVideoSearchUrl(videoKeywords || exerciseName), '_blank')} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                <Youtube className="w-4 h-4 mr-2" />
                Ver no YouTube
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }

  // Fallback para quando GIF não é encontrado
  return <div className={`aspect-video bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center p-4">
        <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
        <p className="text-gray-600 text-sm mb-2">GIF não encontrado</p>
        
        
        <div className="flex flex-col gap-2">
          <Button onClick={handleRetry} variant="outline" size="sm" disabled={isLoading} className="text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar novamente {retryCount > 0 && `(${retryCount})`}
          </Button>
          
          <Button onClick={() => window.open(generateVideoSearchUrl(videoKeywords || exerciseName), '_blank')} className="bg-red-600 hover:bg-red-700 text-white text-xs" size="sm">
            <Youtube className="w-3 h-3 mr-1" />
            Ver no YouTube
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2">
          Busca: "{videoKeywords || exerciseName}"
        </p>
      </div>
    </div>;
};