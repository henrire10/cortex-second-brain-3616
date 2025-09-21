import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MobileHeader } from '@/components/MobileHeader';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PhotoGallery } from '@/components/PhotoGallery';
import { PhotoCollageCreator } from '@/components/PhotoCollageCreator';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  date: string;
  photo_type: string;
  created_at: string;
}

export default function PhotoEvolution() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [photoType, setPhotoType] = useState<string>('front');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      toast({
        title: "Erro ao carregar fotos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Salvar no banco de dados
      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          date: new Date(selectedDate).toISOString(),
          photo_type: photoType
        });

      if (dbError) throw dbError;

      toast({
        title: "Foto salva com sucesso! 📸",
        description: "Sua foto de progresso foi adicionada à galeria.",
      });

      // Resetar formulário
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setPhotoType('front');
      
      // Atualizar lista de fotos
      fetchPhotos();

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao salvar foto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extrair nome do arquivo da URL
      const fileName = photoUrl.split('/').pop();
      if (fileName) {
        // Deletar do storage
        await supabase.storage
          .from('progress-photos')
          .remove([fileName]);
      }

      // Deletar do banco
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Foto removida",
        description: "A foto foi removida da sua galeria.",
      });

      fetchPhotos();
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      toast({
        title: "Erro ao remover foto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedPhotos([]);
    }
  };

  const clearSelection = () => {
    setSelectedPhotos([]);
    setSelectionMode(false);
  };

  const downloadPhoto = (photoUrl: string, date: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `progresso-${date}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader
        onMenuToggle={() => {}}
        onBack={() => navigate('/dashboard')}
        title="Fotos de Progresso"
        showBackButton={true}
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6 md:pt-8">
        {/* Desktop Header */}
        <div className="text-center hidden md:block">
          <h1 className="text-3xl font-bold gradient-text">📸 Fotos de Progresso</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe sua transformação através de fotos
          </p>
        </div>

        {/* Photo Upload */}
        <PhotoUpload
          selectedDate={selectedDate}
          photoType={photoType}
          onDateChange={setSelectedDate}
          onTypeChange={setPhotoType}
          onUpload={uploadPhoto}
          isUploading={isUploading}
        />

        {/* Collage Creator */}
        <PhotoCollageCreator
          photos={photos}
          selectedPhotos={selectedPhotos}
          onClearSelection={clearSelection}
        />

        {/* Photo Gallery */}
        <PhotoGallery
          photos={photos}
          selectedPhotos={selectedPhotos}
          onPhotoSelect={togglePhotoSelection}
          onDeletePhoto={deletePhoto}
          onDownloadPhoto={downloadPhoto}
          selectionMode={selectionMode}
          onToggleSelectionMode={toggleSelectionMode}
        />
      </div>
    </div>
  );
}