import { useState, useRef, useCallback } from 'react';

export interface TTSOptions {
    rate: number;
    pitch: number;
    voiceURI?: string;
}

export const useTTS = (options: TTSOptions) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            // Stop any current speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options.rate;
            utterance.pitch = options.pitch;

            if (options.voiceURI) {
                // Try to find the voice immediately
                const voices = speechSynthesis.getVoices();
                let selectedVoice = voices.find(voice => voice.voiceURI === options.voiceURI);

                // If not found, try to find by name (for Google voices)
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.name.includes(options.voiceURI) ||
                        options.voiceURI.includes(voice.name)
                    );
                }

                // If still not found, try to find by language and gender
                if (!selectedVoice && options.voiceURI.includes('Google')) {
                    const isMale = options.voiceURI.includes('Male') || options.voiceURI.includes('Homme') || options.voiceURI.includes('Mann') || options.voiceURI.includes('Hombre') || options.voiceURI.includes('남성') || options.voiceURI.includes('男性');
                    const lang = options.voiceURI.includes('vi') ? 'vi' :
                                options.voiceURI.includes('en-US') ? 'en-US' :
                                options.voiceURI.includes('en-GB') ? 'en-GB' :
                                options.voiceURI.includes('fr') ? 'fr' :
                                options.voiceURI.includes('de') ? 'de' :
                                options.voiceURI.includes('es') ? 'es' :
                                options.voiceURI.includes('ja') ? 'ja' :
                                options.voiceURI.includes('ko') ? 'ko' : '';

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
                setIsSpeaking(true);
                setIsPaused(false);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };

            utterance.onerror = (event) => {
                console.warn('TTS Error:', event);
                setIsSpeaking(false);
                setIsPaused(false);
            };

            utteranceRef.current = utterance;
            speechSynthesis.speak(utterance);
        }
    }, [options]);

    const pause = useCallback(() => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            setIsPaused(true);
        }
    }, []);

    const resume = useCallback(() => {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            setIsPaused(false);
        }
    }, []);

    const stop = useCallback(() => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    }, []);

    const toggle = useCallback((text: string) => {
        if (isSpeaking) {
            if (isPaused) {
                resume();
            } else {
                pause();
            }
        } else {
            speak(text);
        }
    }, [isSpeaking, isPaused, speak, pause, resume]);

    return {
        isSpeaking,
        isPaused,
        speak,
        pause,
        resume,
        stop,
        toggle,
    };
};
