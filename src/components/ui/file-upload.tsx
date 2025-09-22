import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  currentFile?: File | null;
  onRemoveFile?: () => void;
}

export const FileUpload = ({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  className,
  disabled = false,
  currentFile,
  onRemoveFile
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return false;
    }

    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Tipo de arquivo não permitido. Tipos aceitos: ${accept}`);
      return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    if (validateFile(file)) {
      setUploadStatus('success');
      onFileSelect(file);
    } else {
      setUploadStatus('error');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setUploadStatus('idle');
    if (onRemoveFile) {
      onRemoveFile();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      {currentFile ? (
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <File className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{currentFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            uploadStatus === 'error' && "border-destructive bg-destructive/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "p-4 rounded-full",
              isDragOver ? "bg-primary/20" : "bg-muted/50"
            )}>
              <Upload className={cn(
                "w-8 h-8",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragOver 
                  ? "Solte o arquivo aqui" 
                  : "Clique ou arraste um arquivo aqui"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Tipos aceitos: {accept} (máx. {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};