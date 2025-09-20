import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Chat } from '@google/genai';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ContentNavigator } from './components/ContentNavigator';
import { CustomPromptsManager } from './components/CustomPromptsManager';
import { VersionHistoryViewer } from './components/VersionHistoryViewer';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateStorySegment } from './services/geminiService';
import {
    Scenario,
    CharacterDynamics,
    Pacing,
    GenerationMode,
    type GenerationConfig,
    type StorySegment,
    type ApiKey,
    type CustomPrompt,
    type HistoryEntry,
    type StorySession,
} from './types';
import { KeyIcon, BookmarkIcon, EditIcon, SaveIcon, CopyIcon, TrashIcon, CloseIcon, CheckCircleIcon, HistoryIcon, DragHandleIcon, SearchIcon, UploadIcon, DownloadIcon } from './components/icons';

const initialConfig: GenerationConfig = {
    scenario: Scenario.FIRST_TIME,
    dynamics: CharacterDynamics.A_LEADS,
    pacing: Pacing.MEDIUM,
    adultContentOptions: [],
    avoidKeywords: '',
    focusKeywords: '',
    generationMode: GenerationMode.CONTINUE,
};

const App: React.FC = () => {
    const [config, setConfig] = useLocalStorage<GenerationConfig>('generationConfig', initialConfig);
    const [storySegments, setStorySegments] = useLocalStorage<StorySegment[]>('storySegments', []);
    const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);
    const [useDefaultKey, setUseDefaultKey] = useLocalStorage<boolean>('useDefaultKey', true);
    const [customPrompts, setCustomPrompts] = useLocalStorage<CustomPrompt[]>('customPrompts', []);
    const [selectedPromptIds, setSelectedPromptIds] = useLocalStorage<string[]>('selectedPromptIds', []);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentKeyIndex, setCurrentKeyIndex] = useLocalStorage<number>('currentKeyIndex', 0);
    const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    
    // Modals visibility state
    const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
    const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);
    const [historyViewerTarget, setHistoryViewerTarget] = useState<StorySegment | null>(null);


    // Autosave status state
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
    const isInitialMount = useRef(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Drag and drop state
    const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    const chatSession = useRef<Chat | { messages: any[] } | null>(null);
    const endOfStoryRef = useRef<HTMLDivElement>(null);
    
    // Reset chat session if story is cleared or generation mode changes to REWRITE
    useEffect(() => {
        if (storySegments.length === 0 || config.generationMode === GenerationMode.REWRITE) {
            chatSession.current = null;
        }
    }, [storySegments.length, config.generationMode]);
    
    useEffect(() => {
      endOfStoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [storySegments]);

    // Effect for autosave visual indicator
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setSaveStatus('saved');
        const timer = setTimeout(() => {
            setSaveStatus('idle');
        }, 3000); // Show "Saved" for 3 seconds

        return () => clearTimeout(timer);
    }, [storySegments, config, customPrompts, selectedPromptIds]);

    const filteredSegments = useMemo(() => {
        if (!searchQuery.trim()) {
            return storySegments;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return storySegments.filter(segment =>
            segment.content.toLowerCase().includes(lowercasedQuery)
        );
    }, [storySegments, searchQuery]);


    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const lastUserSegment = [...storySegments].reverse().find(s => s.type === 'user');
        if (!lastUserSegment && config.generationMode === GenerationMode.CONTINUE && storySegments.length > 0) {
            setError("Cannot continue without a new user prompt. Please add to the story.");
            setIsLoading(false);
            return;
        }

        const prompt = lastUserSegment?.content || storySegments.map(s => s.content).join('\n\n') || '';
        const fullStoryForRewrite = storySegments.map(s => s.content).join('\n\n');

        const selectedPromptsContent = customPrompts
            .filter(p => selectedPromptIds.includes(p.id))
            .map(p => p.content);
        
        const availableKeys = useDefaultKey ? [{ id: 'default', name: 'Default', key: 'N/A', isDefault: true }, ...apiKeys] : apiKeys;

        try {
            const result = await generateStorySegment(
                prompt,
                fullStoryForRewrite,
                config,
                selectedPromptsContent,
                availableKeys,
                currentKeyIndex,
                chatSession.current
            );
            
            if (config.generationMode === GenerationMode.REWRITE) {
                 setStorySegments([{
                    id: Date.now().toString(),
                    type: 'ai',
                    content: result.content,
                    config: { ...config },
                    history: []
                }]);
            } else {
                 setStorySegments(prev => [...prev, {
                    id: Date.now().toString(),
                    type: 'ai',
                    content: result.content,
                    config: { ...config },
                    history: []
                }]);
            }
           
            chatSession.current = result.newChatSession;
            setCurrentKeyIndex(result.newKeyIndex);

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [storySegments, config, customPrompts, selectedPromptIds, apiKeys, useDefaultKey, currentKeyIndex, setStorySegments, setCurrentKeyIndex]);

    const handleAddUserSegment = (content: string) => {
        if (!content.trim()) return;
        setStorySegments(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: content.trim(),
        }]);
    };

    const handleStartEdit = (segment: StorySegment) => {
        setEditingSegmentId(segment.id);
        setEditText(segment.content);
    };

    const handleSaveEdit = () => {
        if (!editingSegmentId) return;
        setStorySegments(prev => prev.map(s => {
            if (s.id === editingSegmentId) {
                if (s.type === 'ai') {
                    const newHistoryEntry: HistoryEntry = {
                        timestamp: Date.now(),
                        content: s.content,
                    };
                    const newHistory = [newHistoryEntry, ...(s.history || [])];
                    return { ...s, content: editText, history: newHistory };
                }
                return { ...s, content: editText };
            }
            return s;
        }));
        setEditingSegmentId(null);
        setEditText('');
    };

    const handleRevertToVersion = (segmentId: string, historyEntry: HistoryEntry) => {
        if (window.confirm("Are you sure you want to revert to this version? The current content will be saved to history.")) {
            setStorySegments(prev => prev.map(s => {
                if (s.id === segmentId) {
                    const currentContentAsHistory: HistoryEntry = {
                        timestamp: Date.now(),
                        content: s.content,
                    };
                    const newHistory = [currentContentAsHistory, ...(s.history || [])].filter(h => h.timestamp !== historyEntry.timestamp);
                    return { ...s, content: historyEntry.content, history: newHistory };
                }
                return s;
            }));
            setHistoryViewerTarget(null);
        }
    };


    const handleDeleteSegment = (id: string) => {
        if(window.confirm("Are you sure you want to delete this segment? This action cannot be undone.")){
            setStorySegments(prev => prev.filter(s => s.id !== id));
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
        e.preventDefault();
        const sourceSegmentId = e.dataTransfer.getData('text/plain');

        if (!sourceSegmentId || sourceSegmentId === dropSegmentId) {
            setDraggedSegmentId(null);
            setDropTargetId(null);
            return;
        }

        setStorySegments(prevSegments => {
            const sourceIndex = prevSegments.findIndex(s => s.id === sourceSegmentId);
            const dropIndex = prevSegments.findIndex(s => s.id === dropSegmentId);
            if (sourceIndex === -1 || dropIndex === -1) return prevSegments;

            const newSegments = [...prevSegments];
            const [draggedItem] = newSegments.splice(sourceIndex, 1);
            newSegments.splice(dropIndex, 0, draggedItem);
            return newSegments;
        });

        chatSession.current = null; // Reset chat context after reordering
        setDraggedSegmentId(null);
        setDropTargetId(null);
    };

    const handleDragEnd = () => {
        setDraggedSegmentId(null);
        setDropTargetId(null);
    };


    const isGenerateDisabled = useMemo(() => {
        return storySegments.length === 0;
    }, [storySegments]);

    const handleSaveSession = () => {
        try {
            const sessionData: StorySession = {
                storySegments: storySegments,
                generationConfig: config,
                customPrompts: customPrompts,
                selectedPromptIds: selectedPromptIds,
            };
            const dataStr = JSON.stringify(sessionData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const linkElement = document.createElement('a');
            linkElement.href = url;
            linkElement.download = 'ai-story-weaver-session.json';
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

        if (!window.confirm("Are you sure you want to load a new story? Your current progress will be overwritten.")) {
            event.target.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result as string;
                const loadedSession: StorySession = JSON.parse(result);

                // Basic validation
                if (
                    Array.isArray(loadedSession.storySegments) &&
                    loadedSession.generationConfig &&
                    Array.isArray(loadedSession.customPrompts) &&
                    Array.isArray(loadedSession.selectedPromptIds)
                ) {
                    setStorySegments(loadedSession.storySegments);
                    setConfig(loadedSession.generationConfig);
                    setCustomPrompts(loadedSession.customPrompts);
                    setSelectedPromptIds(loadedSession.selectedPromptIds);
                    chatSession.current = null; // Reset chat context
                    alert('Story session loaded successfully!');
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

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            {isApiKeyManagerOpen && <ApiKeyManager apiKeys={apiKeys} setApiKeys={setApiKeys} useDefaultKey={useDefaultKey} setUseDefaultKey={setUseDefaultKey} onClose={() => setIsApiKeyManagerOpen(false)} />}
            {isPromptManagerOpen && <CustomPromptsManager prompts={customPrompts} setPrompts={setCustomPrompts} onClose={() => setIsPromptManagerOpen(false)} />}
            {historyViewerTarget && <VersionHistoryViewer segment={historyViewerTarget} onClose={() => setHistoryViewerTarget(null)} onRevert={handleRevertToVersion} />}

            <main className="flex-1 flex flex-col p-4 overflow-hidden">
                <header className="flex justify-between items-center mb-4 flex-shrink-0 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-100 flex-shrink-0">AI Creative Writer</h1>
                        <div className={`transition-opacity duration-500 ${saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>All changes saved.</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex justify-center px-4">
                        <div className="relative w-full max-w-lg">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="search-story"
                                name="search-story"
                                className="block w-full rounded-md border-0 bg-gray-700 py-2 pl-10 pr-10 text-gray-200 ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
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
                                        className="p-1 text-gray-400 hover:text-gray-200 focus:outline-none"
                                        aria-label="Clear search"
                                    >
                                        <CloseIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                         <label htmlFor="load-session" className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 rounded-md hover:bg-gray-700 transition-colors" title="Load Story Session">
                            <UploadIcon className="w-4 h-4" /> Load
                        </label>
                        <input id="load-session" type="file" accept=".json" onChange={handleLoadSession} className="hidden" />
                        <button onClick={handleSaveSession} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 rounded-md hover:bg-gray-700 transition-colors" title="Save Story Session">
                            <DownloadIcon className="w-4 h-4" /> Save
                        </button>
                        <button onClick={() => setIsPromptManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 rounded-md hover:bg-gray-700 transition-colors" title="Manage Custom Prompts">
                            <BookmarkIcon className="w-4 h-4" /> Prompts
                        </button>
                         <button onClick={() => setIsApiKeyManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 rounded-md hover:bg-gray-700 transition-colors" title="Manage API Keys">
                            <KeyIcon className="w-4 h-4" /> API Keys
                        </button>
                    </div>
                </header>

                <div className="flex-grow bg-gray-800 rounded-lg p-4 overflow-y-auto mb-4 relative">
                    {filteredSegments.length === 0 && (
                        <div className="text-center text-gray-500 absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
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
                    {filteredSegments.map((segment) => {
                        const isBeingDragged = draggedSegmentId === segment.id;
                        const isDropTarget = dropTargetId === segment.id;

                        return (
                            <div
                                key={segment.id}
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
                                     <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-full animate-pulse" />
                                )}
                                <div className={`relative p-5 rounded-lg mb-6 ${segment.type === 'user' ? 'bg-gray-700' : 'bg-indigo-900/40 border border-indigo-800'}`}>
                                    {editingSegmentId === segment.id ? (
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                            rows={Math.max(5, editText.split('\n').length)}
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-gray-200">
                                            <MarkdownRenderer content={segment.content} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!editingSegmentId && (
                                            <div className="p-1.5 cursor-grab" title="Drag to reorder">
                                                <DragHandleIcon className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                        {editingSegmentId === segment.id ? (
                                            <>
                                                <button onClick={handleSaveEdit} className="p-1.5 rounded hover:bg-gray-600 text-green-400" title="Save"><SaveIcon className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingSegmentId(null)} className="p-1.5 rounded hover:bg-gray-600" title="Cancel"><CloseIcon className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleStartEdit(segment)} className="p-1.5 rounded hover:bg-gray-600" title="Edit"><EditIcon className="w-4 h-4" /></button>
                                        )}
                                        {segment.type === 'ai' && !editingSegmentId && (
                                            <button onClick={() => setHistoryViewerTarget(segment)} className="p-1.5 rounded hover:bg-gray-600" title="View History"><HistoryIcon className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => navigator.clipboard.writeText(segment.content)} className="p-1.5 rounded hover:bg-gray-600" title="Copy"><CopyIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteSegment(segment.id)} className="p-1.5 rounded hover:bg-gray-600 text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={endOfStoryRef} />
                </div>
                 {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-md mb-4 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <UserInput onSubmit={handleAddUserSegment} />
            </main>
            <aside className="w-[380px] flex-shrink-0">
                <ContentNavigator
                    config={config}
                    setConfig={setConfig}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    isGenerateDisabled={isGenerateDisabled}
                    customPrompts={customPrompts}
                    selectedPromptIds={selectedPromptIds}
                    setSelectedPromptIds={setSelectedPromptIds}
                    onManagePrompts={() => setIsPromptManagerOpen(true)}
                />
            </aside>
        </div>
    );
};

interface UserInputProps {
    onSubmit: (content: string) => void;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit }) => {
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
        <div className="flex-shrink-0 bg-gray-800 rounded-lg p-2 flex items-start gap-2">
            <textarea
                ref={textAreaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Viết phần tiếp theo của câu chuyện ở đây..."
                className="w-full bg-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={1}
                style={{maxHeight: '200px'}}
            />
            <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed self-end"
            >
                Thêm
            </button>
        </div>
    );
};

export default App;