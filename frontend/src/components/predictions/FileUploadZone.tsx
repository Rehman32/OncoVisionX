"use client";

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { filesApi } from '@/lib/api/files';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  label: string;
  category: 'pathology' | 'radiology' | 'clinical' | 'genomic';
  accept: string;
  multiple?: boolean;
  onUploadComplete: (fileIds: string[]) => void;
}

export default function FileUploadZone({ 
  label, 
  category, 
  accept, 
  multiple = false,
  onUploadComplete 
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; id: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    const newFileIds: string[] = [];
    const newFileNames: { name: string; id: string }[] = [];

    try {
      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Call the chunked upload service
        const fileId = await filesApi.uploadFile(file, category, (pct:any) => {
          // Calculate overall progress across all files
          const overallProgress = Math.round(((i * 100) + pct) / files.length);
          setProgress(overallProgress);
        });

        newFileIds.push(fileId);
        newFileNames.push({ name: file.name, id: fileId });
      }

      setUploadedFiles(prev => [...prev, ...newFileNames]);
      onUploadComplete(newFileIds);
      toast.success(`${label} uploaded successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload ${label}`);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (idToRemove: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== idToRemove));
    // Note: In a real app, you might want to call a delete API here too
    // For now, we just remove it from the UI list so it's not submitted
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors text-center cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleUpload(e.target.files)}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-muted">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-muted-foreground uppercase">{accept.replace(/,/g, ', ')}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between text-xs">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="grid gap-2">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-card text-sm">
              <div className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 text-blue-500" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
