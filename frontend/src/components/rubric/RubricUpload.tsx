'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadRubricPDF, RubricImportResponse } from '@/service/api/rubric';
import { toast } from 'sonner';
import { IconUpload, IconLoader2, IconFile, IconX } from '@tabler/icons-react';

interface RubricUploadProps {
  onSuccess?: (response: RubricImportResponse) => void;
}

export function RubricUpload({ onSuccess }: RubricUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rubricName, setRubricName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      e.target.value = ''; // Reset input
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    // Reset the file input
    const fileInput = document.getElementById('rubric-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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
        const fileInput = document.getElementById('rubric-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
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
    <Card>
      <CardHeader>
        <CardTitle>Upload Rubric PDF</CardTitle>
        <CardDescription>
          Upload a PDF rubric for AI-powered parsing and import. The system will automatically extract dimensions, weights, and scoring levels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rubric-name">Rubric Name (Optional)</Label>
            <Input
              id="rubric-name"
              type="text"
              placeholder="Leave blank to use name from PDF"
              value={rubricName}
              onChange={(e) => setRubricName(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rubric-file">PDF File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="rubric-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
            </div>
            {file && (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <IconFile className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading and processing...
              </>
            ) : (
              <>
                <IconUpload className="mr-2 h-4 w-4" />
                Upload Rubric
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
