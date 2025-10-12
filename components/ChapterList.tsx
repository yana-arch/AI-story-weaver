import React, { useState, useMemo } from 'react';
import { useChapter } from '../contexts/ChapterContext';
import { useStory } from '../contexts/StoryContext';
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
} from './icons';
import {
  ChapterStatus,
  ChapterType,
  EnhancedStorySegment
} from '../types/chapter';

interface ChapterListProps {
    storySegments: any[]; // Keep for compatibility, but we use ChapterContext
    onNavigateToChapter: (chapterId: string) => void;
    onAddChapter?: () => void; // Make optional as we handle internally
    onEditChapter?: (chapterId: string, newTitle: string) => void;
    onDeleteChapter?: (chapterId: string) => void;
    currentChapterId?: string;
}

interface ChapterItemProps {
    chapter: EnhancedStorySegment;
    level: number;
    isExpanded: boolean;
    onToggle: () => void;
    onNavigate: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isCurrent: boolean;
    hasChildren: boolean;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
    chapter,
    level,
    isExpanded,
    onToggle,
    onNavigate,
    onEdit,
    onDelete,
    isCurrent,
    hasChildren
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(chapter.content);
    const { updateChapterStatus } = useChapter();

    const handleSaveEdit = () => {
        if (editTitle.trim() && editTitle.trim() !== chapter.content) {
            onEdit(editTitle.trim());
            setIsEditing(false);
        } else {
            handleCancelEdit();
        }
    };

