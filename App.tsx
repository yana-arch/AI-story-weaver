import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Chat } from '@google/ai';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ContentNavigator } from './components/ContentNavigator';
import { CustomPromptsManager } from './components/CustomPromptsManager';
import { KeywordPresetManager } from './components/KeywordPresetManager';
import { VersionHistoryViewer } from './components/VersionHistoryViewer';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { StoryContentRenderer } from './components/StoryContentRenderer';
import { StoryDisplaySettings } from './components/StoryDisplaySettings';
import { CharacterPanel } from './components/CharacterPanel';
import { CharacterProfileEditor } from './components/CharacterProfileEditor';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTTS } from './hooks/useTTS';
import { StoryManager } from './components/StoryManager';
import { TTSSettings, type TTSOptions } from './components/TTSSettings';
import * as storyManager from './services/storyManagerService';
import { generateStorySegment, generateCharacterProfiles } from './services/geminiService';
import { addHistoryEntry, deleteHistory } from './services/historyService';
import {
    Scenario,
    CharacterDynamics,
    Pacing,
    GenerationMode,
    NarrativeStructure,
    type GenerationConfig,
    type StorySegment,
    type ApiKey,
    type CustomPrompt,
    type KeywordPreset,
    type HistoryEntry,
    type CharacterProfile,
    type Story
} from './types';
import { KeyIcon, BookmarkIcon, EditIcon, SaveIcon, CopyIcon, TrashIcon, CloseIcon, CheckCircleIcon, HistoryIcon, DragHandleIcon, SearchIcon, UploadIcon, DownloadIcon, BookOpenIcon, UserGroupIcon, CollectionIcon, PanelRightIcon, PaintBrushIcon, SpeakerIcon } from './components/icons';
import { ThemeManager } from './components/ThemeManager';

const initialConfig: GenerationConfig = {
    scenario: Scenario.FIRST_TIME,
    dynamics: CharacterDynamics.A_LEADS,
    pacing: Pacing.MEDIUM,
    narrativeStructure: NarrativeStructure.FREEFORM,
    adultContentOptions: [],
    avoidKeywords: '',
    focusKeywords: '',
    generationMode: GenerationMode.CONTINUE,
};

