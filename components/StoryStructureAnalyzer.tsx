import React, { useState } from 'react';
import { getAIService } from '../services/aiService';
import { AIModelCapability } from '../types/ai-models';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { BookOpenIcon, XIcon } from './icons';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StoryStructureAnalyzerProps {
  storyContent: string;
  onClose: () => void;
}

export const StoryStructureAnalyzer: React.FC<StoryStructureAnalyzerProps> = ({
  storyContent,
  onClose,
}) => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addError } = useErrorHandler();

  const handleAnalyzeStory = async () => {
    if (!storyContent.trim()) {
      addError('Story content is empty. Please write something first.', { recoverable: false });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const aiService = getAIService((error, options) => {
        addError(error, options);
        return typeof error === 'string' ? error : error.message;
      });

      const analysisModels = aiService.getModelsByCapability(
        AIModelCapability.STORY_STRUCTURE_ANALYSIS
      );
      const selectedModel = analysisModels[0]; // Use the first available model

      if (!selectedModel) {
        addError('No AI model found for story structure analysis.', { recoverable: false });
        setIsLoading(false);
        return;
      }

      const response = await aiService.analyzeStoryStructure(storyContent, selectedModel.modelId);
      setAnalysisResult(response.content);
    } catch (error) {
      console.error('Error analyzing story structure:', error);
      addError('Failed to analyze story structure. Please try again.', { recoverable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Story Structure Analyzer</h2>
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
            onClick={handleAnalyzeStory}
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
                Analyzing...
              </>
            ) : (
              <>
                <BookOpenIcon className="w-5 h-5 mr-2" />
                Analyze Story Structure
              </>
            )}
          </button>

          {analysisResult && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="text-md font-semibold mb-2 text-foreground">Analysis Result:</h3>
              <MarkdownRenderer content={analysisResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
