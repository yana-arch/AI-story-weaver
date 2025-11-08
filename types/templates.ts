export enum TemplateCategory {
  FICTION = 'Tiểu thuyết',
  NON_FICTION = 'Phi hư cấu',
  STORY_STRUCTURE = 'Cấu trúc truyện',
  CHARACTER = 'Nhân vật',
  PLOT = 'Nội dung',
  WORLD_BUILDING = 'Xây dựng thế giới',
  PINNACLE = 'Đỉnh cao',
  ANTHOLOGY = 'Tuyển tập',
}

export enum TemplateType {
  STORY_TEMPLATE = 'story_template',
  PROMPT_TEMPLATE = 'prompt_template',
  SCENE_TEMPLATE = 'scene_template',
  CHARACTER_TEMPLATE = 'character_template',
}

export type TemplateVariableType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'character_reference'
  | 'story_context'
  | 'computed'
  | 'conditional';

export interface TemplateVariable {
  name: string; // e.g., "character_name", "setting"
  displayName: string; // e.g., "Tên nhân vật", "Bối cảnh"
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  required: boolean;
  type: TemplateVariableType;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: string[]; // for select type
  // Advanced features
  source?: 'character_profile' | 'story_context' | 'generation_config' | 'user_input';
  fallbackExpression?: string; // Expression to compute fallback value
  validation?: {
    pattern?: string;
    customValidator?: string; // JavaScript function as string
  };
  dependsOn?: string[]; // Names of variables this depends on
  visibilityCondition?: string; // Expression to control visibility
}

export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: TemplateType;
  tags: string[];
  author?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  preview?: string; // Short preview text
}

export interface StoryTemplate extends BaseTemplate {
  type: TemplateType.STORY_TEMPLATE;
  structure: {
    scenes: SceneTemplate[];
    characterCount: number;
    plotPoints: string[];
  };
  genre: string[]; // e.g., ['romance', 'fantasy']
  targetLength: 'short' | 'medium' | 'long' | 'epic';
  language: string;
}

export interface PromptTemplate extends BaseTemplate {
  type: TemplateType.PROMPT_TEMPLATE;
  content: string;
  variables: TemplateVariable[];
  systemPrompt?: string;
  model?: string; // Preferred AI model
  temperature?: number;
  maxTokens?: number;
  expectedOutput:
    | 'story_continuation'
    | 'character_description'
    | 'plot_outline'
    | 'scene_description';
  // Composition and inheritance
  parentTemplateId?: string; // For inheritance
  subTemplates?: TemplateComposition[]; // For composition
  preProcessing?: string[]; // JavaScript functions to run before using template
  postProcessing?: string[]; // JavaScript functions to run after generation

  // Advanced features
  constraints?: TemplateConstraint[];
  compatibility?: TemplateCompatibility;
  contextRequirements?: string[]; // Required context elements
}

export interface TemplateComposition {
  templateId: string;
  insertionPoint: string; // Where to insert in parent template: 'before', 'after', 'replace:variable_name'
  variables?: Record<string, string>; // Specific values for this sub-template
  condition?: string; // When to apply this composition
}

export interface TemplateConstraint {
  type:
    | 'min_characters'
    | 'max_characters'
    | 'required_keywords'
    | 'forbidden_keywords'
    | 'format'
    | 'custom';
  value: any;
  message: string;
}

export interface TemplateCompatibility {
  storyTypes: string[]; // E.g., ['romance', 'fantasy']
  generationModes: string[]; // E.g., ['continue', 'rewrite']
  outputFormats: string[]; // E.g., ['story', 'character', 'scene']
}

export interface SceneTemplate extends BaseTemplate {
  type: TemplateType.SCENE_TEMPLATE;
  content: string;
  variables: TemplateVariable[];
  sceneType:
    | 'opening'
    | 'rising_action'
    | 'climax'
    | 'falling_action'
    | 'resolution'
    | 'flashback'
    | 'dream';
  mood: string[]; // e.g., ['tense', 'romantic', 'mysterious']
  pacing: 'slow' | 'medium' | 'fast';
}

