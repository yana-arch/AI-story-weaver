import React, { useState } from 'react';
import type { KeywordPreset } from '../types';
import { CloseIcon, PlusIcon, TrashIcon, EditIcon, SaveIcon } from './icons';

interface KeywordPresetManagerProps {
  presets: KeywordPreset[];
  setPresets: React.Dispatch<React.SetStateAction<KeywordPreset[]>>;
  onClose: () => void;
}

export const KeywordPresetManager: React.FC<KeywordPresetManagerProps> = ({
  presets,
  setPresets,
  onClose,
}) => {
  const [editingPreset, setEditingPreset] = useState<KeywordPreset | null>(null);

  const handleDeletePreset = (id: string) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      setPresets(presets.filter((preset) => preset.id !== id));
      if (editingPreset?.id === id) {
        setEditingPreset(null);
      }
    }
  };

  const handleStartEdit = (preset: KeywordPreset) => {
    setEditingPreset({ ...preset });
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
  };

  const handleUpdatePreset = () => {
    if (editingPreset && editingPreset.name.trim()) {
      setPresets(presets.map((p) => (p.id === editingPreset.id ? editingPreset : p)));
      setEditingPreset(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-indigo-400">Quản lý Mẫu từ khóa</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <ul className="space-y-3">
            {presets.length > 0 ? (
              presets.map((preset) => (
                <li
                  key={preset.id}
                  className="p-3 rounded-md bg-gray-700/50 flex justify-between items-start gap-4"
                >
                  {editingPreset?.id === preset.id ? (
                    <div className="flex-grow space-y-2">
                      <input
                        type="text"
                        placeholder="Tên mẫu"
                        value={editingPreset.name}
                        onChange={(e) =>
                          setEditingPreset({ ...editingPreset, name: e.target.value })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <textarea
                        placeholder="Từ khóa cần tránh"
                        value={editingPreset.avoidKeywords}
                        onChange={(e) =>
                          setEditingPreset({ ...editingPreset, avoidKeywords: e.target.value })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        rows={2}
                      />
                      <textarea
                        placeholder="Từ khóa cần nhấn mạnh"
                        value={editingPreset.focusKeywords}
                        onChange={(e) =>
                          setEditingPreset({ ...editingPreset, focusKeywords: e.target.value })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate text-gray-200" title={preset.name}>
                        {preset.name}
                      </p>
                      <p className="text-sm text-gray-400 truncate" title={preset.avoidKeywords}>
                        <b>Tránh:</b> {preset.avoidKeywords || '(không có)'}
                      </p>
                      <p className="text-sm text-gray-400 truncate" title={preset.focusKeywords}>
                        <b>Nhấn mạnh:</b> {preset.focusKeywords || '(không có)'}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-shrink-0 ml-2">
                    {editingPreset?.id === preset.id ? (
                      <>
                        <button
                          onClick={handleUpdatePreset}
                          className="p-2 rounded-full hover:bg-gray-600 text-green-400"
                          title="Save Preset"
                        >
                          <SaveIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                          title="Cancel Edit"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(preset)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300 hover:text-white"
                        title="Edit Preset"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-2 rounded-full hover:bg-gray-600 text-red-400 hover:text-red-300"
                      title="Delete Preset"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center text-gray-500 py-8">Chưa có mẫu nào được lưu.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
