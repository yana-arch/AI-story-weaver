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
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <textarea
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
    </div>
);

export const CharacterProfileEditor: React.FC<CharacterProfileEditorProps> = ({ profile, onSave, onClose }) => {
    const [editedProfile, setEditedProfile] = useState<CharacterProfile>(
        profile || { id: Date.now().toString(), name: '', appearance: '', personality: '', background: '', goals: '', relationships: '', flaws: '' }
    );

    useEffect(() => {
        if (profile) {
            setEditedProfile(profile);
        } else {
            setEditedProfile({ id: Date.now().toString(), name: '', appearance: '', personality: '', background: '', goals: '', relationships: '', flaws: '' });
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
        <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50">
            <div className="bg-card rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-primary">
                        {profile ? 'Edit Character Profile' : 'Add New Character'}
                    </h2>
                    <button title={"Đóng"} onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Name *</label>
                        <input
                            type="text"
                            value={editedProfile.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Enter character name"
                            className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <LabeledTextarea label="Appearance" value={editedProfile.appearance} onChange={(v) => handleChange('appearance', v)} />
                    <LabeledTextarea label="Personality" value={editedProfile.personality} onChange={(v) => handleChange('personality', v)} />
                    <LabeledTextarea label="Background / Backstory" value={editedProfile.background} onChange={(v) => handleChange('background', v)} />
                    <LabeledTextarea label="Goals" value={editedProfile.goals} onChange={(v) => handleChange('goals', v)} />
                    <LabeledTextarea label="Relationships" value={editedProfile.relationships} onChange={(v) => handleChange('relationships', v)} />
                    <LabeledTextarea label="Flaws" value={editedProfile.flaws} onChange={(v) => handleChange('flaws', v)} />
                </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-muted text-foreground font-semibold rounded-md hover:bg-muted/80 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!editedProfile.name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
                    >
                        <SaveIcon className="w-5 h-5" /> Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
};
