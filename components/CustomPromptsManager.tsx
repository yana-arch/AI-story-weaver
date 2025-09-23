
import React, { useState } from 'react';
import type { CustomPrompt } from '../types';
import { CloseIcon, PlusIcon, TrashIcon, EditIcon, SaveIcon } from './icons';

interface CustomPromptsManagerProps {
    prompts: CustomPrompt[];
    setPrompts: React.Dispatch<React.SetStateAction<CustomPrompt[]>>;
    onClose: () => void;
}

export const CustomPromptsManager: React.FC<CustomPromptsManagerProps> = ({ prompts, setPrompts, onClose }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);

    const handleAddPrompt = () => {
        if (newTitle.trim() && newContent.trim()) {
            const newPrompt: CustomPrompt = {
                id: Date.now().toString(),
                title: newTitle.trim(),
                content: newContent.trim(),
            };
            setPrompts([...prompts, newPrompt]);
            setNewTitle('');
            setNewContent('');
        }
    };

    const handleDeletePrompt = (id: string) => {
        setPrompts(prompts.filter(prompt => prompt.id !== id));
        if (editingPrompt?.id === id) {
            setEditingPrompt(null);
        }
    };
    
    const handleStartEdit = (prompt: CustomPrompt) => {
        setEditingPrompt({ ...prompt });
    };

    const handleCancelEdit = () => {
        setEditingPrompt(null);
    };

    const handleUpdatePrompt = () => {
        if (editingPrompt && editingPrompt.title.trim() && editingPrompt.content.trim()) {
            setPrompts(prompts.map(p => p.id === editingPrompt.id ? editingPrompt : p));
            setEditingPrompt(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50">
            <div className="bg-card rounded-lg shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-primary">Quản lý yêu cầu tùy chỉnh</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex gap-6">
                    {/* Add/Edit Form */}
                    <div className="w-1/2 flex flex-col">
                        <h3 className="font-semibold text-lg mb-2 text-primary/80">
                            {editingPrompt ? 'Chỉnh sửa yêu cầu' : 'Thêm yêu cầu mới'}
                        </h3>
                        <div className="space-y-3 p-4 border border-border rounded-lg h-full flex flex-col">
                            <input
                                type="text"
                                placeholder="Tiêu đề (ví dụ: 'Mô tả nhân vật A')"
                                value={editingPrompt ? editingPrompt.title : newTitle}
                                onChange={(e) => editingPrompt ? setEditingPrompt({...editingPrompt, title: e.target.value}) : setNewTitle(e.target.value)}
                                className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <textarea
                                placeholder="Nội dung yêu cầu..."
                                rows={10}
                                value={editingPrompt ? editingPrompt.content : newContent}
                                onChange={(e) => editingPrompt ? setEditingPrompt({...editingPrompt, content: e.target.value}) : setNewContent(e.target.value)}
                                className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y flex-grow"
                            />
                            {editingPrompt ? (
                                <div className="flex gap-2">
                                    <button onClick={handleUpdatePrompt} className="w-full flex justify-center items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors">
                                        <SaveIcon className="w-5 h-5 mr-2" /> Lưu
                                    </button>
                                    <button onClick={handleCancelEdit} className="px-4 py-2 bg-muted text-foreground font-semibold rounded-md hover:bg-muted/80 transition-colors">
                                        Hủy
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddPrompt}
                                    className="w-full flex justify-center items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
                                    disabled={!newTitle.trim() || !newContent.trim()}
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" /> Thêm yêu cầu
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Prompts List */}
                    <div className="w-1/2 flex flex-col">
                         <h3 className="font-semibold text-lg mb-2 text-muted-foreground">Danh sách yêu cầu</h3>
                        <div className="flex-grow overflow-y-auto pr-2 border border-border rounded-lg p-2">
                            <ul className="space-y-2">
                                {prompts.length > 0 ? prompts.map(prompt => (
                                    <li key={prompt.id} className="p-3 rounded-md bg-muted/50 flex justify-between items-start">
                                        <div className="overflow-hidden">
                                            <p className="font-semibold truncate text-foreground" title={prompt.title}>{prompt.title}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-2" title={prompt.content}>{prompt.content}</p>
                                        </div>
                                        <div className="flex flex-shrink-0 ml-2">
                                            <button onClick={() => handleStartEdit(prompt)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit Prompt">
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeletePrompt(prompt.id)} className="p-2 rounded-full hover:bg-muted text-destructive hover:text-destructive/80" title="Delete Prompt">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                )) : (
                                    <li className="text-center text-muted-foreground py-8">Chưa có yêu cầu nào.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
