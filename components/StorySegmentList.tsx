import React, { memo, useMemo, useCallback } from 'react';
import { StoryContentRenderer } from './StoryContentRenderer';
import { useDragDrop } from '../hooks/useDragDrop';
import { useStory } from '../contexts/StoryContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTTS } from '../hooks/useTTS';
import type { StorySegment } from '../types';
import {
  EditIcon,
  SaveIcon,
  CloseIcon,
  SpeakerIcon,
  HistoryIcon,
  CopyIcon,
  TrashIcon,
  DragHandleIcon,
} from './icons';

interface StorySegmentListProps {
  segments: StorySegment[];
  onEdit: (segment: StorySegment) => void;
  onSave: (segmentId: string, content: string) => void;
  onDelete: (segmentId: string) => void;
  onRevert: (segmentId: string, historyEntry: any) => void;
  editingSegmentId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  setEditingSegmentId: (id: string | null) => void;
  historyViewerTarget: string | null;
  setHistoryViewerTarget: (id: string | null) => void;
}

export const StorySegmentList = memo(
  ({
    segments,
    onEdit,
    onSave,
    onDelete,
    onRevert,
    editingSegmentId,
    editText,
    setEditText,
    setEditingSegmentId,
    historyViewerTarget,
    setHistoryViewerTarget,
  }: StorySegmentListProps) => {
    const { activeStory } = useStory();
    const { isSpeaking, toggle, stop } = useTTS({ rate: 1, pitch: 1 });
    const {
      draggedSegmentId,
      dropTargetId,
      handleDragStart,
      handleDragEnter,
      handleDragOver,
      handleDrop,
      handleDragEnd,
    } = useDragDrop();

    const handleStartEdit = useCallback(
      (segment: StorySegment) => {
        onEdit(segment);
      },
      [onEdit]
    );

    const handleSaveEdit = useCallback(() => {
      if (editingSegmentId) {
        onSave(editingSegmentId, editText);
        setEditingSegmentId(null);
        setEditText('');
      }
    }, [editingSegmentId, editText, onSave, setEditingSegmentId, setEditText]);

    const handleDeleteSegment = useCallback(
      (segmentId: string) => {
        onDelete(segmentId);
      },
      [onDelete]
    );

    const handleCopyContent = useCallback(async (content: string) => {
      try {
        await navigator.clipboard.writeText(content);
      } catch (error) {
        console.error('Failed to copy content:', error);
      }
    }, []);

    const renderSegment = useCallback(
      (segment: StorySegment, index: number) => {
        const isBeingDragged = draggedSegmentId === segment.id;
        const isDropTarget = dropTargetId === segment.id;

        return (
          <div
            key={segment.id}
            ref={(el) => {
              // This would need to be handled by the parent component for reading progress
            }}
            data-segment-id={segment.id}
            draggable={!editingSegmentId}
            onDragStart={(e) => !editingSegmentId && handleDragStart(e, segment.id)}
            onDragEnter={(e) => handleDragEnter(e, segment.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, segment.id)}
            onDragEnd={handleDragEnd}
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
                  displaySettings={activeStory?.displaySettings}
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
                      onClick={handleSaveEdit}
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
                      onClick={() => handleStartEdit(segment)}
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
                  onClick={() => handleCopyContent(segment.content)}
                  className="p-1.5 rounded hover:bg-secondary/80"
                  title="Copy"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSegment(segment.id)}
                  className="p-1.5 rounded hover:bg-secondary/80 text-red-400"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      },
      [
        draggedSegmentId,
        dropTargetId,
        editingSegmentId,
        editText,
        activeStory?.displaySettings,
        isSpeaking,
        handleDragStart,
        handleDragEnter,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleStartEdit,
        handleSaveEdit,
        handleDeleteSegment,
        handleCopyContent,
        setEditingSegmentId,
        setEditText,
        setHistoryViewerTarget,
        toggle,
        stop,
      ]
    );

    const memoizedSegments = useMemo(
      () => segments.map((segment, index) => renderSegment(segment, index)),
      [segments, renderSegment]
    );

    return <div className="space-y-0">{memoizedSegments}</div>;
  }
);

StorySegmentList.displayName = 'StorySegmentList';
