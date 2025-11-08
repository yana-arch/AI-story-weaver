import { ComponentLoadingFallback } from './components/ComponentLoadingFallback';
import { StoryMainContent } from './components/StoryMainContent';
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import type { Chat } from '@google/genai';

// Eager imports for critical components
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorNotificationContainer } from './components/ErrorNotification';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useErrorHandler } from './hooks/useErrorHandler';
import { type TTSOptions } from './components/TTSSettings';
import { useTTS } from './hooks/useTTS';
import {
  usePerformanceMonitor,
  useMemoryLeakDetector,
  useApiPerformanceMonitor,
} from './hooks/usePerformanceMonitor';
import { useImportManager } from './hooks/useImportManager';
import * as storyManager from './services/storyManagerService';
import { generateStorySegment, generateCharacterProfiles } from './services/geminiService';
import { addHistoryEntry, deleteHistory } from './services/historyService';
import { withRetry, RETRY_OPTIONS } from './utils/retryUtils';
import chapterService from './services/chapterService';
import { useSettings } from './contexts/SettingsContext';

// Lazy-loaded components for better initial bundle size
const ApiKeyManager = lazy(() =>
  import('./components/ApiKeyManager').then((module) => ({ default: module.ApiKeyManager }))
);
const ContentNavigator = lazy(() =>
  import('./components/ContentNavigator').then((module) => ({ default: module.ContentNavigator }))
);
const CustomPromptsManager = lazy(() =>
  import('./components/CustomPromptsManager').then((module) => ({
    default: module.CustomPromptsManager,
  }))
);
const KeywordPresetManager = lazy(() =>
  import('./components/KeywordPresetManager').then((module) => ({
    default: module.KeywordPresetManager,
  }))
);
const VersionHistoryViewer = lazy(() =>
  import('./components/VersionHistoryViewer').then((module) => ({
    default: module.VersionHistoryViewer,
  }))
);
const MarkdownRenderer = lazy(() =>
  import('./components/MarkdownRenderer').then((module) => ({ default: module.MarkdownRenderer }))
);
const StoryContentRenderer = lazy(() =>
  import('./components/StoryContentRenderer').then((module) => ({
    default: module.StoryContentRenderer,
  }))
);
const StoryDisplaySettings = lazy(() =>
  import('./components/StoryDisplaySettings').then((module) => ({
    default: module.StoryDisplaySettings,
  }))
);
const CharacterPanel = lazy(() =>
  import('./components/CharacterPanel').then((module) => ({ default: module.CharacterPanel }))
);
const CharacterProfileEditor = lazy(() =>
  import('./components/CharacterProfileEditor').then((module) => ({
    default: module.CharacterProfileEditor,
  }))
);
const ChapterList = lazy(() =>
  import('./components/ChapterList').then((module) => ({ default: module.ChapterList }))
);
const StoryManager = lazy(() =>
  import('./components/StoryManager').then((module) => ({ default: module.StoryManager }))
);
const ThemeManager = lazy(() =>
  import('./components/ThemeManager').then((module) => ({ default: module.ThemeManager }))
);
const TTSSettings = lazy(() =>
  import('./components/TTSSettings').then((module) => ({ default: module.TTSSettings }))
);
const ExportDialog = lazy(() =>
  import('./components/ExportDialog').then((module) => ({ default: module.ExportDialog }))
);
const ImportDialog = lazy(() =>
  import('./components/ImportDialog').then((module) => ({ default: module.ImportDialog }))
);
const ChapterPreviewDialog = lazy(() =>
  import('./components/ChapterPreviewDialog').then((module) => ({
    default: module.ChapterPreviewDialog,
  }))
);
const ImageGenerator = lazy(() =>
  import('./components/ImageGenerator').then((module) => ({ default: module.ImageGenerator }))
);
const StoryStructureAnalyzer = lazy(() =>
  import('./components/StoryStructureAnalyzer').then((module) => ({
    default: module.StoryStructureAnalyzer,
  }))
);
const PlotHoleDetector = lazy(() =>
  import('./components/PlotHoleDetector').then((module) => ({
    default: module.PlotHoleDetector,
  }))
);


import {
  Scenario,
  CharacterDynamics,
  Pacing,
  GenerationMode,
  NarrativeStructure,
  RewriteTarget,
  type GenerationConfig,
  type StorySegment,
  type ApiKey,
  type CustomPrompt,
  type KeywordPreset,
  type HistoryEntry,
  type CharacterProfile,
  type Story,
} from './types';
import type { ImportedStory } from './types/chapter';
import {
  KeyIcon,
  BookmarkIcon,
  UploadIcon,
  DownloadIcon,
  BookOpenIcon,
  UserGroupIcon,
  CollectionIcon,
  PanelRightIcon,
  PaintBrushIcon,
  SpeakerIcon,
  CogIcon,
  WandIcon,
  BugIcon,
  CloseIcon,
} from './components/icons';

const initialConfig: GenerationConfig = {
  scenario: Scenario.FIRST_TIME,
  dynamics: CharacterDynamics.A_LEADS,
  pacing: Pacing.MEDIUM,
  narrativeStructure: NarrativeStructure.FREEFORM,
  adultContentOptions: [],
  avoidKeywords: '',
  focusKeywords: '',
  generationMode: GenerationMode.CONTINUE,
  rewriteTarget: RewriteTarget.ENTIRE_STORY,
  selectedChapterId: '',
};

