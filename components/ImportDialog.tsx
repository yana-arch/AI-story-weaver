import React, { useState, useCallback, useRef } from 'react';
import type {
  ImportOptions,
  ImportResult,
  ProcessingProgress,
  ChapterPattern,
  ContentFilter,
  ImportedStory,
} from '../types/chapter';
import importService from '../services/importService';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (stories: ImportedStory[]) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    fileFormat: 'txt', // Auto-detected, this is set per file
    autoSplit: true,
    splitOptions: {
      method: 'word_count',
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

  const addFiles = useCallback((files: File[] | FileList) => {
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => {
      const existingNames = prev.map((f) => f.name);
      const nonDuplicateFiles = newFiles.filter((f) => !existingNames.includes(f.name));
      return [...prev, ...nonDuplicateFiles];
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);

    try {
      // Simulate progress updates
      const updateProgress = (
        stage: ProcessingProgress['stage'],
        progress: number,
        message: string
      ) => {
        setProgress({ stage, progress, message });
      };

      updateProgress('uploading', 10, 'Đang tải file lên...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateProgress('parsing', 30, 'Đang phân tích nội dung...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (importOptions.autoSplit) {
        updateProgress('splitting', 60, 'Đang chia chương...');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (importOptions.aiProcessing) {
        updateProgress('ai_processing', 80, 'Đang xử lý AI...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      updateProgress('saving', 90, 'Đang lưu kết quả...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Actual import - process multiple files
      const result = await importService.importStoriesFromFiles(selectedFiles, importOptions);

      if (!result.success) {
        throw new Error(`Import failed: ${result.errors.map((e) => e.message).join('; ')}`);
      }

      updateProgress('saving', 100, 'Hoàn thành!');

      onImportComplete(result.stories);
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

    setImportOptions((prev) => ({
      ...prev,
      aiProcessingOptions: {
        ...prev.aiProcessingOptions,
        contentFilters: [...prev.aiProcessingOptions.contentFilters, newFilter],
      },
    }));
  };

  const updateContentFilter = (index: number, filter: ContentFilter) => {
    setImportOptions((prev) => ({
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
    setImportOptions((prev) => ({
      ...prev,
      aiProcessingOptions: {
        ...prev.aiProcessingOptions,
        contentFilters: prev.aiProcessingOptions.contentFilters.filter((_, i) => i !== index),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-border text-foreground">
          <h2 className="text-2xl font-bold text-foreground">Import Truyện từ File</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl w-8 h-8 flex items-center justify-center hover:bg-accent rounded"
          >
            ×
          </button>
        </div>

        {/* File Upload Section */}
        <div className="p-6 pb-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Chọn File</h3>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-background ${
              dragActive ? 'border-primary bg-muted/50' : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-6xl text-muted-foreground">📁</div>
              <div>
                <p className="text-lg text-foreground">
                  Kéo thả file vào đây hoặc{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary/80 underline"
                  >
                    chọn file
                  </button>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Hỗ trợ: .txt, .md, .docx, .epub (Tối đa 50MB mỗi file)
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.docx,.epub"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-foreground">
                File đã chọn ({selectedFiles.length}):
              </h4>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📄</div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-foreground break-all"
                        style={{ wordBreak: 'break-all', hyphens: 'none' }}
                      >
                        {file.name}
                      </p>
                      <p
                        className="text-sm text-muted-foreground break-all"
                        style={{ wordBreak: 'break-all' }}
                      >
                        {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                        {file.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive/80 w-6 h-6 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import Options */}
        {selectedFiles.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Tùy Chọn Cơ Bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Encoding</label>
                  <select
                    value={importOptions.encoding || 'utf-8'}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        encoding: e.target.value,
                      }))
                    }
                    className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="utf-8">UTF-8</option>
                    <option value="utf-8-bom">UTF-8 with BOM</option>
                    <option value="utf-16le">UTF-16 LE</option>
                    <option value="utf-16be">UTF-16 BE</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Định dạng file được tự động phát hiện
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.preserveFormatting}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        preserveFormatting: e.target.checked,
                      }))
                    }
                    className="mr-2 accent-primary"
                  />
                  <span className="text-sm text-foreground">Giữ nguyên định dạng</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.createHierarchy}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        createHierarchy: e.target.checked,
                      }))
                    }
                    className="mr-2 accent-primary"
                  />
                  <span className="text-sm text-foreground">Tạo cấu trúc phân cấp</span>
                </label>
              </div>
            </div>

            {/* Chapter Splitting Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Chia Chương</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.autoSplit}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        autoSplit: e.target.checked,
                      }))
                    }
                    className="mr-2 accent-primary"
                  />
                  <span className="text-sm text-foreground">Tự động chia chương</span>
                </label>

                {importOptions.autoSplit && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Phương Thức Chia
                      </label>
                      <select
                        value={importOptions.splitOptions.method}
                        onChange={(e) =>
                          setImportOptions((prev) => ({
                            ...prev,
                            splitOptions: {
                              ...prev.splitOptions,
                              method: e.target.value as ImportOptions['splitOptions']['method'],
                            },
                          }))
                        }
                        className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="pattern">Theo Pattern</option>
                        <option value="word_count">Theo Số Từ</option>
                        <option value="manual">Chia Thủ Công</option>
                        <option value="ai">AI Tự Động</option>
                      </select>
                    </div>

                    {importOptions.splitOptions.method === 'pattern' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Pattern Chia Chương
                        </label>
                        <input
                          type="text"
                          value={importOptions.splitOptions.pattern || ''}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              splitOptions: {
                                ...prev.splitOptions,
                                pattern: e.target.value,
                              },
                            }))
                          }
                          placeholder="Ví dụ: Chương (\d+): (.+)"
                          className="w-full p-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    )}

                    {importOptions.splitOptions.method === 'word_count' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Số Từ Mỗi Chương
                        </label>
                        <input
                          type="number"
                          value={importOptions.splitOptions.wordCount || 2000}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              splitOptions: {
                                ...prev.splitOptions,
                                wordCount: parseInt(e.target.value),
                              },
                            }))
                          }
                          className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.splitOptions.preserveTitles}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              splitOptions: {
                                ...prev.splitOptions,
                                preserveTitles: e.target.checked,
                              },
                            }))
                          }
                          className="mr-2 accent-primary"
                        />
                        <span className="text-sm text-foreground">Giữ nguyên tiêu đề chương</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.splitOptions.generateTitles}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              splitOptions: {
                                ...prev.splitOptions,
                                generateTitles: e.target.checked,
                              },
                            }))
                          }
                          className="mr-2 accent-primary"
                        />
                        <span className="text-sm text-foreground">Tự động tạo tiêu đề</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Processing Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Xử Lý AI</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.aiProcessing}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        aiProcessing: e.target.checked,
                      }))
                    }
                    className="mr-2 accent-primary"
                  />
                  <span className="text-sm text-foreground">Bật xử lý AI</span>
                </label>

                {importOptions.aiProcessing && (
                  <div className="ml-6 space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.aiProcessingOptions.enableContentModeration}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              aiProcessingOptions: {
                                ...prev.aiProcessingOptions,
                                enableContentModeration: e.target.checked,
                              },
                            }))
                          }
                          className="mr-2 accent-primary"
                        />
                        <span className="text-sm text-foreground">Kiểm duyệt nội dung</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.aiProcessingOptions.enableContentEnhancement}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              aiProcessingOptions: {
                                ...prev.aiProcessingOptions,
                                enableContentEnhancement: e.target.checked,
                              },
                            }))
                          }
                          className="mr-2 accent-primary"
                        />
                        <span className="text-sm text-foreground">Cải thiện nội dung</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.aiProcessingOptions.enableTranslation}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              aiProcessingOptions: {
                                ...prev.aiProcessingOptions,
                                enableTranslation: e.target.checked,
                              },
                            }))
                          }
                          className="mr-2 accent-primary"
                        />
                        <span className="text-sm text-foreground">Dịch sang ngôn ngữ khác</span>
                      </label>
                    </div>

                    {importOptions.aiProcessingOptions.enableTranslation && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Ngôn Ngữ Dịch
                        </label>
                        <select
                          value={importOptions.aiProcessingOptions.targetLanguage || 'vi'}
                          onChange={(e) =>
                            setImportOptions((prev) => ({
                              ...prev,
                              aiProcessingOptions: {
                                ...prev.aiProcessingOptions,
                                targetLanguage: e.target.value,
                              },
                            }))
                          }
                          className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                          <option value="ko">한국어</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Mức Độ Cải Thiện
                      </label>
                      <select
                        value={importOptions.aiProcessingOptions.enhancementLevel}
                        onChange={(e) =>
                          setImportOptions((prev) => ({
                            ...prev,
                            aiProcessingOptions: {
                              ...prev.aiProcessingOptions,
                              enhancementLevel: e.target
                                .value as ImportOptions['aiProcessingOptions']['enhancementLevel'],
                            },
                          }))
                        }
                        className="w-full p-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="light">Nhẹ nhàng</option>
                        <option value="moderate">Trung bình</option>
                        <option value="heavy">Nặng nề</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-foreground">
                          Bộ Lọc Nội Dung
                        </label>
                        <button
                          onClick={addContentFilter}
                          className="text-primary hover:text-primary/80 text-sm"
                        >
                          + Thêm Bộ Lọc
                        </button>
                      </div>

                      <div className="space-y-2">
                        {importOptions.aiProcessingOptions.contentFilters.map((filter, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-2 bg-muted/50 border border-border rounded"
                          >
                            <select
                              value={filter.type}
                              onChange={(e) =>
                                updateContentFilter(index, {
                                  ...filter,
                                  type: e.target.value as ContentFilter['type'],
                                })
                              }
                              className="flex-1 p-1 bg-background border border-border rounded text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                              <option value="violence">Bạo lực</option>
                              <option value="explicit">Nội dung 18+</option>
                              <option value="profanity">Ngôn ngữ thô tục</option>
                              <option value="sensitive">Nội dung nhạy cảm</option>
                              <option value="custom">Tùy chỉnh</option>
                            </select>

                            <select
                              value={filter.action}
                              onChange={(e) =>
                                updateContentFilter(index, {
                                  ...filter,
                                  action: e.target.value as ContentFilter['action'],
                                })
                              }
                              className="flex-1 p-1 bg-background border border-border rounded text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                              <option value="remove">Xóa bỏ</option>
                              <option value="replace">Thay thế</option>
                              <option value="flag">Đánh dấu</option>
                              <option value="rewrite">Viết lại</option>
                            </select>

                            <button
                              onClick={() => removeContentFilter(index)}
                              className="text-destructive hover:text-destructive/80 p-1 rounded"
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

            {/* Enhanced Progress Display */}
            {isProcessing && (
              <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">{progress.message}</div>
                      <div className="text-xs text-muted-foreground">{progress.progress}%</div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        File đang xử lý: {selectedFiles.length}/{selectedFiles.length}
                      </span>
                      <span>
                        {progress.stage === 'uploading' && 'Chuẩn bị files'}
                        {progress.stage === 'parsing' && 'Phân tích nội dung'}
                        {progress.stage === 'splitting' && 'Chia chương'}
                        {progress.stage === 'ai_processing' && 'Xử lý AI'}
                        {progress.stage === 'saving' && 'Lưu kết quả'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File-specific progress */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Tiến tại xử lý từng file:
                    </div>
                    {selectedFiles.map((file, index) => {
                      const isCompleted =
                        progress.progress >= ((index + 1) / selectedFiles.length) * 100;
                      return (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              isCompleted
                                ? 'border-green-500 bg-green-100'
                                : 'border-muted-foreground/20 bg-muted'
                            } flex items-center justify-center`}
                          >
                            {isCompleted && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span
                            className={`truncate ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {file.name}
                          </span>
                          {isCompleted && <span className="text-green-600 text-xs ml-auto">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <button
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Đang Import...' : `Import ${selectedFiles.length} Truyện`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDialog;
