import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useSupabaseStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (
    file: File, 
    bucket: string, 
    folder?: string
  ): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Create file path with user ID folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder 
        ? `${user.id}/${folder}/${fileName}`
        : `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Arquivo enviado com sucesso."
      });

      return data.path;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Erro ao enviar arquivo."
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (
    bucket: string, 
    path: string
  ): Promise<Blob | null> => {
    try {
      setDownloading(true);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: error.message || "Erro ao baixar arquivo."
      });
      return null;
    } finally {
      setDownloading(false);
    }
  };

  const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Arquivo removido com sucesso."
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao remover arquivo."
      });
      return false;
    }
  };

  return {
    uploadFile,
    downloadFile,
    getPublicUrl,
    deleteFile,
    uploading,
    downloading
  };
};