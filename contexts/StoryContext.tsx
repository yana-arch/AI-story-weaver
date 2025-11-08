import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as storyManager from '../services/storyManagerService';
import type { Story, StorySegment, CharacterProfile, GenerationConfig } from '../types';

interface StoryContextType {
  stories: Record<string, Story>;
  activeStoryId: string | null;
  activeStory: Story | null;
  setActiveStory: (story: Story) => void;
  setActiveStoryId: (id: string | null) => void;
  createStory: () => string;
  loadStory: (id: string) => void;
  deleteStory: (id: string) => void;
  renameStory: (id: string, newName: string) => void;
  addUserSegment: (content: string) => void;
  addChapter: () => void;
  updateSegment: (segmentId: string, content: string) => void;
  deleteSegment: (segmentId: string) => void;
  reorderSegments: (sourceId: string, targetId: string) => void;
  updateCharacterProfiles: (profiles: CharacterProfile[]) => void;
  updateGenerationConfig: (config: Partial<GenerationConfig>) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

const initialConfig: GenerationConfig = {
  scenario: 'FIRST_TIME' as any,
  dynamics: 'A_LEADS' as any,
  pacing: 'MEDIUM' as any,
  narrativeStructure: 'FREEFORM' as any,
  adultContentOptions: [],
  avoidKeywords: '',
  focusKeywords: '',
  generationMode: 'CONTINUE' as any,
  rewriteTarget: 'ENTIRE_STORY' as any,
  selectedChapterId: '',
};

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Record<string, Story>>({});
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  // Load stories on mount
  React.useEffect(() => {
    const migratedStoryId = storyManager.migrateToMultiStory();
    const allStories = storyManager.getStories();
    let activeId =
      migratedStoryId || storyManager.getActiveStoryId() || Object.keys(allStories)[0] || null;

    if (!activeId && Object.keys(allStories).length === 0) {
      // No stories exist, create a default one
      const newStory: Story = {
        id: Date.now().toString(),
        name: 'New Story',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storySegments: [],
        generationConfig: initialConfig,
        customPrompts: [],
        keywordPresets: [],
        selectedPromptIds: [],
        characterProfiles: [],
        lastReadSegmentId: null,
      };
      const newStories = { [newStory.id]: newStory };
      storyManager.saveStories(newStories);
      setStories(newStories);
      activeId = newStory.id;
    } else {
      setStories(allStories);
    }
    setActiveStoryId(activeId);
  }, []);

  const activeStory = useMemo(() => {
    if (!activeStoryId || !stories[activeStoryId]) return null;
    return stories[activeStoryId];
  }, [stories, activeStoryId]);

  const setActiveStory = useCallback((story: Story) => {
    setStories((prev) => ({ ...prev, [story.id]: story }));
  }, []);

  const createStory = useCallback(() => {
    const newStory: Story = {
      id: Date.now().toString(),
      name: 'New Story',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      storySegments: [],
      generationConfig: initialConfig,
      customPrompts: [],
      keywordPresets: [],
      selectedPromptIds: [],
      characterProfiles: [],
      lastReadSegmentId: null,
    };
    const newStories = { ...stories, [newStory.id]: newStory };
    setStories(newStories);
    setActiveStoryId(newStory.id);
    return newStory.id;
  }, [stories]);

  const loadStory = useCallback((id: string) => {
    setActiveStoryId(id);
  }, []);

  const deleteStory = useCallback(
    (id: string) => {
      const newStories = { ...stories };
      delete newStories[id];
      setStories(newStories);
      if (activeStoryId === id) {
        setActiveStoryId(Object.keys(newStories)[0] || null);
      }
    },
    [stories, activeStoryId]
  );

  const renameStory = useCallback((id: string, newName: string) => {
    setStories((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        name: newName,
        updatedAt: Date.now(),
      },
    }));
  }, []);

  const addUserSegment = useCallback(
    (content: string) => {
      if (!content.trim() || !activeStory) return;
      const newSegment: StorySegment = {
        id: Date.now().toString(),
        type: 'user',
        content: content.trim(),
      };
      setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newSegment] });
    },
    [activeStory]
  );

  const addChapter = useCallback(() => {
    if (!activeStory) return;
    const title = window.prompt('Enter the title for the new chapter:');
    if (title && title.trim()) {
      const newChapter: StorySegment = {
        id: Date.now().toString(),
        type: 'chapter',
        content: title.trim(),
      };
      setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newChapter] });
    }
  }, [activeStory]);

  const updateSegment = useCallback(
    (segmentId: string, content: string) => {
      if (!activeStory) return;
      setActiveStory({
        ...activeStory,
        storySegments: activeStory.storySegments.map((s) =>
          s.id === segmentId ? { ...s, content } : s
        ),
      });
    },
    [activeStory]
  );

  const deleteSegment = useCallback(
    (segmentId: string) => {
      if (!activeStory) return;
      setActiveStory({
        ...activeStory,
        storySegments: activeStory.storySegments.filter((s) => s.id !== segmentId),
      });
    },
    [activeStory]
  );

  const reorderSegments = useCallback(
    (sourceId: string, targetId: string) => {
      if (!activeStory) return;

      const sourceIndex = activeStory.storySegments.findIndex((s) => s.id === sourceId);
      const targetIndex = activeStory.storySegments.findIndex((s) => s.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const newSegments = [...activeStory.storySegments];
      const [draggedItem] = newSegments.splice(sourceIndex, 1);
      newSegments.splice(targetIndex, 0, draggedItem);

      setActiveStory({ ...activeStory, storySegments: newSegments });
    },
    [activeStory]
  );

  const updateCharacterProfiles = useCallback(
    (profiles: CharacterProfile[]) => {
      if (!activeStory) return;
      setActiveStory({ ...activeStory, characterProfiles: profiles });
    },
    [activeStory]
  );

  const updateGenerationConfig = useCallback(
    (config: Partial<GenerationConfig>) => {
      if (!activeStory) return;
      setActiveStory({
        ...activeStory,
        generationConfig: { ...activeStory.generationConfig, ...config },
      });
    },
    [activeStory]
  );

  const contextValue = useMemo(
    () => ({
      stories,
      activeStoryId,
      activeStory,
      setActiveStory,
      setActiveStoryId,
      createStory,
      loadStory,
      deleteStory,
      renameStory,
      addUserSegment,
      addChapter,
      updateSegment,
      deleteSegment,
      reorderSegments,
      updateCharacterProfiles,
      updateGenerationConfig,
    }),
    [
      stories,
      activeStoryId,
      activeStory,
      setActiveStory,
      setActiveStoryId,
      createStory,
      loadStory,
      deleteStory,
      renameStory,
      addUserSegment,
      addChapter,
      updateSegment,
      deleteSegment,
      reorderSegments,
      updateCharacterProfiles,
      updateGenerationConfig,
    ]
  );

  return <StoryContext.Provider value={contextValue}>{children}</StoryContext.Provider>;
};

export const useStory = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};
