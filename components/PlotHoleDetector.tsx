import React, { useState } from 'react';
import { getAIService } from '../services/aiService';
import { AIModelCapability } from '../types/ai-models';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { BugIcon, XIcon } from './icons';
import { MarkdownRenderer } from './MarkdownRenderer';

interface PlotHoleDetectorProps {
  storyContent: string;
  onClose: () => void;
}

export const PlotHoleDetector: React.FC<PlotHoleDetectorProps> = ({
  storyContent,
  onClose,
}) => {
  const [detectionResult, setDetectionResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addError } = useErrorHandler();

  const handleDetectPlotHoles = async () => {
    if (!storyContent.trim()) {
      addError('Story content is empty. Please write something first.', { recoverable: false });
      return;
    }

    setIsLoading(true);
    setDetectionResult(null);

    try {
      const aiService = getAIService((error, options) => {
        addError(error, options);
        return typeof error === 'string' ? error : error.message;
      });

      const detectionModels = aiService.getModelsByCapability(
        AIModelCapability.PLOT_HOLE_DETECTION
      );
      const selectedModel = detectionModels[0]; // Use the first available model

      if (!selectedModel) {
        addError('No AI model found for plot hole detection.', { recoverable: false });
        setIsLoading(false);
        return;
      }

      const response = await aiService.detectPlotHoles(storyContent, selectedModel.modelId);
      setDetectionResult(response.content);
    } catch (error) {
      console.error('Error detecting plot holes:', error);
      addError('Failed to detect plot holes. Please try again.', { recoverable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Plot Hole Detector</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow overflow-y-auto space-y-4">
          <button
            onClick={handleDetectPlotHoles}
            disabled={isLoading || !storyContent.trim()}
            className="w-full flex justify-center items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Detecting...
              </>
            ) : (
              <>
                <BugIcon className="w-5 h-5 mr-2" />
                Detect Plot Holes
              </>
            )}
          </button>

          {detectionResult && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="text-md font-semibold mb-2 text-foreground">Detection Result:</h3>
              <MarkdownRenderer content={detectionResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
