import React, { useState, useEffect } from 'react';
import { ContentElementType } from '../types';
import type {
  StoryDisplaySettings as StoryDisplaySettingsType,
  ContentElementStyle,
} from '../types';
import { CloseIcon, PaintBrushIcon } from './icons';

interface StoryDisplaySettingsProps {
  settings: StoryDisplaySettingsType;
  onSettingsChange: (settings: StoryDisplaySettingsType) => void;
  onClose: () => void;
}

const elementLabels: Record<ContentElementType, string> = {
  [ContentElementType.NARRATIVE]: 'Nội dung chính',
  [ContentElementType.DIALOGUE]: 'Đối thoại',
  [ContentElementType.MONOLOGUE]: 'Độc tâm',
  [ContentElementType.INTRODUCTION]: 'Dẫn truyện',
  [ContentElementType.DESCRIPTION]: 'Miêu tả',
  [ContentElementType.TRANSITION]: 'Chuyển cảnh',
};

const defaultStyles: Record<ContentElementType, ContentElementStyle> = {
  [ContentElementType.NARRATIVE]: {
    fontSize: '1rem',
    fontWeight: '400',
    fontStyle: 'normal',
    color: 'inherit',
    backgroundColor: 'transparent',
    borderRadius: '0',
    padding: '0',
    margin: '0',
    textAlign: 'left',
    lineHeight: '1.6',
    letterSpacing: 'normal',
  },
  [ContentElementType.DIALOGUE]: {
    fontSize: '1rem',
    fontWeight: '400',
    fontStyle: 'italic',
    color: 'inherit',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeft: '4px solid #3b82f6',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: '8px 0',
    textAlign: 'left',
    lineHeight: '1.5',
    letterSpacing: 'normal',
  },
  [ContentElementType.MONOLOGUE]: {
    fontSize: '0.95rem',
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#6b7280',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderLeft: '4px solid #6b7280',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: '8px 0',
    textAlign: 'left',
    lineHeight: '1.5',
    letterSpacing: 'normal',
  },
  [ContentElementType.INTRODUCTION]: {
    fontSize: '1.1rem',
    fontWeight: '500',
    fontStyle: 'normal',
    color: 'inherit',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '8px',
    padding: '16px',
    margin: '12px 0',
    textAlign: 'center',
    lineHeight: '1.7',
    letterSpacing: '0.025em',
  },
  [ContentElementType.DESCRIPTION]: {
    fontSize: '0.95rem',
    fontWeight: '400',
    fontStyle: 'normal',
    color: '#4b5563',
    backgroundColor: 'rgba(75, 85, 99, 0.05)',
    borderRadius: '6px',
    padding: '12px 16px',
    margin: '8px 0',
    textAlign: 'left',
    lineHeight: '1.6',
    letterSpacing: 'normal',
  },
  [ContentElementType.TRANSITION]: {
    fontSize: '0.9rem',
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#9ca3af',
    backgroundColor: 'transparent',
    borderRadius: '0',
    padding: '8px 0',
    margin: '16px 0',
    textAlign: 'center',
    lineHeight: '1.4',
    letterSpacing: '0.05em',
  },
};