    const handleCancelEdit = () => {
        setEditTitle(chapter.content);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const getStatusColor = (status: ChapterStatus) => {
        switch (status) {
            case ChapterStatus.DRAFT: return 'text-gray-400';
            case ChapterStatus.IN_PROGRESS: return 'text-blue-400';
            case ChapterStatus.COMPLETED: return 'text-green-400';
            case ChapterStatus.PUBLISHED: return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: ChapterStatus) => {
        switch (status) {
            case ChapterStatus.DRAFT: return '📝';
            case ChapterStatus.IN_PROGRESS: return '⏳';
            case ChapterStatus.COMPLETED: return '✓';
            case ChapterStatus.PUBLISHED: return '📚';
            default: return '📝';
        }
    };

    return (
        <div className={`border-l-2 pl-3 py-2 transition-all duration-200 ${
            level > 0 ? 'ml-4' : ''
        } ${
            isCurrent
                ? 'border-l-primary bg-primary/10'
                : 'border-l-border hover:border-l-primary/50 hover:bg-muted/30'
        }`}>
            <div className="flex items-center gap-2">
                {hasChildren && (
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </button>
                )}

                {!hasChildren && <div className="w-6" />} {/* Spacer for alignment */}

                <button
                    onClick={onNavigate}
                    className={`flex-1 text-left p-2 rounded transition-colors ${
                        isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                    }`}
                    title={`Điều hướng đến chương này (${chapter.chapterData?.metadata.estimatedReadingTime} phút đọc)`}
                >
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-background text-foreground border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                            placeholder="Nhập tiêu đề chương..."
                            aria-label="Chỉnh sửa tiêu đề chương"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${getStatusColor(chapter.chapterData?.metadata.status || ChapterStatus.DRAFT)}`}>
                                {getStatusIcon(chapter.chapterData?.metadata.status || ChapterStatus.DRAFT)}
                            </span>
                            <span className="text-sm font-medium">{chapter.content}</span>
                            {chapter.chapterData?.metadata.wordCount && chapter.chapterData.metadata.wordCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    ({chapter.chapterData.metadata.wordCount} từ)
                                </span>
                            )}
                        </div>
                    )}
                </button>

                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                            value={chapter.chapterData?.metadata.status || ChapterStatus.DRAFT}
                            onChange={(e) => updateChapterStatus(chapter.id, e.target.value as ChapterStatus)}
                            className="text-xs p-1 bg-background border border-border rounded"
                            title="Trạng thái chương"
                        >
                            <option value={ChapterStatus.DRAFT}>📝 Draft</option>
                            <option value={ChapterStatus.IN_PROGRESS}>⏳ In Progress</option>
                            <option value={ChapterStatus.COMPLETED}>✓ Completed</option>
                            <option value={ChapterStatus.PUBLISHED}>📚 Published</option>
                        </select>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Chỉnh sửa tiêu đề"
                        >
                            <EditIcon className="w-3 h-3" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1 hover:bg-destructive/20 text-destructive rounded transition-colors"
                            title="Xóa chương"
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {isExpanded && chapter.chapterData?.metadata.description && (
                <div className="mt-2 text-xs text-muted-foreground pl-8">
                    {chapter.chapterData.metadata.description}
                </div>
            )}

            {level > 0 && (
                <div className="text-xs text-muted-foreground pl-8 mt-1">
                    Level {level} chapter
                </div>
            )}
        </div>
    );
};

const EnhancedChapterList: React.FC<ChapterListProps> = ({
    storySegments,
    onNavigateToChapter,
    onAddChapter,
    onEditChapter,
    onDeleteChapter,
    currentChapterId
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const { getChildChapters, updateChapter } = useChapter();
    const { activeStory } = useStory();

    const rootChapters = useMemo(() => {
        return activeStory ? getChildChapters() : [];
    }, [activeStory, getChildChapters]);

    const toggleChapterExpansion = (chapterId: string) => {
        setExpandedChapters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(chapterId)) {
                newSet.delete(chapterId);
            } else {
                newSet.add(chapterId);
            }
            return newSet;
        });
    };

    const handleEditChapter = (chapterId: string, newTitle: string) => {
        updateChapter(chapterId, { content: newTitle });
        if (onEditChapter) onEditChapter(chapterId, newTitle);
    };

    const handleDeleteChapter = (chapterId: string) => {
        if (onDeleteChapter) onDeleteChapter(chapterId);
    };

    const renderChapterTree = (chapters: EnhancedStorySegment[], level: number = 0): React.JSX.Element[] => {
        return chapters.map(chapter => {
            const childChapters = getChildChapters(chapter.id);
            const hasChildren = childChapters.length > 0;
            const isChapterExpanded = expandedChapters.has(chapter.id);

            return (
                <React.Fragment key={chapter.id}>
                    <ChapterItem
                        chapter={chapter}
                        level={level}
                        isExpanded={isChapterExpanded}
                        onToggle={() => toggleChapterExpansion(chapter.id)}
                        onNavigate={() => onNavigateToChapter(chapter.id)}
                        onEdit={(newTitle) => handleEditChapter(chapter.id, newTitle)}
                        onDelete={() => handleDeleteChapter(chapter.id)}
                        isCurrent={currentChapterId === chapter.id}
                        hasChildren={hasChildren}
                    />
                    {(isChapterExpanded || level > 0) && hasChildren && (
                        renderChapterTree(childChapters, level + 1)
                    )}
                </React.Fragment>
            );
        });
    };

    const totalChapters = rootChapters.length;
    const completedChapters = rootChapters.filter(c =>
        c.chapterData?.metadata.status === ChapterStatus.COMPLETED ||
        c.chapterData?.metadata.status === ChapterStatus.PUBLISHED
    ).length;
    const totalWords = rootChapters.reduce((sum, c) =>
        sum + (c.chapterData?.metadata.wordCount || 0), 0
    );

    return (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/50 border-b border-border p-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Danh sách chương ({totalChapters})</span>
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={onAddChapter}
                        className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        title="Thêm chương mới"
                    >
                        <PlusIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="max-h-96 overflow-y-auto">
                    {rootChapters.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            <p>Chưa có chương nào trong câu chuyện.</p>
                            <button
                                onClick={onAddChapter}
                                className="mt-2 text-primary hover:underline text-sm"
                            >
                                Thêm chương đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {renderChapterTree(rootChapters)}
                        </div>
                    )}

                    {totalChapters > 0 && (
                        <div className="p-3 border-t border-border bg-muted/30">
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Tổng số chương:</span>
                                    <span>{totalChapters}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Đã hoàn thành:</span>
                                    <span>{completedChapters}/{totalChapters}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tổng số từ:</span>
                                    <span>{totalWords.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ChapterList = EnhancedChapterList;
