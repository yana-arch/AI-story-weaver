import React, { useState, useEffect } from 'react';
import type { CharacterProfile } from '../types';
import { CloseIcon, SaveIcon } from './icons';

interface CharacterProfileEditorProps {
    profile?: CharacterProfile | null;
    onSave: (profile: CharacterProfile) => void;
    onClose: () => void;
}

const LabeledTextarea: React.FC<{ label: string; value: string; onChange: (value: string) => void; rows?: number }> = ({ label, value, onChange, rows = 3 }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
    </div>
);

export const CharacterProfileEditor: React.FC<CharacterProfileEditorProps> = ({ profile, onSave, onClose }) => {
    const [editedProfile, setEditedProfile] = useState<CharacterProfile>(
        profile || { id: Date.now().toString(), name: '', appearance: '', personality: '', background: '', motivation: '' }
    );

    useEffect(() => {
        if (profile) {
            setEditedProfile(profile);
        } else {
            setEditedProfile({ id: Date.now().toString(), name: '', appearance: '', personality: '', background: '', motivation: '' });
        }
    }, [profile]);

    const handleSave = () => {
        if (editedProfile.name.trim()) {
            onSave(editedProfile);
        }
    };
    
    const handleChange = (field: keyof Omit<CharacterProfile, 'id'>, value: string) => {
        setEditedProfile(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-400">
                        {profile ? 'Edit Character Profile' : 'Add New Character'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                        <input
                            type="text"
                            value={editedProfile.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <LabeledTextarea label="Appearance" value={editedProfile.appearance} onChange={(v) => handleChange('appearance', v)} />
                    <LabeledTextarea label="Personality" value={editedProfile.personality} onChange={(v) => handleChange('personality', v)} />
                    <LabeledTextarea label="Background / Backstory" value={editedProfile.background} onChange={(v) => handleChange('background', v)} />
                    <LabeledTextarea label="Motivation / Goals" value={editedProfile.motivation} onChange={(v) => handleChange('motivation', v)} />
                </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={!editedProfile.name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-500"
                    >
                        <SaveIcon className="w-5 h-5" /> Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
};