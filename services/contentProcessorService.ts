import type {
  ImportedChapter,
  AIProcessingOptions,
  ContentFilter,
} from '../types/chapter';

export class ContentProcessorService {
  private static instance: ContentProcessorService;

  static getInstance(): ContentProcessorService {
    if (!ContentProcessorService.instance) {
      ContentProcessorService.instance = new ContentProcessorService();
    }
    return ContentProcessorService.instance;
  }

  async processContent(
    chapters: ImportedChapter[],
    options: AIProcessingOptions
  ): Promise<ImportedChapter[]> {
    let processedChapters = [...chapters];

    // Apply content moderation
    if (options.enableContentModeration) {
      processedChapters = await this.applyContentModeration(processedChapters, options.contentFilters);
    }

    // Apply content enhancement
    if (options.enableContentEnhancement) {
      processedChapters = await this.applyContentEnhancement(processedChapters, options);
    }

    // Apply translation
    if (options.enableTranslation && options.targetLanguage) {
      processedChapters = await this.applyTranslation(processedChapters, options.targetLanguage);
    }

    return processedChapters;
  }

  private async applyContentModeration(
    chapters: ImportedChapter[],
    filters: ContentFilter[]
  ): Promise<ImportedChapter[]> {
    const processedChapters: ImportedChapter[] = [];

    for (const chapter of chapters) {
      let processedContent = chapter.content;
      const flaggedSections: string[] = [];

      // Apply each filter
      for (const filter of filters) {
        switch (filter.type) {
          case 'violence':
            processedContent = this.filterViolence(processedContent, filter);
            break;
          case 'explicit':
            processedContent = this.filterExplicitContent(processedContent, filter);
            break;
          case 'profanity':
            processedContent = this.filterProfanity(processedContent, filter);
            break;
          case 'sensitive':
            processedContent = this.filterSensitiveContent(processedContent, filter);
            break;
          case 'custom':
            if (filter.customPattern) {
              processedContent = this.filterCustomPattern(processedContent, filter);
            }
            break;
        }
      }

      processedChapters.push({
        ...chapter,
        content: processedContent,
      });
    }

    return processedChapters;
  }

