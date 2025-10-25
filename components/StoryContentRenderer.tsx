import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { ContentElementType } from '../types';
import type { ContentDisplayConfig, StoryDisplaySettings } from '../types';

interface StoryContentRendererProps {
    content: string;
    displaySettings?: StoryDisplaySettings;
}

// Initialize markdown-it
const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: true,
    langPrefix: 'language-',
    linkify: true,
    typographer: true,
});

// Default styles for each content element type
const defaultElementStyles: Record<ContentElementType, React.CSSProperties> = {
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
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
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
        wordBreak: 'break-all',
        wordWrap: 'break-word',
        hyphens: 'auto',
        whiteSpace: 'pre-wrap',
        overflow: 'visible',
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
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
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
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
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
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
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
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
    },
};

// Patterns to detect different content elements
const contentPatterns: Record<ContentElementType, RegExp[]> = {
    [ContentElementType.DIALOGUE]: [
        /^["""]/, // Starts with quote
        /^["""]\s*[^""]*?["""]$/, // Single line dialogue
        /"[^"]*"/g, // Quoted text within content
    ],
    [ContentElementType.MONOLOGUE]: [
        /^\*[^*]*\*$/, // *thought*
        /^_.*_$/, // _thought_
        /\*[^*]+\*/g, // *thought* within content
    ],
    [ContentElementType.INTRODUCTION]: [
        /^(Trong|Một|Khi|Vào|Bắt đầu)/i, // Vietnamese introduction patterns
        /^(In|At|When|As|The|It was)/i, // English introduction patterns
    ],
    [ContentElementType.DESCRIPTION]: [
        /^(Mô tả|Miêu tả|Trông|Nhìn|Cảnh|Không khí)/i, // Vietnamese description
        /^(The scene|The room|He looked|She appeared|The atmosphere)/i, // English description
    ],
    [ContentElementType.TRANSITION]: [
        /^(Sau đó|Tiếp theo|Một thời gian sau|Chuyển sang|Bỗng nhiên)/i, // Vietnamese transitions
        /^(Later|After|Then|Suddenly|Meanwhile|The next day)/i, // English transitions
    ],
    [ContentElementType.NARRATIVE]: [], // Default fallback
};

interface ParsedElement {
    type: ContentElementType;
    content: string;
    originalContent: string;
}

const parseContentElements = (content: string, autoDetect: boolean): ParsedElement[] => {
    if (!autoDetect) {
        return [{ type: ContentElementType.NARRATIVE, content, originalContent: content }];
    }

    // For imported content, try inline detection across paragraphs, not just line-by-line
    // Check if content contains dialogue patterns within text blocks
    if (/"[^"]{3,}"/.test(content) || /\*[^^*]{3,}\*/.test(content)) {
        // Content has inline dialogue or monologue, treat as special content that may need different formatting
        return [{ type: ContentElementType.NARRATIVE, content, originalContent: content }];
    }

    const lines = content.split('\n');
    const elements: ParsedElement[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            elements.push({ type: ContentElementType.NARRATIVE, content: line, originalContent: line });
            continue;
        }

        let detectedType = ContentElementType.NARRATIVE;

        // Check each pattern type
        for (const [type, patterns] of Object.entries(contentPatterns) as [ContentElementType, RegExp[]][]) {
            if (type === ContentElementType.NARRATIVE) continue;

            for (const pattern of patterns) {
                if (pattern.test(trimmedLine)) {
                    detectedType = type;
                    break;
                }
            }
            if (detectedType !== ContentElementType.NARRATIVE) break;
        }

        elements.push({
            type: detectedType,
            content: line,
            originalContent: line
        });
    }

    return elements;
};

const getElementStyle = (
    type: ContentElementType,
    displayConfig?: ContentDisplayConfig
): React.CSSProperties => {
    if (!displayConfig?.enabled) {
        return defaultElementStyles[type];
    }

    const config = displayConfig.style;
    return {
        fontSize: config.fontSize,
        fontWeight: config.fontWeight,
        fontStyle: config.fontStyle,
        color: config.color,
        backgroundColor: config.backgroundColor,
        borderLeft: config.borderLeft,
        borderRadius: config.borderRadius,
        padding: config.padding,
        margin: config.margin,
        textAlign: config.textAlign as any,
        lineHeight: config.lineHeight,
        letterSpacing: config.letterSpacing,
    };
};

export const StoryContentRenderer: React.FC<StoryContentRendererProps> = ({
    content,
    displaySettings
}) => {
    const parsedElements = useMemo(() => {
        return parseContentElements(content, displaySettings?.autoDetect ?? true);
    }, [content, displaySettings?.autoDetect]);

    const renderElement = (element: ParsedElement, index: number) => {
        const config = displaySettings?.elements[element.type];
        const style = getElementStyle(element.type, config);

        // Render markdown content
        const renderedHtml = md.render(element.content);

        return (
            <div
                key={`${element.type}-${index}-${element.originalContent.slice(0, 20)}`}
                style={style}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
        );
    };

    return (
        <div className="story-content prose prose-sm max-w-none break-words overflow-wrap-anywhere">
            {parsedElements.map((element, index) => renderElement(element, index))}
        </div>
    );
};
