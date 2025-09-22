import type { Story, GenerationConfig } from '../types';
import { Scenario, CharacterDynamics, Pacing, GenerationMode } from '../types';

const STORIES_KEY = 'ai_story_weaver_stories';
const ACTIVE_STORY_ID_KEY = 'ai_story_weaver_active_story_id';

const initialConfig: GenerationConfig = {
    scenario: Scenario.FIRST_TIME,
    dynamics: CharacterDynamics.A_LEADS,
    pacing: Pacing.MEDIUM,
    adultContentOptions: [],
    avoidKeywords: '',
    focusKeywords: '',
    generationMode: GenerationMode.CONTINUE,
};

const normalizeGenerationConfig = (config: any): GenerationConfig => {
    return { ...initialConfig, ...(config || {}) };
};

export const getStories = (): Record<string, Story> => {
    try {
        const item = window.localStorage.getItem(STORIES_KEY);
        if (!item) return {};
        const stories = JSON.parse(item);
        // Normalize configs
        const normalizedStories: Record<string, Story> = {};
        for (const [id, story] of Object.entries(stories)) {
            normalizedStories[id] = {
                ...story,
                generationConfig: normalizeGenerationConfig((story as Story).generationConfig),
            };
        }
        return normalizedStories;
    } catch (error) {
        console.error('Error reading stories from localStorage:', error);
        return {};
    }
};

export const saveStories = (stories: Record<string, Story>) => {
    try {
        const dataStr = JSON.stringify(stories);
        // Check if data is too large (localStorage typically has 5-10MB limit)
        if (dataStr.length > 4 * 1024 * 1024) { // 4MB limit
            throw new Error('Story data is too large to save. Please reduce the number of stories or their content.');
        }
        window.localStorage.setItem(STORIES_KEY, dataStr);
    } catch (error) {
        console.error('Error saving stories to localStorage:', error);
        // Could emit an event or show user notification here
        alert('Failed to save stories. Storage may be full or unavailable.');
    }
};

export const getActiveStoryId = (): string | null => {
    return window.localStorage.getItem(ACTIVE_STORY_ID_KEY);
};

export const setActiveStoryId = (id: string) => {
    window.localStorage.setItem(ACTIVE_STORY_ID_KEY, id);
};

export const migrateToMultiStory = (): string | null => {
    const stories = getStories();
    if (Object.keys(stories).length > 0) {
        // Already migrated
        return getActiveStoryId();
    }

    // Check for old data
    const oldStorySegments = window.localStorage.getItem('storySegments');
    if (!oldStorySegments) {
        // No old data to migrate
        return null;
    }

    try {
        const oldConfig = JSON.parse(window.localStorage.getItem('generationConfig') || '{}');
        const generationConfig = { ...initialConfig, ...oldConfig };

        const newStory: Story = {
            id: Date.now().toString(),
            name: 'My First Story',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            storySegments: JSON.parse(window.localStorage.getItem('storySegments') || '[]'),
            generationConfig,
            customPrompts: JSON.parse(window.localStorage.getItem('customPrompts') || '[]'),
            selectedPromptIds: JSON.parse(window.localStorage.getItem('selectedPromptIds') || '[]'),
            characterProfiles: JSON.parse(window.localStorage.getItem('characterProfiles') || '[]'),
            lastReadSegmentId: JSON.parse(window.localStorage.getItem('lastReadSegmentId') || 'null'),
        };

        const newStories = { [newStory.id]: newStory };
        saveStories(newStories);
        setActiveStoryId(newStory.id);

        // Clean up old keys
        window.localStorage.removeItem('storySegments');
        window.localStorage.removeItem('generationConfig');
        window.localStorage.removeItem('customPrompts');
        window.localStorage.removeItem('selectedPromptIds');
        window.localStorage.removeItem('characterProfiles');
        window.localStorage.removeItem('lastReadSegmentId');
        window.localStorage.removeItem('currentKeyIndex');

        console.log('Successfully migrated old story to new multi-story format.');

        return newStory.id;
    } catch (error) {
        console.error('Error migrating old story:', error);
        return null;
    }
};
