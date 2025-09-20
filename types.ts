export enum Scenario {
  FIRST_TIME = "Lần đầu",
  ENEMIES_TO_LOVERS = "Từ ghét thành yêu",
  FRIENDS_TO_LOVERS = "Bạn bè thân thiết",
  RECONCILIATION = "Gương vỡ lại lành",
  BOLD_EXPLORATORY = "Bạo dạn & Khám phá",
}

export enum CharacterDynamics {
  A_LEADS = "Nhân vật A chủ động, B bị động/ngượng ngùng",
  BOTH_LEAD = "Cả hai cùng chủ động và mãnh liệt",
  FOCUS_ON_A = "Tập trung vào nội tâm và cảm xúc của nhân vật A",
  FOCUS_ON_B = "Tập trung vào nội tâm và cảm xúc của nhân vật B",
}

export enum Pacing {
  SLOW = "Chậm: Tập trung xây dựng không khí, miêu tả chi tiết.",
  MEDIUM = "Trung bình: Cân bằng giữa hành động và cảm xúc.",
  FAST = "Nhanh: Đi thẳng vào hành động chính, tạo cảm giác dồn dập.",
}

export enum AdultContentOptions {
    ROMANTIC_BUILDUP = "Xây dựng lãng mạn & Cảm xúc",
    SENSUAL_DETAIL = "Miêu tả Gợi cảm & Tinh tế",
    EXPLICIT_ACTION = "Hành động Tường tận & Trực tiếp",
    DIALOGUE = "Đối thoại Táo bạo & Thân mật",
    DOMINANCE_SUBMISSION = "Yếu tố Thống trị & Phục tùng",
}

export enum GenerationMode {
    CONTINUE = "Viết tiếp câu chuyện",
    REWRITE = "Viết lại và chèn vào",
}

export interface GenerationConfig {
  scenario: string;
  dynamics: string;
  pacing: string;
  adultContentOptions: AdultContentOptions[];
  avoidKeywords: string;
  focusKeywords: string;
  generationMode: GenerationMode;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  isDefault?: boolean;
  endpoint?: string;
  modelId?: string;
}

export interface HistoryEntry {
  timestamp: number;
  content: string;
}

export interface StorySegment {
  id: string;
  type: 'user' | 'ai';
  content: string;
  config?: GenerationConfig;
  history?: HistoryEntry[];
}

export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
}

export interface Story {
  id: string;
  name: string;
  segments: StorySegment[];
  createdAt: number;
  updatedAt: number;
}

export interface StorySession {
  storySegments: StorySegment[];
  generationConfig: GenerationConfig;
  customPrompts: CustomPrompt[];
  selectedPromptIds: string[];
}
