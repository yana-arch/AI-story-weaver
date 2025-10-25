import type {
  ImportResult,
  ImportedChapter,
  ImportError,
  ImportMetadata,
  ImportOptions,
  ChapterPattern,
  ProcessingProgress,
  ImportedStory,
} from '../types/chapter';

export class ImportService {
  private static instance: ImportService;
  private chapterPatterns: ChapterPattern[] = [
    // TIỆNG VIỆT PATTERNS (Priority 1-5)
    {
      name: 'Vietnamese Standard Chapter',
      pattern: /^(?:Chương|Chap)\s*(\d+)[:\.\s]*(.+?)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 1,
    },
    {
      name: 'Vietnamese Part/Volume',
      pattern: /^(?:Phần|Quyển|Volume)\s*(\d+)[:\.\s]*(.+?)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 2,
    },
    {
      name: 'Vietnamese Standalone Chapter',
      pattern: /^Chương\s+(\d+)[:\.\s]*(.*?)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 3,
    },

    // TIỆNG TRUNG PATTERNS (Priority 6-10)
    {
      name: 'Chinese Standard Chapter',
      pattern: /^第(\d+)章[：:]?\s*(.*)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 6,
    },
    {
      name: 'Chinese Extended Numbers',
      pattern: /^第([一二三四五六七八九十\d]+)章[：:]?\s*(.*)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 7,
    },
    {
      name: 'Chinese Part',
      pattern: /^第[一二三四五六七八九十]+部[：:]?\s*(.*)$/im,
      titleGroup: 1,
      contentGroup: 1,
      priority: 8,
    },

    // TIỆNG ANH PATTERNS (Priority 11-15)
    {
      name: 'English Standard Chapter',
      pattern: /^(?:Chapter|Chap)\s+(\d+)[:\.\s]*(.*)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 11,
    },
    {
      name: 'English Part',
      pattern: /^(?:Part|Volume|Book)\s+(\d+)[:\.\s]*(.*)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 12,
    },

    // ORDERED PATTERNS (Priority 16-20)
    {
      name: 'Numbered Section',
      pattern: /^(\d+)\.\s+(.+)$/m,
      titleGroup: 2,
      contentGroup: 1,
      priority: 16,
    },
    {
      name: 'Roman Numerals',
      pattern: /^([IVXLCDM]+)\.\s+(.+)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 17,
    },

    // MARKDOWN PATTERNS (Priority 21-25)
    {
      name: 'Markdown H1',
      pattern: /^#\s+(.+)$/m,
      titleGroup: 1,
      contentGroup: 1,
      priority: 21,
    },
    {
      name: 'Markdown H2',
      pattern: /^##\s+(.+)$/m,
      titleGroup: 1,
      contentGroup: 1,
      priority: 22,
    },
    {
      name: 'Markdown Mixed',
      pattern: /^#{1,6}\s*(?:Chương|Chapter|Chap|第)?\s*(\d+)?[:\.\s]*(.+)$/im,
      titleGroup: 3,
      contentGroup: 1,
      priority: 23,
    },

    // KEYWORD PATTERNS (Priority 26-30)
    {
      name: 'Vietnamese Keywords',
      pattern: /^(?:Bắt\s+đầu|Hành\s+trình|Phát\s+triển|Kết\s+thúc|Cao\s+trào|Mở\s+đầu)\s+(.+)$/im,
      titleGroup: 1,
      contentGroup: 1,
      priority: 26,
    },
    {
      name: 'Chinese Keywords',
      pattern: /^(?:开端|发展|高潮|结局|开始|终结|序曲|尾声)\s*(.+)$/im,
      titleGroup: 1,
      contentGroup: 1,
      priority: 27,
    },

    // SPECIAL MARKERS (Priority 31-35)
    {
      name: 'Star Separators',
      pattern: /^\*\s*\*\s*\*\s*(.+?)\s*\*\s*\*\s*\*$/im,
      titleGroup: 1,
      contentGroup: 1,
      priority: 31,
    },
    {
      name: 'Arrow Separators',
      pattern: /^→\s*(.+?)$/im,
      titleGroup: 1,
      contentGroup: 1,
      priority: 32,
    },
    {
      name: 'Dash Separators',
      pattern: /^[-─]{3,}\s*(.+?)\s*[-─]{3,}$/im,
      titleGroup: 1,
      contentGroup: 1,
      priority: 33,
    },
    {
      name: 'Number in Brackets',
      pattern: /^\[?\s*(\d+)\s*\]?\s+(.+)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 34,
    },
  ];

