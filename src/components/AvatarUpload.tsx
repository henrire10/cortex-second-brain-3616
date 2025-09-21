
import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (url?: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  size = 'md'
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const validateFile = (file: File): boolean => {
    // Validação do tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ AVATAR: Tipo de arquivo inválido:', file.type);
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem JPEG, PNG ou WebP.',
        variant: 'destructive',
      });
      return false;
    }

    // Validação do tamanho
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('❌ AVATAR: Arquivo muito grande:', file.size);
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateImageResolution = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Verificar resolução mínima para qualidade
        const minWidth = 200;
        const minHeight = 200;
        
        if (img.width < minWidth || img.height < minHeight) {
          toast({
            title: 'Resolução baixa',
            description: `A imagem deve ter pelo menos ${minWidth}x${minHeight} pixels para melhor qualidade.`,
            variant: 'destructive',
          });
          resolve(false);
          return;
        }
        
        console.log('✅ AVATAR: Resolução validada:', { width: img.width, height: img.height });
        resolve(true);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        console.error('❌ AVATAR: Erro ao validar resolução da imagem');
        resolve(false);
      };
      
      img.src = url;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log('📂 AVATAR: Seleção de arquivo iniciada');
      event.preventDefault();
      event.stopPropagation();
      
      const file = event.target.files?.[0];
      if (!file) {
        console.log('📂 AVATAR: Nenhum arquivo selecionado');
        return;
      }

      console.log('📂 AVATAR: Arquivo selecionado:', { name: file.name, size: file.size, type: file.type });

      // Validações básicas
      if (!validateFile(file)) {
        return;
      }

      // Validação de resolução
      const resolutionValid = await validateImageResolution(file);
      if (!resolutionValid) {
        return;
      }

      console.log('✅ AVATAR: Arquivo válido, iniciando preview');

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('✅ AVATAR: Preview criado com sucesso');
        setPreviewUrl(e.target?.result as string);
      };
      reader.onerror = (e) => {
        console.error('❌ AVATAR: Erro ao criar preview:', e);
      };
      reader.readAsDataURL(file);

      // Upload do arquivo
      uploadAvatar(file);
    } catch (error) {
      console.error('❌ AVATAR: Erro crítico na seleção de arquivo:', error);
      toast({
        title: 'Erro na seleção',
        description: 'Erro inesperado ao selecionar arquivo.',
        variant: 'destructive',
      });
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      console.error('🚫 AVATAR: Usuário não encontrado');
      return;
    }

    console.log('📤 AVATAR: Iniciando upload para usuário:', user.id);
    console.log('📤 AVATAR: Arquivo:', { name: file.name, size: file.size, type: file.type });

    setUploading(true);
    try {
      // Criar nome único para o arquivo com timestamp para cache busting
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${user.id}/avatar_${timestamp}.${fileExt}`;
      
      console.log('📁 AVATAR: Nome do arquivo:', fileName);

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '0', // Disable caching for immediate updates
          upsert: false, // Create new file instead of overwriting
        });

      if (error) {
        console.error('❌ AVATAR: Erro no upload:', error);
        throw error;
      }

      console.log('✅ AVATAR: Upload realizado:', data);

      // Obter URL pública com cache busting
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;
      console.log('🔗 AVATAR: URL pública gerada:', avatarUrl);

      // Remover avatar anterior se existir
      if (currentAvatarUrl) {
        try {
          const oldFileName = currentAvatarUrl.split('/').pop()?.split('?')[0];
          if (oldFileName && oldFileName !== fileName) {
            await supabase.storage
              .from('avatars')
              .remove([`${user.id}/${oldFileName}`]);
            console.log('🗑️ AVATAR: Avatar anterior removido');
          }
        } catch (cleanupError) {
          console.warn('⚠️ AVATAR: Erro ao limpar avatar anterior:', cleanupError);
        }
      }

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ AVATAR: Erro ao atualizar perfil:', updateError);
        throw updateError;
      }

      console.log('✅ AVATAR: Perfil atualizado com sucesso');

      // Limpar preview após sucesso
      setTimeout(() => {
        setPreviewUrl(null);
      }, 500);

      // Chamar callback se fornecido
      if (onAvatarChange) {
        console.log('🔄 AVATAR: Chamando callback de atualização');
        onAvatarChange(avatarUrl);
      }

      toast({
        title: 'Foto atualizada! ✅',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      });

    } catch (error: any) {
      console.error('❌ AVATAR: Erro no upload do avatar:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível atualizar sua foto. Tente novamente.',
        variant: 'destructive',
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user?.id) return;

    setUploading(true);
    try {
      // Remover do perfil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setPreviewUrl(null);
      if (onAvatarChange) {
        onAvatarChange('');
      }

      toast({
        title: 'Foto removida',
        description: 'Sua foto de perfil foi removida.',
      });

    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a foto.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Usar preview apenas se estiver fazendo upload, caso contrário usar URL atual com cache busting
  const displayUrl = previewUrl || (currentAvatarUrl ? `${currentAvatarUrl}${currentAvatarUrl.includes('?') ? '&' : '?'}cb=${Date.now()}` : undefined);
  const userName = user?.email?.split('@')[0] || 'U';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={displayUrl} alt="Avatar" />
          <AvatarFallback>
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Botão de câmera sobreposto */}
        <Button
          size="sm"
          variant="secondary"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📷 AVATAR: Botão câmera clicado');
            if (fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              console.error('❌ AVATAR: FileInputRef não está disponível');
            }
          }}
          disabled={uploading}
        >
          <Camera className="h-4 w-4" />
        </Button>

        {/* Botão de remover se houver foto */}
        {displayUrl && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={removeAvatar}
            disabled={uploading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📤 AVATAR: Botão adicionar clicado');
            if (fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              console.error('❌ AVATAR: FileInputRef não está disponível');
            }
          }}
          disabled={uploading}
          className="text-xs"
        >
          <Upload className="mr-2 h-3 w-3" />
          {currentAvatarUrl ? 'Alterar' : 'Adicionar'}
        </Button>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading && (
        <p className="text-xs text-muted-foreground">
          Fazendo upload...
        </p>
      )}
    </div>
  );
};
