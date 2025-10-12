import React from 'react';
import { StoryProvider, useStory } from './StoryContext';
import { SettingsProvider, useSettings } from './SettingsContext';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <StoryProvider>
        {children}
      </StoryProvider>
    </SettingsProvider>
  );
};

// Export hooks for use in components
export { useStory, useSettings };