export interface CharacterTemplate extends BaseTemplate {
  type: TemplateType.CHARACTER_TEMPLATE;
  profile: {
    appearance: string;
    personality: string;
    background: string;
    goals: string;
    flaws: string;
    relationships: Array<{
      type: string; // e.g., 'family', 'friend', 'enemy'
      description: string;
    }>;
  };
  archetype: string; // e.g., 'hero', 'mentor', 'villain'
  traits: string[];
  development: string[];
}

export type Template = StoryTemplate | PromptTemplate | SceneTemplate | CharacterTemplate;

// Template collections and user data
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  templates: Template[];
  author: string;
  isPublic: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserTemplateData {
  customTemplates: Template[];
  favoriteTemplates: string[]; // template IDs
  collections: TemplateCollection[];
  recentUsed: Array<{
    templateId: string;
    usedAt: number;
    rating?: number;
  }>;
  preferences: {
    defaultLanguage: string;
    favoriteCategories: TemplateCategory[];
    autoSaveVariations: boolean;
  };
  // Analytics và intelligence
  usageAnalytics: Record<string, TemplateUsageAnalytics>;
  intelligence: TemplateIntelligence;
  abTests: ABLTest[];
  templateRecommendations: TemplateRecommendation[];
}

// Template application and generation
export interface TemplateApplication {
  templateId: string;
  variables: Record<string, string>;
  result: string;
  metadata: {
    appliedAt: number;
    modelUsed?: string;
    tokensUsed?: number;
    generationTime: number;
  };
}

export interface TemplateUsageAnalytics {
  templateId: string;
  usageStats: {
    totalUsage: number;
    successfulGenerations: number;
    averageGenerationTime: number;
    averageTokenCount: number;
    popularVariables: Record<string, number>;
    commonContexts: string[];
  };
  qualityMetrics: {
    averageRating: number;
    userFeedback: Array<{
      rating: number;
      comment?: string;
      date: number;
      context: 'story_quality' | 'technical' | 'usability';
    }>;
    coherence: number; // 0-1 scale based on user feedback
    creativity: number;
    consistency: number;
  };
  performanceHistory: Array<TemplatePerformancePoint>;
}

export interface TemplatePerformancePoint {
  date: number;
  usageCount: number;
  successRate: number;
  averageRating: number;
  contextFeatures: string[]; // What context was used
}

export interface TemplateRecommendation {
  templateId: string;
  confidence: number; // 0-1 how confident the system is in this recommendation
  reasoning: string; // Why this template is recommended
  contextMatch: Record<string, number>; // How well it matches different aspects
}

export interface TemplateIntelligence {
  templateSimilarities: Record<string, TemplateSimilarity[]>;
  userTemplates: TemplateLearning[]; // What users have learned about templates usage
  contextTemplates: Record<string, TemplateContextMapping>; // Context patterns to templates
}

export interface TemplateSimilarity {
  similarTemplateId: string;
  similarity: number; // Cosine similarity or other metric
  sharedFeatures: string[]; // What features they share
}

export interface TemplateLearning {
  templateId: string;
  learnedPatterns: {
    preferredContexts: string[];
    commonAdjustments: Record<string, string>;
    successCorrelations: string[];
  };
}

export interface TemplateContextMapping {
  contextPattern: string;
  templateId: string;
  successRate: number;
  usageCount: number;
}

export interface ABLTest {
  id: string;
  name: string;
  templateIdA: string;
  templateIdB: string;
  context: string;
  variableVariant: Record<string, string>; // Same variables, different values
  results: ABLResult[];
  status: 'running' | 'completed' | 'cancelled';
  startDate: number;
  endDate?: number;
}

export interface ABLResult {
  testId: string;
  userId?: string; // Anonymous if not logged in
  winner: 'A' | 'B' | 'tie';
  justification?: string;
  contextUsed: string;
  preference: 'quality' | 'style' | 'speed';
}

export interface TemplateSearchOptions {
  query?: string;
  category?: TemplateCategory;
  type?: TemplateType;
  tags?: string[];
  author?: string;
  sortBy?: 'name' | 'rating' | 'usage' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TemplateStats {
  totalTemplates: number;
  templatesByCategory: Record<TemplateCategory, number>;
  templatesByType: Record<TemplateType, number>;
  topRatedTemplates: Array<{ id: string; name: string; rating: number }>;
  mostUsedTemplates: Array<{ id: string; name: string; usageCount: number }>;
  recentTemplates: Template[];
}
