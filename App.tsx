
import React, { useState, useCallback, useMemo } from 'react';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ContentNavigator } from './components/ContentNavigator';
import { generateStorySegment } from './services/geminiService';
import type { ApiKey, GenerationConfig, StoryFile, StorySegment } from './types';
import { Scenario, CharacterDynamics, Pacing, NSFWLevel } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { KeyIcon, UploadIcon, DownloadIcon, CopyIcon, PlusIcon, CloseIcon, TrashIcon, WandIcon } from './components/icons';

const initialConfig: GenerationConfig = {
    scenario: Scenario.FIRST_TIME,
    dynamics: CharacterDynamics.A_LEADS,
    pacing: Pacing.MEDIUM,
    nsfwLevel: NSFWLevel.SUGGESTIVE,
    avoidKeywords: '',
    focusKeywords: '',
};

export default function App() {
    const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('ai-story-weaver-keys', []);
    const [apiKeyIndex, setApiKeyIndex] = useLocalStorage<number>('ai-story-weaver-key-index', 0);
    const [config, setConfig] = useState<GenerationConfig>(initialConfig);
    const [storySegments, setStorySegments] = useState<StorySegment[]>([
        { id: 'user-1', type: 'user', content: 'Cơn mưa quất mạnh vào ô cửa sổ thư viện cũ kỹ. Bên trong, Elara miết ngón tay dọc theo gáy một cuốn sách bọc da, trong khi Kael dõi theo cô từ phía bên kia căn phòng, một cơn bão đang âm ỉ trong đôi mắt anh.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
    const [files, setFiles] = useState<StoryFile[]>([]);
    
    const [regeneratingSegment, setRegeneratingSegment] = useState<StorySegment | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (uploadedFiles) {
            const newFiles: StoryFile[] = [];
            Array.from(uploadedFiles).forEach(file => {
                if (file.type === 'text/plain') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const content = e.target?.result as string;
                        newFiles.push({ id: `${file.name}-${Date.now()}`, name: file.name, content });
                        if (newFiles.length === uploadedFiles.length) {
                             const combinedContent = newFiles.map(f => f.content).join('\n\n');
                             setStorySegments([{ id: `user-${Date.now()}`, type: 'user', content: combinedContent}]);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
    };

    const handleGenerate = useCallback(async (contextOverride?: string, configOverride?: GenerationConfig, segmentToReplaceId?: string) => {
        const context = contextOverride || storySegments.map(s => s.content).join('\n\n');
        const generationConfig = configOverride || config;
        
        if (!context.trim()) {
            setError("Không thể sáng tạo từ một câu chuyện trống.");
            return;
        }
        if (apiKeys.length === 0) {
            setError("Vui lòng thêm ít nhất một API Key trong phần cài đặt.");
            setIsKeyManagerOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await generateStorySegment(context, generationConfig, apiKeys, apiKeyIndex);
            
            const newSegment: StorySegment = {
                id: `ai-${Date.now()}`,
                type: 'ai',
                content: result.content,
                config: generationConfig,
            };

            if(segmentToReplaceId) {
                setStorySegments(prev => prev.map(seg => seg.id === segmentToReplaceId ? newSegment : seg));
            } else {
                 setStorySegments(prev => [
                    ...prev,
                    newSegment,
                    { id: `user-${Date.now()}`, type: 'user', content: '' }
                ]);
            }
           
            setApiKeyIndex(result.newKeyIndex);
        } catch (e: any) {
            setError(e.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
            setRegeneratingSegment(null);
        }
    }, [storySegments, config, apiKeys, apiKeyIndex, setApiKeyIndex]);

    const updateSegmentContent = (id: string, newContent: string) => {
        setStorySegments(prev => prev.map(seg => seg.id === id ? { ...seg, content: newContent } : seg));
    };

    const addTextSegmentAfter = (afterId: string) => {
        const index = storySegments.findIndex(s => s.id === afterId);
        if (index > -1) {
            const newSegment: StorySegment = { id: `user-${Date.now()}`, type: 'user', content: '' };
            const newSegments = [...storySegments];
            newSegments.splice(index + 1, 0, newSegment);
            setStorySegments(newSegments);
        }
    };

    const deleteSegment = (id: string) => {
        setStorySegments(prev => prev.filter(seg => seg.id !== id));
    };
    
    const fullStoryText = useMemo(() => storySegments.map(s => s.content).join('\n\n'), [storySegments]);

    const handleDownload = (format: 'txt' | 'md') => {
        const blob = new Blob([fullStoryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(fullStoryText).then(() => {
            alert('Đã sao chép câu chuyện vào clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Sao chép câu chuyện thất bại.');
        });
    };
    
    const openRegenModal = (segment: StorySegment) => {
        if(segment.config) {
            setRegeneratingSegment(segment);
        }
    };
    
    const handleRegenerate = () => {
        if(regeneratingSegment) {
            const contextIndex = storySegments.findIndex(s => s.id === regeneratingSegment.id);
            const context = storySegments.slice(0, contextIndex).map(s => s.content).join('\n\n');
            handleGenerate(context, regeneratingSegment.config, regeneratingSegment.id);
        }
    };

    return (
        <div className="h-screen w-screen flex bg-gray-900 text-gray-100 font-sans">
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 shadow-md">
                    <h1 className="text-2xl font-bold text-indigo-400">AI Story Weaver</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleDownload('txt')} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                            <DownloadIcon className="w-4 h-4" /> TXT
                        </button>
                         <button onClick={() => handleDownload('md')} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                            <DownloadIcon className="w-4 h-4" /> Markdown
                        </button>
                        <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                            <CopyIcon className="w-4 h-4" /> Sao chép
                        </button>
                        <button onClick={() => setIsKeyManagerOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                            <KeyIcon className="w-4 h-4" /> API Keys ({apiKeys.length})
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="p-3 bg-red-800 text-white flex justify-between items-center">
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="font-bold text-lg">&times;</button>
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-lg max-w-4xl mx-auto w-full">
                    {storySegments.map((segment) => (
                        <div key={segment.id} className="relative group">
                            {segment.type === 'user' ? (
                                <textarea
                                    value={segment.content}
                                    onChange={(e) => updateSegmentContent(segment.id, e.target.value)}
                                    className="w-full bg-transparent p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
                                    placeholder="Bắt đầu viết câu chuyện của bạn ở đây..."
                                />
                            ) : (
                                <div onClick={() => openRegenModal(segment)} className="p-4 my-4 bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-lg cursor-pointer hover:bg-indigo-900/40 transition-colors">
                                    <p className="whitespace-pre-wrap">{segment.content}</p>
                                </div>
                            )}
                             <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => addTextSegmentAfter(segment.id)} className="p-1.5 bg-gray-700 rounded-full hover:bg-indigo-600" title="Thêm khối văn bản bên dưới">
                                    <PlusIcon className="w-4 h-4"/>
                                </button>
                                <button onClick={() => deleteSegment(segment.id)} className="p-1.5 bg-gray-700 rounded-full hover:bg-red-600" title="Xóa khối">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="mt-8 text-center">
                         <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                            <UploadIcon className="w-5 h-5" />
                            Tải lên file .txt
                        </label>
                        <input id="file-upload" type="file" multiple accept=".txt" onChange={handleFileChange} className="hidden" />
                    </div>
                </div>
            </main>
            
            <aside className="w-[380px] flex-shrink-0">
                <ContentNavigator 
                    config={config} 
                    setConfig={setConfig}
                    onGenerate={() => handleGenerate()}
                    isLoading={isLoading && !regeneratingSegment}
                    isGenerateDisabled={!fullStoryText.trim()}
                />
            </aside>
            
            {isKeyManagerOpen && <ApiKeyManager apiKeys={apiKeys} setApiKeys={setApiKeys} onClose={() => setIsKeyManagerOpen(false)} />}
            
            {regeneratingSegment && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-indigo-400">Tái tạo Phân cảnh</h3>
                            <button onClick={() => setRegeneratingSegment(null)} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                           <ContentNavigator
                                config={{...initialConfig, ...regeneratingSegment.config}}
                                setConfig={(updater) => {
                                    const newConf = typeof updater === 'function' ? updater({...initialConfig, ...regeneratingSegment.config}) : updater;
                                    setRegeneratingSegment(s => s ? {...s, config: newConf } : null);
                                }}
                                onGenerate={handleRegenerate}
                                isLoading={isLoading && !!regeneratingSegment}
                                isGenerateDisabled={false}
                           />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}