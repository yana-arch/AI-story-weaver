import React, { Fragment, useCallback } from 'react';

import {
  EditIcon,
  SaveIcon,
  CloseIcon,
  SpeakerIcon,
  HistoryIcon,
  CopyIcon,
  TrashIcon,
  DragHandleIcon,
  SearchIcon,
  CheckCircleIcon,
  CogIcon,
  KeyIcon,
  PaintBrushIcon,
  PanelRightIcon,
} from './icons';
import { StorySegment, Story, GenerationConfig, HistoryEntry } from '../types';
import { StoryContentRenderer } from './StoryContentRenderer';
import { UserInput } from './UserInput';
import { ComponentLoadingFallback } from './ComponentLoadingFallback';

interface StoryMainContentProps {
  activeStory: Story | null;
  filteredSegments: StorySegment[];
  editingSegmentId: string | null;
  editText: string;
  isSpeaking: boolean;
  searchQuery: string;
  saveStatus: 'idle' | 'saved';
  lastReadIndex: number;
  unreadMarkerRef: React.RefObject<HTMLDivElement>;
  endOfStoryRef: React.RefObject<HTMLDivElement>;
  setEditText: (text: string) => void;
  setEditingSegmentId: (id: string | null) => void;
  setHistoryViewerTarget: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveStory: (story: Story) => void;
  addHistoryEntry: (segmentId: string, content: string) => void;
  deleteHistory: (segmentId: string) => void;
  toggleSpeech: (text: string) => void;
  stopSpeech: () => void;
  handleGenerate: () => Promise<void>;
  handleAddUserSegment: (content: string) => void;
  handleAddChapter: () => void;
  handleRevertToVersion: (segmentId: string, historyEntry: HistoryEntry) => void;
  draggedSegmentId: string | null;
  dropTargetId: string | null;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, segmentId: string) => void;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>, segmentId: string) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, dropSegmentId: string) => void;
  handleDragEnd: () => void;
  setDropTargetId: (id: string | null) => void;
  chatSessionRef: React.MutableRefObject<any>; // Use a more specific type if possible
  segmentRefs: React.MutableRefObject<Map<string, HTMLElement | null>>;
  isSettingsPanelOpen: boolean;
  setIsSettingsPanelOpen: (open: boolean) => void;
  setIsApiKeysModalOpen: (open: boolean) => void;
  setIsThemeModalOpen: (open: boolean) => void;
  setIsTTSModalOpen: (open: boolean) => void;
  setIsDisplayModalOpen: (open: boolean) => void;
  isNavigatorOpen: boolean;
  setIsNavigatorOpen: (open: boolean) => void;
}

export const StoryMainContent: React.FC<StoryMainContentProps> = ({
  activeStory,
  filteredSegments,
  editingSegmentId,
  editText,
  isSpeaking,
  searchQuery,
  saveStatus,
  lastReadIndex,
  unreadMarkerRef,
  endOfStoryRef,
  setEditText,
  setEditingSegmentId,
  setHistoryViewerTarget,
  setSearchQuery,
  setActiveStory,
  addHistoryEntry,
  deleteHistory,
  toggleSpeech,
  stopSpeech,
  handleAddUserSegment,
  handleAddChapter,
  handleRevertToVersion,
  draggedSegmentId,
  dropTargetId,
  handleDragStart,
  handleDragEnter,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  setDropTargetId,
  chatSessionRef,
  segmentRefs,
  isSettingsPanelOpen,
  setIsSettingsPanelOpen,
  setIsApiKeysModalOpen,
  setIsThemeModalOpen,
  setIsTTSModalOpen,
  setIsDisplayModalOpen,
  isNavigatorOpen,
  setIsNavigatorOpen,
}) => {


  const handleSaveEdit = useCallback(() => {
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
  }, [activeStory, editingSegmentId, editText, addHistoryEntry, setActiveStory, setEditingSegmentId, setEditText]);

  const handleStartEdit = useCallback((segment: StorySegment) => {
    setEditingSegmentId(segment.id);
    setEditText(segment.content);
  }, [setEditingSegmentId, setEditText]);

  const handleDeleteSegment = useCallback((id: string) => {
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
  }, [activeStory, setActiveStory, deleteHistory]);


  const setSegmentRef = useCallback((segmentId: string, el: HTMLElement | null) => {
    if (el) {
      segmentRefs.current.set(segmentId, el);
    } else {
      segmentRefs.current.delete(segmentId);
    }
  }, [segmentRefs]);

  return (
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
            title={isNavigatorOpen ? "Hide AI Panel" : "Show AI Panel"}
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
              <Fragment key={segment.id}>
                {showUnreadMarker && (
                  <div
                    ref={unreadMarkerRef}
                    className="relative my-6 flex items-center"
                    aria-label="New content below"
                  >
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
                    onDragLeave={() => setDropTargetId(null)}
                    role="listitem"
                    aria-roledescription="story segment"
                    aria-grabbed={isBeingDragged}
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
                          aria-label="Edit story segment content"
                        />
                      ) : (
                        <StoryContentRenderer
                          content={segment.content}
                          displaySettings={activeStory.displaySettings}
                        />
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!editingSegmentId && (
                          <div className="p-1.5 cursor-grab" title="Drag to reorder" role="button" aria-label="Drag to reorder story segment">
                            <DragHandleIcon className="w-4 h-4" />
                          </div>
                        )}
                        {editingSegmentId === segment.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-1.5 rounded hover:bg-secondary/80 text-green-400"
                              title="Save"
                              aria-label="Save changes to story segment"
                            >
                              <SaveIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingSegmentId(null)}
                              className="p-1.5 rounded hover:bg-secondary/80"
                              title="Cancel"
                              aria-label="Cancel editing story segment"
                            >
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {isSpeaking ? (
                              <button
                                onClick={stopSpeech}
                                className="p-1.5 rounded hover:bg-secondary/80 text-red-500"
                                title="Stop reading"
                                aria-label="Stop reading story segment"
                              >
                                <CloseIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleSpeech(segment.content)}
                                className="p-1.5 rounded hover:bg-secondary/80"
                                title="Read aloud"
                                aria-label="Read story segment aloud"
                              >
                                <SpeakerIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(segment)}
                              className="p-1.5 rounded hover:bg-secondary/80"
                              title="Edit"
                              aria-label="Edit story segment"
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
                            aria-label="View story segment history"
                          >
                            <HistoryIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigator.clipboard.writeText(segment.content)}
                          className="p-1.5 rounded hover:bg-secondary/80"
                          title="Copy"
                          aria-label="Copy story segment content"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSegment(segment.id)}
                          className="p-1.5 rounded hover:bg-secondary/80 text-red-400"
                          title="Delete"
                          aria-label="Delete story segment"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        <div ref={endOfStoryRef} />
      </div>
      <UserInput onSubmit={handleAddUserSegment} onAddChapter={handleAddChapter} />
    </main>
  );
};

StoryMainContent.displayName = 'StoryMainContent';
