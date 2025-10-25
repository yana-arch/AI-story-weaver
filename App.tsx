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
import { usePerformanceMonitor, useMemoryLeakDetector, useApiPerformanceMonitor } from './hooks/usePerformanceMonitor';
import { useImportManager } from './hooks/useImportManager';
import * as storyManager from './services/storyManagerService';
import { generateStorySegment, generateCharacterProfiles } from './services/geminiService';
import { addHistoryEntry, deleteHistory } from './services/historyService';
import { withRetry, RETRY_OPTIONS } from './utils/retryUtils';
import chapterService from './services/chapterService';
import { useSettings } from './contexts/SettingsContext';

// Lazy-loaded components for better initial bundle size
const ApiKeyManager = lazy(() => import('./components/ApiKeyManager').then(module => ({ default: module.ApiKeyManager })));
const ContentNavigator = lazy(() => import('./components/ContentNavigator').then(module => ({ default: module.ContentNavigator })));
const CustomPromptsManager = lazy(() => import('./components/CustomPromptsManager').then(module => ({ default: module.CustomPromptsManager })));
const KeywordPresetManager = lazy(() => import('./components/KeywordPresetManager').then(module => ({ default: module.KeywordPresetManager })));
const VersionHistoryViewer = lazy(() => import('./components/VersionHistoryViewer').then(module => ({ default: module.VersionHistoryViewer })));
const MarkdownRenderer = lazy(() => import('./components/MarkdownRenderer').then(module => ({ default: module.MarkdownRenderer })));
const StoryContentRenderer = lazy(() => import('./components/StoryContentRenderer').then(module => ({ default: module.StoryContentRenderer })));
const StoryDisplaySettings = lazy(() => import('./components/StoryDisplaySettings').then(module => ({ default: module.StoryDisplaySettings })));
const CharacterPanel = lazy(() => import('./components/CharacterPanel').then(module => ({ default: module.CharacterPanel })));
const CharacterProfileEditor = lazy(() => import('./components/CharacterProfileEditor').then(module => ({ default: module.CharacterProfileEditor })));
const ChapterList = lazy(() => import('./components/ChapterList').then(module => ({ default: module.ChapterList })));
const StoryManager = lazy(() => import('./components/StoryManager').then(module => ({ default: module.StoryManager })));
const ThemeManager = lazy(() => import('./components/ThemeManager').then(module => ({ default: module.ThemeManager })));
const TTSSettings = lazy(() => import('./components/TTSSettings').then(module => ({ default: module.TTSSettings })));
const ExportDialog = lazy(() => import('./components/ExportDialog').then(module => ({ default: module.ExportDialog })));
const ImportDialog = lazy(() => import('./components/ImportDialog').then(module => ({ default: module.ImportDialog })));
const ChapterPreviewDialog = lazy(() => import('./components/ChapterPreviewDialog').then(module => ({ default: module.ChapterPreviewDialog })));