const StyleEditor: React.FC<{
  elementType: ContentElementType;
  style: ContentElementStyle;
  enabled: boolean;
  onChange: (style: ContentElementStyle) => void;
  onEnabledChange: (enabled: boolean) => void;
}> = ({ elementType, style, enabled, onChange, onEnabledChange }) => {
  const updateStyle = (key: keyof ContentElementStyle, value: string) => {
    onChange({ ...style, [key]: value });
  };

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">{elementLabels[elementType]}</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-sm text-muted-foreground">Bật</span>
        </label>
      </div>

      {enabled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Cỡ chữ</label>
            <select
              aria-label="Font Size"
              value={style.fontSize}
              onChange={(e) => updateStyle('fontSize', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            >
              <option value="0.8rem">Nhỏ</option>
              <option value="0.9rem">Vừa nhỏ</option>
              <option value="1rem">Vừa</option>
              <option value="1.1rem">Vừa lớn</option>
              <option value="1.2rem">Lớn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Độ đậm</label>
            <select
              aria-label="Font Weight"
              value={style.fontWeight}
              onChange={(e) => updateStyle('fontWeight', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            >
              <option value="300">Mỏng</option>
              <option value="400">Bình thường</option>
              <option value="500">Đậm</option>
              <option value="600">Rất đậm</option>
              <option value="700">Siêu đậm</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kiểu chữ</label>
            <select
              aria-label="Font Style"
              value={style.fontStyle}
              onChange={(e) => updateStyle('fontStyle', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            >
              <option value="normal">Bình thường</option>
              <option value="italic">Nghiêng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Căn lề</label>
            <select
              aria-label="Text Align"
              value={style.textAlign}
              onChange={(e) => updateStyle('textAlign', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            >
              <option value="left">Trái</option>
              <option value="center">Giữa</option>
              <option value="right">Phải</option>
              <option value="justify">Căn đều</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Màu chữ</label>
            <input
              aria-label="Font Color"
              type="color"
              value={style.color.startsWith('#') ? style.color : '#000000'}
              onChange={(e) => updateStyle('color', e.target.value)}
              className="w-full h-10 px-3 py-2 border border-border rounded-md bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Màu nền</label>
            <input
              aria-label="Background Color"
              type="color"
              value={
                style.backgroundColor.startsWith('#') || style.backgroundColor.startsWith('rgb')
                  ? style.backgroundColor
                  : '#ffffff'
              }
              onChange={(e) => updateStyle('backgroundColor', e.target.value)}
              className="w-full h-10 px-3 py-2 border border-border rounded-md bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Khoảng đệm</label>
            <input
              type="text"
              value={style.padding}
              onChange={(e) => updateStyle('padding', e.target.value)}
              placeholder="12px 16px"
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Khoảng cách</label>
            <input
              type="text"
              value={style.margin}
              onChange={(e) => updateStyle('margin', e.target.value)}
              placeholder="8px 0"
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const StoryDisplaySettings: React.FC<StoryDisplaySettingsProps> = ({
  settings,
  onSettingsChange,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<StoryDisplaySettingsType>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateElementStyle = (elementType: ContentElementType, style: ContentElementStyle) => {
    setLocalSettings((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementType]: {
          ...prev.elements[elementType],
          style,
        },
      },
    }));
  };

  const updateElementEnabled = (elementType: ContentElementType, enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementType]: {
          ...prev.elements[elementType],
          enabled,
        },
      },
    }));
  };

  const resetToDefaults = () => {
    const defaultSettings: StoryDisplaySettingsType = {
      autoDetect: true,
      elements: Object.values(ContentElementType).reduce(
        (acc, type) => ({
          ...acc,
          [type]: {
            enabled: true,
            style: defaultStyles[type],
          },
        }),
        {} as StoryDisplaySettingsType['elements']
      ),
    };
    setLocalSettings(defaultSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <PaintBrushIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Cấu hình hiển thị truyện</h2>
          </div>
          <button
            title="Đóng"
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localSettings.autoDetect}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    autoDetect: e.target.checked,
                  }))
                }
                className="rounded border-border"
              />
              <span className="text-sm font-medium text-foreground">
                Tự động phát hiện các thành phần nội dung
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Khi bật, hệ thống sẽ tự động nhận diện đối thoại, độc tâm, miêu tả, v.v. dựa trên mẫu
              văn bản.
            </p>
          </div>

          <div className="space-y-4">
            {Object.values(ContentElementType).map((elementType) => (
              <StyleEditor
                key={elementType}
                elementType={elementType}
                style={localSettings.elements[elementType]?.style || defaultStyles[elementType]}
                enabled={localSettings.elements[elementType]?.enabled ?? true}
                onChange={(style) => updateElementStyle(elementType, style)}
                onEnabledChange={(enabled) => updateElementEnabled(elementType, enabled)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Đặt lại mặc định
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
