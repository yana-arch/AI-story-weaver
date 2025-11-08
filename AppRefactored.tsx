import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { AppProvider, useStory, useSettings } from './contexts/AppProvider';
import { useStoryOperations } from './hooks/useStoryOperations';
import { useDragDrop } from './hooks/useDragDrop';
import { useReadingProgress } from './hooks/useReadingProgress';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useTTS } from './hooks/useTTS';
import {
  usePerformanceMonitor,
  useMemoryLeakDetector,
  useApiPerformanceMonitor,
} from './hooks/usePerformanceMonitor';
import { deleteHistory } from './services/historyService';
import * as storyManager from './services/storyManagerService';
import type { StorySegment, HistoryEntry, CharacterProfile } from './types';
import { GenerationMode } from './types';

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

// Loading component for lazy-loaded components
const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-muted-foreground">Loading...</div>
  </div>
);

// Import icons
import {
  KeyIcon,
  BookmarkIcon,
  EditIcon,
  SaveIcon,
  CopyIcon,
  TrashIcon,
  CloseIcon,
  CheckCircleIcon,
  HistoryIcon,
  DragHandleIcon,
  SearchIcon,
  UploadIcon,
  DownloadIcon,
  BookOpenIcon,
  UserGroupIcon,
  CollectionIcon,
  PanelRightIcon,
  PaintBrushIcon,
  SpeakerIcon,
  CogIcon,
} from './components/icons';

