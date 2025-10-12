import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ApiKey } from '../types';
import type { TTSOptions } from '../components/TTSSettings';

interface SettingsContextType {
  // API Keys
  apiKeys: ApiKey[];
  setApiKeys: (keys: ApiKey[]) => void;
  useDefaultKey: boolean;
  setUseDefaultKey: (use: boolean) => void;
  currentKeyIndex: number;
  setCurrentKeyIndex: (index: number) => void;

  // Theme
  theme: string;
  setTheme: (theme: string) => void;

  // TTS
  ttsSettings: TTSOptions;
  setTtsSettings: (settings: TTSOptions) => void;

  // UI State
  isApiKeyManagerOpen: boolean;
  setIsApiKeyManagerOpen: (open: boolean) => void;
  isPromptManagerOpen: boolean;
  setIsPromptManagerOpen: (open: boolean) => void;
  isKeywordPresetManagerOpen: boolean;
  setIsKeywordPresetManagerOpen: (open: boolean) => void;
  isCharacterEditorOpen: boolean;
  setIsCharacterEditorOpen: (open: boolean) => void;
  isCharacterPanelOpen: boolean;
  setIsCharacterPanelOpen: (open: boolean) => void;
  isStoryManagerOpen: boolean;
  setIsStoryManagerOpen: (open: boolean) => void;
  isNavigatorOpen: boolean;
  setIsNavigatorOpen: (open: boolean) => void;
  isDesktop: boolean;
  setIsDesktop: (desktop: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isThemeManagerOpen: boolean;
  setIsThemeManagerOpen: (open: boolean) => void;
  isTTSSettingsOpen: boolean;
  setIsTTSSettingsOpen: (open: boolean) => void;
  isDisplaySettingsOpen: boolean;
  setIsDisplaySettingsOpen: (open: boolean) => void;
  isChapterListOpen: boolean;
  setIsChapterListOpen: (open: boolean) => void;
  isSettingsPanelOpen: boolean;
  setIsSettingsPanelOpen: (open: boolean) => void;
  activeSettingsTab: 'api-keys' | 'theme' | 'tts' | 'display';
  setActiveSettingsTab: (tab: 'api-keys' | 'theme' | 'tts' | 'display') => void;

  // Modal states for settings tabs
  isApiKeysModalOpen: boolean;
  setIsApiKeysModalOpen: (open: boolean) => void;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
  isTTSModalOpen: boolean;
  setIsTTSModalOpen: (open: boolean) => void;
  isDisplayModalOpen: boolean;
  setIsDisplayModalOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Export
  isExportDialogOpen: boolean;
  setIsExportDialogOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // API Keys
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);
  const [useDefaultKey, setUseDefaultKey] = useLocalStorage<boolean>('useDefaultKey', true);
  const [currentKeyIndex, setCurrentKeyIndex] = useLocalStorage<number>('currentKeyIndex', 0);

  // Theme
  const [theme, setTheme] = useLocalStorage<string>('theme', 'zinc');

  // TTS
  const [ttsSettings, setTtsSettings] = useLocalStorage<TTSOptions>('ttsSettings', { rate: 1, pitch: 1 });

  // UI State
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);
  const [isKeywordPresetManagerOpen, setIsKeywordPresetManagerOpen] = useState(false);
  const [isCharacterEditorOpen, setIsCharacterEditorOpen] = useState(false);
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] = useState(false);
  const [isStoryManagerOpen, setIsStoryManagerOpen] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(window.innerWidth >= 768);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isTTSSettingsOpen, setIsTTSSettingsOpen] = useState(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'api-keys' | 'theme' | 'tts' | 'display'>('api-keys');

  // Modal states for settings tabs
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isTTSModalOpen, setIsTTSModalOpen] = useState(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Export
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Update navigator state on resize
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) {
        setIsNavigatorOpen(true); // Always show on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply theme to document body
  useEffect(() => {
    document.body.classList.remove('theme-zinc', 'theme-slate', 'theme-stone', 'theme-gray', 'theme-neutral', 'theme-red', 'theme-rose', 'theme-orange', 'theme-green', 'theme-blue', 'theme-yellow', 'theme-violet');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const contextValue = {
    // API Keys
    apiKeys,
    setApiKeys,
    useDefaultKey,
    setUseDefaultKey,
    currentKeyIndex,
    setCurrentKeyIndex,

    // Theme
    theme,
    setTheme,

    // TTS
    ttsSettings,
    setTtsSettings,

    // UI State
    isApiKeyManagerOpen,
    setIsApiKeyManagerOpen,
    isPromptManagerOpen,
    setIsPromptManagerOpen,
    isKeywordPresetManagerOpen,
    setIsKeywordPresetManagerOpen,
    isCharacterEditorOpen,
    setIsCharacterEditorOpen,
    isCharacterPanelOpen,
    setIsCharacterPanelOpen,
    isStoryManagerOpen,
    setIsStoryManagerOpen,
    isNavigatorOpen,
    setIsNavigatorOpen,
    isDesktop,
    setIsDesktop,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isThemeManagerOpen,
    setIsThemeManagerOpen,
    isTTSSettingsOpen,
    setIsTTSSettingsOpen,
    isDisplaySettingsOpen,
    setIsDisplaySettingsOpen,
    isChapterListOpen,
    setIsChapterListOpen,
    isSettingsPanelOpen,
    setIsSettingsPanelOpen,
    activeSettingsTab,
    setActiveSettingsTab,

    // Modal states for settings tabs
    isApiKeysModalOpen,
    setIsApiKeysModalOpen,
    isThemeModalOpen,
    setIsThemeModalOpen,
    isTTSModalOpen,
    setIsTTSModalOpen,
    isDisplayModalOpen,
    setIsDisplayModalOpen,

    // Search
    searchQuery,
    setSearchQuery,

    // Export
    isExportDialogOpen,
    setIsExportDialogOpen,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
