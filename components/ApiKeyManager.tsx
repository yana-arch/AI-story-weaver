
import React, { useState, useMemo } from 'react';
import type { ApiKey } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KeyIcon, TrashIcon, PlusIcon, CloseIcon, RefreshIcon, CheckCircleIcon, ExclamationCircleIcon } from './icons';
import { testApiKey } from '../services/geminiService';

interface ApiKeyManagerProps {
    apiKeys: ApiKey[];
    setApiKeys: React.Dispatch<React.SetStateAction<ApiKey[]>>;
    useDefaultKey: boolean;
    setUseDefaultKey: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const DEFAULT_API_KEY: ApiKey = { 
    id: 'default', 
    name: 'API Key Mặc định (Dùng chung)', 
    key: 'N/A', 
    isDefault: true 
};

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKeys, setApiKeys, useDefaultKey, setUseDefaultKey, onClose }) => {
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newEndpoint, setNewEndpoint] = useState('');
    const [newModelId, setNewModelId] = useState('');
    const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});
    const [testError, setTestError] = useState<Record<string, string | null>>({});

    const displayKeys = useMemo(() => {
        return useDefaultKey ? [DEFAULT_API_KEY, ...apiKeys] : apiKeys;
    }, [useDefaultKey, apiKeys]);

    const handleAddKey = () => {
        if (newKeyName.trim() && newKeyValue.trim()) {
            const newKey: ApiKey = {
                id: Date.now().toString(),
                name: newKeyName.trim(),
                key: newKeyValue.trim(),
                endpoint: newEndpoint.trim() || undefined,
                modelId: newModelId.trim() || undefined,
            };
            setApiKeys([...apiKeys, newKey]);
            setNewKeyName('');
            setNewKeyValue('');
            setNewEndpoint('');
            setNewModelId('');
        }
    };

    const handleDeleteKey = (id: string) => {
        setApiKeys(apiKeys.filter(key => key.id !== id));
        setTestStatus(prev => { const next = {...prev}; delete next[id]; return next; });
        setTestError(prev => { const next = {...prev}; delete next[id]; return next; });
    };

    const handleTestKey = async (apiKey: ApiKey) => {
        setTestStatus(prev => ({...prev, [apiKey.id]: 'testing' }));
        setTestError(prev => ({...prev, [apiKey.id]: null}));
        try {
            await testApiKey(apiKey);
            setTestStatus(prev => ({...prev, [apiKey.id]: 'success' }));
        } catch (e: any) {
            setTestStatus(prev => ({...prev, [apiKey.id]: 'error' }));
            setTestError(prev => ({...prev, [apiKey.id]: e.message || 'Unknown error'}));
        }
    }

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        e.dataTransfer.setData("draggedIndex", index.toString());
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
        if (useDefaultKey && dropIndex === 0) return;

        const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
        
        const realDraggedIndex = useDefaultKey ? draggedIndex - 1 : draggedIndex;
        const realDropIndex = useDefaultKey ? dropIndex - 1 : dropIndex;

        const newApiKeys = [...apiKeys];
        const draggedItem = newApiKeys.splice(realDraggedIndex, 1)[0];
        newApiKeys.splice(realDropIndex, 0, draggedItem);
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
                
                <div className="flex items-center justify-between p-3 mb-4 bg-gray-700/50 rounded-lg">
                    <div>
                        <h3 className="font-semibold text-gray-200">Sử dụng API Key mặc định của Gemini</h3>
                        <p className="text-xs text-gray-400">Sử dụng key được cung cấp sẵn (chia sẻ, có thể bị giới hạn).</p>
                    </div>
                    <label htmlFor="default-key-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={useDefaultKey} onChange={e => setUseDefaultKey(e.target.checked)} id="default-key-toggle" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-800 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <p className="text-sm text-gray-400 mb-2">
                    Thêm API key Gemini của bạn hoặc một nhà cung cấp khác (tương thích OpenAI).
                </p>

                <div className="space-y-3 mb-4 p-4 border border-gray-700 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-indigo-300">Thêm Key mới</h3>
                    <input type="text" placeholder="Tên Key (ví dụ: 'Key chính')" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" placeholder="Giá trị API Key *" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-xs text-gray-500 -mt-2 pl-1">Tùy chọn cho nhà cung cấp khác:</p>
                    <input type="text" placeholder="Endpoint (Base URL) (e.g., https://openrouter.ai/api/v1)" value={newEndpoint} onChange={(e) => setNewEndpoint(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="text" placeholder="Model ID (e.g., google/gemini-flash-1.5)" value={newModelId} onChange={(e) => setNewModelId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={handleAddKey} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!newKeyName.trim() || !newKeyValue.trim()} >
                        <PlusIcon className="w-5 h-5 mr-2" /> Thêm Key
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {displayKeys.map((apiKey, index) => (
                            <li
                                key={apiKey.id}
                                draggable={!apiKey.isDefault}
                                onDragStart={(e) => !apiKey.isDefault && handleDragStart(e, index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => !apiKey.isDefault && handleDrop(e, index)}
                                className={`flex items-center justify-between p-3 rounded-md ${ apiKey.isDefault ? 'bg-indigo-900/40 border border-indigo-700' : 'bg-gray-700 cursor-grab active:cursor-grabbing'}`}
                            >
                                <div className="flex items-center flex-grow overflow-hidden">
                                    <span className="text-gray-400 mr-4 font-mono text-sm">{index + 1}.</span>
                                    <KeyIcon className="w-5 h-5 mr-3 text-indigo-400 flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="font-semibold truncate" title={apiKey.name}>{apiKey.name}</p>
                                        {!apiKey.isDefault && apiKey.endpoint && apiKey.modelId ? (
                                            <p className="text-xs text-gray-400 font-mono truncate" title={apiKey.modelId}>{apiKey.modelId} @ {apiKey.endpoint}</p>
                                        ) : !apiKey.isDefault ? (
                                            <p className="text-xs text-gray-400 font-mono">Gemini ({apiKey.key.substring(0, 4)}...{apiKey.key.slice(-4)})</p>
                                        ) : null}
                                    </div>
                                </div>
                                {!apiKey.isDefault && (
                                    <div className="flex items-center flex-shrink-0 ml-2">
                                        <div className="w-6 h-6 flex items-center justify-center mr-1">
                                            {testStatus[apiKey.id] === 'testing' && <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                            {/* Fix: Wrap status icons in a span with a title attribute. The 'title' prop is not valid for IconProps, causing a type error. */}
                                            {testStatus[apiKey.id] === 'success' && <span title="Test successful!"><CheckCircleIcon className="w-5 h-5 text-green-400" /></span>}
                                            {testStatus[apiKey.id] === 'error' && <span title={testError[apiKey.id] || 'Test failed!'}><ExclamationCircleIcon className="w-5 h-5 text-red-400" /></span>}
                                        </div>
                                        <button onClick={() => handleTestKey(apiKey)} disabled={testStatus[apiKey.id] === 'testing'} className="p-2 rounded-full hover:bg-gray-600 text-gray-300 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed" title="Test Key">
                                            <RefreshIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteKey(apiKey.id)} className="p-2 rounded-full hover:bg-gray-600 text-red-400 hover:text-red-300" title="Delete Key">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                         {displayKeys.length === 0 && (
                            <li className="text-center text-gray-500 py-8">Chưa có API key nào được thêm.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};