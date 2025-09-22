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
    const newHistory = [newEntry, ...history].slice(0, 50); // Keep only last 50 versions to prevent storage bloat
    try {
        const dataStr = JSON.stringify(newHistory);
        if (dataStr.length > 1024 * 1024) { // 1MB limit per segment history
            throw new Error('History data is too large. Consider reducing the number of edits.');
        }
        window.localStorage.setItem(getHistoryKey(segmentId), dataStr);
    } catch (error) {
        console.error(`Error saving history for segment ${segmentId}:`, error);
        // Silently fail for history - not critical
    }
};

export const deleteHistory = (segmentId: string) => {
    try {
        window.localStorage.removeItem(getHistoryKey(segmentId));
    } catch (error) {
        console.error(`Error deleting history for segment ${segmentId}:`, error);
    }
}
