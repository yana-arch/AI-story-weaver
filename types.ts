export enum Scenario {
  FIRST_TIME = 'Lần đầu',
  ENEMIES_TO_LOVERS = 'Từ ghét thành yêu',
  FRIENDS_TO_LOVERS = 'Bạn bè thân thiết',
  RECONCILIATION = 'Gương vỡ lại lành',
  BOLD_EXPLORATORY = 'Bạo dạn & Khám phá',
}

export enum CharacterDynamics {
  A_LEADS = 'Nhân vật A chủ động, B bị động/ngượng ngùng',
  BOTH_LEAD = 'Cả hai cùng chủ động và mãnh liệt',
  FOCUS_ON_A = 'Tập trung vào nội tâm và cảm xúc của nhân vật A',
  FOCUS_ON_B = 'Tập trung vào nội tâm và cảm xúc của nhân vật B',
}

export enum Pacing {
  SLOW = 'Chậm: Tập trung xây dựng không khí, miêu tả chi tiết.',
  MEDIUM = 'Trung bình: Cân bằng giữa hành động và cảm xúc.',
  FAST = 'Nhanh: Đi thẳng vào hành động chính, tạo cảm giác dồn dập.',
}

export enum NarrativeStructure {
  FREEFORM = 'Tự do (Không có cấu trúc)',
  THREE_ACT = 'Cấu trúc 3 hồi',
  HEROS_JOURNEY = 'Hành trình của người hùng',
}

export enum AdultContentOptions {
  ROMANTIC_BUILDUP = 'Xây dựng lãng mạn & Cảm xúc',
  SENSUAL_DETAIL = 'Miêu tả Gợi cảm & Tinh tế',
  EXPLICIT_ACTION = 'Hành động Tường tận & Trực tiếp',
  DIALOGUE = 'Đối thoại Táo bạo & Thân mật',
  DOMINANCE_SUBMISSION = 'Yếu tố Thống trị & Phục tùng',
}

export enum GenerationMode {
  CONTINUE = 'Viết tiếp câu chuyện',
  REWRITE = 'Viết lại và chèn vào',
}

export enum RewriteTarget {
  ENTIRE_STORY = 'Toàn bộ câu chuyện',
  SELECTED_CHAPTER = 'Chương được chọn',
}

export interface GenerationConfig {
  scenario: string;
  dynamics: string;
  pacing: string;
  narrativeStructure: NarrativeStructure;
  adultContentOptions: AdultContentOptions[];
  customAdultContentOptions?: string[];
  avoidKeywords: string;
  focusKeywords: string;
  generationMode: GenerationMode;
  rewriteTarget?: RewriteTarget;
  selectedChapterId?: string;
  additionalInstructions?: string;
  autoGeneratePrompts?: boolean;
  referenceContent?: string;
  useReferenceContent?: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  keys: string[];
  activeIndexes: number[];
  isDefault?: boolean;
  endpoint?: string;
  modelId?: string;
}

export interface HistoryEntry {
  timestamp: number;
  content: string;
}

export enum ContentElementType {
  NARRATIVE = 'narrative', // Regular story text
  DIALOGUE = 'dialogue', // Character dialogue
  MONOLOGUE = 'monologue', // Internal thoughts
  INTRODUCTION = 'introduction', // Story introduction/setup
  DESCRIPTION = 'description', // Scene descriptions
  TRANSITION = 'transition', // Scene transitions
}

export interface ContentElementStyle {
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  borderLeft?: string;
  borderRadius: string;
  padding: string;
  margin: string;
  textAlign: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface ContentDisplayConfig {
  enabled: boolean;
  style: ContentElementStyle;
}

export interface StoryDisplaySettings {
  elements: Record<ContentElementType, ContentDisplayConfig>;
  autoDetect: boolean; // Whether to auto-detect content elements
}

export interface StorySegment {
  id: string;
  type: 'user' | 'ai' | 'chapter';
  content: string;
  config?: GenerationConfig;
  displaySettings?: StoryDisplaySettings;
}

export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
  provider?: string; // AI provider this prompt is optimized for (e.g., 'google', 'openai', 'anthropic')
}

export interface KeywordPreset {
  id: string;
  name: string;
  avoidKeywords: string;
  focusKeywords: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  background: string;
  goals: string;
  relationships: string;
  flaws: string;
}

export interface Collaborator {
  id: string;
  name: string;
}

export interface Story {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  storySegments: StorySegment[];
  generationConfig: GenerationConfig;
  customPrompts: CustomPrompt[];
  keywordPresets: KeywordPreset[];
  selectedPromptIds: string[];
  characterProfiles: CharacterProfile[];
  lastReadSegmentId: string | null;
  displaySettings?: StoryDisplaySettings;
  collaborators?: Collaborator[]; // New field for collaboration
}