  static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  async importFromFile(file: File, options: ImportOptions): Promise<ImportResult> {
    const startTime = Date.now();
    const errors: ImportError[] = [];

    try {
      let rawContent: string;
      let textEncoding = '';

      if (options.fileFormat === 'epub') {
        // For EPUB, parse directly from file buffer
        rawContent = await this.parseEpub(file);
        textEncoding = 'utf-8'; // EPUB typically uses UTF-8
      } else {
        // Read file as text for other formats
        const text = await this.readFileContent(file, options.encoding);
        rawContent = await this.parseFileContent(text, options.fileFormat);
        textEncoding = options.encoding || 'utf-8';
      }

      // Split into chapters
      const chapters = options.autoSplit
        ? await this.splitIntoChapters(rawContent, options.splitOptions)
        : [this.createSingleChapter(rawContent, file.name)];

      // Process with AI if enabled
      const processedChapters = options.aiProcessing
        ? await this.processWithAI(chapters, options.aiProcessingOptions)
        : chapters;

      // Create metadata
      const metadata: ImportMetadata = {
        totalSize: file.size,
        totalCharacters: rawContent.length,
        totalWords: rawContent.split(/\s+/).length,
        encoding: textEncoding,
        fileName: file.name,
        importDate: Date.now(),
        processingTime: Date.now() - startTime,
      };

      return {
        success: true,
        chapters: processedChapters,
        errors,
        metadata,
      };

    } catch (error) {
      errors.push({
        type: 'parse',
        message: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      return {
        success: false,
        chapters: [],
        errors,
        metadata: {
          totalSize: file.size,
          totalCharacters: 0,
          totalWords: 0,
          encoding: options.encoding || 'utf-8',
          fileName: file.name,
          importDate: Date.now(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  private async readFileContent(file: File, encoding?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };

      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };

      reader.readAsText(file, encoding);
    });
  }

  private async parseFileContent(content: string, format: string, file?: File): Promise<string> {
    switch (format) {
      case 'txt':
        return this.parsePlainText(content);
      case 'md':
        return this.parseMarkdown(content);
      case 'docx':
        return this.parseDocx(content);
      case 'epub':
        if (file) {
          return this.parseEpub(file);
        }
        return content;
      default:
        return content;
    }
  }

  private parsePlainText(content: string): string {
    // Clean up common text file artifacts
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, '    ') // Convert tabs to spaces
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .trim();
  }

  private parseMarkdown(content: string): string {
    // Basic markdown to text conversion
    return content
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') // Remove emphasis
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/>\s*/g, '') // Remove blockquotes
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .trim();
  }

  private parseDocx(content: string): string {
    // Basic DOCX text extraction (simplified)
    // In a real implementation, you'd use a library like mammoth.js
    return content
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async parseEpub(file: File): Promise<string> {
    throw new Error('EPUB parsing is not yet supported in the browser environment. Please use .txt or .md files for now.');
  }

  private async splitIntoChapters(
    content: string,
    options: ImportOptions['splitOptions']
  ): Promise<ImportedChapter[]> {
    const chapters: ImportedChapter[] = [];

    switch (options.method) {
      case 'pattern':
        return this.splitByPattern(content, options);
      case 'word_count':
        return this.splitByWordCount(content, options);
      case 'manual':
        return this.splitManually(content, options);
      case 'ai':
        return this.splitByAI(content, options);
      default:
        return [this.createSingleChapter(content, 'Full Content')];
    }
  }

  private splitByPattern(content: string, options: ImportOptions['splitOptions']): ImportedChapter[] {
    const chapters: ImportedChapter[] = [];
    const pattern = new RegExp(options.pattern || '', 'gm');
    const matches = [...content.matchAll(pattern)];

    if (matches.length === 0) {
      return [this.createSingleChapter(content, 'Chapter 1')];
    }

    let lastIndex = 0;

    matches.forEach((match, index) => {
      // Add content before this chapter
      if (match.index! > lastIndex) {
        const beforeContent = content.slice(lastIndex, match.index!).trim();
        if (beforeContent) {
          chapters.push(this.createSingleChapter(beforeContent, `Chapter ${index}`));
        }
      }

      // Extract chapter content - use default groups since ChapterSplitOptions doesn't have these
      const chapterContent = match[1] || '';
      const chapterTitle = match[2] || `Chapter ${index + 1}`;

      if (chapterContent.trim()) {
        chapters.push(this.createChapterFromContent(chapterContent, chapterTitle, index));
      }

      lastIndex = match.index! + match[0].length;
    });

    // Add remaining content
    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex).trim();
      if (remainingContent) {
        chapters.push(this.createSingleChapter(remainingContent, `Chapter ${chapters.length + 1}`));
      }
    }

    return chapters;
  }

