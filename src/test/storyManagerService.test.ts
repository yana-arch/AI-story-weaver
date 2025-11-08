import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as storyManager from '@/services/storyManagerService';
import {
  type Story,
  Pacing,
  Scenario,
  CharacterDynamics,
  NarrativeStructure,
  GenerationMode,
} from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('storyManagerService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStories and saveStories', () => {
    it('should return an empty object if no stories are in localStorage', () => {
      expect(storyManager.getStories()).toEqual({});
    });

    it('should save and retrieve stories correctly', () => {
      const stories: Record<string, Story> = {
        '1': {
          id: '1',
          name: 'Test Story',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          storySegments: [],
          generationConfig: {
            scenario: Scenario.FIRST_TIME,
            dynamics: CharacterDynamics.A_LEADS,
            pacing: Pacing.MEDIUM,
            narrativeStructure: NarrativeStructure.FREEFORM,
            adultContentOptions: [],
            avoidKeywords: '',
            focusKeywords: '',
            generationMode: GenerationMode.CONTINUE,
          },
          customPrompts: [],
          keywordPresets: [],
          selectedPromptIds: [],
          characterProfiles: [],
          lastReadSegmentId: null,
        },
      };
      storyManager.saveStories(stories);
      expect(storyManager.getStories()).toEqual(stories);
    });

    it('should normalize generationConfig when retrieving stories', () => {
      const storiesWithPartialConfig = {
        '1': {
          id: '1',
          name: 'Test Story',
          // other properties...
          generationConfig: { scenario: 'custom' }, // Partial config
        },
      };
      storyManager.saveStories(storiesWithPartialConfig as any);
      const retrievedStories = storyManager.getStories();
      expect(retrievedStories['1'].generationConfig.pacing).toBe(Pacing.MEDIUM); // Check for a default value
      expect(retrievedStories['1'].generationConfig.scenario).toBe('custom'); // Check for the overridden value
    });
  });

  describe('getActiveStoryId and setActiveStoryId', () => {
    it('should set and get the active story ID', () => {
      storyManager.setActiveStoryId('story123');
      expect(storyManager.getActiveStoryId()).toBe('story123');
    });
  });

  describe('migrateToMultiStory', () => {
    it('should return null if no old data exists', () => {
      expect(storyManager.migrateToMultiStory()).toBeNull();
    });

    it('should migrate old data to the new multi-story format', () => {
      // Setup old data
      window.localStorage.setItem(
        'storySegments',
        JSON.stringify([{ id: 'seg1', type: 'user', content: 'Old content' }])
      );
      window.localStorage.setItem('generationConfig', JSON.stringify({ scenario: 'custom-old' }));

      const newStoryId = storyManager.migrateToMultiStory();
      expect(newStoryId).not.toBeNull();

      const stories = storyManager.getStories();
      expect(stories[newStoryId!].name).toBe('My First Story');
      expect(stories[newStoryId!].storySegments[0].content).toBe('Old content');
      expect(stories[newStoryId!].generationConfig.scenario).toBe('custom-old');

      // Check that old keys are removed
      expect(window.localStorage.getItem('storySegments')).toBeNull();
      expect(window.localStorage.getItem('generationConfig')).toBeNull();
    });

    it('should return active story ID if already migrated', () => {
      const stories: Record<string, Story> = {
        '1': { id: '1', name: 'Existing Story' } as Story,
      };
      storyManager.saveStories(stories);
      storyManager.setActiveStoryId('1');

      expect(storyManager.migrateToMultiStory()).toBe('1');
    });
  });
});