const AppContent: React.FC = () => {
  // Performance monitoring hooks
  const performanceMetrics = usePerformanceMonitor('App');
  const memoryLeakMetrics = useMemoryLeakDetector('App');
  const { startApiCall, endApiCall } = useApiPerformanceMonitor('AI Generation');

  // Context hooks
  const {
    activeStory,
    setActiveStory,
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
  } = useStory();

  const {
    apiKeys,
    setApiKeys,
    useDefaultKey,
    setUseDefaultKey,
    currentKeyIndex,
    setCurrentKeyIndex,
    theme,
    setTheme,
    ttsSettings,
    setTtsSettings,
    isApiKeyManagerOpen,
    setIsApiKeyManagerOpen,
    isPromptManagerOpen,
    setIsPromptManagerOpen,
    isKeywordPresetManagerOpen,
    setIsKeywordPresetManagerOpen,
    isCharacterEditorOpen,
    setIsCharacterEditorOpen,
    isCharacterPanelOpen,
    setIsCharacterPanelOpen,
    isStoryManagerOpen,
    setIsStoryManagerOpen,
    isNavigatorOpen,
    setIsNavigatorOpen,
    isDesktop,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isThemeManagerOpen,
    setIsThemeManagerOpen,
    isTTSSettingsOpen,
    setIsTTSSettingsOpen,
    isDisplaySettingsOpen,
    setIsDisplaySettingsOpen,
    isChapterListOpen,
    setIsChapterListOpen,
    isSettingsPanelOpen,
    setIsSettingsPanelOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    isApiKeysModalOpen,
    setIsApiKeysModalOpen,
    isThemeModalOpen,
    setIsThemeModalOpen,
    isTTSModalOpen,
    setIsTTSModalOpen,
    isDisplayModalOpen,
    setIsDisplayModalOpen,
    searchQuery,
    setSearchQuery,
    isExportDialogOpen,
    setIsExportDialogOpen,
  } = useSettings();

  // Custom hooks
  const {
    handleGenerate,
    handleStartEdit,
    handleSaveEdit,
    handleRevertToVersion,
    handleGenerateProfiles,
  } = useStoryOperations();
  const {
    draggedSegmentId,
    dropTargetId,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useDragDrop();
  const { filteredSegments, lastReadIndex, setSegmentRef, endOfStoryRef } = useReadingProgress();

  // Other hooks
  const { addError } = useErrorHandler();
  const { isOnline } = useNetworkStatus();
  const { isSpeaking, toggle, stop } = useTTS(ttsSettings);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [historyViewerTarget, setHistoryViewerTarget] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<CharacterProfile | null>(null);
  const [isGeneratingProfiles, setIsGeneratingProfiles] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const isInitialMount = useRef(true);

  // Auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (activeStory) {
      storyManager.saveStories({ [activeStory.id]: activeStory });
      setSaveStatus('saved');
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [activeStory]);

  // Handle edit operations
  const handleStartEditSegment = (segment: StorySegment) => {
    setEditingSegmentId(segment.id);
    setEditText(segment.content);
  };

  const handleSaveEditSegment = () => {
    if (!editingSegmentId) return;
    handleSaveEdit(editingSegmentId, editText);
    setEditingSegmentId(null);
    setEditText('');
  };

  const handleDeleteSegmentLocal = (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this segment? This action cannot be undone.')
    ) {
      deleteSegment(id);
      deleteHistory(id);
    }
  };

  // Character operations
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
      const newProfiles = activeStory.characterProfiles.filter((p) => p.id !== id);
      updateCharacterProfiles(newProfiles);
    }
  };

  const handleSaveCharacterProfile = (profile: CharacterProfile) => {
    if (!activeStory) return;
    const existingIndex = activeStory.characterProfiles.findIndex((p) => p.id === profile.id);
    let newProfiles;

    if (existingIndex > -1) {
      newProfiles = [...activeStory.characterProfiles];
      newProfiles[existingIndex] = profile;
    } else {
      newProfiles = [...activeStory.characterProfiles, profile];
    }

    updateCharacterProfiles(newProfiles);
    setIsCharacterEditorOpen(false);
    setEditingProfile(null);
  };

  const handleGenerateProfilesLocal = async () => {
    setIsGeneratingProfiles(true);
    setError(null);
    await handleGenerateProfiles();
    setIsGeneratingProfiles(false);
  };

  // Story management operations
  const handleCreateStoryLocal = () => {
    createStory();
  };

  const handleLoadStoryLocal = (id: string) => {
    loadStory(id);
  };

  const handleDeleteStoryLocal = (id: string) => {
    deleteStory(id);
  };

  const handleRenameStoryLocal = (id: string, newName: string) => {
    renameStory(id, newName);
  };

  // File operations
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
      console.error('Failed to save session:', error);
      alert('Failed to save story session.');
    }
  };

  const handleLoadSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const loadedStory = JSON.parse(result);

        if (
          loadedStory.id &&
          loadedStory.name &&
          Array.isArray(loadedStory.storySegments) &&
          loadedStory.generationConfig
        ) {
          setActiveStory(loadedStory);
          alert(`Story "${loadedStory.name}" loaded successfully!`);
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
    event.target.value = '';
  };

  // Configuration operations
  const handleSetConfig = (updater: React.SetStateAction<any>) => {
    if (!activeStory) return;
    const newConfig =
      typeof updater === 'function' ? updater(activeStory.generationConfig) : updater;
    updateGenerationConfig(newConfig);
  };

  const handleSaveKeywordPreset = () => {
    if (!activeStory) return;
    const name = window.prompt('Enter a name for this keyword preset:');
    if (name && name.trim()) {
      // This would need to be implemented in the story context
      console.log('Save keyword preset:', name);
    }
  };

  // Computed values
  const isGenerateDisabled = useMemo(() => {
    if (!activeStory) return true;
    return activeStory.storySegments.filter((s) => s.type !== 'chapter').length === 0;
  }, [activeStory]);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Left Sidebar */}
      <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2">
        <div className="flex flex-col gap-2 w-full px-2">
          {/* Load Button */}
          <div className="relative">
            <label
              htmlFor="load-session"
              className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer"
              title="Load Story Session"
            >
              <UploadIcon className="w-5 h-5" />
              <span className="text-xs text-center">Load</span>
            </label>
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
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="text-xs text-center">Save</span>
          </button>

          <hr />

          {/* Prompts Button */}
          <button
            onClick={() => setIsPromptManagerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Manage Custom Prompts"
          >
            <BookmarkIcon className="w-5 h-5" />
            <span className="text-xs text-center">Prompts</span>
          </button>

          {/* Characters Button */}
          <button
            onClick={() => setIsCharacterPanelOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="View Characters"
          >
            <UserGroupIcon className="w-5 h-5" />
            <span className="text-xs text-center">Characters</span>
          </button>

          {/* Chapters Button */}
          <button
            onClick={() => setIsChapterListOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="View Chapter List"
          >
            <BookOpenIcon className="w-5 h-5" />
            <span className="text-xs text-center">Chapters</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Export Story"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="text-xs text-center">Export</span>
          </button>

          {/* Stories Button */}
          <button
            onClick={() => setIsStoryManagerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            title="Manage Stories"
          >
            <CollectionIcon className="w-5 h-5" />
            <span className="text-xs text-center">Stories</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden">
        <header className="flex justify-between items-center mb-4 flex-shrink-0 gap-2 md:gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex-shrink-0">
              {activeStory ? activeStory.name : 'AI Creative Writer'}
            </h1>
            <div
              className={`transition-opacity duration-500 ${saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}
            >
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
              <button
                onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                title="Settings"
              >
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
            <button
              onClick={() => setIsNavigatorOpen(!isNavigatorOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              title={isNavigatorOpen ? 'Hide AI Panel' : 'Show AI Panel'}
            >
              <PanelRightIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-grow bg-card rounded-lg p-4 overflow-y-auto mb-4 relative">
          {!activeStory ? (
            <div className="text-center text-muted-foreground absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
              <p className="text-lg">Loading story...</p>
            </div>
          ) : (
            filteredSegments.length === 0 && (
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
            )
          )}

          {activeStory &&
            filteredSegments.map((segment, index) => {
              const isBeingDragged = draggedSegmentId === segment.id;
              const isDropTarget = dropTargetId === segment.id;

              const showUnreadMarker =
                index === lastReadIndex + 1 && lastReadIndex < filteredSegments.length - 1;

              return (
                <React.Fragment key={segment.id}>
                  {showUnreadMarker && (
                    <div className="relative my-6 flex items-center" aria-label="New content below">
                      <span className="flex-shrink-0 bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground rounded-full">
                        MỚI
                      </span>
                      <div className="flex-grow border-t-2 border-dashed border-primary ml-2"></div>
                    </div>
                  )}

                  {segment.type === 'chapter' ? (
                    <div
                      ref={(el) => setSegmentRef(segment.id, el)}
                      data-segment-id={segment.id}
                      className="flex items-center my-6"
                    >
                      <div className="flex-grow border-t border-border"></div>
                      <h2 className="flex-shrink-0 px-4 text-center text-lg font-bold text-muted-foreground tracking-wider uppercase">
                        {segment.content}
                      </h2>
                      <div className="flex-grow border-t border-border"></div>
                    </div>
                  ) : (
                    <div
                      ref={(el) => setSegmentRef(segment.id, el)}
                      data-segment-id={segment.id}
                      draggable={!editingSegmentId}
                      onDragStart={(e) => !editingSegmentId && handleDragStart(e, segment.id)}
                      onDragEnter={(e) => handleDragEnter(e, segment.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, segment.id)}
                      onDragEnd={handleDragEnd}
                      onDragLeave={() => {}} // This would need to be handled in useDragDrop
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
                      <div
                        className={`relative p-5 rounded-lg mb-6 ${segment.type === 'user' ? 'bg-secondary' : 'bg-primary/10 border border-primary/20'}`}
                      >
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
                              <button
                                onClick={handleSaveEditSegment}
                                className="p-1.5 rounded hover:bg-secondary/80 text-green-400"
                                title="Save"
                              >
                                <SaveIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingSegmentId(null)}
                                className="p-1.5 rounded hover:bg-secondary/80"
                                title="Cancel"
                              >
                                <CloseIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {isSpeaking ? (
                                <button
                                  onClick={stop}
                                  className="p-1.5 rounded hover:bg-secondary/80 text-red-400"
                                  title="Stop reading"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggle(segment.content)}
                                  className="p-1.5 rounded hover:bg-secondary/80"
                                  title="Read aloud"
                                >
                                  <SpeakerIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEditSegment(segment)}
                                className="p-1.5 rounded hover:bg-secondary/80"
                                title="Edit"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {segment.type === 'ai' && !editingSegmentId && (
                            <button
                              onClick={() => setHistoryViewerTarget(segment.id)}
                              className="p-1.5 rounded hover:bg-secondary/80"
                              title="View History"
                            >
                              <HistoryIcon className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => navigator.clipboard.writeText(segment.content)}
                            className="p-1.5 rounded hover:bg-secondary/80"
                            title="Copy"
                          >
                            <CopyIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSegmentLocal(segment.id)}
                            className="p-1.5 rounded hover:bg-secondary/80 text-red-400"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
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

        <UserInput onSubmit={addUserSegment} onAddChapter={addChapter} />
      </main>

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
                  customPrompts={activeStory.customPrompts}
                  selectedPromptIds={activeStory.selectedPromptIds || []}
                  setSelectedPromptIds={(ids) => {
                    // This would need to be implemented in the story context
                    console.log('Set selected prompt IDs:', ids);
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
                  customPrompts={activeStory.customPrompts}
                  selectedPromptIds={activeStory.selectedPromptIds || []}
                  setSelectedPromptIds={(ids) => {
                    console.log('Set selected prompt IDs:', ids);
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

        {isPromptManagerOpen && activeStory && (
          <CustomPromptsManager
            prompts={activeStory.customPrompts}
            setPrompts={(prompts) => {
              // This would need to be implemented in the story context
              console.log('Set prompts:', prompts);
            }}
            onClose={() => setIsPromptManagerOpen(false)}
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
              onGenerate={handleGenerateProfilesLocal}
              isGenerating={isGeneratingProfiles}
              onClose={() => setIsCharacterPanelOpen(false)}
            />
          </div>
        )}

        {isStoryManagerOpen && (
          <StoryManager
            stories={{ [activeStory?.id || '']: activeStory }}
            activeStoryId={activeStory?.id || null}
            onLoadStory={handleLoadStoryLocal}
            onCreateStory={handleCreateStoryLocal}
            onDeleteStory={handleDeleteStoryLocal}
            onRenameStory={handleRenameStoryLocal}
            onClose={() => setIsStoryManagerOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

App.displayName = 'App';

export default React.memo(App);

// UserInput component (simplified)
interface UserInputProps {
  onSubmit: (content: string) => void;
  onAddChapter: () => void;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, onAddChapter }) => {
  const [content, setContent] = useState('');

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

  return (
    <div className="flex-shrink-0 bg-card rounded-lg p-2 md:p-4 flex flex-col md:flex-row items-start md:items-end gap-2">
      <textarea
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
