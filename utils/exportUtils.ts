import { Story, StorySegment } from '../types';

export interface ExportOptions {
  format: 'pdf' | 'txt' | 'json' | 'html' | 'markdown';
  includeMetadata?: boolean;
  includeCharacterProfiles?: boolean;
  includeGenerationSettings?: boolean;
  customTitle?: string;
  customAuthor?: string;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  url: string;
}

// Convert story segments to plain text
function storySegmentsToText(
  segments: StorySegment[],
  options: ExportOptions = { format: 'txt' }
): string {
  const { customTitle } = options;

  let content = '';

  if (customTitle) {
    content += `${customTitle}\n`;
    content += '='.repeat(customTitle.length) + '\n\n';
  }

  segments.forEach((segment) => {
    if (segment.type === 'chapter') {
      content += `\n${segment.content}\n`;
      content += '='.repeat(segment.content.length) + '\n\n';
    } else {
      content += `${segment.content}\n\n`;
    }
  });

  return content.trim();
}

// Convert to Markdown format
function storySegmentsToMarkdown(
  segments: StorySegment[],
  options: ExportOptions = { format: 'markdown' }
): string {
  const { customTitle, customAuthor } = options;

  let content = '';

  if (customTitle) {
    content += `# ${customTitle}\n\n`;
  }

  if (customAuthor) {
    content += `*By ${customAuthor}*\n\n`;
  }

  segments.forEach((segment) => {
    if (segment.type === 'chapter') {
      content += `# ${segment.content}\n\n`;
    } else {
      // Basic markdown formatting - paragraphs, some cleanup
      const formattedContent = segment.content
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Normalize paragraph breaks
        .replace(/^\s*"([^"]*)"/gm, '> "$1"') // Format dialogue as blockquotes
        .replace(/\n\n/g, '\n\n'); // Preserve paragraphs

      content += `${formattedContent}\n\n`;
    }
  });

  return content.trim();
}

// Convert to HTML format
function storySegmentsToHTML(
  segments: StorySegment[],
  options: ExportOptions = { format: 'html' }
): string {
  const { customTitle, customAuthor } = options;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${customTitle || 'Story'}</title>
    <style>
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 1rem;
        }
        h2 {
            font-size: 1.5em;
            margin-top: 2em;
            margin-bottom: 1em;
            page-break-before: always;
        }
        .chapter-break {
            text-align: center;
            margin: 3rem 0;
            color: #666;
        }
        .story-content {
            margin-bottom: 1.5em;
        }
        .user-input {
            background-color: #f8f9fa;
            padding: 1rem;
            border-left: 4px solid #007bff;
            margin: 1rem 0;
        }
        .ai-output {
            margin: 1rem 0;
        }
        @media print {
            body { margin: 0; }
            .chapter-break { page-break-before: always; }
        }
    </style>
</head>
<body>`;

  if (customTitle) {
    html += `    <h1>${customTitle}</h1>`;
  }

  if (customAuthor) {
    html += `    <p style="text-align: center; font-style: italic;">By ${customAuthor}</p>`;
  }

  segments.forEach((segment) => {
    if (segment.type === 'chapter') {
      html += `    <h2 class="chapter-break">${segment.content}</h2>`;
    } else if (segment.type === 'user') {
      html += `    <div class="user-input story-content">${segment.content.replace(/\n/g, '<br>')}</div>`;
    } else {
      html += `    <div class="ai-output story-content">${segment.content.replace(/\n/g, '<br>')}</div>`;
    }
  });

  html += `</body></html>`;
  return html;
}

// Enhanced text export with metadata
function storySegmentsToEnhancedText(
  segments: StorySegment[],
  story: Story,
  options: ExportOptions = { format: 'txt' }
): string {
  const { includeMetadata, includeCharacterProfiles, includeGenerationSettings } = options;

  let content = '';

  if (includeMetadata) {
    content += `Title: ${story.name}\n`;
    content += `Created: ${new Date(story.createdAt).toLocaleDateString()}\n`;
    content += `Last Updated: ${new Date(story.updatedAt).toLocaleDateString()}\n`;
    content += `Total Segments: ${segments.length}\n\n`;
    content += '='.repeat(50) + '\n\n';
  }

  content += storySegmentsToText(segments, options);

  if (includeCharacterProfiles && story.characterProfiles.length > 0) {
    content += '\n\n' + '='.repeat(30) + ' CHARACTERS ' + '='.repeat(30) + '\n\n';

    story.characterProfiles.forEach((profile) => {
      content += `**${profile.name}**\n`;
      if (profile.appearance) content += `Appearance: ${profile.appearance}\n`;
      if (profile.personality) content += `Personality: ${profile.personality}\n`;
      if (profile.background) content += `Background: ${profile.background}\n`;
      if (profile.goals) content += `Goals: ${profile.goals}\n`;
      if (profile.relationships) content += `Relationships: ${profile.relationships}\n`;
      if (profile.flaws) content += `Flaws: ${profile.flaws}\n`;
      content += '\n';
    });
  }

  if (includeGenerationSettings) {
    content += '\n\n' + '='.repeat(30) + ' SETTINGS ' + '='.repeat(30) + '\n\n';
    content += `Scenario: ${story.generationConfig.scenario}\n`;
    content += `Character Dynamics: ${story.generationConfig.dynamics}\n`;
    content += `Pacing: ${story.generationConfig.pacing}\n`;
    content += `Narrative Structure: ${story.generationConfig.narrativeStructure}\n`;

    if (story.generationConfig.focusKeywords) {
      content += `Focus Keywords: ${story.generationConfig.focusKeywords}\n`;
    }
    if (story.generationConfig.avoidKeywords) {
      content += `Avoid Keywords: ${story.generationConfig.avoidKeywords}\n`;
    }
  }

  return content;
}

// Main export function
export async function exportStory(
  story: Story,
  segments: StorySegment[],
  options: ExportOptions
): Promise<ExportResult> {
  const { format } = options;
  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'txt':
      content = storySegmentsToText(segments, options);
      mimeType = 'text/plain';
      extension = 'txt';
      break;

    case 'markdown':
      content = storySegmentsToMarkdown(segments, options);
      mimeType = 'text/markdown';
      extension = 'md';
      break;

    case 'html':
      content = storySegmentsToHTML(segments, options);
      mimeType = 'text/html';
      extension = 'html';
      break;

    case 'json':
      content = JSON.stringify(
        {
          story: {
            ...story,
            storySegments: segments,
          },
          exportOptions: options,
          exportDate: new Date().toISOString(),
        },
        null,
        2
      );
      mimeType = 'application/json';
      extension = 'json';
      break;

    default:
      content = storySegmentsToEnhancedText(segments, story, options);
      mimeType = 'text/plain';
      extension = 'txt';
  }

  const blob = new Blob([content], { type: mimeType });
  const filename = `${story.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${extension}`;
  const url = URL.createObjectURL(blob);

  return {
    blob,
    filename,
    url,
  };
}

// Download helper function
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