  private filterViolence(content: string, filter: ContentFilter): string {
    // Common violence patterns in Vietnamese and Chinese content
    const violencePatterns = [
      /giết\s+chết/gi,
      /đâm\s+chết/gi,
      /bắn\s+chết/gi,
      /đánh\s+chết/gi,
      /hành\s+hạ/gi,
      /tra\s+tấn/gi,
      /máu\s+me/gi,
      /thây\s+ma/gi,
      /xác\s+chết/gi,
      /thủ\s+tiêu/gi,
      /暗杀/g,
      /杀戮/g,
      /暴力/g,
      /死亡/g,
      /流血/g,
    ];

    let processedContent = content;

    switch (filter.action) {
      case 'remove':
        violencePatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Nội dung đã được loại bỏ]');
        });
        break;
      case 'replace':
        violencePatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Nội dung được chỉnh sửa]');
        });
        break;
      case 'flag':
        // For flagging, we would mark sections but keep content
        // This would be handled in the UI
        break;
      case 'rewrite':
        // This would require AI integration
        processedContent = this.rewriteContent(processedContent, 'violence', filter.severity);
        break;
    }

    return processedContent;
  }

  private filterExplicitContent(content: string, filter: ContentFilter): string {
    // Common explicit content patterns
    const explicitPatterns = [
      /làm\s+chuyện\s+ấy/gi,
      /quan\s+hệ/gi,
      /yêu\s+đương/gi,
      /thân\s+mật/gi,
      /chăn\s+gối/gi,
      /hôn\s+nhau/gi,
      /ôm\s+nhau/gi,
      /chạm\s+nhau/gi,
      /nụ\s+hôn/gi,
      /cơ\s+thể/gi,
      /da\s+thịt/gi,
      /môi\s+trường/gi,
      /tình\s+dục/gi,
      /性爱/g,
      /亲密/g,
      /身体/g,
      /亲吻/g,
    ];

    let processedContent = content;

    switch (filter.action) {
      case 'remove':
        explicitPatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Nội dung 18+ đã được loại bỏ]');
        });
        break;
      case 'replace':
        explicitPatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Nội dung người lớn]');
        });
        break;
      case 'flag':
        // Mark for review
        break;
      case 'rewrite':
        processedContent = this.rewriteContent(processedContent, 'explicit', filter.severity);
        break;
    }

    return processedContent;
  }

  private filterProfanity(content: string, filter: ContentFilter): string {
    // Common profanity patterns
    const profanityPatterns = [
      /địt/gi,
      /đụ/gi,
      /chết/gi,
      /khốn/gi,
      /đồ/gi,
      /mẹ\s+kiếp/gi,
      /con\s+đĩ/gi,
      /đĩ\s+thõa/gi,
      /操/g,
      /他妈的/g,
      /贱人/g,
      /混蛋/g,
    ];

    let processedContent = content;

    switch (filter.action) {
      case 'remove':
        profanityPatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[***]');
        });
        break;
      case 'replace':
        profanityPatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Từ thô tục]');
        });
        break;
      case 'flag':
        // Mark for review
        break;
      case 'rewrite':
        processedContent = this.rewriteContent(processedContent, 'profanity', filter.severity);
        break;
    }

    return processedContent;
  }

  private filterSensitiveContent(content: string, filter: ContentFilter): string {
    // Sensitive topics like politics, religion, etc.
    const sensitivePatterns = [
      /chính\s+trị/gi,
      /tôn\s+giáo/gi,
      /dân\s+tộc/gi,
      /phân\s+biệt/gi,
      /政治/g,
      /宗教/g,
      /民族/g,
      /歧视/g,
    ];

    let processedContent = content;

    switch (filter.action) {
      case 'remove':
        sensitivePatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Nội dung nhạy cảm đã được loại bỏ]');
        });
        break;
      case 'replace':
        sensitivePatterns.forEach(pattern => {
          processedContent = processedContent.replace(pattern, '[Nội dung nhạy cảm]');
        });
        break;
      case 'flag':
        // Mark for review
        break;
      case 'rewrite':
        processedContent = this.rewriteContent(processedContent, 'sensitive', filter.severity);
        break;
    }

    return processedContent;
  }

  private filterCustomPattern(content: string, filter: ContentFilter): string {
    if (!filter.customPattern) return content;

    try {
      const pattern = new RegExp(filter.customPattern, 'gi');
      let processedContent = content;

      switch (filter.action) {
        case 'remove':
          processedContent = processedContent.replace(pattern, '[Nội dung tùy chỉnh đã được loại bỏ]');
          break;
        case 'replace':
          processedContent = processedContent.replace(pattern, '[Nội dung tùy chỉnh]');
          break;
        case 'flag':
          // Mark for review
          break;
        case 'rewrite':
          processedContent = this.rewriteContent(processedContent, 'custom', filter.severity);
          break;
      }

      return processedContent;
    } catch (error) {
      console.error('Invalid custom pattern:', error);
      return content;
    }
  }

  private rewriteContent(content: string, type: string, severity: string): string {
    // This would integrate with AI services for intelligent rewriting
    // For now, provide basic rewriting based on severity

    switch (severity) {
      case 'low':
        // Light modifications
        return content;
      case 'medium':
        // Moderate changes
        return content;
      case 'high':
        // Heavy modifications
        return content;
      default:
        return content;
    }
  }

  private async applyContentEnhancement(
    chapters: ImportedChapter[],
    options: AIProcessingOptions
  ): Promise<ImportedChapter[]> {
    // This would integrate with AI services for content enhancement
    // For now, return chapters as-is
    return chapters;
  }

  private async applyTranslation(
    chapters: ImportedChapter[],
    targetLanguage: string
  ): Promise<ImportedChapter[]> {
    // This would integrate with AI services for translation
    // For now, return chapters as-is
    return chapters;
  }

  // Utility methods for content analysis
  analyzeContent(content: string): {
    hasViolence: boolean;
    hasExplicitContent: boolean;
    hasProfanity: boolean;
    hasSensitiveContent: boolean;
    wordCount: number;
    characterCount: number;
  } {
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;

    return {
      hasViolence: /giết|đâm|bắn|đánh\s+chết|hành\s+hạ|tra\s+tấn|暗杀|杀戮|暴力|死亡|流血/.test(content),
      hasExplicitContent: /làm\s+chuyện\s+ấy|quan\s+hệ|yêu\s+đương|thân\s+mật|chăn\s+gối|性爱|亲密|身体|亲吻/.test(content),
      hasProfanity: /địt|đụ|chết|khốn|đồ|con\s+đĩ|操|他妈的|贱人|混蛋/.test(content),
      hasSensitiveContent: /chính\s+trị|tôn\s+giáo|dân\s+tộc|phân\s+biệt|政治|宗教|民族|歧视/.test(content),
      wordCount,
      characterCount,
    };
  }

  // Batch processing for large files
  async processBatch(
    chapters: ImportedChapter[],
    options: AIProcessingOptions,
    batchSize: number = 10
  ): Promise<ImportedChapter[]> {
    const results: ImportedChapter[] = [];

    for (let i = 0; i < chapters.length; i += batchSize) {
      const batch = chapters.slice(i, i + batchSize);
      const processedBatch = await this.processContent(batch, options);
      results.push(...processedBatch);

      // Small delay to prevent overwhelming the AI service
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

export default ContentProcessorService.getInstance();
