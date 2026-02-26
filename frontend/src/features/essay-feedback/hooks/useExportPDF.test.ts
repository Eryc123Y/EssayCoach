import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExportPDF } from './useExportPDF';
import type { FeedbackPDFData } from '../components/feedback-pdf';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', async () => {
  const actual = await vi.importActual('@react-pdf/renderer');
  return {
    ...actual,
    pdf: vi.fn(() => ({
      toBlob: vi.fn(() => Promise.resolve(new Blob(['mock-pdf'], { type: 'application/pdf' })))
    }))
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('useExportPDF', () => {
  const mockData: FeedbackPDFData = {
    studentName: 'John Doe',
    studentEmail: 'john.doe@example.com',
    submissionDate: '2026-02-26',
    essayQuestion: 'Test Essay Question',
    essayContent: 'Test essay content',
    overallScore: 85,
    scores: [
      { category: 'Structure', score: 82, fullMark: 100 }
    ],
    insights: [
      {
        id: '1',
        type: 'strength',
        category: 'Structure',
        title: 'Good Structure',
        description: 'Well organized'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useExportPDF());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.generatePDF).toBeDefined();
    expect(result.current.generatePDFBlob).toBeDefined();
  });

  it('should generate PDF blob successfully', async () => {
    const { result } = renderHook(() => useExportPDF());

    let blob: Blob;
    await act(async () => {
      blob = await result.current.generatePDFBlob(mockData);
    });

    expect(blob).toBeDefined();
    expect(blob!.type).toBe('application/pdf');
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should generate and download PDF file', async () => {
    const { result } = renderHook(() => useExportPDF());

    // Mock document.createElement for download link
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(mockData);
    });

    // Verify download was triggered
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(mockLink.download).toContain('.pdf');
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should use custom filename when provided', async () => {
    const { result } = renderHook(() => useExportPDF());

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(mockData, { filename: 'custom-essay-report' });
    });

    expect(mockLink.download).toBe('custom-essay-report.pdf');

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should call onSuccess callback after successful generation', async () => {
    const { result } = renderHook(() => useExportPDF());
    const onSuccessMock = vi.fn();

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(mockData, { onSuccess: onSuccessMock });
    });

    expect(onSuccessMock).toHaveBeenCalledTimes(1);

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should handle PDF generation error', async () => {
    // Mock pdf() to throw error
    const { pdf } = await import('@react-pdf/renderer');
    vi.mocked(pdf).mockImplementationOnce(
      () => ({
        toBlob: vi.fn(() => Promise.reject(new Error('PDF generation failed')))
      }) as any
    );

    const { result } = renderHook(() => useExportPDF());
    const onErrorMock = vi.fn();

    await act(async () => {
      await result.current.generatePDF(mockData, { onError: onErrorMock });
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('PDF generation failed');
    expect(onErrorMock).toHaveBeenCalledTimes(1);

    // Cleanup
    vi.clearAllMocks();
  });

  it('should show success toast on successful generation', async () => {
    const { result } = renderHook(() => useExportPDF());

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(mockData);
    });

    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('PDF report exported successfully');

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should show error toast on failed generation', async () => {
    const { pdf } = await import('@react-pdf/renderer');
    vi.mocked(pdf).mockImplementationOnce(
      () => ({
        toBlob: vi.fn(() => Promise.reject(new Error('Failed')))
      }) as any
    );

    const { result } = renderHook(() => useExportPDF());

    await act(async () => {
      await result.current.generatePDF(mockData);
    });

    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith(
      'Failed to export PDF. Please try again.'
    );

    // Cleanup
    vi.clearAllMocks();
  });

  it('should use default filename when not provided', async () => {
    const { result } = renderHook(() => useExportPDF());

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(mockData);
    });

    // Check that filename contains date
    expect(mockLink.download).toMatch(/essay-feedback-\d{4}-\d{2}-\d{2}\.pdf/);

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});

describe('useExportPDF - Edge Cases', () => {
  it('should handle empty student name', async () => {
    const { result } = renderHook(() => useExportPDF());

    const dataWithoutName: FeedbackPDFData = {
      studentName: '',
      studentEmail: 'test@example.com',
      submissionDate: '2026-02-26',
      essayQuestion: 'Test',
      essayContent: 'Content',
      overallScore: 80,
      scores: [],
      insights: []
    };

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(dataWithoutName);
    });

    expect(result.current.error).toBe(null);

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should handle very long essay content', async () => {
    const { result } = renderHook(() => useExportPDF());

    const dataWithLongContent: FeedbackPDFData = {
      studentName: 'Test',
      studentEmail: 'test@example.com',
      submissionDate: '2026-02-26',
      essayQuestion: 'Test',
      essayContent: 'Long content '.repeat(1000),
      overallScore: 80,
      scores: [],
      insights: []
    };

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(dataWithLongContent);
    });

    expect(result.current.error).toBe(null);

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should handle missing skills data', async () => {
    const { result } = renderHook(() => useExportPDF());

    const dataWithoutSkills: FeedbackPDFData = {
      studentName: 'Test',
      studentEmail: 'test@example.com',
      submissionDate: '2026-02-26',
      essayQuestion: 'Test',
      essayContent: 'Content',
      overallScore: 80,
      scores: [],
      insights: []
    };

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(dataWithoutSkills);
    });

    expect(result.current.error).toBe(null);

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should handle missing rubric results', async () => {
    const { result } = renderHook(() => useExportPDF());

    const dataWithoutRubrics: FeedbackPDFData = {
      studentName: 'Test',
      studentEmail: 'test@example.com',
      submissionDate: '2026-02-26',
      essayQuestion: 'Test',
      essayContent: 'Content',
      overallScore: 80,
      scores: [],
      insights: []
    };

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      vi.fn()
    );

    await act(async () => {
      await result.current.generatePDF(dataWithoutRubrics);
    });

    expect(result.current.error).toBe(null);

    // Cleanup
    createElementSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
