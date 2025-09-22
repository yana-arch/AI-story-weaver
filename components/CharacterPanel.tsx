import React from 'react';
import type { CharacterProfile } from '../types';
import { UserGroupIcon, PlusIcon, EditIcon, TrashIcon, CloseIcon } from './icons';

interface CharacterPanelProps {
    profiles: CharacterProfile[];
    onAdd: () => void;
    onEdit: (profile: CharacterProfile) => void;
    onDelete: (id: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    onClose: () => void;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ profiles, onAdd, onEdit, onDelete, onGenerate, isGenerating, onClose }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100 flex items-center">
                    <UserGroupIcon className="w-6 h-6 mr-2" />
                    Character Profiles
                </h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Close">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {profiles.length > 0 ? (
                    profiles.map(profile => (
                        <div key={profile.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 group">
                            <div className="flex justify-between items-start">
                                <h3 className="text-md font-semibold text-indigo-300 mb-2">{profile.name}</h3>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(profile)} className="p-1.5 rounded hover:bg-gray-600" title="Edit"><EditIcon className="w-4 h-4" /></button>
                                    <button onClick={() => onDelete(profile.id)} className="p-1.5 rounded hover:bg-gray-600 text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-300">
                                {profile.personality && <p><strong className="text-gray-400">Personality:</strong> {profile.personality}</p>}
                                {profile.appearance && <p><strong className="text-gray-400">Appearance:</strong> {profile.appearance}</p>}
                                {profile.motivation && <p><strong className="text-gray-400">Motivation:</strong> {profile.motivation}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <p>No character profiles yet.</p>
                        <p className="mt-2 text-xs">Use the button below to let AI analyze your story and create them.</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="w-full flex justify-center items-center px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-transform duration-200 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : 'Analyze Story & Create Profiles'}
                </button>
                <button
                    onClick={onAdd}
                    className="w-full flex justify-center items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Character Manually
                </button>
            </div>
        </div>
    );
};