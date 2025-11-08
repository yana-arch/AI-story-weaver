import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStory } from '../contexts/StoryContext';

export const useReadingProgress = () => {
  const { activeStory, setActiveStory } = useStory();
  const [searchQuery, setSearchQuery] = useState('');
  const segmentRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const observer = useRef<IntersectionObserver | null>(null);
  const endOfStoryRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

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

  const setSegmentRef = useCallback((segmentId: string, el: HTMLElement | null) => {
    if (el) {
      segmentRefs.current.set(segmentId, el);
    } else {
      segmentRefs.current.delete(segmentId);
    }
  }, []);

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
    if (!didInitialScroll.current && endOfStoryRef.current && lastReadIndex >= 0) {
      setTimeout(() => {
        const targetElement =
          lastReadIndex < filteredSegments.length - 1
            ? segmentRefs.current.get(activeStory?.lastReadSegmentId || '')
            : endOfStoryRef.current;

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
        didInitialScroll.current = true;
      }, 100);
    }
  }, [lastReadIndex, filteredSegments.length, activeStory?.lastReadSegmentId]);

  // Auto-scroll to end of story when new segments are added
  useEffect(() => {
    if (endOfStoryRef.current && activeStory) {
      endOfStoryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeStory?.storySegments]);

  return {
    searchQuery,
    setSearchQuery,
    filteredSegments,
    lastReadIndex,
    setSegmentRef,
    endOfStoryRef,
    segmentRefs,
  };
};
