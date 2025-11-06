import React, { useState } from 'react';
import type { GenerationConfig, CustomPrompt, KeywordPreset, StorySegment } from '../types';
import { Scenario, CharacterDynamics, Pacing, AdultContentOptions, GenerationMode, NarrativeStructure, RewriteTarget } from '../types';
import { WandIcon, BookmarkIcon, ChevronDownIcon, SaveIcon, CheckCircleIcon } from './icons';
import { getAIService } from '../services/aiService';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface ContentNavigatorProps {
    config: GenerationConfig;
    setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
    onGenerate: () => void;
    isLoading: boolean;
    isGenerateDisabled: boolean;
    customPrompts: CustomPrompt[];
    selectedPromptIds: string[];
    setSelectedPromptIds: (ids: string[]) => void;
    onManagePrompts: () => void;
    onAddPrompt?: (prompt: Omit<CustomPrompt, 'id'> | Omit<CustomPrompt, 'id'>[]) => void;
    keywordPresets: KeywordPreset[];
    onManageKeywordPresets: () => void;
    onSaveKeywordPreset: () => void;
    storySegments: StorySegment[];
}

const Section: React.FC<{ title: string; children: React.ReactNode, initialOpen?: boolean }> = ({ title, children, initialOpen = true }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="bg-card/50 border border-border rounded-lg overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left"
            >
                <h3 className="text-md font-semibold text-primary">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && (
                <div className="p-3 pt-0 space-y-3">
                    {children}
                </div>
            )}
        </div>
    );
};

const LabeledSelect: React.FC<{label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode}> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <select
            aria-label={label}
            value={value}
            onChange={onChange}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
            {children}
        </select>
    </div>
);

const ComboboxInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  dataListId: string;
}> = ({ label, value, onChange, options, dataListId }) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <input
            type="text"
            list={dataListId}
            value={value}
            onChange={onChange}
            aria-label={label}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <datalist id={dataListId}>
            {options.map(opt => <option key={opt} value={opt} />)}
        </datalist>
    </div>
);

const TextArea: React.FC<{ label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; }> = ({ label, placeholder, value, onChange }) => (
     <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <textarea
            rows={2}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
    </div>
);


