
import { supabase } from '@/integrations/supabase/client';

// Cache para arquivos disponíveis no storage
let availableGifs: string[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

/**
 * Lista todos os GIFs disponíveis no storage do Supabase
 */
export const listAvailableGifs = async (): Promise<string[]> => {
  const now = Date.now();
  
  // Usar cache se ainda válido
  if (availableGifs.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    console.log('🚀 Usando cache de GIFs disponíveis:', availableGifs.length, 'arquivos');
    return availableGifs;
  }
  
  try {
    console.log('🔍 Buscando GIFs disponíveis no storage...');
    
    const { data, error } = await supabase.storage
      .from('exercise-media')
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error('❌ Erro ao listar GIFs:', error);
      return availableGifs; // Retorna cache antigo em caso de erro
    }
    
    // Filtrar apenas arquivos .gif
    const gifFiles = data
      ?.filter(file => file.name.toLowerCase().endsWith('.gif'))
      ?.map(file => file.name.replace('.gif', '')) || [];
    
    availableGifs = gifFiles;
    lastFetchTime = now;
    
    console.log('✅ GIFs encontrados no storage:', gifFiles.length);
    console.log('📁 Arquivos:', gifFiles.slice(0, 10), gifFiles.length > 10 ? '...' : '');
    
    return gifFiles;
  } catch (error) {
    console.error('❌ Erro inesperado ao listar GIFs:', error);
    return availableGifs; // Retorna cache antigo
  }
};

/**
 * Verifica se um GIF específico existe no storage
 */
export const checkGifExists = async (fileName: string): Promise<boolean> => {
  try {
    const { data } = supabase.storage
      .from('exercise-media')
      .getPublicUrl(`${fileName}.gif`);
    
    const response = await fetch(data.publicUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Obtém a URL pública de um GIF
 */
export const getGifPublicUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from('exercise-media')
    .getPublicUrl(`${fileName}.gif`);
  
  return data.publicUrl;
};

/**
 * Força atualização do cache de GIFs
 */
export const refreshGifCache = async (): Promise<string[]> => {
  availableGifs = [];
  lastFetchTime = 0;
  return await listAvailableGifs();
};
