import React, { useState } from 'react';
import type { GenerationConfig, CustomPrompt, KeywordPreset } from '../types';
import { Scenario, CharacterDynamics, Pacing, AdultContentOptions, GenerationMode, NarrativeStructure } from '../types';
import { WandIcon, BookmarkIcon, ChevronDownIcon, SaveIcon } from './icons';

interface ContentNavigatorProps {
    config: GenerationConfig;
    setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
    onGenerate: () => void;
    isLoading: boolean;
    isGenerateDisabled: boolean;
    customPrompts: CustomPrompt[];
    selectedPromptIds: string[];
    setSelectedPromptIds: React.Dispatch<React.SetStateAction<string[]>>;
    onManagePrompts: () => void;
    keywordPresets: KeywordPreset[];
    onManageKeywordPresets: () => void;
    onSaveKeywordPreset: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode, initialOpen?: boolean }> = ({ title, children, initialOpen = true }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left"
            >
                <h3 className="text-md font-semibold text-indigo-300">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
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
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select 
            value={value} 
            onChange={onChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type="text"
            list={dataListId}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <datalist id={dataListId}>
            {options.map(opt => <option key={opt} value={opt} />)}
        </datalist>
    </div>
);

const TextArea: React.FC<{ label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; }> = ({ label, placeholder, value, onChange }) => (
     <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea
            rows={2}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
    </div>
);


export const ContentNavigator: React.FC<ContentNavigatorProps> = ({ config, setConfig, onGenerate, isLoading, isGenerateDisabled, customPrompts, selectedPromptIds, setSelectedPromptIds, onManagePrompts, keywordPresets, onManageKeywordPresets, onSaveKeywordPreset }) => {
    
    const handleChange = <K extends keyof GenerationConfig,>(
        field: K,
        value: GenerationConfig[K]
    ) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handlePromptSelection = (id: string, isChecked: boolean) => {
        setSelectedPromptIds(prev => {
            if (isChecked) {
                return [...prev, id];
            } else {
                return prev.filter(promptId => promptId !== id);
            }
        });
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
        <div className="h-full flex flex-col bg-gray-800 p-4 border-l border-gray-700">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-100">Bảng điều khiển AI</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                 <Section title="Chế độ Sáng tạo" initialOpen={true}>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button 
                            onClick={() => handleChange('generationMode', GenerationMode.CONTINUE)}
                            className={`flex-1 text-sm font-semibold p-2 rounded-md transition-colors ${config.generationMode === GenerationMode.CONTINUE ? 'bg-indigo-600 text-white' : 'hover:bg-gray-600'}`}
                        >
                            {GenerationMode.CONTINUE}
                        </button>
                         <button 
                            onClick={() => handleChange('generationMode', GenerationMode.REWRITE)}
                            className={`flex-1 text-sm font-semibold p-2 rounded-md transition-colors ${config.generationMode === GenerationMode.REWRITE ? 'bg-indigo-600 text-white' : 'hover:bg-gray-600'}`}
                        >
                            {GenerationMode.REWRITE}
                        </button>
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
                    <button onClick={onManagePrompts} className="w-full flex justify-center items-center px-4 py-2 text-sm bg-gray-700 font-semibold rounded-md hover:bg-gray-600 transition-colors">
                        <BookmarkIcon className="w-4 h-4 mr-2" />
                        Quản lý yêu cầu
                    </button>
                    <div className="max-h-36 overflow-y-auto space-y-2 border-t border-gray-700 pt-3 mt-3">
                        {customPrompts.length > 0 ? customPrompts.map(prompt => (
                             <label key={prompt.id} htmlFor={`prompt-${prompt.id}`} className="flex items-center p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id={`prompt-${prompt.id}`}
                                    checked={selectedPromptIds.includes(prompt.id)}
                                    onChange={e => handlePromptSelection(prompt.id, e.target.checked)}
                                    className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-sm text-gray-300 select-none">{prompt.title}</span>
                            </label>
                        )) : (
                            <p className="text-sm text-gray-500 text-center py-2">Chưa có yêu cầu tùy chỉnh nào.</p>
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
                        <button onClick={onSaveKeywordPreset} className="w-full flex justify-center items-center px-3 py-2 text-sm bg-indigo-600/80 font-semibold rounded-md hover:bg-indigo-600 transition-colors">
                            <SaveIcon className="w-4 h-4 mr-2" />
                            Lưu làm mẫu
                        </button>
                        <button onClick={onManageKeywordPresets} className="w-full flex justify-center items-center px-3 py-2 text-sm bg-gray-700 font-semibold rounded-md hover:bg-gray-600 transition-colors">
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
                     <p className="text-xs text-gray-400 -mt-2 mb-2">Chọn các yếu tố cần tập trung. Bỏ trống để giữ SFW.</p>
                    <div className="space-y-2">
                        {Object.values(AdultContentOptions).map(option => (
                             <label key={option} htmlFor={`adult-${option}`} className="flex items-center p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id={`adult-${option}`}
                                    checked={(config.adultContentOptions || []).includes(option)}
                                    onChange={e => handleAdultContentSelection(option, e.target.checked)}
                                    className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-sm text-gray-300 select-none">{option}</span>
                            </label>
                        ))}
                    </div>
                </Section>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || isGenerateDisabled}
                    className="w-full flex justify-center items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-transform duration-200 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    <p className="text-xs text-center text-yellow-400 mt-2">
                        Thêm nội dung vào truyện để bắt đầu.
                    </p>
                 )}
            </div>
        </div>
    );
};
