'use client';

import { useCallback, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { FeedbackPDFDocument, FeedbackPDFData } from '../components/feedback-pdf';

export interface UseExportPDFOptions {
  /** 文件名（不含扩展名） */
  filename?: string;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 失败回调 */
  onError?: (error: Error) => void;
}

export interface UseExportPDFReturn {
  /** 是否正在生成 PDF */
  isGenerating: boolean;
  /** 生成 PDF 的函数 */
  generatePDF: (data: FeedbackPDFData, options?: UseExportPDFOptions) => Promise<void>;
  /** 生成 PDF Blob */
  generatePDFBlob: (data: FeedbackPDFData) => Promise<Blob>;
  /** 错误状态 */
  error: Error | null;
}

/**
 * Hook for generating and downloading PDF feedback reports
 */
export function useExportPDF(): UseExportPDFReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate PDF as Blob (for advanced usage)
   */
  const generatePDFBlob = useCallback(async (data: FeedbackPDFData): Promise<Blob> => {
    try {
      const pdfDocument = <FeedbackPDFDocument data={data} />;
      const blob = await pdf(pdfDocument).toBlob();
      return blob;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate PDF');
      throw error;
    }
  }, []);

  /**
   * Generate and download PDF file
   */
  const generatePDF = useCallback(
    async (
      data: FeedbackPDFData,
      options?: UseExportPDFOptions
    ): Promise<void> => {
      const {
        filename = `essay-feedback-${new Date().toISOString().split('T')[0]}`,
        onSuccess,
        onError
      } = options || {};

      setIsGenerating(true);
      setError(null);

      try {
        // Generate PDF document
        const pdfDocument = <FeedbackPDFDocument data={data} />;

        // Convert to Blob
        const blob = await pdf(pdfDocument).toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.pdf`;
        link.click();

        // Cleanup
        URL.revokeObjectURL(url);

        // Success callback
        toast.success('PDF report exported successfully');
        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate PDF');
        setError(error);
        toast.error('Failed to export PDF. Please try again.');
        onError?.(error);
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePDFBlob]
  );

  return {
    isGenerating,
    generatePDF,
    generatePDFBlob,
    error
  };
}

export default useExportPDF;
