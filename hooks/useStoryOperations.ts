import { useCallback, useRef } from 'react';
import { useStory } from '../contexts/StoryContext';
import { useSettings } from '../contexts/SettingsContext';
import { useErrorHandler } from './useErrorHandler';
import { useNetworkStatus } from './useNetworkStatus';
import { useApiPerformanceMonitor } from './usePerformanceMonitor';
import { generateStorySegment, generateCharacterProfiles } from '../services/geminiService';
import { addHistoryEntry } from '../services/historyService';
import { withRetry, RETRY_OPTIONS } from '../utils/retryUtils';
import type { StorySegment, HistoryEntry } from '../types';
import { GenerationMode, RewriteTarget } from '../types';

export const useStoryOperations = () => {
  const { activeStory, setActiveStory } = useStory();
  const { apiKeys, useDefaultKey, currentKeyIndex, setCurrentKeyIndex } = useSettings();
  const { addError, clearErrors } = useErrorHandler();
  const { isOnline } = useNetworkStatus();
  const { startApiCall, endApiCall } = useApiPerformanceMonitor('AI Generation');

  const chatSession = useRef<{ messages: any[] } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!activeStory) return;

    clearErrors();

    const lastUserSegment = [...activeStory.storySegments].reverse().find(s => s.type === 'user');
    if (!lastUserSegment && activeStory.generationConfig.generationMode === GenerationMode.CONTINUE && activeStory.storySegments.length > 0) {
      const errorMsg = "Cannot continue without a new user prompt. Please add to the story.";
      addError(errorMsg, {
        recoverable: false,
        context: 'Story Generation',
      });
      return;
    }

    // Check if rewriting a specific chapter
    if (activeStory.generationConfig.generationMode === GenerationMode.REWRITE &&
        activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
        !activeStory.generationConfig.selectedChapterId) {
      const errorMsg = "Vui lòng chọn chương cần viết lại.";
      addError(errorMsg, {
        recoverable: false,
        context: 'Story Generation',
      });
      return;
    }

    const storyContext = activeStory.storySegments.filter(s => s.type !== 'chapter').map(s => s.content).join('\n\n');
    const prompt = lastUserSegment?.content || storyContext || '';

    // Prepare content for rewriting
    let fullStoryForRewrite = storyContext;
    if (activeStory.generationConfig.generationMode === GenerationMode.REWRITE &&
        activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
        activeStory.generationConfig.selectedChapterId) {

      // Find the selected chapter and get content up to that chapter
      const chapterIndex = activeStory.storySegments.findIndex(s => s.id === activeStory.generationConfig.selectedChapterId);
      if (chapterIndex !== -1) {
        const segmentsUpToChapter = activeStory.storySegments.slice(0, chapterIndex + 1);
        fullStoryForRewrite = segmentsUpToChapter.filter(s => s.type !== 'chapter').map(s => s.content).join('\n\n');
      }
    }

    const selectedPromptIds = Array.isArray(activeStory.selectedPromptIds) ? activeStory.selectedPromptIds : [];
    const selectedPromptsContent = activeStory.customPrompts
        .filter(p => selectedPromptIds.includes(p.id))
        .map(p => p.content);

    const availableKeys = useDefaultKey ? [{ id: 'default', name: 'Default', key: 'N/A', isDefault: true }, ...apiKeys] : apiKeys;

    try {
      const startTime = startApiCall();

      const result = await withRetry(
        () => generateStorySegment(
          prompt,
          fullStoryForRewrite,
          activeStory.generationConfig,
          selectedPromptsContent,
          activeStory.characterProfiles,
          availableKeys,
          currentKeyIndex,
          chatSession.current
        ),
        RETRY_OPTIONS.API_CALL
      );

      endApiCall(startTime, true); // Success

      const newSegment: StorySegment = {
        id: Date.now().toString(),
        type: 'ai',
        content: result.content,
        config: { ...activeStory.generationConfig },
      };

      if (activeStory.generationConfig.generationMode === GenerationMode.REWRITE) {
        // For rewrite mode, replace the entire story or just the selected chapter
        if (activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
            activeStory.generationConfig.selectedChapterId) {

          // Replace only the selected chapter's content
          const chapterIndex = activeStory.storySegments.findIndex(s => s.id === activeStory.generationConfig.selectedChapterId);
          if (chapterIndex !== -1) {
            const newSegments = [...activeStory.storySegments];
            newSegments[chapterIndex] = newSegment;
            setActiveStory({ ...activeStory, storySegments: newSegments });
          } else {
            setActiveStory({ ...activeStory, storySegments: [newSegment] });
          }
        } else {
          // Replace entire story while preserving chapter structure
          const chapters = activeStory.storySegments.filter(s => s.type === 'chapter');
          if (chapters.length > 0) {
            // If there are chapters, preserve them and replace content with new segment
            const newSegments = [...chapters, newSegment];
            setActiveStory({ ...activeStory, storySegments: newSegments });
          } else {
            // If no chapters, just replace with new segment
            setActiveStory({ ...activeStory, storySegments: [newSegment] });
          }
        }
      } else {
        setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newSegment] });
      }

      chatSession.current = result.newChatSession as { messages: any[] };
      setCurrentKeyIndex(result.newKeyIndex);

    } catch (e: any) {
      const errorMsg = isOnline
          ? (e.message || 'Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.')
          : 'Mất kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';

      // Add to error manager with retry action
      addError(errorMsg, {
        recoverable: true,
        context: 'Story Generation',
        retryAction: handleGenerate,
      });
    }
  }, [activeStory, apiKeys, useDefaultKey, currentKeyIndex, setActiveStory, setCurrentKeyIndex, isOnline, addError, clearErrors, startApiCall, endApiCall]);

  const handleStartEdit = useCallback((segment: StorySegment) => {
    return {
      editingId: segment.id,
      editContent: segment.content,
    };
  }, []);

  const handleSaveEdit = useCallback((segmentId: string, newContent: string) => {
    if (!activeStory) return;

    const originalSegment = activeStory.storySegments.find(s => s.id === segmentId);

    if (originalSegment && originalSegment.type === 'ai') {
      addHistoryEntry(segmentId, originalSegment.content);
    }

    setActiveStory({
      ...activeStory,
      storySegments: activeStory.storySegments.map(s =>
        s.id === segmentId ? { ...s, content: newContent } : s
      )
    });
  }, [activeStory, setActiveStory]);

  const handleRevertToVersion = useCallback((segmentId: string, historyEntry: HistoryEntry) => {
    if (!activeStory) return;
    if (window.confirm("Are you sure you want to revert to this version? The current content will be saved to history.")) {
      const segmentToRevert = activeStory.storySegments.find(s => s.id === segmentId);
      if (segmentToRevert) {
        addHistoryEntry(segmentId, segmentToRevert.content);
      }

      setActiveStory({
        ...activeStory,
        storySegments: activeStory.storySegments.map(s =>
          s.id === segmentId ? { ...s, content: historyEntry.content } : s
        )
      });
    }
  }, [activeStory, setActiveStory]);

  const handleGenerateProfiles = useCallback(async () => {
    if (!activeStory) return;

    const storyContent = activeStory.storySegments.map(s => s.content).join('\n\n');
    if (!storyContent.trim()) {
      addError("Cannot analyze an empty story. Please write something first.", {
        recoverable: false,
        context: 'Character Generation'
      });
      return;
    }

    const availableKeys = useDefaultKey ? [{ id: 'default', name: 'Default', key: 'N/A', isDefault: true }, ...apiKeys] : apiKeys;

    try {
      const { profiles, newKeyIndex } = await generateCharacterProfiles(storyContent, availableKeys, currentKeyIndex);

      const updatedProfiles = [...activeStory.characterProfiles];
      profiles.forEach(newProfile => {
        const existingIndex = updatedProfiles.findIndex(p => p.name.toLowerCase() === newProfile.name.toLowerCase());
        if (existingIndex !== -1) {
          updatedProfiles[existingIndex] = {
           ...updatedProfiles[existingIndex],
           appearance: newProfile.appearance || updatedProfiles[existingIndex].appearance,
           personality: newProfile.personality || updatedProfiles[existingIndex].personality,
           background: newProfile.background || updatedProfiles[existingIndex].background,
           goals: newProfile.goals || updatedProfiles[existingIndex].goals,
          };
        } else {
          updatedProfiles.push(newProfile);
        }
      });

      setActiveStory({ ...activeStory, characterProfiles: updatedProfiles });
      setCurrentKeyIndex(newKeyIndex);
    } catch(e: any) {
      addError(e.message || "An unknown error occurred while generating profiles.", {
        recoverable: true,
        context: 'Character Generation'
      });
    }
  }, [activeStory, apiKeys, useDefaultKey, currentKeyIndex, setActiveStory, setCurrentKeyIndex, addError]);

  return {
    handleGenerate,
    handleStartEdit,
    handleSaveEdit,
    handleRevertToVersion,
    handleGenerateProfiles,
    chatSession,
  };
};