const App: React.FC = () => {
  // Performance monitoring hooks
  const performanceMetrics = usePerformanceMonitor('App');
  const memoryLeakMetrics = useMemoryLeakDetector('App');
  const { startApiCall, endApiCall } = useApiPerformanceMonitor('AI Generation');

  // Get global prompts from settings
  const { globalPrompts, setGlobalPrompts } = useSettings();

  const [stories, setStories] = useState<Record<string, Story>>({});
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);
  const [useDefaultKey, setUseDefaultKey] = useLocalStorage<boolean>('useDefaultKey', true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeyIndex, setCurrentKeyIndex] = useLocalStorage<number>('currentKeyIndex', 0);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string>('currentUserId', Date.now().toString() + Math.random().toString(36).substr(2, 9));
  const [currentUserName, setCurrentUserName] = useLocalStorage<string>('currentUserName', 'Anonymous');

  // Enhanced error handling and network status
  const { addError, clearErrors } = useErrorHandler();
  const { isOnline } = useNetworkStatus();
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Modals and panels visibility state
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);
  const [isKeywordPresetManagerOpen, setIsKeywordPresetManagerOpen] = useState(false);
  const [historyViewerTarget, setHistoryViewerTarget] = useState<string | null>(null);
  const [isCharacterEditorOpen, setIsCharacterEditorOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CharacterProfile | null>(null);
  const [isGeneratingProfiles, setIsGeneratingProfiles] = useState(false);
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] = useState(false);
  const [isStoryManagerOpen, setIsStoryManagerOpen] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(window.innerWidth >= 768);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isTTSSettingsOpen, setIsTTSSettingsOpen] = useState(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'api-keys' | 'theme' | 'tts' | 'display'
  >('api-keys');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState(false);
  const [isStoryStructureAnalyzerOpen, setIsStoryStructureAnalyzerOpen] = useState(false);
  const [isPlotHoleDetectorOpen, setIsPlotHoleDetectorOpen] = useState(false);

  // Individual modal states for settings tabs
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isTTSModalOpen, setIsTTSModalOpen] = useState(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [ttsSettings, setTtsSettings] = useLocalStorage<TTSOptions>('ttsSettings', {
    rate: 1,
    pitch: 1,
  });

  const { isSpeaking, toggle, stop } = useTTS(ttsSettings);

  // Import Manager
  const { isImportDialogOpen, openImportDialog, closeImportDialog, handleImportComplete } =
    useImportManager();

  // Import completion handler
  const onImportComplete = handleImportComplete((importedStories) => {
    // Create new stories from imported stories
    const newStories: Record<string, Story> = { ...stories };
    importedStories.forEach((story) => {
      // Convert chapters to story segments
      const storySegments: StorySegment[] = story.chapters.map((chapter) => ({
        id: chapter.id,
        type: 'ai',
        content: chapter.content,
      }));

      newStories[story.id] = {
        id: story.id,
        name: story.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storySegments,
        generationConfig: initialConfig,
        customPrompts: [],
        keywordPresets: [],
        selectedPromptIds: [],
        characterProfiles: [],
        lastReadSegmentId: null,
      };
    });
    setStories(newStories);

    // Set the first imported story as active if no active story
    if (!activeStoryId && importedStories.length > 0) {
      setActiveStoryId(importedStories[0].id);
    }
  });

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const isInitialMount = useRef(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useLocalStorage<string>('theme', 'zinc');

  useEffect(() => {
    document.body.classList.remove(
      'theme-zinc',
      'theme-slate',
      'theme-stone',
      'theme-gray',
      'theme-neutral',
      'theme-red',
      'theme-rose',
      'theme-orange',
      'theme-green',
      'theme-blue',
      'theme-yellow',
      'theme-violet'
    );
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Update navigator state on resize
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsDesktop(isDesktop);
      if (isDesktop) {
        setIsNavigatorOpen(true); // Always show on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    // Set initial state again in case of late updates
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag and drop state
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const chatSession = useRef<Chat | { messages: any[] } | null>(null);
  const endOfStoryRef = useRef<HTMLDivElement>(null);

  // Reading progress state
  const segmentRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const observer = useRef<IntersectionObserver | null>(null);
  const unreadMarkerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
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
  }, [setStories]);

  // Reset chat session if story is cleared or generation mode changes to REWRITE
  useEffect(() => {
    if (
      !activeStory ||
      activeStory.storySegments.length === 0 ||
      activeStory.generationConfig.generationMode === GenerationMode.REWRITE
    ) {
      chatSession.current = null;
    }
  }, [activeStory]);

  useEffect(() => {
    endOfStoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeStory?.storySegments]);

  // Effect for autosave visual indicator
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (activeStory) {
      storyManager.saveStories(stories);
      setSaveStatus('saved');
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000); // Show "Saved" for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [activeStory, stories]);

  const filteredSegments = useMemo(() => {
    if (!activeStory) return [];
    if (!searchQuery.trim()) {
      return activeStory.storySegments;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return activeStory.storySegments.filter(
      (segment) =>
        segment.type !== 'chapter' && segment.content.toLowerCase().includes(lowercasedQuery)
    );
  }, [activeStory, searchQuery]);

  const lastReadIndex = useMemo(() => {
    if (!activeStory || !activeStory.lastReadSegmentId) return -1;
    return filteredSegments.findIndex((s) => s.id === activeStory.lastReadSegmentId);
  }, [filteredSegments, activeStory]);

  // Reading progress observer effect
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const segmentId = entry.target.getAttribute('data-segment-id');
          if (segmentId && activeStory) {
            setActiveStory({ ...activeStory, lastReadSegmentId: segmentId });
          }
        }
      });
    };

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    });

    const currentObserver = observer.current;

    segmentRefs.current.forEach((el) => {
      if (el) currentObserver.observe(el);
    });

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [filteredSegments, activeStory, setActiveStory]);

  // Auto-scroll to unread marker effect
  useEffect(() => {
    if (!didInitialScroll.current && unreadMarkerRef.current) {
      setTimeout(() => {
        unreadMarkerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        didInitialScroll.current = true;
      }, 100);
    }
  }, [lastReadIndex]);

  const handleGenerate = useCallback(async () => {
    if (!activeStory) return;

    setIsLoading(true);
    setError(null);
    clearErrors();

    const lastUserSegment = [...activeStory.storySegments].reverse().find((s) => s.type === 'user');
    if (
      !lastUserSegment &&
      activeStory.generationConfig.generationMode === GenerationMode.CONTINUE &&
      activeStory.storySegments.length > 0
    ) {
      const errorMsg = 'Cannot continue without a new user prompt. Please add to the story.';
      setError(errorMsg);
      addError(errorMsg, {
        recoverable: false,
        context: 'Story Generation',
      });
      setIsLoading(false);
      return;
    }

    // Check if rewriting a specific chapter
    if (
      activeStory.generationConfig.generationMode === GenerationMode.REWRITE &&
      activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
      !activeStory.generationConfig.selectedChapterId
    ) {
      const errorMsg = 'Vui lòng chọn chương cần viết lại.';
      setError(errorMsg);
      addError(errorMsg, {
        recoverable: false,
        context: 'Story Generation',
      });
      setIsLoading(false);
      return;
    }

    const storyContext = activeStory.storySegments
      .filter((s) => s.type !== 'chapter')
      .map((s) => s.content)
      .join('\n\n');
    const prompt = lastUserSegment?.content || storyContext || '';

    // Prepare content for rewriting
    let fullStoryForRewrite = storyContext;
    if (
      activeStory.generationConfig.generationMode === GenerationMode.REWRITE &&
      activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
      activeStory.generationConfig.selectedChapterId
    ) {
      // Find the selected chapter and get content up to that chapter
      const chapterIndex = activeStory.storySegments.findIndex(
        (s) => s.id === activeStory.generationConfig.selectedChapterId
      );
      if (chapterIndex !== -1) {
        const segmentsUpToChapter = activeStory.storySegments.slice(0, chapterIndex + 1);
        fullStoryForRewrite = segmentsUpToChapter
          .filter((s) => s.type !== 'chapter')
          .map((s) => s.content)
          .join('\n\n');
      }
    }

    const selectedPromptIds = Array.isArray(activeStory.selectedPromptIds)
      ? activeStory.selectedPromptIds
      : [];
    const selectedPromptsContent = globalPrompts
      .filter((p) => selectedPromptIds.includes(p.id))
      .map((p) => p.content);

    const rawAvailableKeys = useDefaultKey
      ? [
          { id: 'default', name: 'Default', keys: ['N/A'], activeIndexes: [0], isDefault: true },
          ...apiKeys,
        ]
      : apiKeys;
    // Flatten active keys for cycling
    const availableKeys = rawAvailableKeys.flatMap((apiKey) =>
      apiKey.activeIndexes.map((index) => ({ apiKey, keyIndex: index, key: apiKey.keys[index] }))
    );

    // Use retry mechanism for API calls with performance monitoring
    try {
      const startTime = startApiCall();

      const result = await withRetry(
        () =>
          generateStorySegment(
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
        if (
          activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
          activeStory.generationConfig.selectedChapterId
        ) {
          // Replace only the selected chapter's content
          const chapterIndex = activeStory.storySegments.findIndex(
            (s) => s.id === activeStory.generationConfig.selectedChapterId
          );
          if (chapterIndex !== -1) {
            const newSegments = [...activeStory.storySegments];
            newSegments[chapterIndex] = newSegment;
            setActiveStory({ ...activeStory, storySegments: newSegments });
          } else {
            setActiveStory({ ...activeStory, storySegments: [newSegment] });
          }
        } else {
          // Replace entire story while preserving chapter structure
          const chapters = activeStory.storySegments.filter((s) => s.type === 'chapter');
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
        setActiveStory({
          ...activeStory,
          storySegments: [...activeStory.storySegments, newSegment],
        });
      }

      chatSession.current = result.newChatSession;
      setCurrentKeyIndex(result.newKeyIndex);
    } catch (e: any) {
      const errorMsg = isOnline
        ? e.message || 'Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.'
        : 'Mất kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';

      setError(errorMsg);

      // Add to error manager with retry action
      addError(errorMsg, {
        recoverable: true,
        context: 'Story Generation',
        retryAction: handleGenerate,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    activeStory,
    apiKeys,
    useDefaultKey,
    currentKeyIndex,
    setActiveStory,
    setCurrentKeyIndex,
    isOnline,
    addError,
    clearErrors,
  ]);

  const handleAddUserSegment = useCallback(
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

  const handleAddChapter = useCallback(() => {
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

  const handleStartEdit = (segment: StorySegment) => {
    setEditingSegmentId(segment.id);
    setEditText(segment.content);
  };

  const handleSaveEdit = () => {
    if (!editingSegmentId || !activeStory) return;

    const originalSegment = activeStory.storySegments.find((s) => s.id === editingSegmentId);

    if (originalSegment && originalSegment.type === 'ai') {
      addHistoryEntry(editingSegmentId, originalSegment.content);
    }

    setActiveStory({
      ...activeStory,
      storySegments: activeStory.storySegments.map((s) =>
        s.id === editingSegmentId ? { ...s, content: editText } : s
      ),
    });

    setEditingSegmentId(null);
    setEditText('');
  };

  const handleRevertToVersion = (segmentId: string, historyEntry: HistoryEntry) => {
    if (!activeStory) return;
    if (
      window.confirm(
        'Are you sure you want to revert to this version? The current content will be saved to history.'
      )
    ) {
      const segmentToRevert = activeStory.storySegments.find((s) => s.id === segmentId);
      if (segmentToRevert) {
        addHistoryEntry(segmentId, segmentToRevert.content);
      }

      setActiveStory({
        ...activeStory,
        storySegments: activeStory.storySegments.map((s) =>
          s.id === segmentId ? { ...s, content: historyEntry.content } : s
        ),
      });
      setHistoryViewerTarget(null);
    }
  };

  const handleDeleteSegment = (id: string) => {
    if (!activeStory) return;
    if (
      window.confirm('Are you sure you want to delete this segment? This action cannot be undone.')
    ) {
      setActiveStory({
        ...activeStory,
        storySegments: activeStory.storySegments.filter((s) => s.id !== id),
      });
      deleteHistory(id);
    }
  };

  const handleGenerateProfiles = useCallback(async () => {
    if (!activeStory) return;
    setIsGeneratingProfiles(true);
    setError(null);
    const storyContent = activeStory.storySegments.map((s) => s.content).join('\n\n');
    if (!storyContent.trim()) {
      setError('Cannot analyze an empty story. Please write something first.');
      setIsGeneratingProfiles(false);
      return;
    }

    const rawAvailableKeys = useDefaultKey
      ? [
          { id: 'default', name: 'Default', keys: ['N/A'], activeIndexes: [0], isDefault: true },
          ...apiKeys,
        ]
      : apiKeys;
    // Flatten active keys for cycling
    const availableKeys = rawAvailableKeys.flatMap((apiKey) =>
      apiKey.activeIndexes.map((index) => ({ apiKey, keyIndex: index, key: apiKey.keys[index] }))
    );

    try {
      const { profiles, newKeyIndex } = await generateCharacterProfiles(
        storyContent,
        availableKeys,
        currentKeyIndex
      );

      const updatedProfiles = [...activeStory.characterProfiles];
      profiles.forEach((newProfile) => {
        const existingIndex = updatedProfiles.findIndex(
          (p) => p.name.toLowerCase() === newProfile.name.toLowerCase()
        );
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
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred while generating profiles.');
    } finally {
      setIsGeneratingProfiles(false);
    }
  }, [activeStory, useDefaultKey, apiKeys, currentKeyIndex, setActiveStory, setCurrentKeyIndex, setError, setIsGeneratingProfiles]);

  const handleAddCharacter = () => {
    setEditingProfile(null);
    setIsCharacterEditorOpen(true);
  };

  const handleEditCharacter = (profile: CharacterProfile) => {
    setEditingProfile(profile);
    setIsCharacterEditorOpen(true);
  };

  const handleDeleteCharacter = (id: string) => {
    if (!activeStory) return;
    if (window.confirm('Are you sure you want to delete this character profile?')) {
      setActiveStory({
        ...activeStory,
        characterProfiles: activeStory.characterProfiles.filter((p) => p.id !== id),
      });
    }
  };

  const handleSaveCharacterProfile = useCallback((profile: CharacterProfile) => {
    if (!activeStory) return;
    const index = activeStory.characterProfiles.findIndex((p) => p.id === profile.id);
    if (index > -1) {
      const newProfiles = [...activeStory.characterProfiles];
      newProfiles[index] = profile;
      setActiveStory({ ...activeStory, characterProfiles: newProfiles });
    } else {
      setActiveStory({
        ...activeStory,
        characterProfiles: [...activeStory.characterProfiles, profile],
      });
    }
    setIsCharacterEditorOpen(false);
    setEditingProfile(null);
  }, [activeStory, setActiveStory, setIsCharacterEditorOpen, setEditingProfile]);

  const handleSetConfig = useCallback((updater: React.SetStateAction<GenerationConfig>) => {
    if (!activeStoryId) return;
    setStories((prevStories) => {
      const currentStory = prevStories[activeStoryId];
      if (!currentStory) return prevStories;

      const newConfig =
        typeof updater === 'function' ? updater(currentStory.generationConfig) : updater;

      return {
        ...prevStories,
        [activeStoryId]: {
          ...currentStory,
          generationConfig: newConfig,
        },
      };
    });
  }, [activeStoryId, setStories]);

  const handleSaveKeywordPreset = useCallback(() => {
    if (!activeStory) return;
    const name = window.prompt('Enter a name for this keyword preset:');
    if (name && name.trim()) {
      const newPreset: KeywordPreset = {
        id: Date.now().toString(),
        name: name.trim(),
        avoidKeywords: activeStory.generationConfig.avoidKeywords,
        focusKeywords: activeStory.generationConfig.focusKeywords,
      };
      setActiveStory({
        ...activeStory,
        keywordPresets: [...(activeStory.keywordPresets || []), newPreset],
      });
    }
  }, [activeStory, setActiveStory]);

  const handleCreateStory = useCallback(() => {
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
  }, [stories, setStories, setActiveStoryId]);

  const handleLoadStory = useCallback((id: string) => {
    setActiveStoryId(id);
  }, [setActiveStoryId]);

  const handleDeleteStory = useCallback((id: string) => {
    const newStories = { ...stories };
    delete newStories[id];
    setStories(newStories);
    if (activeStoryId === id) {
      setActiveStoryId(Object.keys(newStories)[0] || null);
    }
  }, [stories, setStories, activeStoryId, setActiveStoryId]);

  // --- Drag and Drop Handlers ---
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, segmentId: string) => {
    e.dataTransfer.setData('text/plain', segmentId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSegmentId(segmentId);
  }, [setDraggedSegmentId]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, segmentId: string) => {
    e.preventDefault();
    if (draggedSegmentId && draggedSegmentId !== segmentId) {
      setDropTargetId(segmentId);
    }
  }, [draggedSegmentId, setDropTargetId]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, dropSegmentId: string) => {
    if (!activeStory) return;
    e.preventDefault();
    const sourceSegmentId = e.dataTransfer.getData('text/plain');

    if (!sourceSegmentId || sourceSegmentId === dropSegmentId) {
      setDraggedSegmentId(null);
      setDropTargetId(null);
      return;
    }

    const sourceIndex = activeStory.storySegments.findIndex((s) => s.id === sourceSegmentId);
    const dropIndex = activeStory.storySegments.findIndex((s) => s.id === dropSegmentId);
    if (sourceIndex === -1 || dropIndex === -1) return;

    const newSegments = [...activeStory.storySegments];
    const [draggedItem] = newSegments.splice(sourceIndex, 1);
    newSegments.splice(dropIndex, 0, draggedItem);

    setActiveStory({ ...activeStory, storySegments: newSegments });

    chatSession.current = null; // Reset chat context after reordering
    setDraggedSegmentId(null);
    setDropTargetId(null);
  }, [activeStory, setActiveStory, setDraggedSegmentId, setDropTargetId, chatSession]);

  const handleDragEnd = useCallback(() => {
    setDraggedSegmentId(null);
    setDropTargetId(null);
  }, [setDraggedSegmentId, setDropTargetId]);

  const isGenerateDisabled = useMemo(() => {
    if (!activeStory) return true;
    return activeStory.storySegments.filter((s) => s.type !== 'chapter').length === 0;
  }, [activeStory]);

  const handleSaveSession = useCallback(() => {
    if (!activeStory) return;
    try {
      const dataStr = JSON.stringify(activeStory, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = `${activeStory.name.replace(/\s+/g, '_').toLowerCase()}_session.json`;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('Failed to save story session.');
    }
  }, [activeStory]);

  const handleLoadSession = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const loadedStory: Story = JSON.parse(result);

        if (
          loadedStory.id &&
          loadedStory.name &&
          Array.isArray(loadedStory.storySegments) &&
          loadedStory.generationConfig
        ) {
          // Normalize the config
          const normalizedConfig = { ...initialConfig, ...loadedStory.generationConfig };
          const normalizedStory: Story = {
            ...loadedStory,
            generationConfig: normalizedConfig,
            keywordPresets: loadedStory.keywordPresets || [],
            selectedPromptIds: Array.isArray(loadedStory.selectedPromptIds)
              ? loadedStory.selectedPromptIds
              : [],
          };
          setStories((prev) => ({ ...prev, [normalizedStory.id]: normalizedStory }));
          setActiveStoryId(normalizedStory.id);
          chatSession.current = null; // Reset chat context
          alert(`Story "${normalizedStory.name}" loaded successfully!`);
        } else {
          throw new Error('Invalid session file format.');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        alert('Error loading session file. Please ensure it is a valid story file.');
      }
    };
    reader.onerror = () => {
      alert('Failed to read the file.');
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  }, [initialConfig, setStories, setActiveStoryId, chatSession]);

  const handleRenameStory = useCallback((id: string, newName: string) => {
    const newStories = { ...stories };
    newStories[id].name = newName;
    newStories[id].updatedAt = Date.now();
    setStories(newStories);
  }, [stories, setStories]);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Left Sidebar */}
      <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2">
        <div className="flex flex-col gap-2 w-full px-2">
          {/* Load Button */}
          <div className="relative">
            <button
              onClick={() => document.getElementById('load-session')?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer"
              title="Load Story Session"
              aria-label="Load Story Session"
            >
              <UploadIcon className="w-5 h-5" />
              <span className="text-xs text-center">Load</span>
            </button>
            <input
              id="load-session"
              type="file"
              accept=".json"
              onChange={handleLoadSession}
              className="hidden"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSession}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Save Story Session"
            aria-label="Save Story Session"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="text-xs text-center">Save</span>
          </button>

          <hr />

          {/* API Keys Button */}
          <button
            onClick={() => setIsApiKeyManagerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Manage API Keys"
            aria-label="Manage API Keys"
          >
            <KeyIcon className="w-5 h-5" />
            <span className="text-xs text-center">API Keys</span>
          </button>

          {/* Prompts Button */}
          <button
            onClick={() => setIsPromptManagerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Manage Custom Prompts"
            aria-label="Manage Custom Prompts"
          >
            <BookmarkIcon className="w-5 h-5" />
            <span className="text-xs text-center">Prompts</span>
          </button>

          {/* Characters Button */}
          <button
            onClick={() => setIsCharacterPanelOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="View Characters"
            aria-label="View Characters"
          >
            <UserGroupIcon className="w-5 h-5" />
            <span className="text-xs text-center">Characters</span>
          </button>

          {/* Chapters Button */}
          <button
            onClick={() => setIsChapterListOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="View Chapter List"
            aria-label="View Chapter List"
          >
            <BookOpenIcon className="w-5 h-5" />
            <span className="text-xs text-center">Chapters</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Export Story"
            aria-label="Export Story"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="text-xs text-center">Export</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => openImportDialog()}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Import Story from File"
            aria-label="Import Story from File"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="text-xs text-center">Import</span>
          </button>

          {/* Image Generator Button */}
          <button
            onClick={() => setIsImageGeneratorOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Generate Image with AI"
            aria-label="Generate Image with AI"
          >
            <WandIcon className="w-5 h-5" />
            <span className="text-xs text-center">Image</span>
          </button>

          {/* Story Structure Analyzer Button */}
          <button
            onClick={() => setIsStoryStructureAnalyzerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Analyze Story Structure"
            aria-label="Analyze Story Structure"
          >
            <BookOpenIcon className="w-5 h-5" />
            <span className="text-xs text-center">Structure</span>
          </button>

          {/* Plot Hole Detector Button */}
          <button
            onClick={() => setIsPlotHoleDetectorOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Detect Plot Holes"
            aria-label="Detect Plot Holes"
          >
            <BugIcon className="w-5 h-5" />
            <span className="text-xs text-center">Plot Holes</span>
          </button>

          {/* Stories Button */}
          <button
            onClick={() => setIsStoryManagerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Manage Stories"
            aria-label="Manage Stories"
          >
            <CollectionIcon className="w-5 h-5" />
            <span className="text-xs text-center">Stories</span>
          </button>

          {/* Plugin Manager Button (Placeholder) */}
          <button
            onClick={() => alert('Plugin Manager coming soon!')}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Manage Plugins (Coming Soon)"
            aria-label="Manage Plugins (Coming Soon)"
          >
            <CogIcon className="w-5 h-5" />
            <span className="text-xs text-center">Plugins</span>
          </button>
        </div>
      </aside>

      {/* Individual settings modals */}
      <Suspense fallback={null}>
        {isApiKeysModalOpen && (
          <ApiKeyManager
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            useDefaultKey={useDefaultKey}
            setUseDefaultKey={setUseDefaultKey}
            onClose={() => setIsApiKeysModalOpen(false)}
          />
        )}
        {isThemeModalOpen && (
          <ThemeManager
            currentTheme={theme}
            setTheme={setTheme}
            onClose={() => setIsThemeModalOpen(false)}
          />
        )}
        {isTTSModalOpen && (
          <TTSSettings
            settings={ttsSettings}
            onSettingsChange={setTtsSettings}
            onClose={() => setIsTTSModalOpen(false)}
          />
        )}
        {isDisplayModalOpen && activeStory && (
          <StoryDisplaySettings
            settings={
              activeStory.displaySettings || {
                autoDetect: true,
                elements: {
                  narrative: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      color: '#000000',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  dialogue: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'italic',
                      color: '#000000',
                      backgroundColor: 'transparent',
                      borderLeft: '2px solid #ccc',
                      borderRadius: '0px',
                      padding: '8px',
                      margin: '8px 0',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  monologue: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'italic',
                      color: '#666666',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  introduction: {
                    enabled: true,
                    style: {
                      fontSize: '16px',
                      fontWeight: 'bold',
                      fontStyle: 'normal',
                      color: '#000000',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'center',
                      lineHeight: '1.8',
                      letterSpacing: 'normal',
                    },
                  },
                  description: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      color: '#444444',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  transition: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      color: '#888888',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '16px 0',
                      textAlign: 'center',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                },
              }
            }
            onSettingsChange={(settings) =>
              setActiveStory({ ...activeStory, displaySettings: settings })
            }
            onClose={() => setIsDisplayModalOpen(false)}
          />
        )}
      </Suspense>

      {/* Modals and panels with lazy loading */}
      <Suspense fallback={null}>
        {isApiKeyManagerOpen && (
          <ApiKeyManager
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            useDefaultKey={useDefaultKey}
            setUseDefaultKey={setUseDefaultKey}
            onClose={() => setIsApiKeyManagerOpen(false)}
          />
        )}
        {isPromptManagerOpen && (
          <CustomPromptsManager
            prompts={globalPrompts}
            setPrompts={setGlobalPrompts}
            onClose={() => setIsPromptManagerOpen(false)}
          />
        )}
        {isKeywordPresetManagerOpen && activeStory && (
          <KeywordPresetManager
            presets={activeStory.keywordPresets}
            setPresets={(updater) => {
              const newPresets =
                typeof updater === 'function' ? updater(activeStory.keywordPresets || []) : updater;
              setActiveStory({ ...activeStory, keywordPresets: newPresets });
            }}
            onClose={() => setIsKeywordPresetManagerOpen(false)}
          />
        )}
        {historyViewerTarget && (
          <VersionHistoryViewer
            segmentId={historyViewerTarget}
            onClose={() => setHistoryViewerTarget(null)}
            onRevert={handleRevertToVersion}
          />
        )}
        {isCharacterEditorOpen && (
          <CharacterProfileEditor
            profile={editingProfile}
            onSave={handleSaveCharacterProfile}
            onClose={() => setIsCharacterEditorOpen(false)}
          />
        )}
        {isCharacterPanelOpen && activeStory && (
          <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-40">
            <CharacterPanel
              profiles={activeStory.characterProfiles}
              onAdd={handleAddCharacter}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteCharacter}
              onGenerate={handleGenerateProfiles}
              isGenerating={isGeneratingProfiles}
              onClose={() => setIsCharacterPanelOpen(false)}
            />
          </div>
        )}
        {isStoryManagerOpen && (
          <StoryManager
            stories={stories}
            activeStoryId={activeStoryId}
            onLoadStory={handleLoadStory}
            onCreateStory={handleCreateStory}
            onDeleteStory={handleDeleteStory}
            onRenameStory={handleRenameStory}
            onClose={() => setIsStoryManagerOpen(false)}
          />
        )}
        {isThemeManagerOpen && (
          <ThemeManager
            currentTheme={theme}
            setTheme={setTheme}
            onClose={() => setIsThemeManagerOpen(false)}
          />
        )}
        {isDisplaySettingsOpen && activeStory && (
          <StoryDisplaySettings
            settings={
              activeStory.displaySettings || {
                autoDetect: true,
                elements: {
                  narrative: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      color: '#000000',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  dialogue: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'italic',
                      color: '#000000',
                      backgroundColor: 'transparent',
                      borderLeft: '2px solid #ccc',
                      borderRadius: '0px',
                      padding: '8px',
                      margin: '8px 0',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  monologue: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'italic',
                      color: '#666666',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  introduction: {
                    enabled: true,
                    style: {
                      fontSize: '16px',
                      fontWeight: 'bold',
                      fontStyle: 'normal',
                      color: '#000000',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'center',
                      lineHeight: '1.8',
                      letterSpacing: 'normal',
                    },
                  },
                  description: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      color: '#444444',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '0px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                  transition: {
                    enabled: true,
                    style: {
                      fontSize: '14px',
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      color: '#888888',
                      backgroundColor: 'transparent',
                      borderRadius: '0px',
                      padding: '0px',
                      margin: '16px 0',
                      textAlign: 'center',
                      lineHeight: '1.6',
                      letterSpacing: 'normal',
                    },
                  },
                },
              }
            }
            onSettingsChange={(settings) =>
              setActiveStory({ ...activeStory, displaySettings: settings })
            }
            onClose={() => setIsDisplaySettingsOpen(false)}
          />
        )}
        {isChapterListOpen && activeStory && (
          <div
            className="fixed inset-0 bg-background/80 flex justify-center items-center z-40 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Danh sách chương</h2>
                <button
                  onClick={() => setIsChapterListOpen(false)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Đóng danh sách chương"
                  aria-label="Đóng danh sách chương"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <ChapterList
                  storySegments={activeStory.storySegments}
                  onNavigateToChapter={(chapterId) => {
                    // Scroll to the chapter in the story
                    const chapterElement = document.querySelector(
                      `[data-segment-id="${chapterId}"]`
                    );
                    if (chapterElement) {
                      chapterElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    setIsChapterListOpen(false);
                  }}
                  onAddChapter={() => {
                    const title = window.prompt('Nhập tiêu đề cho chương mới:');
                    if (title && title.trim()) {
                      const newChapter: StorySegment = {
                        id: Date.now().toString(),
                        type: 'chapter',
                        content: title.trim(),
                      };
                      setActiveStory({
                        ...activeStory,
                        storySegments: [...activeStory.storySegments, newChapter],
                      });
                    }
                  }}
                  onEditChapter={(chapterId, newTitle) => {
                    setActiveStory({
                      ...activeStory,
                      storySegments: activeStory.storySegments.map((s) =>
                        s.id === chapterId ? { ...s, content: newTitle } : s
                      ),
                    });
                  }}
                  onDeleteChapter={(chapterId) => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa chương này?')) {
                      setActiveStory({
                        ...activeStory,
                        storySegments: activeStory.storySegments.filter((s) => s.id !== chapterId),
                      });
                    }
                  }}
                  currentChapterId={undefined}
                />
              </div>
            </div>
          </div>
        )}
      </Suspense>

      {/* Import Dialogs */}
      <Suspense fallback={null}>
        {isImportDialogOpen && (
          <ImportDialog
            isOpen={isImportDialogOpen}
            onClose={closeImportDialog}
            onImportComplete={onImportComplete}
          />
        )}
        {isImageGeneratorOpen && (
          <ImageGenerator
            onClose={() => setIsImageGeneratorOpen(false)}
          />
        )}
        {isStoryStructureAnalyzerOpen && activeStory && (
          <StoryStructureAnalyzer
            storyContent={activeStory.storySegments.map(s => s.content).join('\n\n')}
            onClose={() => setIsStoryStructureAnalyzerOpen(false)}
          />
        )}
        {isPlotHoleDetectorOpen && activeStory && (
          <PlotHoleDetector
            storyContent={activeStory.storySegments.map(s => s.content).join('\n\n')}
            onClose={() => setIsPlotHoleDetectorOpen(false)}
          />
        )}
      </Suspense>

      <StoryMainContent
        activeStory={activeStory}
        filteredSegments={filteredSegments}
        editingSegmentId={editingSegmentId}
        editText={editText}
        isSpeaking={isSpeaking}
        searchQuery={searchQuery}
        saveStatus={saveStatus}
        lastReadIndex={lastReadIndex}
        unreadMarkerRef={unreadMarkerRef}
        endOfStoryRef={endOfStoryRef}
        setEditText={setEditText}
        setEditingSegmentId={setEditingSegmentId}
        setHistoryViewerTarget={setHistoryViewerTarget}
        setSearchQuery={setSearchQuery}
        setActiveStory={setActiveStory}
        addHistoryEntry={addHistoryEntry}
        deleteHistory={deleteHistory}
        toggleSpeech={toggle}
        stopSpeech={stop}
        handleGenerate={handleGenerate}
        handleAddUserSegment={handleAddUserSegment}
        handleAddChapter={handleAddChapter}
        handleRevertToVersion={handleRevertToVersion}
        draggedSegmentId={draggedSegmentId}
        dropTargetId={dropTargetId}
        handleDragStart={handleDragStart}
        handleDragEnter={handleDragEnter}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        handleDragEnd={handleDragEnd}
        setDropTargetId={setDropTargetId}
        chatSessionRef={chatSession}
        segmentRefs={segmentRefs}
        isSettingsPanelOpen={isSettingsPanelOpen}
        setIsSettingsPanelOpen={setIsSettingsPanelOpen}
        setIsApiKeysModalOpen={setIsApiKeysModalOpen}
        setIsThemeModalOpen={setIsThemeModalOpen}
        setIsTTSModalOpen={setIsTTSModalOpen}
        setIsDisplayModalOpen={setIsDisplayModalOpen}
        isNavigatorOpen={isNavigatorOpen}
        setIsNavigatorOpen={setIsNavigatorOpen}
      />
      {/* Desktop Aside */}
      {isDesktop && (
        <aside
          className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isNavigatorOpen ? 'w-[380px]' : 'w-0'}`}
        >
          <div className="w-[380px] h-full">
            {activeStory && (
              <Suspense fallback={<ComponentLoadingFallback />}>
                <ContentNavigator
                  key={`navigator-${activeStory.id}`}
                  config={activeStory.generationConfig}
                  setConfig={handleSetConfig}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  isGenerateDisabled={isGenerateDisabled}
                  customPrompts={globalPrompts}
                  selectedPromptIds={activeStory.selectedPromptIds || []}
                  setSelectedPromptIds={(ids) => {
                    setStories((prev) => ({
                      ...prev,
                      [activeStory.id]: {
                        ...activeStory,
                        selectedPromptIds: ids,
                      },
                    }));
                  }}
                  onManagePrompts={() => setIsPromptManagerOpen(true)}
                  onAddPrompt={(prompts) => {
                    const newPrompts = Array.isArray(prompts) ? prompts : [prompts];
                    const promptsWithIds = newPrompts.map((prompt) => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      ...prompt,
                    }));
                    setGlobalPrompts([...globalPrompts, ...promptsWithIds]);
                  }}
                  keywordPresets={activeStory.keywordPresets || []}
                  onManageKeywordPresets={() => setIsKeywordPresetManagerOpen(true)}
                  onSaveKeywordPreset={handleSaveKeywordPreset}
                  storySegments={activeStory.storySegments}
                />
              </Suspense>
            )}
          </div>
        </aside>
      )}
      {/* Mobile Overlay */}
      {isNavigatorOpen && !isDesktop && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsNavigatorOpen(false)}
          ></div>
          <aside className="absolute right-0 top-0 w-80 h-full bg-secondary border-l border-border">
            {activeStory && (
              <Suspense fallback={<ComponentLoadingFallback />}>
                <ContentNavigator
                  config={activeStory.generationConfig}
                  setConfig={handleSetConfig}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  isGenerateDisabled={isGenerateDisabled}
                  customPrompts={globalPrompts}
                  selectedPromptIds={activeStory.selectedPromptIds || []}
                  setSelectedPromptIds={(ids) => {
                    setStories((prev) => ({
                      ...prev,
                      [activeStory.id]: {
                        ...activeStory,
                        selectedPromptIds: ids,
                      },
                    }));
                  }}
                  onManagePrompts={() => setIsPromptManagerOpen(true)}
                  onAddPrompt={(prompts) => {
                    const newPrompts = Array.isArray(prompts) ? prompts : [prompts];
                    const promptsWithIds = newPrompts.map((prompt) => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      ...prompt,
                    }));
                    setGlobalPrompts([...globalPrompts, ...promptsWithIds]);
                  }}
                  keywordPresets={activeStory.keywordPresets || []}
                  onManageKeywordPresets={() => setIsKeywordPresetManagerOpen(true)}
                  onSaveKeywordPreset={handleSaveKeywordPreset}
                  storySegments={activeStory.storySegments}
                />
              </Suspense>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

App.displayName = 'App';

export default React.memo(App);
