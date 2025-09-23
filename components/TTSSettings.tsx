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

interface VoiceOption {
    name: string;
    voiceURI: string;
    lang: string;
    gender: 'male' | 'female';
    type: 'google' | 'system' | 'other';
}

export const TTSSettings: React.FC<TTSSettingsProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
}) => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [localSettings, setLocalSettings] = useState<TTSOptions>(settings);

    // Predefined Google voices
    const googleVoices: VoiceOption[] = [
        // Vietnamese Google voices
        { name: 'Google Tiếng Việt Nam (Nữ)', voiceURI: 'Google Tiếng Việt Nam', lang: 'vi-VN', gender: 'female', type: 'google' },
        { name: 'Google Tiếng Việt (Nữ)', voiceURI: 'Google Tiếng Việt', lang: 'vi-VN', gender: 'female', type: 'google' },
        { name: 'Google US English (Female)', voiceURI: 'Google US English', lang: 'en-US', gender: 'female', type: 'google' },
        { name: 'Google US English (Male)', voiceURI: 'Google US English Male', lang: 'en-US', gender: 'male', type: 'google' },
        { name: 'Google UK English (Female)', voiceURI: 'Google UK English Female', lang: 'en-GB', gender: 'female', type: 'google' },
        { name: 'Google UK English (Male)', voiceURI: 'Google UK English Male', lang: 'en-GB', gender: 'male', type: 'google' },
        { name: 'Google Français (Femme)', voiceURI: 'Google Français', lang: 'fr-FR', gender: 'female', type: 'google' },
        { name: 'Google Français (Homme)', voiceURI: 'Google Français Male', lang: 'fr-FR', gender: 'male', type: 'google' },
        { name: 'Google Deutsch (Frau)', voiceURI: 'Google Deutsch', lang: 'de-DE', gender: 'female', type: 'google' },
        { name: 'Google Deutsch (Mann)', voiceURI: 'Google Deutsch Male', lang: 'de-DE', gender: 'male', type: 'google' },
        { name: 'Google Español (Mujer)', voiceURI: 'Google Español', lang: 'es-ES', gender: 'female', type: 'google' },
        { name: 'Google Español (Hombre)', voiceURI: 'Google Español Male', lang: 'es-ES', gender: 'male', type: 'google' },
        { name: 'Google 日本語 (女性)', voiceURI: 'Google 日本語', lang: 'ja-JP', gender: 'female', type: 'google' },
        { name: 'Google 日本語 (男性)', voiceURI: 'Google 日本語 Male', lang: 'ja-JP', gender: 'male', type: 'google' },
        { name: 'Google 한국의 (여성)', voiceURI: 'Google 한국의', lang: 'ko-KR', gender: 'female', type: 'google' },
        { name: 'Google 한국의 (남성)', voiceURI: 'Google 한국의 Male', lang: 'ko-KR', gender: 'male', type: 'google' },
    ];

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
            // Determine test text based on selected voice language
            const isVietnamese = localSettings.voiceURI?.includes('vi') || localSettings.voiceURI?.includes('Viet') || localSettings.voiceURI?.includes('Tiếng Việt');
            const testText = isVietnamese
                ? "Xin chào! Đây là giọng nói tiếng Việt. Bạn có thể nghe rõ không?"
                : "Hello! This is a test of the selected voice. Can you hear me clearly?";

            const utterance = new SpeechSynthesisUtterance(testText);
            utterance.rate = localSettings.rate;
            utterance.pitch = localSettings.pitch;

            if (localSettings.voiceURI) {
                const voices = speechSynthesis.getVoices();
                let selectedVoice = voices.find(voice => voice.voiceURI === localSettings.voiceURI);

                // If not found, try to find by name (for Google voices)
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.name.includes(localSettings.voiceURI!) ||
                        localSettings.voiceURI!.includes(voice.name)
                    );
                }

                // If still not found, try to find by language and gender
                if (!selectedVoice && localSettings.voiceURI!.includes('Google')) {
                    const isMale = localSettings.voiceURI!.includes('Male') || localSettings.voiceURI!.includes('Homme') || localSettings.voiceURI!.includes('Mann') || localSettings.voiceURI!.includes('Hombre') || localSettings.voiceURI!.includes('남성') || localSettings.voiceURI!.includes('男性');
                    const lang = localSettings.voiceURI!.includes('vi') ? 'vi' :
                                localSettings.voiceURI!.includes('en-US') ? 'en-US' :
                                localSettings.voiceURI!.includes('en-GB') ? 'en-GB' :
                                localSettings.voiceURI!.includes('fr') ? 'fr' :
                                localSettings.voiceURI!.includes('de') ? 'de' :
                                localSettings.voiceURI!.includes('es') ? 'es' :
                                localSettings.voiceURI!.includes('ja') ? 'ja' :
                                localSettings.voiceURI!.includes('ko') ? 'ko' : '';

                    if (lang) {
                        selectedVoice = voices.find(voice =>
                            voice.lang.startsWith(lang) &&
                            ((isMale && voice.name.toLowerCase().includes('male')) ||
                             (!isMale && !voice.name.toLowerCase().includes('male')))
                        );
                    }
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            utterance.onstart = () => {
                console.log('TTS test started');
            };

            utterance.onend = () => {
                console.log('TTS test completed');
            };

            utterance.onerror = (event) => {
                console.warn('TTS test error:', event);
                alert('Không thể phát giọng nói. Vui lòng kiểm tra cài đặt giọng nói trên hệ thống.');
            };

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

                            {/* Google Voices Section */}
                            <optgroup label="🌐 Google Voices (Premium)">
                                {googleVoices.map((voice) => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} {voice.gender === 'female' ? '👩‍🦰' : '👨‍🦰'}
                                    </option>
                                ))}
                            </optgroup>

                            {/* System Voices Section */}
                            {voices.length > 0 && (
                                <optgroup label="💻 System Voices">
                                    {voices.map((voice) => (
                                        <option key={voice.voiceURI} value={voice.voiceURI}>
                                            {voice.name} ({voice.lang})
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>

                        {/* Voice Status Information */}
                        <div className="mt-2 space-y-1">
                            {voices.filter(v => v.lang.startsWith('vi')).length === 0 && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Không tìm thấy giọng nói tiếng Việt.</p>
                                    <p>Để thêm giọng nói tiếng Việt:</p>
                                    <ul className="list-disc list-inside ml-2">
                                        <li>Windows: Settings {'>'} Time & Language {'>'} Speech {'>'} Add voices</li>
                                        <li>Chrome: Cài đặt voice packs từ Microsoft hoặc Google</li>
                                    </ul>
                                </div>
                            )}
                            {voices.filter(v => v.lang.startsWith('vi')).length > 0 && (
                                <p className="text-xs text-green-500">
                                    ✓ Đã tìm thấy {voices.filter(v => v.lang.startsWith('vi')).length} giọng nói tiếng Việt
                                </p>
                            )}
                            <div className="text-xs text-muted-foreground">
                                <p>💡 <strong>Google Voices:</strong> Giọng nói chất lượng cao, tự nhiên</p>
                                <p>💻 <strong>System Voices:</strong> Giọng nói có sẵn trên thiết bị</p>
                            </div>
                        </div>
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
