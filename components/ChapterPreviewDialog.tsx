import React, { useState, useMemo } from 'react';
import type { ImportedChapter, ImportResult } from '../types/chapter';

interface ChapterPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  importResult: ImportResult | null;
  onConfirmImport: (selectedChapters: ImportedChapter[]) => void;
}

export const ChapterPreviewDialog: React.FC<ChapterPreviewDialogProps> = ({
  isOpen,
  onClose,
  importResult,
  onConfirmImport,
}) => {
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [editingChapter, setEditingChapter] = useState<ImportedChapter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapters = useMemo(() => {
    if (!importResult) return [];

    if (!searchQuery.trim()) {
      return importResult.chapters;
    }

    const query = searchQuery.toLowerCase();
    return importResult.chapters.filter(chapter =>
      chapter.title.toLowerCase().includes(query) ||
      chapter.content.toLowerCase().includes(query)
    );
  }, [importResult, searchQuery]);

  const handleChapterSelect = (chapterId: string, selected: boolean) => {
    const newSelected = new Set(selectedChapters);
    if (selected) {
      newSelected.add(chapterId);
    } else {
      newSelected.delete(chapterId);
    }
    setSelectedChapters(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedChapters.size === filteredChapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(filteredChapters.map(c => c.id)));
    }
  };

  const handleEditChapter = (chapter: ImportedChapter) => {
    setEditingChapter(chapter);
  };

  const handleSaveEdit = (updatedChapter: ImportedChapter) => {
    // In a real implementation, this would update the chapter in the import result
    setEditingChapter(null);
  };

  const handleConfirmImport = () => {
    const chaptersToImport = importResult?.chapters.filter(c => selectedChapters.has(c.id)) || [];
    onConfirmImport(chaptersToImport);
  };

  if (!isOpen || !importResult) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Preview Chương Import</h2>
            <p className="text-sm text-gray-600 mt-1">
              Đã import {importResult.chapters.length} chương từ file "{importResult.metadata.fileName}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Tổng số chương:</span>
              <span className="ml-2 text-blue-600">{importResult.chapters.length}</span>
            </div>
            <div>
              <span className="font-medium">Tổng số từ:</span>
              <span className="ml-2 text-green-600">
                {importResult.metadata.totalWords.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Thời gian xử lý:</span>
              <span className="ml-2 text-purple-600">
                {(importResult.metadata.processingTime / 1000).toFixed(1)}s
              </span>
            </div>
            <div>
              <span className="font-medium">Kích thước file:</span>
              <span className="ml-2 text-orange-600">
                {(importResult.metadata.totalSize / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="font-medium text-red-800 mb-2">Lỗi Import:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>
                    {error.type}: {error.message}
                    {error.line && ` (Dòng ${error.line})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm chương..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {selectedChapters.size === filteredChapters.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredChapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedChapters.has(chapter.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedChapters.has(chapter.id)}
                    onChange={(e) => handleChapterSelect(chapter.id, e.target.checked)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chapter.title}
                      </h3>
                      <button
                        onClick={() => handleEditChapter(chapter)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        Chỉnh sửa
                      </button>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      {chapter.wordCount.toLocaleString()} từ •
                      {chapter.estimatedReadingTime} phút đọc •
                      {chapter.characterCount.toLocaleString()} ký tự
                    </div>

                    <div className="text-sm text-gray-700 line-clamp-3">
                      {chapter.content.substring(0, 200)}
                      {chapter.content.length > 200 && '...'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center p-6 border-t">
          <div className="text-sm text-gray-600">
            Đã chọn {selectedChapters.size} / {filteredChapters.length} chương
          </div>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={selectedChapters.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selectedChapters.size} chương
            </button>
          </div>
        </div>
      </div>

      {/* Edit Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Chỉnh sửa chương: {editingChapter.title}</h3>
              <button
                onClick={() => setEditingChapter(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tiêu đề chương</label>
                <input
                  type="text"
                  value={editingChapter.title}
                  onChange={(e) => setEditingChapter(prev =>
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nội dung chương</label>
                <textarea
                  value={editingChapter.content}
                  onChange={(e) => setEditingChapter(prev =>
                    prev ? { ...prev, content: e.target.value } : null
                  )}
                  rows={20}
                  className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setEditingChapter(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => handleSaveEdit(editingChapter)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterPreviewDialog;
