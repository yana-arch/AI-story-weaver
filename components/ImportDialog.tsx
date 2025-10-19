import React, { useState, useCallback, useRef } from 'react';
import type {
  ImportOptions,
  ImportResult,
  ProcessingProgress,
  ChapterPattern,
  ContentFilter,
} from '../types/chapter';
import importService from '../services/importService';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    fileFormat: 'txt',
    autoSplit: true,
    splitOptions: {
      method: 'pattern',
      pattern: '',
      wordCount: 2000,
      preserveTitles: true,
      generateTitles: true,
    },
    aiProcessing: false,
    aiProcessingOptions: {
      enableContentModeration: false,
      enableContentEnhancement: false,
      enableTranslation: false,
      contentFilters: [],
      enhancementLevel: 'light',
      preserveStyle: true,
    },
    preserveFormatting: true,
    createHierarchy: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'uploading',
    progress: 0,
    message: '',
  });

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);

    // Auto-detect format based on file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'md') {
      setImportOptions(prev => ({ ...prev, fileFormat: 'md' }));
    } else if (extension === 'docx') {
      setImportOptions(prev => ({ ...prev, fileFormat: 'docx' }));
    } else {
      setImportOptions(prev => ({ ...prev, fileFormat: 'txt' }));
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      // Simulate progress updates
      const updateProgress = (stage: ProcessingProgress['stage'], progress: number, message: string) => {
        setProgress({ stage, progress, message });
      };

      updateProgress('uploading', 10, 'Đang tải file lên...');
      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress('parsing', 30, 'Đang phân tích nội dung...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (importOptions.autoSplit) {
        updateProgress('splitting', 60, 'Đang chia chương...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (importOptions.aiProcessing) {
        updateProgress('ai_processing', 80, 'Đang xử lý AI...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      updateProgress('saving', 90, 'Đang lưu kết quả...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Actual import
      const result = await importService.importFromFile(selectedFile, importOptions);

      updateProgress('saving', 100, 'Hoàn thành!');

      onImportComplete(result);
      onClose();

    } catch (error) {
      setProgress({
        stage: 'saving',
        progress: 0,
        message: `Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addContentFilter = () => {
    const newFilter: ContentFilter = {
      type: 'custom',
      action: 'flag',
      severity: 'medium',
      customPattern: '',
    };

    setImportOptions(prev => ({
      ...prev,
      aiProcessingOptions: {
        ...prev.aiProcessingOptions,
        contentFilters: [...prev.aiProcessingOptions.contentFilters, newFilter],
      },
    }));
  };

  const updateContentFilter = (index: number, filter: ContentFilter) => {
    setImportOptions(prev => ({
      ...prev,
      aiProcessingOptions: {
        ...prev.aiProcessingOptions,
        contentFilters: prev.aiProcessingOptions.contentFilters.map((f, i) =>
          i === index ? filter : f
        ),
      },
    }));
  };

  const removeContentFilter = (index: number) => {
    setImportOptions(prev => ({
      ...prev,
      aiProcessingOptions: {
        ...prev.aiProcessingOptions,
        contentFilters: prev.aiProcessingOptions.contentFilters.filter((_, i) => i !== index),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Import Truyện từ File</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Chọn File</h3>

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-6xl text-gray-400">📁</div>
                <div>
                  <p className="text-lg text-gray-600">
                    Kéo thả file vào đây hoặc{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      chọn file
                    </button>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Hỗ trợ: .txt, .md, .docx (Tối đa 50MB)
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.docx"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Import Options */}
        {selectedFile && (
          <div className="space-y-6">
            {/* Basic Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tùy Chọn Cơ Bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Định Dạng File</label>
                  <select
                    value={importOptions.fileFormat}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      fileFormat: e.target.value as ImportOptions['fileFormat']
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="txt">Plain Text (.txt)</option>
                    <option value="md">Markdown (.md)</option>
                    <option value="docx">Word Document (.docx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Encoding</label>
                  <select
                    value={importOptions.encoding || 'utf-8'}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      encoding: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="utf-8">UTF-8</option>
                    <option value="utf-8-bom">UTF-8 with BOM</option>
                    <option value="utf-16le">UTF-16 LE</option>
                    <option value="utf-16be">UTF-16 BE</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.preserveFormatting}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      preserveFormatting: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Giữ nguyên định dạng</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.createHierarchy}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      createHierarchy: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Tạo cấu trúc phân cấp</span>
                </label>
              </div>
            </div>

            {/* Chapter Splitting Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Chia Chương</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.autoSplit}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      autoSplit: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Tự động chia chương</span>
                </label>

                {importOptions.autoSplit && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phương Thức Chia</label>
                      <select
                        value={importOptions.splitOptions.method}
                        onChange={(e) => setImportOptions(prev => ({
                          ...prev,
                          splitOptions: {
                            ...prev.splitOptions,
                            method: e.target.value as ImportOptions['splitOptions']['method']
                          }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="pattern">Theo Pattern</option>
                        <option value="word_count">Theo Số Từ</option>
                        <option value="manual">Chia Thủ Công</option>
                        <option value="ai">AI Tự Động</option>
                      </select>
                    </div>

                    {importOptions.splitOptions.method === 'pattern' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Pattern Chia Chương</label>
                        <input
                          type="text"
                          value={importOptions.splitOptions.pattern || ''}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            splitOptions: {
                              ...prev.splitOptions,
                              pattern: e.target.value
                            }
                          }))}
                          placeholder="Ví dụ: Chương (\d+): (.+)"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    {importOptions.splitOptions.method === 'word_count' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Số Từ Mỗi Chương</label>
                        <input
                          type="number"
                          value={importOptions.splitOptions.wordCount || 2000}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            splitOptions: {
                              ...prev.splitOptions,
                              wordCount: parseInt(e.target.value)
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.splitOptions.preserveTitles}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            splitOptions: {
                              ...prev.splitOptions,
                              preserveTitles: e.target.checked
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Giữ nguyên tiêu đề chương</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.splitOptions.generateTitles}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            splitOptions: {
                              ...prev.splitOptions,
                              generateTitles: e.target.checked
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Tự động tạo tiêu đề</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Processing Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Xử Lý AI</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.aiProcessing}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      aiProcessing: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Bật xử lý AI</span>
                </label>

                {importOptions.aiProcessing && (
                  <div className="ml-6 space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.aiProcessingOptions.enableContentModeration}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            aiProcessingOptions: {
                              ...prev.aiProcessingOptions,
                              enableContentModeration: e.target.checked
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Kiểm duyệt nội dung</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.aiProcessingOptions.enableContentEnhancement}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            aiProcessingOptions: {
                              ...prev.aiProcessingOptions,
                              enableContentEnhancement: e.target.checked
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Cải thiện nội dung</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.aiProcessingOptions.enableTranslation}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            aiProcessingOptions: {
                              ...prev.aiProcessingOptions,
                              enableTranslation: e.target.checked
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Dịch sang ngôn ngữ khác</span>
                      </label>
                    </div>

                    {importOptions.aiProcessingOptions.enableTranslation && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Ngôn Ngữ Dịch</label>
                        <select
                          value={importOptions.aiProcessingOptions.targetLanguage || 'vi'}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            aiProcessingOptions: {
                              ...prev.aiProcessingOptions,
                              targetLanguage: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                          <option value="ko">한국어</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Mức Độ Cải Thiện</label>
                      <select
                        value={importOptions.aiProcessingOptions.enhancementLevel}
                        onChange={(e) => setImportOptions(prev => ({
                          ...prev,
                          aiProcessingOptions: {
                            ...prev.aiProcessingOptions,
                            enhancementLevel: e.target.value as ImportOptions['aiProcessingOptions']['enhancementLevel']
                          }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="light">Nhẹ nhàng</option>
                        <option value="moderate">Trung bình</option>
                        <option value="heavy">Nặng nề</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Bộ Lọc Nội Dung</label>
                        <button
                          onClick={addContentFilter}
                          className="text-blue-500 hover:text-blue-600 text-sm"
                        >
                          + Thêm Bộ Lọc
                        </button>
                      </div>

                      <div className="space-y-2">
                        {importOptions.aiProcessingOptions.contentFilters.map((filter, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <select
                              value={filter.type}
                              onChange={(e) => updateContentFilter(index, {
                                ...filter,
                                type: e.target.value as ContentFilter['type']
                              })}
                              className="flex-1 p-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="violence">Bạo lực</option>
                              <option value="explicit">Nội dung 18+</option>
                              <option value="profanity">Ngôn ngữ thô tục</option>
                              <option value="sensitive">Nội dung nhạy cảm</option>
                              <option value="custom">Tùy chỉnh</option>
                            </select>

                            <select
                              value={filter.action}
                              onChange={(e) => updateContentFilter(index, {
                                ...filter,
                                action: e.target.value as ContentFilter['action']
                              })}
                              className="flex-1 p-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="remove">Xóa bỏ</option>
                              <option value="replace">Thay thế</option>
                              <option value="flag">Đánh dấu</option>
                              <option value="rewrite">Viết lại</option>
                            </select>

                            <button
                              onClick={() => removeContentFilter(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Display */}
            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-800">
                      {progress.message}
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Đang Import...' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDialog;
