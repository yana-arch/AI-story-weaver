import React, { useState, useEffect } from 'react';
import { Story, StorySegment } from '../types';
import { exportStory, downloadBlob, formatFileSize, ExportOptions } from '../utils/exportUtils';
import { CloseIcon, DownloadIcon, CheckCircleIcon } from './icons';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface ExportDialogProps {
  story: Story;
  segments: StorySegment[];
  isOpen: boolean;
  onClose: () => void;
}

interface ExportStatus {
  isExporting: boolean;
  exported: boolean;
  fileSize?: number;
  filename?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  story,
  segments,
  isOpen,
  onClose,
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'txt',
    includeMetadata: false,
    includeCharacterProfiles: false,
    includeGenerationSettings: false,
    customTitle: '',
    customAuthor: '',
  });

  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    isExporting: false,
    exported: false,
  });

  const { addError } = useErrorHandler();

  useEffect(() => {
    if (isOpen) {
      // Reset dialog state when opened
      setExportStatus({ isExporting: false, exported: false });
      setExportOptions({
        format: 'txt',
        includeMetadata: false,
        includeCharacterProfiles: false,
        includeGenerationSettings: false,
        customTitle: story.name,
        customAuthor: '',
      });
    }
  }, [isOpen, story.name]);

  const handleExport = async () => {
    setExportStatus({ isExporting: true, exported: false });

    try {
      const result = await exportStory(story, segments, exportOptions);
      downloadBlob(result.blob, result.filename);

      setExportStatus({
        isExporting: false,
        exported: true,
        fileSize: result.blob.size,
        filename: result.filename,
      });

      // Auto close dialog after successful export
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      addError(
        'Xuất câu chuyện thất bại. Vui lòng thử lại.',
        {
          recoverable: true,
          context: 'Story Export',
          retryAction: handleExport,
        }
      );
      setExportStatus({ isExporting: false, exported: false });
    }
  };

  const getFormatDescription = (format: string): string => {
    switch (format) {
      case 'txt':
        return 'Văn bản thuần (đơn giản, tương thích tốt)';
      case 'markdown':
        return 'Markdown (chỉnh sửa dễ dàng)';
      case 'html':
        return 'HTML (hiển thị dạng web, có thể in)';
      case 'json':
        return 'JSON (toàn bộ dữ liệu gốc)';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Xuất câu chuyện</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {exportStatus.exported ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Xuất thành công!</h3>
              <p className="text-sm text-muted-foreground">
                Tệp đã được tải xuống: {exportStatus.filename}
                {exportStatus.fileSize && (
                  <span className="ml-1">
                    ({formatFileSize(exportStatus.fileSize)})
                  </span>
                )}
              </p>
            </div>
          ) : (
            <>
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Định dạng xuất
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'txt', label: 'Văn bản thuần (.txt)' },
                    { value: 'markdown', label: 'Markdown (.md)' },
                    { value: 'html', label: 'HTML (.html)' },
                    { value: 'json', label: 'JSON (.json)' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center p-3 border border-border rounded-md hover:bg-accent cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="format"
                        value={value}
                        checked={exportOptions.format === value}
                        onChange={(e) => setExportOptions({
                          ...exportOptions,
                          format: e.target.value as ExportOptions['format']
                        })}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">
                          {getFormatDescription(value)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tiêu đề tùy chỉnh (không bắt buộc)
                </label>
                <input
                  type="text"
                  value={exportOptions.customTitle || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    customTitle: e.target.value
                  })}
                  placeholder={story.name}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>

              {/* Custom Author */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tác giả (không bắt buộc)
                </label>
                <input
                  type="text"
                  value={exportOptions.customAuthor || ''}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    customAuthor: e.target.value
                  })}
                  placeholder="Tên tác giả"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata ?? false}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includeMetadata: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Bao gồm thông tin metadata (ngày tạo, cập nhật)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharacterProfiles ?? false}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includeCharacterProfiles: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Bao gồm thông tin nhân vật ({story.characterProfiles.length} nhân vật)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeGenerationSettings ?? false}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includeGenerationSettings: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Bao gồm cài đặt tạo câu chuyện</span>
                </label>
              </div>
            </>
          )}
        </div>

        {!exportStatus.exported && (
          <div className="flex gap-3 p-4 border-t border-border bg-muted/10">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              disabled={exportStatus.isExporting}
            >
              Hủy
            </button>
            <button
              onClick={handleExport}
              disabled={exportStatus.isExporting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exportStatus.isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  Xuất tệp
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
