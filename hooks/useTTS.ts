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
                const voices = speechSynthesis.getVoices();
                const selectedVoice = voices.find(voice => voice.voiceURI === options.voiceURI);
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

            utterance.onerror = () => {
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
