
import React from 'react';
import type { GenerationConfig } from '../types';
import { Scenario, CharacterDynamics, Pacing, NSFWLevel } from '../types';
import { WandIcon } from './icons';

interface ContentNavigatorProps {
    config: GenerationConfig;
    setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
    onGenerate: () => void;
    isLoading: boolean;
    isGenerateDisabled: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-md font-semibold text-indigo-300 mb-3">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const Select: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
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


export const ContentNavigator: React.FC<ContentNavigatorProps> = ({ config, setConfig, onGenerate, isLoading, isGenerateDisabled }) => {
    
    const handleChange = <K extends keyof GenerationConfig,>(
        field: K,
        value: GenerationConfig[K]
    ) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const nsfwLevelToNumber = (level: NSFWLevel): number => {
        if (level === NSFWLevel.SUGGESTIVE) return 2;
        if (level === NSFWLevel.EXPLICIT) return 3;
        return 1; // SUBTLE
    };

    const numberToNsfwLevel = (num: number): NSFWLevel => {
        if (num === 2) return NSFWLevel.SUGGESTIVE;
        if (num === 3) return NSFWLevel.EXPLICIT;
        return NSFWLevel.SUBTLE;
    };

    return (
        <div className="h-full flex flex-col bg-gray-800 p-4 border-l border-gray-700">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-100">Bảng điều khiển AI</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                <Section title="Kịch bản / Bối cảnh">
                    <Select 
                        label="Chọn một kịch bản phổ biến cho AI"
                        value={config.scenario}
                        onChange={e => handleChange('scenario', e.target.value as Scenario)}
                        options={Object.values(Scenario)}
                    />
                </Section>
                <Section title="Động lực nhân vật">
                    <Select 
                        label="Ai là người dẫn dắt phân cảnh?"
                        value={config.dynamics}
                        onChange={e => handleChange('dynamics', e.target.value as CharacterDynamics)}
                        options={Object.values(CharacterDynamics)}
                    />
                </Section>
                 <Section title="Bộ lọc và Trọng tâm từ khóa">
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
                </Section>
                <Section title="Thiết lập nhịp độ">
                    <Select 
                        label="Đặt nhịp độ cho phân cảnh"
                        value={config.pacing}
                        onChange={e => handleChange('pacing', e.target.value as Pacing)}
                        options={Object.values(Pacing)}
                    />
                </Section>
                <Section title="Mức độ NSFW">
                    <div className="flex flex-col">
                        <label htmlFor="nsfw-slider" className="block text-sm font-medium text-gray-300 mb-1">Điều chỉnh mức độ chi tiết</label>
                        <input
                            id="nsfw-slider"
                            type="range"
                            min="1"
                            max="3"
                            step="1"
                            value={nsfwLevelToNumber(config.nsfwLevel)}
                            onChange={e => handleChange('nsfwLevel', numberToNsfwLevel(parseInt(e.target.value, 10)))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-sm text-gray-400 mt-1 font-semibold">{config.nsfwLevel}</div>
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