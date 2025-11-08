import React, { useState, useCallback } from 'react';
import { useStory } from '../contexts/StoryContext';

export const useDragDrop = () => {
  const { activeStory, setActiveStory } = useStory();
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, segmentId: string) => {
    e.dataTransfer.setData('text/plain', segmentId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSegmentId(segmentId);
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>, segmentId: string) => {
      e.preventDefault();
      if (draggedSegmentId && draggedSegmentId !== segmentId) {
        setDropTargetId(segmentId);
      }
    },
    [draggedSegmentId]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropSegmentId: string) => {
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
      setDraggedSegmentId(null);
      setDropTargetId(null);
    },
    [activeStory, setActiveStory]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSegmentId(null);
    setDropTargetId(null);
  }, []);

  return {
    draggedSegmentId,
    dropTargetId,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
};
