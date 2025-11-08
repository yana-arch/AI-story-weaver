import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  ChapterStatus,
  ChapterType,
  ChapterMetadata,
  ChapterHierarchy,
  ChapterAnalytics,
  ChapterDependency,
  ChapterTemplate,
  ChapterOperation,
  EnhancedStorySegment,
} from '../types/chapter';
import type { Story, StorySegment } from '../types';
import chapterService from '../services/chapterService';

interface ChapterContextType {
  // Chapter Management
  chapters: Record<string, EnhancedStorySegment>;
  chapterHierarchy: ChapterHierarchy[];
  chapterTemplates: ChapterTemplate[];

  // Chapter Operations
  createChapter: (title: string, parentId?: string, templateId?: string) => string;
  deleteChapter: (chapterId: string) => void;
  updateChapter: (chapterId: string, updates: Partial<EnhancedStorySegment>) => void;
  moveChapter: (chapterId: string, newParentId?: string, newPosition?: number) => void;
  mergeChapters: (chapterIds: string[], mergedTitle: string) => string;
  splitChapter: (chapterId: string, splitPoints: number[]) => string[];

  // Chapter Analytics
  getChapterAnalytics: (chapterId: string) => ChapterAnalytics;
  updateChapterAnalytics: (chapterId: string, analytics: Partial<ChapterAnalytics>) => void;

  // Chapter Status and Metadata
  updateChapterStatus: (chapterId: string, status: ChapterStatus) => void;
  updateChapterMetadata: (chapterId: string, metadata: Partial<ChapterMetadata>) => void;

  // Templates
  createChapterTemplate: (template: Omit<ChapterTemplate, 'id'>) => string;
  deleteChapterTemplate: (templateId: string) => void;
  applyChapterTemplate: (chapterId: string, templateId: string) => void;

  // Dependencies
  addChapterDependency: (dependency: Omit<ChapterDependency, 'id'>) => string;
  removeChapterDependency: (dependencyId: string) => void;

  // Navigation
  getChapterPath: (chapterId: string) => EnhancedStorySegment[];
  getChildChapters: (chapterId?: string) => EnhancedStorySegment[];
  getChapterLevel: (chapterId: string) => number;

  // Search and Filter
  searchChapters: (query: string) => EnhancedStorySegment[];
  filterChaptersByStatus: (status: ChapterStatus) => EnhancedStorySegment[];
  filterChaptersByType: (type: ChapterType) => EnhancedStorySegment[];

  // Integration with StoryContext
  loadChaptersFromStory: (story: Story) => void;
  convertToStorySegments: () => StorySegment[];
}

const ChapterContext = createContext<ChapterContextType | undefined>(undefined);