const App: React.FC = () => {
    const [stories, setStories] = useState<Record<string, Story>>({});
    const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

    const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);
    const [useDefaultKey, setUseDefaultKey] = useLocalStorage<boolean>('useDefaultKey', true);


    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentKeyIndex, setCurrentKeyIndex] = useLocalStorage<number>('currentKeyIndex', 0);
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
    const [isNavigatorOpen, setIsNavigatorOpen] = useState(true);
    const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
    const [isTTSSettingsOpen, setIsTTSSettingsOpen] = useState(false);
    const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);
    const [ttsSettings, setTtsSettings] = useLocalStorage<TTSOptions>('ttsSettings', { rate: 1, pitch: 1 });

    const { isSpeaking, toggle } = useTTS(ttsSettings);


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

        const lastUserSegment = [...activeStory.storySegments].reverse().find(s => s.type === 'user');
        if (!lastUserSegment && activeStory.generationConfig.generationMode === GenerationMode.CONTINUE && activeStory.storySegments.length > 0) {
            setError("Cannot continue without a new user prompt. Please add to the story.");
            setIsLoading(false);
            return;
        }
        
        const storyContext = activeStory.storySegments.filter(s => s.type !== 'chapter').map(s => s.content).join('\n\n');

        const prompt = lastUserSegment?.content || storyContext || '';
        const fullStoryForRewrite = storyContext;

        const selectedPromptsContent = activeStory.customPrompts
            .filter(p => activeStory.selectedPromptIds.includes(p.id))
            .map(p => p.content);
        
        const availableKeys = useDefaultKey ? [{ id: 'default', name: 'Default', key: 'N/A', isDefault: true }, ...apiKeys] : apiKeys;

        try {
            const result = await generateStorySegment(
                prompt,
                fullStoryForRewrite,
                activeStory.generationConfig,
                selectedPromptsContent,
                activeStory.characterProfiles,
                availableKeys,
                currentKeyIndex,
                chatSession.current
            );
            
            const newSegment: StorySegment = {
                id: Date.now().toString(),
                type: 'ai',
                content: result.content,
                config: { ...activeStory.generationConfig },
            };

            if (activeStory.generationConfig.generationMode === GenerationMode.REWRITE) {
                setActiveStory({ ...activeStory, storySegments: [newSegment] });
            } else {
                setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newSegment] });
            }
           
            chatSession.current = result.newChatSession;
            setCurrentKeyIndex(result.newKeyIndex);

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [activeStory, apiKeys, useDefaultKey, currentKeyIndex, setActiveStory, setCurrentKeyIndex]);

    const handleAddUserSegment = (content: string) => {
        if (!content.trim() || !activeStory) return;
        const newSegment: StorySegment = {
            id: Date.now().toString(),
            type: 'user',
            content: content.trim(),
        };
        setActiveStory({ ...activeStory, storySegments: [...activeStory.storySegments, newSegment] });
    };

    const handleAddChapter = () => {
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
    };


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
                    const normalizedStory = { ...loadedStory, generationConfig: normalizedConfig, keywordPresets: loadedStory.keywordPresets || [] };
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
            {isApiKeyManagerOpen && <ApiKeyManager apiKeys={apiKeys} setApiKeys={setApiKeys} useDefaultKey={useDefaultKey} setUseDefaultKey={setUseDefaultKey} onClose={() => setIsApiKeyManagerOpen(false)} />}
            {isPromptManagerOpen && activeStory && <CustomPromptsManager prompts={activeStory.customPrompts} setPrompts={(prompts) => setActiveStory({...activeStory, customPrompts: prompts})} onClose={() => setIsPromptManagerOpen(false)} />}
            {isKeywordPresetManagerOpen && activeStory && <KeywordPresetManager presets={activeStory.keywordPresets} setPresets={(presets) => setActiveStory({...activeStory, keywordPresets: presets})} onClose={() => setIsKeywordPresetManagerOpen(false)} />}
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
            {isTTSSettingsOpen && <TTSSettings settings={ttsSettings} onSettingsChange={setTtsSettings} onClose={() => setIsTTSSettingsOpen(false)} isOpen={isTTSSettingsOpen} />}
            {isDisplaySettingsOpen && activeStory && <StoryDisplaySettings settings={activeStory.displaySettings || { autoDetect: true, elements: {} }} onSettingsChange={(settings) => setActiveStory({ ...activeStory, displaySettings: settings })} onClose={() => setIsDisplaySettingsOpen(false)} />}



            <main className="flex-1 flex flex-col p-4 overflow-hidden">
                <header className="flex justify-between items-center mb-4 flex-shrink-0 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground flex-shrink-0">{activeStory ? activeStory.name : 'AI Creative Writer'}</h1>
                        <div className={`transition-opacity duration-500 ${saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>All changes saved.</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex justify-center px-4">
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

                    <div className="flex items-center gap-3 flex-shrink-0">
                         <label htmlFor="load-session" className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Load Story Session">
                            <UploadIcon className="w-4 h-4" /> Load
                        </label>
                        <input id="load-session" type="file" accept=".json" onChange={handleLoadSession} className="hidden" />
                        <button onClick={handleSaveSession} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Save Story Session">
                            <DownloadIcon className="w-4 h-4" /> Save
                        </button>
                        <button onClick={() => setIsPromptManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Manage Custom Prompts">
                            <BookmarkIcon className="w-4 h-4" /> Prompts
                        </button>
                        <button onClick={() => setIsApiKeyManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Manage API Keys">
                            <KeyIcon className="w-4 h-4" /> API Keys
                        </button>
                        <button onClick={() => setIsCharacterPanelOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="View Characters">
                            <UserGroupIcon className="w-4 h-4" /> Characters
                        </button>
                        <button onClick={() => setIsStoryManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Manage Stories">
                            <CollectionIcon className="w-4 h-4" /> Stories
                        </button>
                        <button onClick={() => setIsThemeManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Customize Theme">
                            <PaintBrushIcon className="w-4 h-4" /> Theme
                        </button>
                        <button onClick={() => setIsTTSSettingsOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="TTS Settings">
                            <SpeakerIcon className="w-4 h-4" /> TTS
                        </button>
                        <button onClick={() => setIsDisplaySettingsOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors" title="Display Settings">
                            <PaintBrushIcon className="w-4 h-4" /> Display
                        </button>
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
                                                        <button onClick={() => toggle(segment.content)} className="p-1.5 rounded hover:bg-secondary/80" title="Read aloud"><SpeakerIcon className="w-4 h-4" /></button>
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
                    <div className="bg-destructive/20 border border-destructive/50 text-destructive-foreground px-4 py-2 rounded-md mb-4 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <UserInput onSubmit={handleAddUserSegment} onAddChapter={handleAddChapter} />
            </main>
            <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isNavigatorOpen ? 'w-[380px]' : 'w-0'}`}>
                <div className="w-[380px] h-full">
                    {activeStory && <ContentNavigator
                        config={activeStory.generationConfig}
                        setConfig={handleSetConfig}
                        onGenerate={handleGenerate}
                        isLoading={isLoading}
                        isGenerateDisabled={isGenerateDisabled}
                        customPrompts={activeStory.customPrompts}
                        selectedPromptIds={activeStory.selectedPromptIds}
                        setSelectedPromptIds={(ids) => setActiveStory({ ...activeStory, selectedPromptIds: ids })}
                        onManagePrompts={() => setIsPromptManagerOpen(true)}
                        keywordPresets={activeStory.keywordPresets || []}
                        onManageKeywordPresets={() => setIsKeywordPresetManagerOpen(true)}
                        onSaveKeywordPreset={handleSaveKeywordPreset}
                    />}
                </div>
            </aside>
        </div>
    );
};

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
        <div className="flex-shrink-0 bg-card rounded-lg p-2 flex items-start gap-2">
            <textarea
                ref={textAreaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Viết phần tiếp theo của câu chuyện ở đây..."
                className="w-full size-200px bg-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={1}
                aria-label="Viết phần tiếp theo của câu chuyện ở đây..."
            />
            <button
                type="button"
                onClick={onAddChapter}
                className="p-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary/80 transition-colors self-end"
                title="Add Chapter Break"
            >
                <BookOpenIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed self-end"
            >
                Thêm
            </button>
        </div>
    );
};

export default App;
