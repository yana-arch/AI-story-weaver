
import React from 'react';
import type { AdvancedGenerationConfig } from '../types';
import { WritingMode, PartnerType, SceneFramework, DeepeningDynamics } from '../types';
import { WandIcon, DownloadIcon, UploadIcon } from './icons';

interface AdvancedSceneModeProps {
    config: AdvancedGenerationConfig;
    setConfig: React.Dispatch<React.SetStateAction<AdvancedGenerationConfig>>;
    onGenerate: () => void;
    onImport: (config: AdvancedGenerationConfig) => void;
    onExport: () => void;
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

const TextArea: React.FC<{ label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number }> = ({ label, placeholder, value, onChange, rows = 2 }) => (
     <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
    </div>
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-3">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-300">{label}</span>
    </label>
);

export const AdvancedSceneMode: React.FC<AdvancedSceneModeProps> = ({ config, setConfig, onGenerate, onImport, onExport, isLoading, isGenerateDisabled }) => {

    const handleChange = <K extends keyof AdvancedGenerationConfig>(
        field: K,
        value: AdvancedGenerationConfig[K]
    ) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const importedConfig = JSON.parse(text);
                    // TODO: Add validation logic here
                    onImport(importedConfig);
                } catch (error) {
                    // TODO: Proper error handling
                    alert("Lỗi import file JSON.");
                    console.error("JSON Import Error:", error);
                }
            };
            reader.readAsText(file);
            event.target.value = ''; // Reset file input
        }
    };


    return (
        <div className="h-full flex flex-col bg-gray-800 p-4 border-l border-gray-700">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-100">Chế độ Kịch bản 18+</h2>
                 <div className="flex gap-2">
                    <button onClick={onExport} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600" title="Export JSON">
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <label htmlFor="json-import" className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 cursor-pointer" title="Import JSON">
                        <UploadIcon className="w-5 h-5" />
                    </label>
                    <input id="json-import" type="file" accept=".json" className="hidden" onChange={handleFileImport} />
                 </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                <Section title="Tùy chọn Bật/Tắt">
                    <Checkbox
                        label="Kịch bản Vô danh/Ba người"
                        checked={config.anonymousScenario}
                        onChange={e => handleChange('anonymousScenario', e.target.checked)}
                    />
                    <Checkbox
                        label="Hội thoại Tường thuật"
                        checked={config.explicitDialogue}
                        onChange={e => handleChange('explicitDialogue', e.target.checked)}
                    />
                    <Checkbox
                        label="Mô tả Âm thanh"
                        checked={config.audioDescription}
                        onChange={e => handleChange('audioDescription', e.target.checked)}
                    />
                </Section>

                <Section title="Tham số Cảnh 18+ Cốt lõi">
                    <Select
                        label="Chế độ Viết"
                        value={config.writingMode}
                        onChange={e => handleChange('writingMode', e.target.value as WritingMode)}
                        options={Object.values(WritingMode)}
                    />
                    <Select
                        label="Loại Đối tác"
                        value={config.partnerType}
                        onChange={e => handleChange('partnerType', e.target.value as PartnerType)}
                        options={Object.values(PartnerType)}
                    />
                    <TextArea
                        label="Bối cảnh"
                        placeholder="Vd: Private Location, Late Evening"
                        value={config.setting}
                        onChange={e => handleChange('setting', e.target.value)}
                    />
                    <TextArea
                        label="Từ khóa Tập trung"
                        placeholder="Các từ khóa cần nhấn mạnh"
                        value={config.focusKeywords}
                        onChange={e => handleChange('focusKeywords', e.target.value)}
                    />
                    <TextArea
                        label="Từ khóa Tránh"
                        placeholder="Các từ khóa cấm"
                        value={config.avoidKeywords}
                        onChange={e => handleChange('avoidKeywords', e.target.value)}
                    />
                </Section>

                 <Section title="Cấu trúc và Động lực Kịch bản">
                    <Select
                        label="Khuôn khổ Cảnh"
                        value={config.sceneFramework}
                        onChange={e => handleChange('sceneFramework', e.target.value as SceneFramework)}
                        options={Object.values(SceneFramework)}
                    />
                    <Select
                        label="Động lực Chiều sâu"
                        value={config.deepeningDynamics}
                        onChange={e => handleChange('deepeningDynamics', e.target.value as DeepeningDynamics)}
                        options={Object.values(DeepeningDynamics)}
                    />
                </Section>

                <Section title="Các Khối Xây dựng Kịch bản">
                     <TextArea
                        label="[User Customization Layer #1]"
                        placeholder="Chỉ dẫn tùy chỉnh của người dùng..."
                        value={config.userCustomizationLayer1}
                        onChange={e => handleChange('userCustomizationLayer1', e.target.value)}
                        rows={4}
                    />
                    <TextArea
                        label="[Base Character Input]"
                        placeholder="Mô tả nhân vật cơ bản..."
                        value={config.baseCharacterInput}
                        onChange={e => handleChange('baseCharacterInput', e.target.value)}
                        rows={4}
                    />
                    <TextArea
                        label="[Building Block #1: Authority Statement]"
                        placeholder="Tuyên bố về quyền lực..."
                        value={config.buildingBlock1_AuthorityStatement}
                        onChange={e => handleChange('buildingBlock1_AuthorityStatement', e.target.value)}
                        rows={4}
                    />
                     <TextArea
                        label="[Building Block #2: Body Control]"
                        placeholder="Kiểm soát cơ thể..."
                        value={config.buildingBlock2_BodyControl}
                        onChange={e => handleChange('buildingBlock2_BodyControl', e.target.value)}
                        rows={4}
                    />
                    <TextArea
                        label="[User Customizable Segment #2]"
                        placeholder="Phân đoạn tùy chỉnh của người dùng..."
                        value={config.userCustomizableSegment2}
                        onChange={e => handleChange('userCustomizableSegment2', e.target.value)}
                        rows={4}
                    />
                     <TextArea
                        label="[Building Block #3: Sensory Details]"
                        placeholder="Chi tiết cảm giác..."
                        value={config.buildingBlock3_SensoryDetails}
                        onChange={e => handleChange('buildingBlock3_SensoryDetails', e.target.value)}
                        rows={4}
                    />
                     <TextArea
                        label="[Building Block #4: Dialogue]"
                        placeholder="Hội thoại..."
                        value={config.buildingBlock4_Dialogue}
                        onChange={e => handleChange('buildingBlock4_Dialogue', e.target.value)}
                        rows={4}
                    />
                     <TextArea
                        label="[User Customizable Segment #3]"
                        placeholder="Phân đoạn tùy chỉnh của người dùng..."
                        value={config.userCustomizableSegment3}
                        onChange={e => handleChange('userCustomizableSegment3', e.target.value)}
                        rows={4}
                    />
                     <TextArea
                        label="[Building Block #5: Climax]"
                        placeholder="Cao trào..."
                        value={config.buildingBlock5_Climax}
                        onChange={e => handleChange('buildingBlock5_Climax', e.target.value)}
                        rows={4}
                    />
                     <TextArea
                        label="[Building Block #6: Aftermath]"
                        placeholder="Kết cục..."
                        value={config.buildingBlock6_Aftermath}
                        onChange={e => handleChange('buildingBlock6_Aftermath', e.target.value)}
                        rows={4}
                    />
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
