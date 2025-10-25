
import React, { useState, useMemo } from 'react';
import type { ApiKey } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KeyIcon, TrashIcon, PlusIcon, CloseIcon, RefreshIcon, CheckCircleIcon, ExclamationCircleIcon, ChevronDownIcon, ChevronRightIcon, EditIcon, SaveIcon } from './icons';
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
    keys: ['N/A'],
    activeIndexes: [0],
    isDefault: true
};

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKeys, setApiKeys, useDefaultKey, setUseDefaultKey, onClose }) => {
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [activeIndexes, setActiveIndexes] = useState<number[]>([]);
    const [newEndpoint, setNewEndpoint] = useState('');
    const [newModelId, setNewModelId] = useState('');
    const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});
    const [testError, setTestError] = useState<Record<string, string | null>>({});
    const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editEndpoint, setEditEndpoint] = useState('');
    const [editModelId, setEditModelId] = useState('');

    const toggleProviderExpansion = (apiKeyId: string) => {
        setExpandedProviders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(apiKeyId)) {
                newSet.delete(apiKeyId);
            } else {
                newSet.add(apiKeyId);
            }
            return newSet;
        });
    };

    const toggleKeyActivation = (apiKeyId: string, keyIndex: number) => {
        setApiKeys(prev => prev.map(apiKey => {
            if (apiKey.id === apiKeyId) {
                const activeIndexes = apiKey.activeIndexes.includes(keyIndex)
                    ? apiKey.activeIndexes.filter(idx => idx !== keyIndex)
                    : [...apiKey.activeIndexes, keyIndex].sort((a, b) => a - b);
                return { ...apiKey, activeIndexes };
            }
            return apiKey;
        }));
    };

    const displayKeys = useMemo(() => {
        return useDefaultKey ? [DEFAULT_API_KEY, ...apiKeys] : apiKeys;
    }, [useDefaultKey, apiKeys]);

    const handleAddKey = () => {
        if (newKeyName.trim() && newKeyValue.trim()) {
            const keys = newKeyValue.split(/[,\n\s]+/).filter(k => k.trim()).map(k => k.trim());
            if (keys.length === 0) return;

            const newKey: ApiKey = {
                id: Date.now().toString(),
                name: newKeyName.trim(),
                keys,
                activeIndexes: keys.map((_, i) => i), // all active by default
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

    const handleDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
        e.dataTransfer.setData("draggedIndex", index.toString());
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>, dropIndex: number) => {
        if (useDefaultKey && dropIndex === 0) return;

        const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
        
        const realDraggedIndex = useDefaultKey ? draggedIndex - 1 : draggedIndex;
        const realDropIndex = useDefaultKey ? dropIndex - 1 : dropIndex;

        const newApiKeys = [...apiKeys];
        const draggedItem = newApiKeys.splice(realDraggedIndex, 1)[0];
        newApiKeys.splice(realDropIndex, 0, draggedItem);
        setApiKeys(newApiKeys);
    };

    const startEditingProvider = (apiKey: ApiKey) => {
        setEditingProvider(apiKey.id);
        setEditName(apiKey.name);
        setEditEndpoint(apiKey.endpoint || '');
        setEditModelId(apiKey.modelId || '');
    };

    const cancelEditingProvider = () => {
        setEditingProvider(null);
        setEditName('');
        setEditEndpoint('');
        setEditModelId('');
    };

    const saveEditedProvider = () => {
        if (editingProvider && editName.trim()) {
            setApiKeys(prev => prev.map(apiKey =>
                apiKey.id === editingProvider
                    ? { ...apiKey, name: editName.trim(), endpoint: editEndpoint.trim() || undefined, modelId: editModelId.trim() || undefined }
                    : apiKey
            ));
            cancelEditingProvider();
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50">
            <div className="bg-card rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-primary flex items-center">
                        <KeyIcon className="w-6 h-6 mr-3" />
                        Quản lý API Key
                    </h2>
                    <button title={"Đóng"} onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex items-center justify-between p-3 mb-4 bg-muted/50 rounded-lg">
                    <div>
                        <h3 className="font-semibold text-foreground">Sử dụng API Key mặc định của Gemini</h3>
                        <p className="text-xs text-muted-foreground">Sử dụng key được cung cấp sẵn (chia sẻ, có thể bị giới hạn).</p>
                    </div>
                    <label htmlFor="default-key-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" title="Toggle default API key" checked={useDefaultKey} onChange={e => setUseDefaultKey(e.target.checked)} id="default-key-toggle" className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-background peer-focus:ring-ring peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                    Thêm API key Gemini của bạn hoặc một nhà cung cấp khác (tương thích OpenAI).
                </p>

                <div className="space-y-3 mb-4 p-4 border border-border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-primary/80">Thêm Key mới</h3>
                    <input type="text" placeholder="Tên nhà cung cấp (ví dụ: 'Gemini chính')" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    <textarea placeholder="API Key * (có thể nhập nhiều key cách nhau bởi ',' hoặc xuống dòng hoặc dấu cách)" rows={3} value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" />
                    <p className="text-xs text-muted-foreground -mt-2 pl-1">Tùy chọn cho nhà cung cấp khác:</p>
                    <input type="text" placeholder="Endpoint (Base URL) (e.g., https://openrouter.ai/api/v1)" value={newEndpoint} onChange={(e) => setNewEndpoint(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    <input type="text" placeholder="Model ID (e.g., google/gemini-flash-1.5)" value={newModelId} onChange={(e) => setNewModelId(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button onClick={handleAddKey} className="w-full flex justify-center items-center px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed" disabled={!newKeyName.trim() || !newKeyValue.trim()} >
                        <PlusIcon className="w-5 h-5 mr-2" /> Thêm Provider
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-2">
                        {displayKeys.map((apiKey, index) => {
                            const isExpanded = expandedProviders.has(apiKey.id);
                            return (
                                <div key={apiKey.id} className="bg-card rounded-md border border-border">
                                    {/* Provider Header */}
                                    <div
                                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${apiKey.isDefault ? 'bg-primary/20 border-b border-primary/50' : 'bg-muted/50'}`}
                                        onClick={() => toggleProviderExpansion(apiKey.id)}
                                        draggable={!apiKey.isDefault}
                                        onDragStart={(e) => !apiKey.isDefault && handleDragStart(e, index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => !apiKey.isDefault && handleDrop(e, index)}
                                    >
                                        <div className="flex items-center flex-grow overflow-hidden">
                                            <span className="text-muted-foreground mr-4 font-mono text-sm">{index + 1}.</span>
                                            {isExpanded ? (
                                                <ChevronDownIcon className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                                            ) : (
                                                <ChevronRightIcon className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                                            )}
                                            <KeyIcon className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                                            <div className="overflow-hidden flex-grow">
                                                {editingProvider === apiKey.id ? (
                                                    <div className="flex flex-col space-y-2 pr-2">
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="text-sm font-semibold bg-input border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                                            placeholder="Provider name"
                                                        />
                                                        <div className="flex space-x-2">
                                                            <input
                                                                type="text"
                                                                value={editEndpoint}
                                                                onChange={(e) => setEditEndpoint(e.target.value)}
                                                                className="text-xs bg-input border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-grow"
                                                                placeholder="Endpoint URL"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editModelId}
                                                                onChange={(e) => setEditModelId(e.target.value)}
                                                                className="text-xs bg-input border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-grow"
                                                                placeholder="Model ID"
                                                            />
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button onClick={(e) => { e.stopPropagation(); saveEditedProvider(); }} className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90" title="Save">
                                                                <SaveIcon className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); cancelEditingProvider(); }} className="px-3 py-1 bg-muted text-foreground text-xs rounded hover:bg-muted/80" title="Cancel">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="font-semibold truncate" title={apiKey.name}>{apiKey.name}</p>
                                                        {!apiKey.isDefault && apiKey.endpoint && apiKey.modelId ? (
                                                            <p className="text-xs text-muted-foreground font-mono truncate" title={apiKey.modelId}>{apiKey.modelId} @ {apiKey.endpoint}</p>
                                                        ) : !apiKey.isDefault ? (
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                {apiKey.activeIndexes.length}/{apiKey.keys.length} keys active
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!apiKey.isDefault && (
                                            <div className="flex items-center flex-shrink-0 ml-2">
                                                <div className="w-6 h-6 flex items-center justify-center mr-1">
                                                    {testStatus[apiKey.id] === 'testing' && <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                    {testStatus[apiKey.id] === 'success' && <span title="Test successful!"><CheckCircleIcon className="w-5 h-5 text-green-500" /></span>}
                                                    {testStatus[apiKey.id] === 'error' && <span title={testError[apiKey.id] || 'Test failed!'}><ExclamationCircleIcon className="w-5 h-5 text-red-500" /></span>}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); handleTestKey(apiKey); }} disabled={testStatus[apiKey.id] === 'testing'} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:text-muted disabled:cursor-not-allowed" title="Test Key">
                                                    <RefreshIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); startEditingProvider(apiKey); }} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit Provider">
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteKey(apiKey.id); }} className="p-2 rounded-full hover:bg-muted text-destructive hover:text-destructive/80" title="Delete Key">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Individual Keys */}
                                    {isExpanded && !apiKey.isDefault && (
                                        <div className="p-3 border-t border-border bg-muted/20">
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Select active keys:</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {apiKey.keys.map((key, keyIndex) => (
                                                    <label key={keyIndex} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={apiKey.activeIndexes.includes(keyIndex)}
                                                            onChange={() => toggleKeyActivation(apiKey.id, keyIndex)}
                                                            className="rounded border-border text-primary focus:ring-ring focus:ring-2"
                                                        />
                                                        <span className="text-sm font-mono text-muted-foreground truncate" title={key}>
                                                            {key.length > 50 ? `${key.substring(0, 50)}...` : key}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {displayKeys.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">Chưa có API key nào được thêm.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
