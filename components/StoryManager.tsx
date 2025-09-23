import React, { useState } from 'react';
import type { Story } from '../types';
import { CloseIcon, PlusIcon, TrashIcon, EditIcon, SaveIcon } from './icons';

interface StoryManagerProps {
    stories: Record<string, Story>;
    activeStoryId: string | null;
    onLoadStory: (id: string) => void;
    onCreateStory: () => void;
    onDeleteStory: (id: string) => void;
    onRenameStory: (id: string, newName: string) => void;
    onClose: () => void;
}

export const StoryManager: React.FC<StoryManagerProps> = ({
    stories,
    activeStoryId,
    onLoadStory,
    onCreateStory,
    onDeleteStory,
    onRenameStory,
    onClose,
}) => {
    const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const handleStartEdit = (story: Story) => {
        setEditingStoryId(story.id);
        setNewName(story.name);
    };

    const handleRename = () => {
        if (editingStoryId && newName.trim()) {
            onRenameStory(editingStoryId, newName.trim());
            setEditingStoryId(null);
            setNewName('');
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    const sortedStories = (Object.values(stories) as Story[]).sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50">
            <div className="bg-card rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-primary">Manage Stories</h2>
                    <button title="Đóng" onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-4">
                    <button
                        onClick={onCreateStory}
                        className="w-full flex justify-center items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" /> Create New Story
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 border border-border rounded-lg p-2">
                    <ul className="space-y-2">
                        {sortedStories.length > 0 ? sortedStories.map(story => (
                            <li key={story.id} className={`p-3 rounded-md flex justify-between items-center ${story.id === activeStoryId ? 'bg-primary/20 border border-primary/50' : 'bg-muted/50'}`}>
                                <div className="overflow-hidden">
                                    {editingStoryId === story.id ? (
                                        <input
                                            type="text"
                                            value={newName}
                                            aria-label="New story name"
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-input border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                            onBlur={handleRename}
                                        />
                                    ) : (
                                        <p className="font-semibold truncate text-foreground" title={story.name}>{story.name}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Last updated: {formatTimestamp(story.updatedAt)}</p>
                                </div>
                                <div className="flex flex-shrink-0 ml-2">
                                    {editingStoryId === story.id ? (
                                        <button onClick={handleRename} className="p-2 rounded-full hover:bg-muted text-green-500" title="Save">
                                            <SaveIcon className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => onLoadStory(story.id)} disabled={story.id === activeStoryId} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:text-muted disabled:cursor-not-allowed" title="Load Story">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm11 5a1 1 0 10-2 0v2a1 1 0 102 0V7zM7 7a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm-3 4a1 1 0 100 2h8a1 1 0 100-2H4z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleStartEdit(story)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground" title="Rename Story">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => onDeleteStory(story.id)} className="p-2 rounded-full hover:bg-muted text-destructive hover:text-destructive/80" title="Delete Story">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        )) : (
                            <li className="text-center text-muted-foreground py-8">No stories found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
