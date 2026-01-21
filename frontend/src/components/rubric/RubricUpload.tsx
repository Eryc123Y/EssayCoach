'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadRubricPDF, RubricImportResponse } from '@/service/api/rubric';
import { toast } from 'sonner';
import { IconUpload, IconLoader2, IconFile, IconX, IconCloudUpload } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RubricUploadProps {
  onSuccess?: (response: RubricImportResponse) => void;
}

export function RubricUpload({ onSuccess }: RubricUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rubricName, setRubricName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file';
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(selectedFile);
    // Auto-fill name if empty
    if (!rubricName) {
      setRubricName(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [rubricName]);

  const handleRemoveFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadRubricPDF(file, rubricName || undefined);

      if (response.success) {
        toast.success(`Rubric "${response.rubric_name}" imported successfully! (${response.items_count} items, ${response.levels_count} levels)`);
        
        // Reset form
        setFile(null);
        setRubricName('');
        if (inputRef.current) {
          inputRef.current.value = '';
        }

        onSuccess?.(response);
      } else {
        toast.error(response.error || 'Failed to import rubric');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload rubric');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUpload className="h-5 w-5 text-primary" />
          Upload Rubric PDF
        </CardTitle>
        <CardDescription>
          Drag and drop a PDF rubric for AI-powered parsing. We'll automatically extract dimensions and scoring levels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rubric-name">Rubric Name (Optional)</Label>
            <Input
              id="rubric-name"
              type="text"
              placeholder="e.g., Argumentative Essay Rubric"
              value={rubricName}
              onChange={(e) => setRubricName(e.target.value)}
              disabled={isUploading}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>PDF File</Label>
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200 ease-in-out cursor-pointer",
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25",
                    isUploading && "pointer-events-none opacity-50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    id="rubric-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="rounded-full bg-primary/10 p-4">
                      <IconCloudUpload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-primary">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF (max. 10MB)
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="file-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card border-primary/20 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-red-100 p-2 dark:bg-red-900/20">
                      <IconFile className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium line-clamp-1 max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <IconX className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            type="submit"
            disabled={!file || isUploading}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300"
          >
            {isUploading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is analyzing your rubric...
              </>
            ) : (
              <>
                <IconUpload className="mr-2 h-4 w-4" />
                Start AI Import
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
