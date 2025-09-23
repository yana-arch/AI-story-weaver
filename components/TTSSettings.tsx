import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface TTSSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: TTSOptions;
    onSettingsChange: (settings: TTSOptions) => void;
}

export interface TTSOptions {
    rate: number;
    pitch: number;
    voiceURI?: string;
}

export const TTSSettings: React.FC<TTSSettingsProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
}) => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [localSettings, setLocalSettings] = useState<TTSOptions>(settings);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            const loadVoices = () => {
                const availableVoices = speechSynthesis.getVoices();
                setVoices(availableVoices);
            };

            loadVoices();
            speechSynthesis.addEventListener('voiceschanged', loadVoices);

            return () => {
                speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            };
        }
    }, []);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onSettingsChange(localSettings);
        onClose();
    };

    const handleTestVoice = () => {
        if ('speechSynthesis' in window) {
            const testText = localSettings.voiceURI?.includes('vi') || localSettings.voiceURI?.includes('Viet')
                ? "Xin chào! Đây là giọng nói tiếng Việt. Bạn có thể nghe rõ không?"
                : "Hello! This is a test of the selected voice. Can you hear me clearly?";

            const utterance = new SpeechSynthesisUtterance(testText);
            utterance.rate = localSettings.rate;
            utterance.pitch = localSettings.pitch;
            if (localSettings.voiceURI) {
                const voices = speechSynthesis.getVoices();
                const selectedVoice = voices.find(voice => voice.voiceURI === localSettings.voiceURI);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }
            speechSynthesis.speak(utterance);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">TTS Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-secondary/80 rounded" title="Close">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Voice
                        </label>
                        <select 
                            title="Choose Voice"
                            value={localSettings.voiceURI || ''}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, voiceURI: e.target.value || undefined }))}
                            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Default Voice</option>
                            {voices.map((voice) => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                        {voices.filter(v => v.lang.startsWith('vi')).length === 0 && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                <p>Không tìm thấy giọng nói tiếng Việt.</p>
                                <p>Để thêm giọng nói tiếng Việt:</p>
                                <ul className="list-disc list-inside ml-2">
                                    <li>Windows: Settings {'>'} Time & Language {'>'} Speech {'>'} Add voices</li>
                                    <li>Chrome: Cài đặt voice packs từ Microsoft hoặc Google</li>
                                </ul>
                            </div>
                        )}
                        {voices.filter(v => v.lang.startsWith('vi')).length > 0 && (
                            <p className="text-xs text-green-500 mt-1">
                                ✓ Đã tìm thấy {voices.filter(v => v.lang.startsWith('vi')).length} giọng nói tiếng Việt
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Speed: {localSettings.rate.toFixed(1)}x
                        </label>
                        <input
                            aria-label="Speed"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={localSettings.rate}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Pitch: {localSettings.pitch.toFixed(1)}
                        </label>
                        <input
                            aria-label="Pitch"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={localSettings.pitch}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={handleTestVoice}
                        className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
                    >
                        Test Voice
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