export const ChapterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chapters, setChapters] = useState<Record<string, EnhancedStorySegment>>({});
  const [chapterHierarchy, setChapterHierarchy] = useState<ChapterHierarchy[]>([]);
  const [chapterTemplates, setChapterTemplates] = useState<ChapterTemplate[]>([]);
  const [operations, setOperations] = useState<ChapterOperation[]>([]);

  // Initialize with default templates
  React.useEffect(() => {
    const defaultTemplates = chapterService.getDefaultTemplates();
    setChapterTemplates(defaultTemplates);
  }, []);

  const createChapter = useCallback(
    (title: string, parentId?: string, templateId?: string): string => {
      const chapterId = chapterService.generateChapterId();
      const template = templateId ? chapterTemplates.find((t) => t.id === templateId) : undefined;

      const metadata: ChapterMetadata = {
        tags: template?.genre || [],
        estimatedReadingTime: template?.structure.suggestedWordCount
          ? Math.ceil(template.structure.suggestedWordCount / 200)
          : 5,
        wordCount: 0,
        characterCount: 0,
        lastModifiedAt: Date.now(),
        createdAt: Date.now(),
        status: ChapterStatus.DRAFT,
        type: ChapterType.MAIN,
        description: template?.description || '',
        notes: '',
      };

      const analytics: ChapterAnalytics = {
        wordsAdded: 0,
        wordsEdited: 0,
        writingTime: 0,
        revisionsCount: 0,
        readerEngagement: 0,
        popularityScore: 0,
      };

      const hierarchy: ChapterHierarchy = {
        id: chapterId,
        parentId,
        children: [],
        level: parentId ? (chapterHierarchy.find((h) => h.id === parentId)?.level ?? 0 + 1) : 0,
      };

      const chapter: EnhancedStorySegment = {
        id: chapterId,
        type: 'chapter',
        content: title,
        chapterData: {
          hierarchy,
          metadata,
          analytics,
          dependencies: [],
        },
      };

      // Apply template content if provided
      if (template?.defaultContent) {
        chapter.content = template.defaultContent;
      }

      // Update hierarchy
      setChapterHierarchy((prev) => {
        const newHierarchy = [...prev, hierarchy];

        // Update parent's children
        if (parentId) {
          newHierarchy.forEach((h) => {
            if (h.id === parentId) {
              h.children.push(chapterId);
            }
          });
        }

        return newHierarchy;
      });

      // Add to chapters
      setChapters((prev) => ({ ...prev, [chapterId]: chapter }));

      // Record operation
      const operation: ChapterOperation = {
        id: chapterService.generateOperationId(),
        type: 'create',
        timestamp: Date.now(),
        data: { chapterId, title, parentId, templateId },
        affectedChapters: [chapterId],
      };
      setOperations((prev) => [...prev, operation]);

      return chapterId;
    },
    [chapterTemplates, chapterHierarchy]
  );

  const deleteChapter = useCallback(
    (chapterId: string) => {
      const chapter = chapters[chapterId];
      if (!chapter) return;

      // Get all child chapters recursively
      const getAllChildren = (id: string): string[] => {
        const children = chapterHierarchy.find((h) => h.id === id)?.children || [];
        return [id, ...children.flatMap(getAllChildren)];
      };

      const chaptersToDelete = getAllChildren(chapterId);

      // Remove from hierarchy
      setChapterHierarchy((prev) => {
        return prev.filter((h) => !chaptersToDelete.includes(h.id));
      });

      // Remove from parent children
      setChapters((prev) => {
        const newChapters = { ...prev };
        chaptersToDelete.forEach((id) => delete newChapters[id]);
        return newChapters;
      });

      // Record operation
      const operation: ChapterOperation = {
        id: chapterService.generateOperationId(),
        type: 'delete',
        timestamp: Date.now(),
        data: { chapterId },
        affectedChapters: chaptersToDelete,
      };
      setOperations((prev) => [...prev, operation]);
    },
    [chapters, chapterHierarchy]
  );

  const updateChapter = useCallback((chapterId: string, updates: Partial<EnhancedStorySegment>) => {
    setChapters((prev) => {
      if (!prev[chapterId]) return prev;

      const updatedChapter = {
        ...prev[chapterId],
        ...updates,
        chapterData: {
          ...prev[chapterId].chapterData,
          ...updates.chapterData,
          metadata: {
            ...prev[chapterId].chapterData?.metadata,
            ...updates.chapterData?.metadata,
            lastModifiedAt: Date.now(),
          },
        },
      };

      return { ...prev, [chapterId]: updatedChapter };
    });

    // Update word count in metadata
    if (updates.content) {
      const wordCount = updates.content.split(/\s+/).length;
      const characterCount = updates.content.length;

      setChapters((prev) => {
        if (!prev[chapterId]?.chapterData) return prev;

        return {
          ...prev,
          [chapterId]: {
            ...prev[chapterId],
            chapterData: {
              ...prev[chapterId].chapterData!,
              metadata: {
                ...prev[chapterId].chapterData!.metadata,
                wordCount,
                characterCount,
                lastModifiedAt: Date.now(),
              },
            },
          },
        };
      });
    }

    // Record operation
    const operation: ChapterOperation = {
      id: chapterService.generateOperationId(),
      type: 'create', // Actually update, but using create for simplicity
      timestamp: Date.now(),
      data: { chapterId, updates },
      affectedChapters: [chapterId],
    };
    setOperations((prev) => [...prev, operation]);
  }, []);

  const moveChapter = useCallback(
    (chapterId: string, newParentId?: string, newPosition?: number) => {
      setChapterHierarchy((prev) => {
        const newHierarchy = [...prev];

        // Find current hierarchy entry
        const chapterIndex = newHierarchy.findIndex((h) => h.id === chapterId);
        if (chapterIndex === -1) return prev;

        // Remove from old parent
        const oldParentId = newHierarchy[chapterIndex].parentId;
        if (oldParentId) {
          const oldParentIndex = newHierarchy.findIndex((h) => h.id === oldParentId);
          if (oldParentIndex !== -1) {
            newHierarchy[oldParentIndex].children = newHierarchy[oldParentIndex].children.filter(
              (id) => id !== chapterId
            );
          }
        }

        // Update hierarchy entry
        newHierarchy[chapterIndex].parentId = newParentId;
        newHierarchy[chapterIndex].level = newParentId
          ? (newHierarchy.find((h) => h.id === newParentId)?.level ?? 0 + 1)
          : 0;

        // Add to new parent
        if (newParentId) {
          const newParentIndex = newHierarchy.findIndex((h) => h.id === newParentId);
          if (newParentIndex !== -1) {
            if (newPosition !== undefined) {
              newHierarchy[newParentIndex].children.splice(newPosition, 0, chapterId);
            } else {
              newHierarchy[newParentIndex].children.push(chapterId);
            }
          }
        }

        return newHierarchy;
      });
    },
    []
  );

  const mergeChapters = useCallback(
    (chapterIds: string[], mergedTitle: string): string => {
      const validChapters = chapterIds.filter((id) => chapters[id]);
      if (validChapters.length < 2) return '';

      const content = validChapters.map((id) => chapters[id].content).join('\n\n');

      const newChapterId = createChapter(mergedTitle);
      updateChapter(newChapterId, { content });

      // Delete original chapters
      validChapters.forEach((id) => deleteChapter(id));

      return newChapterId;
    },
    [chapters, createChapter, updateChapter, deleteChapter]
  );

  const splitChapter = useCallback(
    (chapterId: string, splitPoints: number[]): string[] => {
      const chapter = chapters[chapterId];
      if (!chapter || splitPoints.length === 0) return [];

      const contentLines = chapter.content.split('\n');
      const newChapterIds: string[] = [];

      let currentLines: string[] = [];
      let currentIndex = 0;

      for (let i = 0; i < contentLines.length; i++) {
        currentLines.push(contentLines[i]);

        if (splitPoints.includes(i + 1) || i === contentLines.length - 1) {
          const sectionTitle = `Chapter ${currentIndex + 1} (Split from ${chapter.content})`;
          const newChapterId = createChapter(sectionTitle, undefined, undefined);
          updateChapter(newChapterId, { content: currentLines.join('\n') });
          newChapterIds.push(newChapterId);

          currentLines = [];
          currentIndex++;
        }
      }

      deleteChapter(chapterId);

      return newChapterIds;
    },
    [chapters, createChapter, updateChapter, deleteChapter]
  );

  const getChapterAnalytics = useCallback(
    (chapterId: string): ChapterAnalytics => {
      return (
        chapters[chapterId]?.chapterData?.analytics || {
          wordsAdded: 0,
          wordsEdited: 0,
          writingTime: 0,
          revisionsCount: 0,
          readerEngagement: 0,
          popularityScore: 0,
        }
      );
    },
    [chapters]
  );

  const updateChapterAnalytics = useCallback(
    (chapterId: string, analytics: Partial<ChapterAnalytics>) => {
      setChapters((prev) => {
        if (!prev[chapterId]?.chapterData) return prev;

        return {
          ...prev,
          [chapterId]: {
            ...prev[chapterId],
            chapterData: {
              ...prev[chapterId].chapterData!,
              analytics: {
                ...prev[chapterId].chapterData!.analytics,
                ...analytics,
              },
            },
          },
        };
      });
    },
    []
  );

  const updateChapterStatus = useCallback(
    (chapterId: string, status: ChapterStatus) => {
      updateChapter(chapterId, {
        chapterData: {
          ...chapters[chapterId]?.chapterData,
          metadata: {
            ...chapters[chapterId]?.chapterData?.metadata,
            status,
          },
        },
      });
    },
    [chapters, updateChapter]
  );

  const updateChapterMetadata = useCallback(
    (chapterId: string, metadata: Partial<ChapterMetadata>) => {
      updateChapter(chapterId, {
        chapterData: {
          ...chapters[chapterId]?.chapterData,
          metadata: {
            ...chapters[chapterId]?.chapterData?.metadata,
            ...metadata,
          },
        },
      });
    },
    [chapters, updateChapter]
  );

  const createChapterTemplate = useCallback((template: Omit<ChapterTemplate, 'id'>): string => {
    const templateId = chapterService.generateTemplateId();
    const newTemplate: ChapterTemplate = { ...template, id: templateId };
    setChapterTemplates((prev) => [...prev, newTemplate]);
    return templateId;
  }, []);

  const deleteChapterTemplate = useCallback((templateId: string) => {
    setChapterTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  const applyChapterTemplate = useCallback(
    (chapterId: string, templateId: string) => {
      const template = chapterTemplates.find((t) => t.id === templateId);
      if (!template) return;

      updateChapter(chapterId, {
        content: template.defaultContent || template.structure.sections.join('\n\n'),
        chapterData: {
          ...chapters[chapterId]?.chapterData,
          metadata: {
            ...chapters[chapterId]?.chapterData?.metadata,
            tags: template.genre,
            description: template.description,
          },
        },
      });
    },
    [chapterTemplates, chapters, updateChapter]
  );

  const addChapterDependency = useCallback((dependency: Omit<ChapterDependency, 'id'>): string => {
    const dependencyId = chapterService.generateDependencyId();

    setChapters((prev) => {
      if (!prev[dependency.sourceChapterId]?.chapterData) return prev;

      const sourceChapter = prev[dependency.sourceChapterId];
      const newDependency: ChapterDependency = { ...dependency, id: dependencyId };

      return {
        ...prev,
        [dependency.sourceChapterId]: {
          ...sourceChapter,
          chapterData: {
            ...sourceChapter.chapterData!,
            dependencies: [...sourceChapter.chapterData!.dependencies, newDependency],
          },
        },
      };
    });

    return dependencyId;
  }, []);

  const removeChapterDependency = useCallback((dependencyId: string) => {
    setChapters((prev) => {
      const newChapters = { ...prev };

      Object.keys(newChapters).forEach((chapterId) => {
        const chapter = newChapters[chapterId];
        if (chapter.chapterData?.dependencies) {
          chapter.chapterData.dependencies = chapter.chapterData.dependencies.filter(
            (d) => d.id !== dependencyId
          );
        }
      });

      return newChapters;
    });
  }, []);

  const getChapterPath = useCallback(
    (chapterId: string): EnhancedStorySegment[] => {
      const path: EnhancedStorySegment[] = [];
      let currentId: string | undefined = chapterId;

      while (currentId) {
        const chapter = chapters[currentId];
        if (chapter) {
          path.unshift(chapter);
          currentId = chapterHierarchy.find((h) => h.id === currentId)?.parentId;
        } else {
          break;
        }
      }

      return path;
    },
    [chapters, chapterHierarchy]
  );

  const getChildChapters = useCallback(
    (chapterId?: string): EnhancedStorySegment[] => {
      const children = chapterId
        ? chapterHierarchy.find((h) => h.id === chapterId)?.children || []
        : chapterHierarchy.filter((h) => !h.parentId).map((h) => h.id);

      return children
        .map((id) => chapters[id])
        .filter((chapter): chapter is EnhancedStorySegment => !!chapter);
    },
    [chapters, chapterHierarchy]
  );

  const getChapterLevel = useCallback(
    (chapterId: string): number => {
      return chapterHierarchy.find((h) => h.id === chapterId)?.level || 0;
    },
    [chapterHierarchy]
  );

  const searchChapters = useCallback(
    (query: string): EnhancedStorySegment[] => {
      const lowerQuery = query.toLowerCase();
      return Object.values(chapters).filter((chapter) => {
        const chapterObj = chapter as EnhancedStorySegment;
        return (
          chapterObj.content.toLowerCase().includes(lowerQuery) ||
          chapterObj.chapterData?.metadata.tags.some((tag) =>
            tag.toLowerCase().includes(lowerQuery)
          ) ||
          chapterObj.chapterData?.metadata.description?.toLowerCase().includes(lowerQuery)
        );
      }) as EnhancedStorySegment[];
    },
    [chapters]
  );

  const filterChaptersByStatus = useCallback(
    (status: ChapterStatus): EnhancedStorySegment[] => {
      return Object.values(chapters).filter((chapter) => {
        const chapterObj = chapter as EnhancedStorySegment;
        return chapterObj.chapterData?.metadata.status === status;
      }) as EnhancedStorySegment[];
    },
    [chapters]
  );

  const filterChaptersByType = useCallback(
    (type: ChapterType): EnhancedStorySegment[] => {
      return Object.values(chapters).filter((chapter) => {
        const chapterObj = chapter as EnhancedStorySegment;
        return chapterObj.chapterData?.metadata.type === type;
      }) as EnhancedStorySegment[];
    },
    [chapters]
  );

  const loadChaptersFromStory = useCallback((story: Story) => {
    const chapterSegments = story.storySegments.filter((s) => s.type === 'chapter');
    const newChapters: Record<string, EnhancedStorySegment> = {};
    const newHierarchy: ChapterHierarchy[] = [];

    // Convert each chapter segment to enhanced format
    chapterSegments.forEach((segment) => {
      const enhanced: EnhancedStorySegment = {
        ...segment,
        chapterData: {
          hierarchy: {
            id: segment.id,
            children: [],
            level: 0,
          },
          metadata: {
            tags: [],
            estimatedReadingTime: Math.ceil(segment.content.split(' ').length / 200),
            wordCount: segment.content.split(' ').length,
            characterCount: segment.content.length,
            lastModifiedAt: story.updatedAt,
            createdAt: story.createdAt,
            status: ChapterStatus.COMPLETED,
            type: ChapterType.MAIN,
            description: '',
            notes: '',
          },
          analytics: {
            wordsAdded: segment.content.split(' ').length,
            wordsEdited: 0,
            writingTime: 0,
            revisionsCount: 0,
            readerEngagement: 0,
            popularityScore: 0,
          },
          dependencies: [],
        },
      };

      newChapters[segment.id] = enhanced;
      newHierarchy.push(enhanced.chapterData!.hierarchy);
    });

    setChapters(newChapters);
    setChapterHierarchy(newHierarchy);
  }, []);

  const convertToStorySegments = useCallback((): StorySegment[] => {
    return Object.values(chapters).map((chapter) => {
      const chapterObj = chapter as EnhancedStorySegment;
      return {
        id: chapterObj.id,
        type: chapterObj.type,
        content: chapterObj.content,
        config: chapterObj.config,
        displaySettings: chapterObj.displaySettings,
      };
    });
  }, [chapters]);

  const contextValue = useMemo(
    () => ({
      chapters,
      chapterHierarchy,
      chapterTemplates,
      createChapter,
      deleteChapter,
      updateChapter,
      moveChapter,
      mergeChapters,
      splitChapter,
      getChapterAnalytics,
      updateChapterAnalytics,
      updateChapterStatus,
      updateChapterMetadata,
      createChapterTemplate,
      deleteChapterTemplate,
      applyChapterTemplate,
      addChapterDependency,
      removeChapterDependency,
      getChapterPath,
      getChildChapters,
      getChapterLevel,
      searchChapters,
      filterChaptersByStatus,
      filterChaptersByType,
      loadChaptersFromStory,
      convertToStorySegments,
    }),
    [
      chapters,
      chapterHierarchy,
      chapterTemplates,
      createChapter,
      deleteChapter,
      updateChapter,
      moveChapter,
      mergeChapters,
      splitChapter,
      getChapterAnalytics,
      updateChapterAnalytics,
      updateChapterStatus,
      updateChapterMetadata,
      createChapterTemplate,
      deleteChapterTemplate,
      applyChapterTemplate,
      addChapterDependency,
      removeChapterDependency,
      getChapterPath,
      getChildChapters,
      getChapterLevel,
      searchChapters,
      filterChaptersByStatus,
      filterChaptersByType,
      loadChaptersFromStory,
      convertToStorySegments,
    ]
  );

  return <ChapterContext.Provider value={contextValue}>{children}</ChapterContext.Provider>;
};

export const useChapter = () => {
  const context = useContext(ChapterContext);
  if (context === undefined) {
    throw new Error('useChapter must be used within a ChapterProvider');
  }
  return context;
};
