
import React, { useState, useEffect } from 'react';
import type { HistoryEntry } from '../types';
import { getHistoryForSegment } from '../services/historyService';
import { CloseIcon, RefreshIcon, HistoryIcon } from './icons';

interface VersionHistoryViewerProps {
    segmentId: string;
    onClose: () => void;
    onRevert: (segmentId: string, historyEntry: HistoryEntry) => void;
}

export const VersionHistoryViewer: React.FC<VersionHistoryViewerProps> = ({ segmentId, onClose, onRevert }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        setHistory(getHistoryForSegment(segmentId));
    }, [segmentId]);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-400 flex items-center">
                        <HistoryIcon className="w-6 h-6 mr-3" />
                        Version History
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 border border-gray-700 rounded-lg p-2">
                    <ul className="space-y-3">
                        {(history && history.length > 0) ? history.map(entry => (
                            <li key={entry.timestamp} className="p-4 rounded-md bg-gray-700/50 flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-sm text-gray-400">
                                        Saved on: {formatTimestamp(entry.timestamp)}
                                    </p>
                                    <button
                                        onClick={() => onRevert(segmentId, entry)}
                                        className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                                    >
                                        <RefreshIcon className="w-4 h-4" />
                                        Revert to this version
                                    </button>
                                </div>
                                <div className="text-sm text-gray-300 bg-gray-900/40 p-3 rounded-md max-h-40 overflow-y-auto">
                                    <p className="whitespace-pre-wrap line-clamp-6">{entry.content}</p>
                                </div>
                            </li>
                        )) : (
                            <li className="text-center text-gray-500 py-16">
                                No previous versions available for this segment.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};