// Base Story Segment Interface
export interface StorySegment {
  id: string;
  type: 'user' | 'ai' | 'chapter';
  content: string;
  config?: any;
  displaySettings?: any;
}

// Chapter Status
export enum ChapterStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PUBLISHED = 'published',
}

// Chapter Type
export enum ChapterType {
  MAIN = 'main',
  SUB = 'sub',
  EPILOGUE = 'epilogue',
  PROLOGUE = 'prologue',
  INTERLUDE = 'interlude',
}

// Chapter Metadata
export interface ChapterMetadata {
  tags: string[];
  estimatedReadingTime: number; // in minutes
  wordCount: number;
  characterCount: number;
  lastModifiedAt: number;
  createdAt: number;
  status: ChapterStatus;
  type: ChapterType;
  description: string;
  notes: string;
}

// Chapter Analytics
export interface ChapterAnalytics {
  wordsAdded: number;
  wordsEdited: number;
  writingTime: number; // in milliseconds
  revisionsCount: number;
  readerEngagement: number; // score from 0-100
  popularityScore: number; // score from 0-100
}

// Chapter Hierarchy
export interface ChapterHierarchy {
  id: string;
  parentId?: string;
  children: string[];
  level: number;
}

// Chapter Dependency
export interface ChapterDependency {
  id: string;
  sourceChapterId: string;
  targetChapterId: string;
  type: 'requires' | 'references' | 'conflicts';
  description: string;
}

// Chapter Template Structure
export interface ChapterTemplateStructure {
  sections: string[];
  suggestedWordCount: number;
  keyElements: string[];
}

// Chapter Template
export interface ChapterTemplate {
  id: string;
  name: string;
  description: string;
  genre: string[];
  structure: ChapterTemplateStructure;
  defaultContent?: string;
}

// Enhanced Story Segment with Chapter Data
export interface ChapterData {
  hierarchy: ChapterHierarchy;
  metadata: ChapterMetadata;
  analytics: ChapterAnalytics;
  dependencies: ChapterDependency[];
}

export interface EnhancedStorySegment extends StorySegment {
  chapterData?: ChapterData;
}

// Chapter Operation (for undo/redo)
export interface ChapterOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  timestamp: number;
  data: any; // Operation-specific data
  affectedChapters: string[];
}

// Chapter Suggestions (from AI)
export interface ChapterSuggestion {
  title: string;
  description: string;
  content: string;
  position: number;
  suggestedBy: string; // AI model name
  confidence: number; // 0-100
  reasons: string[];
}

// Chapter Insights
export interface ChapterInsight {
  chapterId: string;
  type: 'consistency' | 'pacing' | 'character_development' | 'plot_hole' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
  position?: {
    start: number;
    end: number;
  };
}

// Chapter Progress Tracking
export interface ChapterProgress {
  chapterId: string;
  readingProgress: number; // 0-100
  lastReadPosition: number;
  bookmarks: number[];
  notes: string;
  completedAt?: number;
}

// Advanced Chapter Operations
export interface ChapterMergeOptions {
  keepMetadata: boolean;
  combineAnalytics: boolean;
  separator: string;
}

export interface ChapterSplitOptions {
  splitBy: 'paragraph' | 'scene' | 'word_count';
  maxWordCount?: number;
  preserveMetadata: boolean;
}

// Chapter Statistics
export interface ChapterStats {
  totalChapters: number;
  completedChapters: number;
  totalWords: number;
  averageChapterLength: number;
  estimatedTotalReadingTime: number;
  mostProlificDay?: number;
  writingStreak: number;
}

// Chapter Management Settings
export interface ChapterSettings {
  autoSaveInterval: number; // in milliseconds
  defaultStatus: ChapterStatus;
  showChapterNumbers: boolean;
  chapterNumberFormat: string;
  enableDependencies: boolean;
  enableAnalytics: boolean;
  maxChapterDepth: number;
}

// Import Related Types
export interface ImportResult {
  success: boolean;
  chapters: ImportedChapter[];
  errors: ImportError[];
  metadata: ImportMetadata;
}

export interface ImportedChapter {
  id: string;
  title: string;
  content: string;
  originalPosition: number;
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number;
  metadata?: ChapterMetadata;
}

export interface ImportError {
  type: 'parse' | 'encoding' | 'format' | 'size' | 'content';
  message: string;
  position?: number;
  line?: number;
}

export interface ImportMetadata {
  totalSize: number;
  totalCharacters: number;
  totalWords: number;
  encoding: string;
  fileName: string;
  importDate: number;
  processingTime: number;
}

export interface ImportedStory {
  id: string;
  title: string;
  chapters: ImportedChapter[];
  metadata: ImportMetadata;
  originalFile: string;
}

export interface ImportSplitOptions {
  method: 'pattern' | 'word_count' | 'manual' | 'ai';
  pattern?: string;
  wordCount?: number;
  minChapterSize?: number;
  maxChapterSize?: number;
  preserveTitles: boolean;
  generateTitles: boolean;
}

export interface ImportOptions {
  fileFormat: 'txt' | 'md' | 'docx' | 'epub';
  encoding?: string;
  autoSplit: boolean;
  splitOptions: ImportSplitOptions;
  aiProcessing: boolean;
  aiProcessingOptions: AIProcessingOptions;
  preserveFormatting: boolean;
  createHierarchy: boolean;
}

export interface ChapterSplitOptions {
  method: 'pattern' | 'word_count' | 'manual' | 'ai';
  pattern?: string;
  wordCount?: number;
  minChapterSize?: number;
  maxChapterSize?: number;
  preserveTitles: boolean;
  generateTitles: boolean;
}

export interface ChapterPattern {
  name: string;
  pattern: RegExp;
  titleGroup?: number;
  contentGroup?: number;
  priority: number;
}

export interface AIProcessingOptions {
  enableContentModeration: boolean;
  enableContentEnhancement: boolean;
  enableTranslation: boolean;
  targetLanguage?: string;
  contentFilters: ContentFilter[];
  enhancementLevel: 'light' | 'moderate' | 'heavy';
  preserveStyle: boolean;
}

export interface ContentFilter {
  type: 'violence' | 'explicit' | 'profanity' | 'sensitive' | 'custom';
  action: 'remove' | 'replace' | 'flag' | 'rewrite';
  severity: 'low' | 'medium' | 'high';
  customPattern?: string;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'parsing' | 'splitting' | 'ai_processing' | 'saving';
  progress: number; // 0-100
  message: string;
  currentItem?: string;
  estimatedTimeRemaining?: number;
}
