
import React, { useState } from 'react';
import type { ApiKey } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KeyIcon, TrashIcon, PlusIcon, CloseIcon } from './icons';

interface ApiKeyManagerProps {
    apiKeys: ApiKey[];
    setApiKeys: React.Dispatch<React.SetStateAction<ApiKey[]>>;
    onClose: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKeys, setApiKeys, onClose }) => {
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');

    const handleAddKey = () => {
        if (newKeyName.trim() && newKeyValue.trim()) {
            const newKey: ApiKey = {
                id: Date.now().toString(),
                name: newKeyName.trim(),
                key: newKeyValue.trim(),
            };
            setApiKeys([...apiKeys, newKey]);
            setNewKeyName('');
            setNewKeyValue('');
        }
    };

    const handleDeleteKey = (id: string) => {
        setApiKeys(apiKeys.filter(key => key.id !== id));
    };

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        e.dataTransfer.setData("draggedIndex", index.toString());
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
        const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
        const newApiKeys = [...apiKeys];
        const draggedItem = newApiKeys.splice(draggedIndex, 1)[0];
        newApiKeys.splice(dropIndex, 0, draggedItem);
        setApiKeys(newApiKeys);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-400 flex items-center">
                        <KeyIcon className="w-6 h-6 mr-3" />
                        Quản lý API Key
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Thêm các API key của Google AI Studio của bạn. Kéo và thả để sắp xếp thứ tự ưu tiên (trên cùng là cao nhất). Ứng dụng sẽ tự động chuyển sang key tiếp theo nếu một key đạt đến giới hạn sử dụng.
                </p>

                <div className="space-y-3 mb-4">
                    <input
                        type="text"
                        placeholder="Tên Key (ví dụ: 'Key chính')"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="password"
                        placeholder="Giá trị API Key"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleAddKey}
                        className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={!newKeyName.trim() || !newKeyValue.trim()}
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Thêm Key
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {apiKeys.map((apiKey, index) => (
                            <li
                                key={apiKey.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, index)}
                                className="flex items-center justify-between bg-gray-700 p-3 rounded-md cursor-grab active:cursor-grabbing"
                            >
                                <div className="flex items-center">
                                    <span className="text-gray-400 mr-4 font-mono text-sm">{index + 1}.</span>
                                    <KeyIcon className="w-5 h-5 mr-3 text-indigo-400" />
                                    <div>
                                        <p className="font-semibold">{apiKey.name}</p>
                                        <p className="text-xs text-gray-400 font-mono">{apiKey.key.substring(0, 4)}...{apiKey.key.slice(-4)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteKey(apiKey.id)} className="p-2 rounded-full hover:bg-gray-600 text-red-400 hover:text-red-300">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                         {apiKeys.length === 0 && (
                            <li className="text-center text-gray-500 py-8">Chưa có API key nào được thêm.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};