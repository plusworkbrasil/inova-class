import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string;
  userId: string;
  userName: string;
  onAvatarChange?: (avatarUrl: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userId,
  userName,
  onAvatarChange,
  className,
  size = 'md'
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync previewUrl with currentAvatar when it changes
  React.useEffect(() => {
    setPreviewUrl(currentAvatar || null);
  }, [currentAvatar]);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      // Don't allow upload for temporary users
      if (userId.startsWith('temp-')) {
        throw new Error('Salve o usuário antes de fazer upload da foto');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB');
      }

      // Delete old avatar if exists
      if (currentAvatar) {
        const oldPath = currentAvatar.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onAvatarChange?.(publicUrl);

      toast({
        title: "Sucesso!",
        description: "Avatar atualizado com sucesso."
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao fazer upload do avatar"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      // Don't allow removal for temporary users
      if (userId.startsWith('temp-')) {
        throw new Error('Salve o usuário antes de remover a foto');
      }

      if (currentAvatar) {
        const path = currentAvatar.split('/').pop();
        if (path) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${path}`]);
        }
      }

      setPreviewUrl(null);
      onAvatarChange?.(null);

      toast({
        title: "Sucesso!",
        description: "Avatar removido com sucesso."
      });

    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover avatar"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], "border-2 border-border")}>
          <AvatarImage src={previewUrl || ''} alt={userName} />
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={uploading || userId.startsWith('temp-')}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          {previewUrl ? 'Alterar' : 'Adicionar'} Foto
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeAvatar}
            disabled={uploading || userId.startsWith('temp-')}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};