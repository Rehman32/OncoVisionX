"use client";

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  label: string;
  accept: string;
  // Passing the single selected file to the parent (which controls mutation flow state)
  onFileSelect: (file: File | null) => void; 
}

export default function FileUploadZone({ 
  label, 
  accept, 
  onFileSelect 
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Grab only the first file
    const file = files[0];
    setSelectedFile(file);
    onFileSelect(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      
      {!selectedFile ? (
        <div
            className={cn(
            "border-2 border-dashed rounded-lg p-6 transition-colors text-center cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
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
            multiple={false} // Force single file
            onChange={(e) => handleFileSelect(e.target.files)}
            />
            
            <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-muted">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm">
                <span className="font-semibold text-primary">Click to select</span> or drag and drop
            </div>
            <p className="text-xs text-muted-foreground uppercase">{accept.replace(/,/g, ', ')}</p>
            </div>
        </div>
      ) : (
          <div className="flex items-center justify-between p-4 border rounded-md bg-card text-sm">
              <div className="flex items-center gap-2 truncate">
              <FileIcon className="h-5 w-5 text-blue-500" />
              <div className="flex flex-col truncate">
                  <span className="font-medium truncate max-w-[250px]">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              </div>
              <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
              }}
              >
              <X className="h-5 w-5" />
              </Button>
          </div>
      )}
    </div>
  );
}