export const ContentNavigator: React.FC<ContentNavigatorProps> = ({ config, setConfig, onGenerate, isLoading, isGenerateDisabled, customPrompts, selectedPromptIds, setSelectedPromptIds, onManagePrompts, onAddPrompt, keywordPresets, onManageKeywordPresets, onSaveKeywordPreset, storySegments }) => {

    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
    const { addError } = useErrorHandler();

    const handleChange = <K extends keyof GenerationConfig,>(
        field: K,
        value: GenerationConfig[K]
    ) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleAutoFillSettings = async () => {
        if (!config.additionalInstructions?.trim()) {
            addError('Vui lòng nhập hướng dẫn để tự động điền cài đặt', {
                context: 'Auto-fill Settings',
                recoverable: true,
            });
            return;
        }

        setIsAutoFilling(true);
        try {
            const aiService = getAIService((error, options) => {
                addError(error, options);
                return typeof error === 'string' ? error : error.message;
            });

            // Run settings auto-fill
            const autoFilledSettings = await aiService.generateAutoFillSettings(
                config.additionalInstructions,
                'gemini-flash' // Default model, could be made configurable
            );

            // Apply the auto-filled settings
            console.log('Auto-filled settings from AI:', autoFilledSettings);
            setConfig(prev => {
                const newConfig = {
                    ...prev,
                    ...autoFilledSettings,
                };
                console.log('New config after auto-fill:', newConfig);
                return newConfig;
            });

            // Generate prompts if enabled
            if (config.autoGeneratePrompts && onAddPrompt) {
                const generatedPrompts = await aiService.generateAutoPrompts(
                    config.additionalInstructions,
                    'gemini-flash' // Default model, could be made configurable
                );
                console.log('Generated prompts from AI:', generatedPrompts);
                const promptsToAdd = generatedPrompts.map(prompt => ({
                    title: prompt.title,
                    content: prompt.content,
                }));
                onAddPrompt(promptsToAdd);
                console.log('Prompts added successfully');
            }

            // Show success message
            console.log('Auto-fill completed successfully');
        } catch (error) {
            console.error('Auto-fill failed:', error);
            addError('Không thể tự động điền cài đặt. Vui lòng thử lại hoặc điền thủ công.', {
                context: 'Auto-fill Settings',
                recoverable: true,
            });
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleAutoGeneratePrompts = async () => {
        if (!config.additionalInstructions?.trim()) {
            addError('Vui lòng nhập hướng dẫn để tự động tạo yêu cầu', {
                context: 'Auto-generate Prompts',
                recoverable: true,
            });
            return;
        }

        if (!onAddPrompt) {
            addError('Không thể thêm yêu cầu. Vui lòng thử lại.', {
                context: 'Auto-generate Prompts',
                recoverable: true,
            });
            return;
        }

        setIsGeneratingPrompts(true);
        try {
            const aiService = getAIService((error, options) => {
                addError(error, options);
                return typeof error === 'string' ? error : error.message;
            });
            const generatedPrompts = await aiService.generateAutoPrompts(
                config.additionalInstructions,
                'gemini-flash' // Default model, could be made configurable
            );

            // Add the generated prompts
            console.log('Generated prompts from AI:', generatedPrompts);
            const promptsToAdd = generatedPrompts.map(prompt => ({
                title: prompt.title,
                content: prompt.content,
            }));
            onAddPrompt!(promptsToAdd);

            console.log('Prompts added successfully');
        } catch (error) {
            console.error('Auto-generate prompts failed:', error);
            addError('Không thể tự động tạo yêu cầu. Vui lòng thử lại hoặc tạo thủ công.', {
                context: 'Auto-generate Prompts',
                recoverable: true,
            });
        } finally {
            setIsGeneratingPrompts(false);
        }
    };

    const handlePromptSelection = (id: string, isChecked: boolean) => {
        const newIds = isChecked
            ? [...selectedPromptIds, id]
            : selectedPromptIds.filter((promptId: string) => promptId !== id);
        setSelectedPromptIds(newIds);
    };

    const handleAdultContentSelection = (option: AdultContentOptions, isChecked: boolean) => {
        setConfig(prev => {
            const currentOptions = prev.adultContentOptions || [];
            if (isChecked) {
                return { ...prev, adultContentOptions: [...currentOptions, option] };
            } else {
                return { ...prev, adultContentOptions: currentOptions.filter(opt => opt !== option) };
            }
        });
    };

    const handlePresetSelect = (id: string) => {
        if (id === 'none') {
            return;
        }
        const selected = keywordPresets.find(p => p.id === id);
        if (selected) {
            setConfig(prev => ({
                ...prev,
                avoidKeywords: selected.avoidKeywords,
                focusKeywords: selected.focusKeywords,
            }));
        }
    };

    return (
        <div className="h-full flex flex-col bg-secondary p-4 border-l border-border">
            <h2 className="text-xl font-bold text-center mb-4 text-foreground">Bảng điều khiển AI</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                 <Section title="Chế độ Sáng tạo" initialOpen={true}>
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => handleChange('generationMode', GenerationMode.CONTINUE)}
                            className={`flex-1 text-sm font-semibold p-2 rounded-md transition-colors ${config.generationMode === GenerationMode.CONTINUE ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                        >
                            {GenerationMode.CONTINUE}
                        </button>
                         <button
                            onClick={() => handleChange('generationMode', GenerationMode.REWRITE)}
                            className={`flex-1 text-sm font-semibold p-2 rounded-md transition-colors ${config.generationMode === GenerationMode.REWRITE ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                        >
                            {GenerationMode.REWRITE}
                        </button>
                    </div>
                    {config.generationMode === GenerationMode.REWRITE && (
                        <div className="mt-3 space-y-3">
                            <LabeledSelect
                                label="Chọn mục tiêu viết lại"
                                value={config.rewriteTarget || RewriteTarget.ENTIRE_STORY}
                                onChange={(e) => handleChange('rewriteTarget', e.target.value as RewriteTarget)}
                            >
                                <option value={RewriteTarget.ENTIRE_STORY}>{RewriteTarget.ENTIRE_STORY}</option>
                                <option value={RewriteTarget.SELECTED_CHAPTER}>{RewriteTarget.SELECTED_CHAPTER}</option>
                            </LabeledSelect>
                            {config.rewriteTarget === RewriteTarget.SELECTED_CHAPTER && (
                                <LabeledSelect
                                    label="Chọn chương cần viết lại"
                                    value={config.selectedChapterId || ''}
                                    onChange={(e) => handleChange('selectedChapterId', e.target.value)}
                                >
                                    <option value="">-- Chọn chương --</option>
                                    {storySegments
                                        .filter(segment => segment.type === 'chapter')
                                        .map(chapter => (
                                            <option key={chapter.id} value={chapter.id}>
                                                {chapter.content}
                                            </option>
                                        ))}
                                </LabeledSelect>
                            )}
                        </div>
                    )}
                 </Section>
                <Section title="Hướng dẫn bổ sung cho AI" initialOpen={true}>
                    <div className="space-y-2">
                        <TextArea
                            label="Hướng dẫn tùy chỉnh (tùy chọn)"
                            placeholder={`Ví dụ:
• Tập trung vào cảm xúc nội tâm của nhân vật chính
• Sử dụng ngôn ngữ thơ mộng, lãng mạn hơn
• Thêm yếu tố bất ngờ và twist plot
• Viết theo phong cách văn học Việt Nam hiện đại
• Tăng cường tương tác giữa các nhân vật`}
                            value={config.additionalInstructions || ''}
                            onChange={e => handleChange('additionalInstructions', e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="auto-generate-prompts"
                                checked={config.autoGeneratePrompts || false}
                                onChange={e => handleChange('autoGeneratePrompts', e.target.checked)}
                                className="h-4 w-4 rounded bg-background border-border text-primary focus:ring-ring"
                            />
                            <label htmlFor="auto-generate-prompts" className="text-sm text-muted-foreground select-none">
                                Tự động tạo yêu cầu tùy chỉnh
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAutoFillSettings}
                                disabled={isAutoFilling || !config.additionalInstructions?.trim()}
                                className="flex-1 flex justify-center items-center px-3 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
                            >
                            {isAutoFilling ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <WandIcon className="w-4 h-4 mr-2" />
                                    Tự động điền cài đặt
                                </>
                            )}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Nhập hướng dẫn và nhấn "Tự động điền cài đặt" để AI phân tích và điền các trường phù hợp. Nếu tích "Tự động tạo yêu cầu", AI cũng sẽ tạo các prompts tùy chỉnh.
                        </p>
                    </div>
                </Section>
                <Section title="Kịch bản / Bối cảnh" initialOpen={true}>
                    <ComboboxInput 
                        label="Chọn kịch bản hoặc nhập tùy chỉnh"
                        value={config.scenario}
                        onChange={e => handleChange('scenario', e.target.value)}
                        options={Object.values(Scenario)}
                        dataListId="scenario-options"
                    />
                </Section>
                 <Section title="Cấu trúc tường thuật" initialOpen={true}>
                    <ComboboxInput 
                        label="Chọn cấu trúc tường thuật"
                        value={config.narrativeStructure}
                        onChange={e => handleChange('narrativeStructure', e.target.value as NarrativeStructure)}
                        options={Object.values(NarrativeStructure)}
                        dataListId="narrative-structure-options"
                    />
                </Section>
                <Section title="Động lực nhân vật">
                    <ComboboxInput 
                        label="Ai là người dẫn dắt hoặc nhập tùy chỉnh"
                        value={config.dynamics}
                        onChange={e => handleChange('dynamics', e.target.value)}
                        options={Object.values(CharacterDynamics)}
                        dataListId="dynamics-options"
                    />
                </Section>
                 <Section title="Yêu cầu tùy chỉnh">
                    <div className="flex gap-2">
                        <button onClick={onManagePrompts} className="w-full flex justify-center items-center px-3 py-2 text-sm bg-secondary font-semibold rounded-md hover:bg-secondary/80 transition-colors">
                            <BookmarkIcon className="w-4 h-4 mr-2" />
                            Quản lý yêu cầu
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Quản lý các yêu cầu tùy chỉnh để sử dụng trong việc sáng tạo nội dung.
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-2 border-t border-border pt-3 mt-3">
                        {customPrompts.length > 0 ? customPrompts.map(prompt => (
                             <label key={prompt.id} htmlFor={`prompt-${prompt.id}`} className="flex items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id={`prompt-${prompt.id}`}
                                    checked={Array.isArray(selectedPromptIds) && selectedPromptIds.includes(prompt.id)}
                                    onChange={e => handlePromptSelection(prompt.id, e.target.checked)}
                                    className="h-4 w-4 rounded bg-background border-border text-primary focus:ring-ring"
                                />
                                <span className="ml-3 text-sm text-muted-foreground select-none">{prompt.title}</span>
                            </label>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-2">Chưa có yêu cầu tùy chỉnh nào.</p>
                        )}
                    </div>
                </Section>
                 <Section title="Bộ lọc và Trọng tâm từ khóa">
                    <LabeledSelect label="Chọn mẫu đã lưu" value="none" onChange={(e) => handlePresetSelect(e.target.value)}>
                        <option value="none">-- Chọn một mẫu --</option>
                        {keywordPresets.map(preset => (
                            <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                    </LabeledSelect>
                    <TextArea
                        label="Từ khóa cần tránh"
                        placeholder="ví dụ: các từ ngữ thô tục"
                        value={config.avoidKeywords}
                        onChange={e => handleChange('avoidKeywords', e.target.value)}
                    />
                     <TextArea
                        label="Từ khóa cần nhấn mạnh"
                        placeholder="ví dụ: lãng mạn, đam mê, nhẹ nhàng"
                        value={config.focusKeywords}
                        onChange={e => handleChange('focusKeywords', e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={onSaveKeywordPreset} className="w-full flex justify-center items-center px-3 py-2 text-sm bg-primary/80 text-primary-foreground font-semibold rounded-md hover:bg-primary transition-colors">
                            <SaveIcon className="w-4 h-4 mr-2" />
                            Lưu làm mẫu
                        </button>
                        <button onClick={onManageKeywordPresets} className="w-full flex justify-center items-center px-3 py-2 text-sm bg-secondary font-semibold rounded-md hover:bg-secondary/80 transition-colors">
                            Quản lý mẫu
                        </button>
                    </div>
                </Section>
                <Section title="Thiết lập nhịp độ">
                    <ComboboxInput
                        label="Đặt nhịp độ hoặc nhập tùy chỉnh"
                        value={config.pacing}
                        onChange={e => handleChange('pacing', e.target.value)}
                        options={Object.values(Pacing)}
                        dataListId="pacing-options"
                    />
                </Section>
                <Section title="Tùy chọn Nội dung 18+">
                     <p className="text-xs text-muted-foreground -mt-2 mb-2">Chọn các yếu tố cần tập trung. Bỏ trống để giữ SFW.</p>
                    <div className="space-y-2">
                        {Object.values(AdultContentOptions).map(option => (
                             <label key={option} htmlFor={`adult-${option}`} className="flex items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id={`adult-${option}`}
                                    checked={(config.adultContentOptions || []).includes(option)}
                                    onChange={e => handleAdultContentSelection(option, e.target.checked)}
                                    className="h-4 w-4 rounded bg-background border-border text-primary focus:ring-ring"
                                />
                                <span className="ml-3 text-sm text-muted-foreground select-none">{option}</span>
                            </label>
                        ))}
                    </div>
                </Section>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || isGenerateDisabled}
                    className="w-full flex justify-center items-center px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-transform duration-200 active:scale-95 disabled:bg-muted disabled:cursor-not-allowed border"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang sáng tạo...
                        </>
                    ) : (
                        <>
                            <WandIcon className="w-5 h-5 mr-2" />
                            Sáng tạo với AI
                        </>
                    )}
                </button>
                 {isGenerateDisabled && !isLoading && (
                    <p className="text-xs text-center text-destructive mt-2">
                        Thêm nội dung vào truyện để bắt đầu.
                    </p>
                 )}
            </div>
        </div>
    );
};