// Loading component for lazy-loaded components
const ComponentLoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
    </div>
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
    type Story
} from './types';
import type { ImportedStory } from './types/chapter';
import { KeyIcon, BookmarkIcon, EditIcon, SaveIcon, CopyIcon, TrashIcon, CloseIcon, CheckCircleIcon, HistoryIcon, DragHandleIcon, SearchIcon, UploadIcon, DownloadIcon, BookOpenIcon, UserGroupIcon, CollectionIcon, PanelRightIcon, PaintBrushIcon, SpeakerIcon, CogIcon } from './components/icons';

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
    const [activeSettingsTab, setActiveSettingsTab] = useState<'api-keys' | 'theme' | 'tts' | 'display'>('api-keys');
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    // Individual modal states for settings tabs
    const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isTTSModalOpen, setIsTTSModalOpen] = useState(false);
    const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
    const [ttsSettings, setTtsSettings] = useLocalStorage<TTSOptions>('ttsSettings', { rate: 1, pitch: 1 });

    const { isSpeaking, toggle, stop } = useTTS(ttsSettings);

    // Import Manager
    const {
        isImportDialogOpen,
        openImportDialog,
        closeImportDialog,
        handleImportComplete,
    } = useImportManager();

    // Import completion handler
    const onImportComplete = handleImportComplete((importedStories) => {
        // Create new stories from imported stories
        const newStories: Record<string, Story> = { ...stories };
        importedStories.forEach(story => {
            // Convert chapters to story segments
            const storySegments: StorySegment[] = story.chapters.map(chapter => ({
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
        document.body.classList.remove('theme-zinc', 'theme-slate', 'theme-stone', 'theme-gray', 'theme-neutral', 'theme-red', 'theme-rose', 'theme-orange', 'theme-green', 'theme-blue', 'theme-yellow', 'theme-violet');
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
        let activeId = migratedStoryId || storyManager.getActiveStoryId() || Object.keys(allStories)[0] || null;
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

    const setActiveStory = (story: Story) => {
        setStories(prev => ({ ...prev, [story.id]: story }));
    };

    // Reset chat session if story is cleared or generation mode changes to REWRITE
    useEffect(() => {
        if (!activeStory || activeStory.storySegments.length === 0 || activeStory.generationConfig.generationMode === GenerationMode.REWRITE) {
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
        return activeStory.storySegments.filter(segment =>
            segment.type !== 'chapter' && segment.content.toLowerCase().includes(lowercasedQuery)
        );
    }, [activeStory, searchQuery]);
    
     const lastReadIndex = useMemo(() => {
        if (!activeStory || !activeStory.lastReadSegmentId) return -1;
        return filteredSegments.findIndex(s => s.id === activeStory.lastReadSegmentId);
    }, [filteredSegments, activeStory]);

    // Reading progress observer effect
    useEffect(() => {
        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
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

        segmentRefs.current.forEach(el => {
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

        const lastUserSegment = [...activeStory.storySegments].reverse().find(s => s.type === 'user');
        if (!lastUserSegment && activeStory.generationConfig.generationMode === GenerationMode.CONTINUE && activeStory.storySegments.length > 0) {
            const errorMsg = "Cannot continue without a new user prompt. Please add to the story.";
            setError(errorMsg);
            addError(errorMsg, {
                recoverable: false,
                context: 'Story Generation',
            });
            setIsLoading(false);
            return;
        }

        // Check if rewriting a specific chapter
        if (activeStory.generationConfig.generationMode === GenerationMode.REWRITE &&
            activeStory.generationConfig.rewriteTarget === RewriteTarget.SELECTED_CHAPTER &&
            !activeStory.generationConfig.selectedChapterId) {
            const errorMsg = "Vui lòng chọn chương cần viết lại.";
            setError(errorMsg);
            addError(errorMsg, {
                recoverable: false,
                context: 'Story Generation',
            });
            setIsLoading(false);
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
        const selectedPromptsContent = globalPrompts
            .filter(p => selectedPromptIds.includes(p.id))
            .map(p => p.content);



        const availableKeys = useDefaultKey ? [{ id: 'default', name: 'Default', key: 'N/A', isDefault: true }, ...apiKeys] : apiKeys;

        // Use retry mechanism for API calls with performance monitoring
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

            chatSession.current = result.newChatSession;
            setCurrentKeyIndex(result.newKeyIndex);

        } catch (e: any) {
            const errorMsg = isOnline
                ? (e.message || 'Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.')
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
    }, [activeStory, apiKeys, useDefaultKey, currentKeyIndex, setActiveStory, setCurrentKeyIndex, isOnline, addError, clearErrors]);

    const handleAddUserSegment = useCallback((content: string) => {
        if (!content.trim() || !activeStory) return;
        const newSegment: StorySegment = {
            id: Date.now().toString(),
            type: 'user',
            content: content.trim(),
        };
        setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newSegment] });
    }, [activeStory]);

    const handleAddChapter = useCallback(() => {
        if (!activeStory) return;
        const title = window.prompt("Enter the title for the new chapter:");
        if (title && title.trim()) {
            const newChapter: StorySegment = {
                id: Date.now().toString(),
                type: 'chapter',
                content: title.trim()
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

        const originalSegment = activeStory.storySegments.find(s => s.id === editingSegmentId);

        if (originalSegment && originalSegment.type === 'ai') {
            addHistoryEntry(editingSegmentId, originalSegment.content);
        }

        setActiveStory({
            ...activeStory,
            storySegments: activeStory.storySegments.map(s => 
                s.id === editingSegmentId ? { ...s, content: editText } : s
            )
        });

        setEditingSegmentId(null);
        setEditText('');
    };

    const handleRevertToVersion = (segmentId: string, historyEntry: HistoryEntry) => {
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
            setHistoryViewerTarget(null);
        }
    };


    const handleDeleteSegment = (id: string) => {
        if (!activeStory) return;
        if(window.confirm("Are you sure you want to delete this segment? This action cannot be undone.")){
            setActiveStory({
                ...activeStory,
                storySegments: activeStory.storySegments.filter(s => s.id !== id)
            });
            deleteHistory(id);
        }
    };

    const handleGenerateProfiles = async () => {
        if (!activeStory) return;
        setIsGeneratingProfiles(true);
        setError(null);
        const storyContent = activeStory.storySegments.map(s => s.content).join('\n\n');
        if (!storyContent.trim()) {
            setError("Cannot analyze an empty story. Please write something first.");
            setIsGeneratingProfiles(false);
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
            setError(e.message || "An unknown error occurred while generating profiles.");
        } finally {
            setIsGeneratingProfiles(false);
        }
    };
    
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
        if (window.confirm("Are you sure you want to delete this character profile?")) {
            setActiveStory({
                ...activeStory,
                characterProfiles: activeStory.characterProfiles.filter(p => p.id !== id)
            });
        }
    };

    const handleSaveCharacterProfile = (profile: CharacterProfile) => {
        if (!activeStory) return;
        const index = activeStory.characterProfiles.findIndex(p => p.id === profile.id);
        if (index > -1) {
            const newProfiles = [...activeStory.characterProfiles];
            newProfiles[index] = profile;
            setActiveStory({ ...activeStory, characterProfiles: newProfiles });
        } else {
            setActiveStory({ ...activeStory, characterProfiles: [...activeStory.characterProfiles, profile] });
        }
        setIsCharacterEditorOpen(false);
        setEditingProfile(null);
    };

    const handleSetConfig = (updater: React.SetStateAction<GenerationConfig>) => {
        if (!activeStoryId) return;
        setStories(prevStories => {
            const currentStory = prevStories[activeStoryId];
            if (!currentStory) return prevStories;

            const newConfig = typeof updater === 'function' 
                ? updater(currentStory.generationConfig) 
                : updater;

            return {
                ...prevStories,
                [activeStoryId]: {
                    ...currentStory,
                    generationConfig: newConfig,
                },
            };
        });
    };

    const handleSaveKeywordPreset = () => {
        if (!activeStory) return;
        const name = window.prompt("Enter a name for this keyword preset:");
        if (name && name.trim()) {
            const newPreset: KeywordPreset = {
                id: Date.now().toString(),
                name: name.trim(),
                avoidKeywords: activeStory.generationConfig.avoidKeywords,
                focusKeywords: activeStory.generationConfig.focusKeywords,
            };
            setActiveStory({ 
                ...activeStory, 
                keywordPresets: [...(activeStory.keywordPresets || []), newPreset] 
            });
        }
    };

    const handleCreateStory = () => {
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
    };

    const handleLoadStory = (id: string) => {
        setActiveStoryId(id);
    };

    const handleDeleteStory = (id: string) => {
        const newStories = { ...stories };
        delete newStories[id];
        setStories(newStories);
        if (activeStoryId === id) {
            setActiveStoryId(Object.keys(newStories)[0] || null);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, segmentId: string) => {
        e.dataTransfer.setData('text/plain', segmentId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedSegmentId(segmentId);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, segmentId: string) => {
        e.preventDefault();
        if (draggedSegmentId && draggedSegmentId !== segmentId) {
            setDropTargetId(segmentId);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropSegmentId: string) => {
        if (!activeStory) return;
        e.preventDefault();
        const sourceSegmentId = e.dataTransfer.getData('text/plain');

        if (!sourceSegmentId || sourceSegmentId === dropSegmentId) {
            setDraggedSegmentId(null);
            setDropTargetId(null);
            return;
        }

        const sourceIndex = activeStory.storySegments.findIndex(s => s.id === sourceSegmentId);
        const dropIndex = activeStory.storySegments.findIndex(s => s.id === dropSegmentId);
        if (sourceIndex === -1 || dropIndex === -1) return;

        const newSegments = [...activeStory.storySegments];
        const [draggedItem] = newSegments.splice(sourceIndex, 1);
        newSegments.splice(dropIndex, 0, draggedItem);
        
        setActiveStory({ ...activeStory, storySegments: newSegments });

        chatSession.current = null; // Reset chat context after reordering
        setDraggedSegmentId(null);
        setDropTargetId(null);
    };

    const handleDragEnd = () => {
        setDraggedSegmentId(null);
        setDropTargetId(null);
    };


    const isGenerateDisabled = useMemo(() => {
        if (!activeStory) return true;
        return activeStory.storySegments.filter(s => s.type !== 'chapter').length === 0;
    }, [activeStory]);


    const handleSaveSession = () => {
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
            console.error("Failed to save session:", error);
            alert("Failed to save story session.");
        }
    };

    const handleLoadSession = (event: React.ChangeEvent<HTMLInputElement>) => {
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
                    selectedPromptIds: Array.isArray(loadedStory.selectedPromptIds) ? loadedStory.selectedPromptIds : []
                };
                    setStories(prev => ({ ...prev, [normalizedStory.id]: normalizedStory }));
                    setActiveStoryId(normalizedStory.id);
                    chatSession.current = null; // Reset chat context
                    alert(`Story "${normalizedStory.name}" loaded successfully!`);
                } else {
                    throw new Error('Invalid session file format.');
                }
            } catch (error) {
                console.error("Failed to load session:", error);
                alert('Error loading session file. Please ensure it is a valid story file.');
            }
        };
        reader.onerror = () => {
            alert('Failed to read the file.');
        }
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    const handleRenameStory = (id: string, newName: string) => {
        const newStories = { ...stories };
        newStories[id].name = newName;
        newStories[id].updatedAt = Date.now();
        setStories(newStories);
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-sans">
            {/* Left Sidebar */}
            <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2">
                <div className="flex flex-col gap-2 w-full px-2">
                    {/* Load Button */}
                    <div className="relative">
                        <label htmlFor="load-session" className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer" title="Load Story Session">
                            <UploadIcon className="w-5 h-5" />
                            <span className="text-xs text-center">Load</span>
                        </label>
                        <input id="load-session" type="file" accept=".json" onChange={handleLoadSession} className="hidden" />
                    </div>

                    {/* Save Button */}
                    <button onClick={handleSaveSession} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="Save Story Session">
                        <DownloadIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Save</span>
                    </button>

                    <hr/>

                    {/* Prompts Button */}
                    <button onClick={() => setIsPromptManagerOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="Manage Custom Prompts">
                        <BookmarkIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Prompts</span>
                    </button>

                    {/* Characters Button */}
                    <button onClick={() => setIsCharacterPanelOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="View Characters">
                        <UserGroupIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Characters</span>
                    </button>

                    {/* Chapters Button */}
                    <button onClick={() => setIsChapterListOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="View Chapter List">
                        <BookOpenIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Chapters</span>
                    </button>

                    {/* Export Button */}
                    <button onClick={() => setIsExportDialogOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="Export Story">
                        <DownloadIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Export</span>
                    </button>

                    {/* Import Button */}
                    <button onClick={() => openImportDialog()} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="Import Story from File">
                        <UploadIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Import</span>
                    </button>

                    {/* Stories Button */}
                    <button onClick={() => setIsStoryManagerOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors" title="Manage Stories">
                        <CollectionIcon className="w-5 h-5" />
                        <span className="text-xs text-center">Stories</span>
                    </button>
                </div>
            </aside>



            {/* Individual settings modals */}
            <Suspense fallback={null}>
                {isApiKeysModalOpen && <ApiKeyManager apiKeys={apiKeys} setApiKeys={setApiKeys} useDefaultKey={useDefaultKey} setUseDefaultKey={setUseDefaultKey} onClose={() => setIsApiKeysModalOpen(false)} />}
                {isThemeModalOpen && <ThemeManager currentTheme={theme} setTheme={setTheme} onClose={() => setIsThemeModalOpen(false)} />}
                {isTTSModalOpen && <TTSSettings settings={ttsSettings} onSettingsChange={setTtsSettings} onClose={() => setIsTTSModalOpen(false)} />}
                {isDisplayModalOpen && activeStory && <StoryDisplaySettings settings={activeStory.displaySettings || {
                    autoDetect: true,
                    elements: {
                        narrative: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'normal', color: '#000000', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        dialogue: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'italic', color: '#000000', backgroundColor: 'transparent', borderLeft: '2px solid #ccc', borderRadius: '0px', padding: '8px', margin: '8px 0', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        monologue: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'italic', color: '#666666', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        introduction: { enabled: true, style: { fontSize: '16px', fontWeight: 'bold', fontStyle: 'normal', color: '#000000', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'center', lineHeight: '1.8', letterSpacing: 'normal' } },
                        description: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'normal', color: '#444444', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        transition: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'normal', color: '#888888', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '16px 0', textAlign: 'center', lineHeight: '1.6', letterSpacing: 'normal' } }
                    }
                }} onSettingsChange={(settings) => setActiveStory({ ...activeStory, displaySettings: settings })} onClose={() => setIsDisplayModalOpen(false)} />}
            </Suspense>

            {/* Modals and panels with lazy loading */}
            <Suspense fallback={null}>
                {isApiKeyManagerOpen && <ApiKeyManager apiKeys={apiKeys} setApiKeys={setApiKeys} useDefaultKey={useDefaultKey} setUseDefaultKey={setUseDefaultKey} onClose={() => setIsApiKeyManagerOpen(false)} />}
                {isPromptManagerOpen && <CustomPromptsManager prompts={globalPrompts} setPrompts={setGlobalPrompts} onClose={() => setIsPromptManagerOpen(false)} />}
                {isKeywordPresetManagerOpen && activeStory && <KeywordPresetManager presets={activeStory.keywordPresets} setPresets={(updater) => {
                    const newPresets = typeof updater === 'function' ? updater(activeStory.keywordPresets || []) : updater;
                    setActiveStory({ ...activeStory, keywordPresets: newPresets });
                }} onClose={() => setIsKeywordPresetManagerOpen(false)} />}
                {historyViewerTarget && <VersionHistoryViewer segmentId={historyViewerTarget} onClose={() => setHistoryViewerTarget(null)} onRevert={handleRevertToVersion} />}
                {isCharacterEditorOpen && <CharacterProfileEditor profile={editingProfile} onSave={handleSaveCharacterProfile} onClose={() => setIsCharacterEditorOpen(false)} />}
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
                {isThemeManagerOpen && <ThemeManager currentTheme={theme} setTheme={setTheme} onClose={() => setIsThemeManagerOpen(false)} />}
                {isDisplaySettingsOpen && activeStory && <StoryDisplaySettings settings={activeStory.displaySettings || {
                    autoDetect: true,
                    elements: {
                        narrative: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'normal', color: '#000000', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        dialogue: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'italic', color: '#000000', backgroundColor: 'transparent', borderLeft: '2px solid #ccc', borderRadius: '0px', padding: '8px', margin: '8px 0', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        monologue: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'italic', color: '#666666', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        introduction: { enabled: true, style: { fontSize: '16px', fontWeight: 'bold', fontStyle: 'normal', color: '#000000', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'center', lineHeight: '1.8', letterSpacing: 'normal' } },
                        description: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'normal', color: '#444444', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '0px', textAlign: 'left', lineHeight: '1.6', letterSpacing: 'normal' } },
                        transition: { enabled: true, style: { fontSize: '14px', fontWeight: 'normal', fontStyle: 'normal', color: '#888888', backgroundColor: 'transparent', borderRadius: '0px', padding: '0px', margin: '16px 0', textAlign: 'center', lineHeight: '1.6', letterSpacing: 'normal' } }
                    }
                }} onSettingsChange={(settings) => setActiveStory({ ...activeStory, displaySettings: settings })} onClose={() => setIsDisplaySettingsOpen(false)} />}
                {isChapterListOpen && activeStory && (
                    <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-40 p-4">
                        <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-foreground">Danh sách chương</h2>
                                <button
                                    onClick={() => setIsChapterListOpen(false)}
                                    className="p-1 hover:bg-muted rounded transition-colors"
                                    title="Đóng danh sách chương"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                                <ChapterList
                                    storySegments={activeStory.storySegments}
                                    onNavigateToChapter={(chapterId) => {
                                        // Scroll to the chapter in the story
                                        const chapterElement = document.querySelector(`[data-segment-id="${chapterId}"]`);
                                        if (chapterElement) {
                                            chapterElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                        setIsChapterListOpen(false);
                                    }}
                                    onAddChapter={() => {
                                        const title = window.prompt("Nhập tiêu đề cho chương mới:");
                                        if (title && title.trim()) {
                                            const newChapter: StorySegment = {
                                                id: Date.now().toString(),
                                                type: 'chapter',
                                                content: title.trim()
                                            };
                                            setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newChapter] });
                                        }
                                    }}
                                    onEditChapter={(chapterId, newTitle) => {
                                        setActiveStory({
                                            ...activeStory,
                                            storySegments: activeStory.storySegments.map(s =>
                                                s.id === chapterId ? { ...s, content: newTitle } : s
                                            )
                                        });
                                    }}
                                    onDeleteChapter={(chapterId) => {
                                        if (window.confirm("Bạn có chắc chắn muốn xóa chương này?")) {
                                            setActiveStory({
                                                ...activeStory,
                                                storySegments: activeStory.storySegments.filter(s => s.id !== chapterId)
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
            </Suspense>

            <main className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden">
                <header className="flex justify-between items-center mb-4 flex-shrink-0 gap-2 md:gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground flex-shrink-0">{activeStory ? activeStory.name : 'AI Creative Writer'}</h1>
                        <div className={`transition-opacity duration-500 ${saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>All changes saved.</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center px-2 md:px-4">
                        <div className="relative w-full max-w-lg">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </div>
                            <input
                                id="search-story"
                                name="search-story"
                                className="block w-full rounded-md border-0 bg-input py-2 pl-10 pr-10 text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm"
                                placeholder="Search story..."
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                                        aria-label="Clear search"
                                    >
                                        <CloseIcon className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 flex-wrap justify-end">
                        <div className="relative">
                            <button onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Settings">
                                <CogIcon className="w-4 h-4" />
                            </button>
                            {isSettingsPanelOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setIsSettingsPanelOpen(false);
                                                setIsApiKeysModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded text-left"
                                        >
                                            <KeyIcon className="w-4 h-4" />
                                            API Keys
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsSettingsPanelOpen(false);
                                                setIsThemeModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded text-left"
                                        >
                                            <PaintBrushIcon className="w-4 h-4" />
                                            Theme
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsSettingsPanelOpen(false);
                                                setIsTTSModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded text-left"
                                        >
                                            <SpeakerIcon className="w-4 h-4" />
                                            TTS
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsSettingsPanelOpen(false);
                                                setIsDisplayModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded text-left"
                                        >
                                            <PaintBrushIcon className="w-4 h-4" />
                                            Display
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                         <button onClick={() => setIsNavigatorOpen(!isNavigatorOpen)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title={isNavigatorOpen ? "Hide AI Panel" : "Show AI Panel"}>
                            <PanelRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow bg-card rounded-lg p-4 overflow-y-auto mb-4 relative">
                    {!activeStory ? (
                        <div className="text-center text-muted-foreground absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            <p className="text-lg">Loading story...</p>
                        </div>
                    ) : filteredSegments.length === 0 && (
                        <div className="text-center text-muted-foreground absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            {searchQuery ? (
                                <p className="text-lg">No segments match your search.</p>
                            ) : (
                                <>
                                    <p className="text-lg">Bắt đầu câu chuyện của bạn.</p>
                                    <p>Viết đoạn mở đầu vào ô bên dưới.</p>
                                </>
                            )}
                        </div>
                    )}
                    {activeStory && filteredSegments.map((segment, index) => {
                        const isBeingDragged = draggedSegmentId === segment.id;
                        const isDropTarget = dropTargetId === segment.id;

                        const setSegmentRef = (el: HTMLDivElement | null) => {
                            if (el) {
                                segmentRefs.current.set(segment.id, el);
                            } else {
                                segmentRefs.current.delete(segment.id);
                            }
                        };
                        
                        const showUnreadMarker = index === lastReadIndex + 1 && lastReadIndex < filteredSegments.length - 1;

                        return (
                            <React.Fragment key={segment.id}>
                                {showUnreadMarker && (
                                    <div ref={unreadMarkerRef} className="relative my-6 flex items-center" aria-label="New content below">
                                        <span className="flex-shrink-0 bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground rounded-full">MỚI</span>
                                        <div className="flex-grow border-t-2 border-dashed border-primary ml-2"></div>
                                    </div>
                                )}
                                {segment.type === 'chapter' ? (
                                    <div ref={setSegmentRef} data-segment-id={segment.id} className="flex items-center my-6">
                                        <div className="flex-grow border-t border-border"></div>
                                        <h2 className="flex-shrink-0 px-4 text-center text-lg font-bold text-muted-foreground tracking-wider uppercase">{segment.content}</h2>
                                        <div className="flex-grow border-t border-border"></div>
                                    </div>
                                ) : (
                                    <div
                                        ref={setSegmentRef}
                                        data-segment-id={segment.id}
                                        draggable={!editingSegmentId}
                                        onDragStart={(e) => !editingSegmentId && handleDragStart(e, segment.id)}
                                        onDragEnter={(e) => handleDragEnter(e, segment.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, segment.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragLeave={() => setDropTargetId(null)}
                                        className={`
                                            group relative transition-all duration-200
                                            ${segment.type === 'user' ? 'pr-8' : 'pl-8'}
                                            ${isBeingDragged ? 'opacity-30' : 'opacity-100'}
                                            ${isDropTarget ? 'pt-2' : ''}
                                        `}
                                    >
                                        {isDropTarget && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full animate-pulse" />
                                        )}
                                        <div className={`relative p-5 rounded-lg mb-6 ${segment.type === 'user' ? 'bg-secondary' : 'bg-primary/10 border border-primary/20'}`}>
                                            {editingSegmentId === segment.id ? (
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                                                    rows={Math.max(5, editText.split('\n').length)}
                                                    autoFocus
                                                    placeholder="Chỉnh sửa nội dung đoạn này..."
                                                    title="Chỉnh sửa nội dung đoạn này"
                                                />
                                            ) : (
                                                <StoryContentRenderer
                                                    content={segment.content}
                                                    displaySettings={activeStory.displaySettings}
                                                />
                                            )}
                                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!editingSegmentId && (
                                                    <div className="p-1.5 cursor-grab" title="Drag to reorder">
                                                        <DragHandleIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                {editingSegmentId === segment.id ? (
                                                    <>
                                                        <button onClick={handleSaveEdit} className="p-1.5 rounded hover:bg-secondary/80 text-green-400" title="Save"><SaveIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingSegmentId(null)} className="p-1.5 rounded hover:bg-secondary/80" title="Cancel"><CloseIcon className="w-4 h-4" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {isSpeaking ? (
                                                            <button onClick={stop} className="p-1.5 rounded hover:bg-secondary/80 text-red-400" title="Stop reading"><CloseIcon className="w-4 h-4" /></button>
                                                        ) : (
                                                            <button onClick={() => toggle(segment.content)} className="p-1.5 rounded hover:bg-secondary/80" title="Read aloud"><SpeakerIcon className="w-4 h-4" /></button>
                                                        )}
                                                        <button onClick={() => handleStartEdit(segment)} className="p-1.5 rounded hover:bg-secondary/80" title="Edit"><EditIcon className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                                {segment.type === 'ai' && !editingSegmentId && (
                                                    <button onClick={() => setHistoryViewerTarget(segment.id)} className="p-1.5 rounded hover:bg-secondary/80" title="View History"><HistoryIcon className="w-4 h-4" /></button>
                                                )}
                                                <button onClick={() => navigator.clipboard.writeText(segment.content)} className="p-1.5 rounded hover:bg-secondary/80" title="Copy"><CopyIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSegment(segment.id)} className="p-1.5 rounded hover:bg-secondary/80 text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                    <div ref={endOfStoryRef} />
                </div>
                 {error && (
                    <div className="bg-destructive/20 border border-destructive/50 px-4 py-2 rounded-md mb-4 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <UserInput onSubmit={handleAddUserSegment} onAddChapter={handleAddChapter} />
            </main>
            {/* Desktop Aside */}
            {isDesktop && <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isNavigatorOpen ? 'w-[380px]' : 'w-0'}`}>
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
                                    setStories(prev => ({
                                        ...prev,
                                        [activeStory.id]: {
                                            ...activeStory,
                                            selectedPromptIds: ids
                                        }
                                    }));
                                }}
                                onManagePrompts={() => setIsPromptManagerOpen(true)}
                                keywordPresets={activeStory.keywordPresets || []}
                                onManageKeywordPresets={() => setIsKeywordPresetManagerOpen(true)}
                                onSaveKeywordPreset={handleSaveKeywordPreset}
                                storySegments={activeStory.storySegments}
                            />
                        </Suspense>
                    )}
                </div>
            </aside>}
            {/* Mobile Overlay */}
            {isNavigatorOpen && !isDesktop && (
                <div className="fixed inset-0 z-50">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsNavigatorOpen(false)}></div>
                    <aside className="absolute right-0 top-0 w-80 h-full bg-secondary border-l border-border">
                        {activeStory && (
                            <Suspense fallback={<ComponentLoadingFallback />}>
                                <ContentNavigator
                                    config={activeStory.generationConfig}
                                    setConfig={handleSetConfig}
                                    onGenerate={handleGenerate}
                                    isLoading={isLoading}
                                    isGenerateDisabled={isGenerateDisabled}
                                    customPrompts={activeStory.customPrompts}
                                    selectedPromptIds={activeStory.selectedPromptIds || []}
                                    setSelectedPromptIds={(ids) => {
                                        setStories(prev => ({
                                            ...prev,
                                            [activeStory.id]: {
                                                ...activeStory,
                                                selectedPromptIds: ids
                                            }
                                        }));
                                    }}
                                    onManagePrompts={() => setIsPromptManagerOpen(true)}
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

interface UserInputProps {
    onSubmit: (content: string) => void;
    onAddChapter: () => void;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, onAddChapter }) => {
    const [content, setContent] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if (!content.trim()) return;
        onSubmit(content);
        setContent('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    useEffect(() => {
        const el = textAreaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [content]);

    return (
        <div className="flex-shrink-0 bg-card rounded-lg p-2 md:p-4 flex flex-col md:flex-row items-start md:items-end gap-2">
            <textarea
                ref={textAreaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Viết phần tiếp theo của câu chuyện ở đây..."
                className="w-full max-h-96 bg-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={1}
                aria-label="Viết phần tiếp theo của câu chuyện ở đây..."
            />
            <div className="flex gap-2 self-end">
                <button
                    type="button"
                    onClick={onAddChapter}
                    className="p-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary/80 transition-colors"
                    title="Add Chapter Break"
                >
                    <BookOpenIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
                >
                    Thêm
                </button>
            </div>
        </div>
    );
};


UserInput.displayName = 'UserInput';