  private splitByWordCount(content: string, options: ImportOptions['splitOptions']): ImportedChapter[] {
    const chapters: ImportedChapter[] = [];
    const words = content.split(/\s+/);
    const wordsPerChapter = options.wordCount || 2000;

    for (let i = 0; i < words.length; i += wordsPerChapter) {
      const chapterWords = words.slice(i, i + wordsPerChapter);
      const chapterContent = chapterWords.join(' ');
      const chapterTitle = options.generateTitles
        ? `Chapter ${chapters.length + 1}`
        : `Chapter ${chapters.length + 1}`;

      chapters.push(this.createChapterFromContent(chapterContent, chapterTitle, chapters.length));
    }

    return chapters;
  }

  private splitManually(content: string, options: ImportOptions['splitOptions']): ImportedChapter[] {
    // For manual splitting, return the entire content as one chapter
    // The UI will handle manual splitting
    return [this.createSingleChapter(content, 'Manual Split')];
  }

  private async splitByAI(content: string, options: ImportOptions['splitOptions']): Promise<ImportedChapter[]> {
    // This would integrate with AI service to intelligently split content
    // For now, fall back to pattern-based splitting
    return this.splitByPattern(content, options);
  }

  private createSingleChapter(content: string, title: string): ImportedChapter {
    const wordCount = content.split(/\s+/).length;
    return {
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      originalPosition: 0,
      wordCount,
      characterCount: content.length,
      estimatedReadingTime: Math.ceil(wordCount / 200),
    };
  }

  private createChapterFromContent(content: string, title: string, position: number): ImportedChapter {
    const wordCount = content.split(/\s+/).length;
    return {
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      content: content.trim(),
      originalPosition: position,
      wordCount,
      characterCount: content.length,
      estimatedReadingTime: Math.ceil(wordCount / 200),
    };
  }

  private async processWithAI(
    chapters: ImportedChapter[],
    options: ImportOptions['aiProcessingOptions']
  ): Promise<ImportedChapter[]> {
    // This would integrate with AI services for content processing
    // For now, return chapters as-is
    return chapters;
  }

  getChapterPatterns(): ChapterPattern[] {
    return [...this.chapterPatterns];
  }

  addChapterPattern(pattern: ChapterPattern): void {
    this.chapterPatterns.push(pattern);
    // Sort by priority
    this.chapterPatterns.sort((a, b) => b.priority - a.priority);
  }

  detectEncoding(sample: string): string {
    // Simple encoding detection based on BOM and common patterns
    if (sample.startsWith('\uFEFF')) return 'utf-8-bom';
    if (sample.startsWith('\uFFFE')) return 'utf-16be';
    if (sample.startsWith('\uFFFE')) return 'utf-16le';

    // Check for common Vietnamese characters to detect UTF-8
    if (/[\u00C0-\u1EF9]/.test(sample)) return 'utf-8';

    return 'utf-8'; // Default fallback
  }

  estimateProcessingTime(fileSize: number, options: ImportOptions): number {
    // Rough estimation based on file size and processing options
    let baseTime = fileSize / 1024 / 100; // Base time in seconds

    if (options.autoSplit) baseTime *= 1.5;
    if (options.aiProcessing) baseTime *= 3;

    return Math.min(baseTime, 300); // Cap at 5 minutes
  }

  async importStoriesFromFiles(files: File[], options: ImportOptions): Promise<{
    success: boolean;
    stories: ImportedStory[];
    errors: ImportError[];
    summary: { totalFiles: number; successfulFiles: number; totalProcessingTime: number };
  }> {
    const startTime = Date.now();
    const stories: ImportedStory[] = [];
    const errors: ImportError[] = [];

    const filePromises = files.map(async (file) => {
      try {
        const result = await this.importFromFile(file, options);
        if (result.success && result.chapters.length > 0) {
          const story: ImportedStory = {
            id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: this.extractStoryTitle(file.name, result.chapters[0].content),
            chapters: result.chapters,
            metadata: result.metadata,
            originalFile: file.name,
          };
          return { success: true, story };
        } else {
          return {
            success: false,
            error: new Error(`Failed to import ${file.name}: ${result.errors.map(e => e.message).join('; ')}`)
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(`Unknown error importing ${file.name}`)
        };
      }
    });

    const results = await Promise.all(filePromises);

    results.forEach(result => {
      if (result.success) {
        stories.push(result.story);
      } else {
        errors.push({
          type: 'parse',
          message: result.error.message,
        });
      }
    });

    return {
      success: stories.length > 0,
      stories,
      errors,
      summary: {
        totalFiles: files.length,
        successfulFiles: stories.length,
        totalProcessingTime: Date.now() - startTime,
      },
    };
  }

  private extractStoryTitle(fileName: string, firstChapterContent: string): string {
    // Try to extract title from the first few lines of content
    const lines = firstChapterContent.split('\n').filter(line => line.trim());
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100 && !trimmed.includes('\n')) {
        // Use this as title if it looks reasonable
        return trimmed;
      }
    }

    // Fallback to filename without extension
    return fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/-/g, ' ');
  }
}

export default ImportService.getInstance();
