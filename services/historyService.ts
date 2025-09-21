import type { HistoryEntry } from '../types';

const getHistoryKey = (segmentId: string) => `story_segment_history_${segmentId}`;

export const getHistoryForSegment = (segmentId: string): HistoryEntry[] => {
    try {
        const item = window.localStorage.getItem(getHistoryKey(segmentId));
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error(`Error reading history for segment ${segmentId}:`, error);
        return [];
    }
};

export const addHistoryEntry = (segmentId: string, currentContent: string) => {
    const history = getHistoryForSegment(segmentId);
    const newEntry: HistoryEntry = {
        timestamp: Date.now(),
        content: currentContent,
    };
    const newHistory = [newEntry, ...history];
    try {
        window.localStorage.setItem(getHistoryKey(segmentId), JSON.stringify(newHistory));
    } catch (error) {
        console.error(`Error saving history for segment ${segmentId}:`, error);
    }
};

export const deleteHistory = (segmentId: string) => {
    try {
        window.localStorage.removeItem(getHistoryKey(segmentId));
    } catch (error) {
        console.error(`Error deleting history for segment ${segmentId}:`, error);
    }
}