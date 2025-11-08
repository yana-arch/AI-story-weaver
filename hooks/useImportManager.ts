import { useState, useCallback } from 'react';
import type { ImportedStory } from '../types/chapter';

export const useImportManager = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const openImportDialog = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const closeImportDialog = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const handleImportComplete = useCallback(
    (onImportSuccess: (stories: ImportedStory[]) => void) => async (stories: ImportedStory[]) => {
      try {
        // Call the success callback with the imported stories
        onImportSuccess(stories);

        // Close import dialog
        closeImportDialog();
      } catch (error) {
        console.error('Failed to process imported stories:', error);
        // Handle error (show notification, etc.)
      }
    },
    [closeImportDialog]
  );

  return {
    // Dialog states
    isImportDialogOpen,
    isProcessing,

    // Dialog actions
    openImportDialog,
    closeImportDialog,

    // Import actions
    handleImportComplete,
  };
};

export default useImportManager;
