import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  selectedDate: string;
  photoType: string;
  onDateChange: (date: string) => void;
  onTypeChange: (type: string) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  selectedDate,
  photoType,
  onDateChange,
  onTypeChange,
  onUpload,
  isUploading
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas imagens.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await onUpload(selectedFile);
      clearSelection();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Card className="border-border/20">
      <CardContent className="p-4 space-y-4">
        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'}
            ${selectedFile ? 'border-solid border-primary' : ''}
            hover:border-primary/50 hover:bg-primary/5
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-w-48 mx-auto rounded-lg object-cover"
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Toque para selecionar foto</p>
                <p className="text-xs text-muted-foreground">
                  ou arraste e solte aqui
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="photo-date" className="text-sm font-medium">
              Data da Foto
            </Label>
            <Input
              id="photo-date"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="photo-type" className="text-sm font-medium">
              Tipo de Foto
            </Label>
            <select
              id="photo-type"
              value={photoType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full mt-1 p-2 border border-border rounded-md bg-background"
            >
              <option value="front">Frontal</option>
              <option value="side">Lateral</option>
              <option value="back">Costas</option>
            </select>
          </div>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="w-full h-12"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Salvar Foto
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};