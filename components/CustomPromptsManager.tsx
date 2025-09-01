
import React, { useState, useEffect } from 'react';
import type { CustomPrompt } from '../types';
import { CloseIcon, BookmarkIcon, PlusIcon, TrashIcon, EditIcon } from './icons';

interface CustomPromptsManagerProps {
    prompts: CustomPrompt[];
    setPrompts: React.Dispatch<React.SetStateAction<CustomPrompt[]>>;
    onClose: () => void;
}

export const CustomPromptsManager: React.FC<CustomPromptsManagerProps> = ({ prompts, setPrompts, onClose }) => {
    const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (editingPrompt) {
            setTitle(editingPrompt.title);
            setContent(editingPrompt.content);
        } else {
            setTitle('');
            setContent('');
        }
    }, [editingPrompt]);

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;

        if (editingPrompt) {
            // Update existing prompt
            setPrompts(prompts.map(p => 
                p.id === editingPrompt.id ? { ...p, title: title.trim(), content: content.trim() } : p
            ));
        } else {
            // Add new prompt
            const newPrompt: CustomPrompt = {
                id: Date.now().toString(),
                title: title.trim(),
                content: content.trim(),
            };
            setPrompts([...prompts, newPrompt]);
        }
        
        // Reset form
        setEditingPrompt(null);
    };
    
    const handleDelete = (id: string) => {
        setPrompts(prompts.filter(p => p.id !== id));
        if (editingPrompt?.id === id) {
            setEditingPrompt(null);
        }
    };

    const handleSelectForEdit = (prompt: CustomPrompt) => {
        setEditingPrompt(prompt);
    };

    const handleClearForm = () => {
        setEditingPrompt(null);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-400 flex items-center">
                        <BookmarkIcon className="w-6 h-6 mr-3" />
                        Quản lý Yêu cầu Tùy chỉnh
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Thêm, sửa, hoặc xóa các yêu cầu tùy chỉnh. Các yêu cầu này có thể được chọn trong bảng điều khiển để định hướng AI.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                    {/* Form Section */}
                    <div className="flex flex-col bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-semibold text-indigo-300 mb-3">
                            {editingPrompt ? 'Chỉnh sửa Yêu cầu' : 'Thêm Yêu cầu Mới'}
                        </h3>
                        <div className="space-y-4 flex-grow flex flex-col">
                            <input
                                type="text"
                                placeholder="Tiêu đề (ví dụ: 'Xưng hô A-B')"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <textarea
                                placeholder="Nội dung yêu cầu (ví dụ: 'Nhân vật A xưng 'anh', gọi nhân vật B là 'em'')"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                rows={8}
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                             <button
                                onClick={handleSave}
                                className="flex-1 flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                disabled={!title.trim() || !content.trim()}
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                {editingPrompt ? 'Lưu thay đổi' : 'Thêm yêu cầu'}
                            </button>
                            {editingPrompt && (
                                <button onClick={handleClearForm} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors">
                                    Tạo mới
                                </button>
                            )}
                        </div>
                    </div>
                    {/* List Section */}
                    <div className="flex flex-col">
                         <h3 className="text-lg font-semibold text-indigo-300 mb-3">
                            Danh sách Yêu cầu
                        </h3>
                        <div className="flex-grow overflow-y-auto pr-2 border-t border-gray-700 pt-3">
                            <ul className="space-y-2">
                                {prompts.map((prompt) => (
                                    <li
                                        key={prompt.id}
                                        className="flex items-center justify-between bg-gray-700/50 p-3 rounded-md"
                                    >
                                        <div className="flex-1 overflow-hidden">
                                           <p className="font-semibold truncate" title={prompt.title}>{prompt.title}</p>
                                           <p className="text-xs text-gray-400 truncate" title={prompt.content}>{prompt.content}</p>
                                        </div>
                                        <div className="flex items-center ml-4">
                                            <button onClick={() => handleSelectForEdit(prompt)} className="p-2 rounded-full hover:bg-gray-600 text-blue-400 hover:text-blue-300" aria-label={`Edit ${prompt.title}`}>
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(prompt.id)} className="p-2 rounded-full hover:bg-gray-600 text-red-400 hover:text-red-300" aria-label={`Delete ${prompt.title}`}>
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {prompts.length === 0 && (
                                    <li className="text-center text-gray-500 py-10">Chưa có yêu cầu nào.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
