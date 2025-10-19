import { useState, useCallback } from 'react';
import type {
  ImportResult,
  ImportedChapter,
  ImportOptions,
  ProcessingProgress,
} from '../types/chapter';
import importService from '../services/importService';

export const useImportManager = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const openImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const closeImportDialog = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const openPreviewDialog = useCallback(() => {
    setIsPreviewDialogOpen(true);
  }, []);

  const closePreviewDialog = useCallback(() => {
    setIsPreviewDialogOpen(false);
    setImportResult(null);
  }, []);

  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result);
    setIsImportDialogOpen(false);
    setIsPreviewDialogOpen(true);
  }, []);

  const handlePreviewConfirm = useCallback(async (selectedChapters: ImportedChapter[], onImportSuccess?: (chapters: ImportedChapter[]) => void) => {
    setIsProcessing(true);

    try {
      // Call the success callback with the imported chapters
      // The parent component will handle adding them to the story
      if (onImportSuccess) {
        onImportSuccess(selectedChapters);
      }

      // Close preview dialog
      closePreviewDialog();

    } catch (error) {
      console.error('Failed to save imported chapters:', error);
      // Handle error (show notification, etc.)
    } finally {
      setIsProcessing(false);
    }
  }, [closePreviewDialog]);

  const testImportWithSampleFile = useCallback(async () => {
    setIsProcessing(true);

    try {
      // This would normally read from the actual sample file
      // For now, we'll simulate the import process
      const sampleContent = `Đây là nội dung mẫu của chương 1.

Đây là một câu chuyện về một cô gái trẻ tên là Linh, người có khả năng đặc biệt.

Linh sống trong một ngôi làng nhỏ yên bình, nơi mọi người đều biết nhau.

## Chương 2: Khám phá

Linh phát hiện ra khả năng của mình khi cô ấy vô tình cứu được một con chim bị thương.

Khả năng chữa lành của cô ấy ngày càng mạnh mẽ hơn.

Chương 3: Hành trình

Linh quyết định rời khỏi làng để tìm hiểu về nguồn gốc của khả năng đặc biệt này.

Cô ấy gặp gỡ nhiều người bạn mới trên hành trình của mình.`;

      // Simulate processing
      const mockResult: ImportResult = {
        success: true,
        chapters: [
          {
            id: 'sample_1',
            title: 'Chương 1: Bắt đầu',
            content: 'Đây là nội dung mẫu của chương 1.\n\nĐây là một câu chuyện về một cô gái trẻ tên là Linh, người có khả năng đặc biệt.\n\nLinh sống trong một ngôi làng nhỏ yên bình, nơi mọi người đều biết nhau.',
            originalPosition: 0,
            wordCount: 45,
            characterCount: 234,
            estimatedReadingTime: 1,
          },
          {
            id: 'sample_2',
            title: 'Chương 2: Khám phá',
            content: 'Linh phát hiện ra khả năng của mình khi cô ấy vô tình cứu được một con chim bị thương.\n\nKhả năng chữa lành của cô ấy ngày càng mạnh mẽ hơn.',
            originalPosition: 1,
            wordCount: 28,
            characterCount: 145,
            estimatedReadingTime: 1,
          },
          {
            id: 'sample_3',
            title: 'Chương 3: Hành trình',
            content: 'Linh quyết định rời khỏi làng để tìm hiểu về nguồn gốc của khả năng đặc biệt này.\n\nCô ấy gặp gỡ nhiều người bạn mới trên hành trình của mình.',
            originalPosition: 2,
            wordCount: 32,
            characterCount: 156,
            estimatedReadingTime: 1,
          },
        ],
        errors: [],
        metadata: {
          totalSize: 456,
          totalCharacters: 456,
          totalWords: 105,
          encoding: 'utf-8',
          fileName: 'sample-story.txt',
          importDate: Date.now(),
          processingTime: 1500,
        },
      };

      handleImportComplete(mockResult);

    } catch (error) {
      console.error('Test import failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [handleImportComplete]);

  return {
    // Dialog states
    isImportDialogOpen,
    isPreviewDialogOpen,
    importResult,
    isProcessing,

    // Dialog actions
    openImportDialog,
    closeImportDialog,
    openPreviewDialog,
    closePreviewDialog,

    // Import actions
    handleImportComplete,
    handlePreviewConfirm,
    testImportWithSampleFile,
  };
};

export default useImportManager;
