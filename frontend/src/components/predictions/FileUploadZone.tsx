"use client";

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, File as FileIcon, X, AlertCircle, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

interface FileUploadZoneProps {
  label: string;
  accept: string;
  onFileSelect: (file: File | null) => void; 
}

export default function FileUploadZone({ 
  label, 
  accept, 
  onFileSelect 
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type. Only PNG, JPG, and JPEG are accepted.`;
    }
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreview(null);
      onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [validateFile, onFileSelect]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileSelect]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      
      {!selectedFile ? (
        <div>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/5 scale-[1.01]" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
              error && "border-destructive/50 bg-destructive/5"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              multiple={false}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "p-4 rounded-full transition-colors",
                isDragging ? "bg-primary/10" : "bg-muted"
              )}>
                <UploadCloud className={cn(
                  "h-8 w-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Click to select</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG • Max 10MB</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in-50 slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Image Preview */}
          {preview && (
            <div className="relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
              <img 
                src={preview} 
                alt="Dermoscopy preview" 
                className="max-h-64 rounded-lg object-contain shadow-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* File info bar */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="flex items-center gap-3 truncate">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-medium text-sm truncate max-w-[300px]">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
