import type {
  ImportResult,
  ImportedChapter,
  ImportError,
  ImportMetadata,
  ImportOptions,
  ChapterPattern,
  ProcessingProgress,
} from '../types/chapter';

export class ImportService {
  private static instance: ImportService;
  private chapterPatterns: ChapterPattern[] = [
    {
      name: 'Standard Chapter',
      pattern: /^(?:Chương|Chapter|第)\s*(\d+)[:\s]*(.+?)$/im,
      titleGroup: 2,
      contentGroup: 1,
      priority: 1,
    },
    {
      name: 'Vietnamese Chapter',
      pattern: /^(?:Chương|Chap)\s*(\d+)[:\s]*\n([\s\S]*?)(?=(?:Chương|Chap)\s*\d+|$)/i,
      titleGroup: 1,
      contentGroup: 2,
      priority: 2,
    },
    {
      name: 'Numbered Section',
      pattern: /^(\d+)[\.\s]+(.+?)$/m,
      titleGroup: 2,
      contentGroup: 1,
      priority: 3,
    },
    {
      name: 'Header Pattern',
      pattern: /^(#{1,6})\s*(.+?)$/m,
      titleGroup: 2,
      contentGroup: 1,
      priority: 4,
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
      // Read file content
      const text = await this.readFileContent(file, options.encoding);

      // Parse content based on file format
      const rawContent = await this.parseFileContent(text, options.fileFormat);

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
        totalCharacters: text.length,
        totalWords: text.split(/\s+/).length,
        encoding: options.encoding || 'utf-8',
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

  private async parseFileContent(content: string, format: string): Promise<string> {
    switch (format) {
      case 'txt':
        return this.parsePlainText(content);
      case 'md':
        return this.parseMarkdown(content);
      case 'docx':
        return this.parseDocx(content);
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
}

export default ImportService.getInstance();
