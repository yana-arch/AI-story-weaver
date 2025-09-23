import React, { useState } from 'react';
import type { StorySegment } from '../types';
import { BookOpenIcon, ChevronDownIcon, ChevronRightIcon, EditIcon, TrashIcon, PlusIcon } from './icons';

interface ChapterListProps {
    storySegments: StorySegment[];
    onNavigateToChapter: (chapterId: string) => void;
    onAddChapter: () => void;
    onEditChapter: (chapterId: string, newTitle: string) => void;
    onDeleteChapter: (chapterId: string) => void;
    currentChapterId?: string;
}

interface ChapterItemProps {
    chapter: StorySegment;
    isExpanded: boolean;
    onToggle: () => void;
    onNavigate: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isCurrent: boolean;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
    chapter,
    isExpanded,
    onToggle,
    onNavigate,
    onEdit,
    onDelete,
    isCurrent
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(chapter.content);

    const handleSaveEdit = () => {
        if (editTitle.trim()) {
            onEdit(chapter.id, editTitle.trim());
            setIsEditing(false);
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

    return (
        <div className={`border-l-2 pl-3 py-2 transition-all duration-200 ${
            isCurrent
                ? 'border-l-primary bg-primary/10'
                : 'border-l-border hover:border-l-primary/50 hover:bg-muted/30'
        }`}>
            <div className="flex items-center gap-2">
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

                <button
                    onClick={onNavigate}
                    className={`flex-1 text-left p-2 rounded transition-colors ${
                        isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                    }`}
                    title="Điều hướng đến chương này"
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
                        <span className="text-sm font-medium">{chapter.content}</span>
                    )}
                </button>

                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

            {isExpanded && (
                <div className="mt-2 text-xs text-muted-foreground">
                    Nhấn vào tiêu đề để điều hướng đến chương này
                </div>
            )}
        </div>
    );
};

export const ChapterList: React.FC<ChapterListProps> = ({
    storySegments,
    onNavigateToChapter,
    onAddChapter,
    onEditChapter,
    onDeleteChapter,
    currentChapterId
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

    const chapters = storySegments.filter(segment => segment.type === 'chapter');
    const contentSegments = storySegments.filter(segment => segment.type !== 'chapter');

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

    const getChapterContentCount = (chapterIndex: number) => {
        const nextChapterIndex = chapters.findIndex((_, i) => i > chapterIndex);
        if (nextChapterIndex === -1) {
            return contentSegments.slice(chapterIndex).length;
        }
        return contentSegments.slice(chapterIndex, nextChapterIndex).length;
    };

    return (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/50 border-b border-border p-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Danh sách chương ({chapters.length})</span>
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
                    {chapters.length === 0 ? (
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
                            {chapters.map((chapter, index) => (
                                <div key={chapter.id} className="group">
                                    <ChapterItem
                                        chapter={chapter}
                                        isExpanded={expandedChapters.has(chapter.id)}
                                        onToggle={() => toggleChapterExpansion(chapter.id)}
                                        onNavigate={() => onNavigateToChapter(chapter.id)}
                                        onEdit={(newTitle) => onEditChapter(chapter.id, newTitle)}
                                        onDelete={() => onDeleteChapter(chapter.id)}
                                        isCurrent={currentChapterId === chapter.id}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {chapters.length > 0 && (
                        <div className="p-3 border-t border-border bg-muted/30">
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Tổng số chương:</span>
                                    <span>{chapters.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tổng số đoạn nội dung:</span>
                                    <span>{contentSegments.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tổng số từ:</span>
                                    <span>{contentSegments.reduce((acc, segment) => acc + segment.content.split(' ').length, 0)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
