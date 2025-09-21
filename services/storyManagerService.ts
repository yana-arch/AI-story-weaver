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

export const getStories = (): Record<string, Story> => {
    try {
        const item = window.localStorage.getItem(STORIES_KEY);
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error('Error reading stories from localStorage:', error);
        return {};
    }
};

export const saveStories = (stories: Record<string, Story>) => {
    try {
        window.localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    } catch (error) {
        console.error('Error saving stories to localStorage:', error);
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
        const newStory: Story = {
            id: Date.now().toString(),
            name: 'My First Story',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            storySegments: JSON.parse(window.localStorage.getItem('storySegments') || '[]'),
            generationConfig: JSON.parse(window.localStorage.getItem('generationConfig') || JSON.stringify(initialConfig)),
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
