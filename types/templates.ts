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

export interface TemplateVariable {
  name: string; // e.g., "character_name", "setting"
  displayName: string; // e.g., "Tên nhân vật", "Bối cảnh"
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  required: boolean;
  type: 'text' | 'textarea' | 'number' | 'select';
  min?: number;
  max?: number;
  maxLength?: number;
  options?: string[]; // for select type
}
// @deprecated - placeholder, min, maxLength removed to match type definition

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
  expectedOutput: 'story_continuation' | 'character_description' | 'plot_outline' | 'scene_description';
}

export interface SceneTemplate extends BaseTemplate {
  type: TemplateType.SCENE_TEMPLATE;
  content: string;
  variables: TemplateVariable[];
  sceneType: 'opening' | 'rising_action' | 'climax' | 'falling_action' | 'resolution' | 'flashback' | 'dream';
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
