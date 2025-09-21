import React from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Normaliza o nome do exercício para corresponder ao padrão dos arquivos GIF
 * @param exerciseName Nome do exercício (ex: "Supino Inclinado com Halteres")
 * @returns Nome do arquivo normalizado (ex: "supino-inclinado-com-halteres.gif")
 */
export function getGifFileName(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .trim()
    // Remover acentos e caracteres especiais
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Substituir espaços e caracteres especiais por hífens
    .replace(/[^a-z0-9]+/g, '-')
    // Remover hífens duplos ou no início/fim
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    + '.gif';
}

/**
 * Busca a URL pública do GIF do exercício no Supabase Storage
 * @param exerciseName Nome do exercício
 * @returns URL pública do GIF ou null se não encontrado
 */
export async function getExerciseGifUrl(exerciseName: string): Promise<string | null> {
  try {
    const fileName = getGifFileName(exerciseName);
    console.log(`🎬 Buscando GIF para exercício: "${exerciseName}" -> arquivo: "${fileName}"`);
    
    // Verificar se o arquivo existe no bucket 'exercise-media'
    const { data: fileData, error: listError } = await supabase.storage
      .from('exercise-media')
      .list('', {
        limit: 1,
        search: fileName
      });

    if (listError) {
      console.error('❌ Erro ao listar arquivos no storage:', listError);
      return null;
    }

    if (!fileData || fileData.length === 0) {
      console.warn(`⚠️ GIF não encontrado: ${fileName}`);
      return null;
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('exercise-media')
      .getPublicUrl(fileName);

    if (urlData?.publicUrl) {
      console.log(`✅ GIF encontrado: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar GIF do exercício:', error);
    return null;
  }
}

/**
 * URL da imagem de fallback para quando não encontrar o GIF
 */
export const EXERCISE_FALLBACK_IMAGE = '/lovable-uploads/exercise-placeholder.png';

/**
 * Hook personalizado para buscar GIF do exercício com cache
 */
export function useExerciseGif(exerciseName: string) {
  const [gifUrl, setGifUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchGif = async () => {
      if (!exerciseName?.trim()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const url = await getExerciseGifUrl(exerciseName);
        
        if (isMounted) {
          setGifUrl(url);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar GIF');
          setLoading(false);
        }
      }
    };

    fetchGif();

    return () => {
      isMounted = false;
    };
  }, [exerciseName]);

  return { gifUrl, loading, error };
}

// Cache simples para evitar requisições desnecessárias
const gifUrlCache = new Map<string, string | null>();

/**
 * Versão com cache da função getExerciseGifUrl
 */
export async function getCachedExerciseGifUrl(exerciseName: string): Promise<string | null> {
  const cacheKey = exerciseName.toLowerCase().trim();
  
  if (gifUrlCache.has(cacheKey)) {
    return gifUrlCache.get(cacheKey) || null;
  }

  const url = await getExerciseGifUrl(exerciseName);
  gifUrlCache.set(cacheKey, url);
  
  return url;
}