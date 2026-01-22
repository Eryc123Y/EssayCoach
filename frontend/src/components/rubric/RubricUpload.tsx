'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { uploadRubricPDF, RubricImportResponse } from '@/service/api/rubric';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, X, CloudUpload, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RubricUploadProps {
  onSuccess?: (response: RubricImportResponse) => void;
}

function InfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
        >
          <Info className='h-4 w-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' sideOffset={8} className='max-w-sm'>
        <div className='space-y-4'>
          <div>
            <h4 className='text-foreground mb-2 text-sm font-semibold'>
              AI Processing Workflow
            </h4>
            <div className='space-y-2 text-xs'>
              <p className='text-muted-foreground leading-relaxed'>
                Your PDF is processed through these steps:
              </p>
              <ol className='text-muted-foreground ml-4 list-decimal space-y-1.5'>
                <li>AI analyzes document structure</li>
                <li>Validates rubric format detection</li>
                <li>Extracts dimensions and scoring levels</li>
                <li>Auto-saves to your rubric library</li>
              </ol>
            </div>
          </div>

          <div className='border-border/50 border-t pt-3'>
            <h4 className='text-foreground mb-2 text-sm font-semibold'>
              File Requirements
            </h4>
            <div className='text-muted-foreground space-y-1.5 text-xs'>
              <p className='flex items-start gap-2'>
                <span className='font-medium'>•</span>
                PDF format only
              </p>
              <p className='flex items-start gap-2'>
                <span className='font-medium'>•</span>
                Maximum 10MB file size
              </p>
              <p className='flex items-start gap-2'>
                <span className='font-medium'>•</span>
                Valid rubric structure with dimensions
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RubricUpload({ onSuccess }: RubricUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rubricName, setRubricName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file';
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = useCallback(
    (selectedFile: File) => {
      const error = validateFile(selectedFile);
      if (error) {
        toast.error(error);
        return;
      }
      setFile(selectedFile);
      if (!rubricName) {
        setRubricName(selectedFile.name.replace('.pdf', ''));
      }
    },
    [rubricName, validateFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

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
        toast.success(
          `Rubric "${response.rubric_name}" imported successfully! (${response.items_count} items, ${response.levels_count} levels)`
        );

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
    <Card className='border-border/50 bg-background/60 overflow-hidden shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md'>
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'>
              <Upload className='h-5 w-5' />
            </div>
            <div>
              <CardTitle>Upload Rubric PDF</CardTitle>
              <CardDescription>AI-powered rubric extraction</CardDescription>
            </div>
          </div>
          <InfoPopover />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label
              htmlFor='rubric-name'
              className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
            >
              Rubric Name
            </Label>
            <Input
              id='rubric-name'
              type='text'
              placeholder='e.g., Argumentative Essay Rubric'
              value={rubricName}
              onChange={(e) => setRubricName(e.target.value)}
              disabled={isUploading}
              className='bg-background/50 border-border/50 focus:border-indigo-500/50 focus:ring-indigo-500/20'
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
              PDF File
            </Label>
            <AnimatePresence mode='wait'>
              {!file ? (
                <motion.div
                  key='dropzone'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 transition-all duration-300 ease-in-out',
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-border/60 bg-background/30 hover:bg-background/50 hover:border-indigo-500/50',
                    isUploading && 'pointer-events-none opacity-50'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    id='rubric-file'
                    type='file'
                    accept='.pdf'
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className='hidden'
                  />
                  <div className='flex flex-col items-center gap-3 text-center'>
                    <div
                      className={cn(
                        'rounded-full p-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30',
                        dragActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/40'
                          : 'bg-muted/50'
                      )}
                    >
                      <CloudUpload
                        className={cn(
                          'h-6 w-6 transition-colors duration-300',
                          dragActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        )}
                      />
                    </div>
                    <div>
                      <div className='text-foreground text-sm font-medium'>
                        <span className='text-indigo-600 dark:text-indigo-400'>
                          Click to upload
                        </span>{' '}
                        or drag PDF
                      </div>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Max size 10MB
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key='file-preview'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='flex items-center justify-between rounded-xl border border-indigo-100/50 bg-indigo-50/30 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10'
                >
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg bg-red-100 p-2.5 dark:bg-red-900/20'>
                      <FileText className='h-5 w-5 text-red-600 dark:text-red-400' />
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-foreground line-clamp-1 max-w-[180px] text-sm font-medium'>
                        {file.name}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                    className='text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            type='submit'
            disabled={!file || isUploading}
            className='h-11 w-full border-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700'
          >
            {isUploading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing Rubric...
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                Start AI Import
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
