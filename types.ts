
// --- V1 CONFIG TYPES (OLD) ---
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

export enum NSFWLevel {
    SUBTLE = "Tinh tế",
    SUGGESTIVE = "Gợi cảm",
    EXPLICIT = "Tường tận",
}

export interface GenerationConfigV1 {
  scenario: Scenario;
  dynamics: CharacterDynamics;
  pacing: Pacing;
  nsfwLevel: NSFWLevel;
  avoidKeywords: string;
  focusKeywords: string;
}


// --- V2 ADVANCED SCENE MODE TYPES ---

export enum WritingMode {
    SCORCHING = "Scorching",
    PASSIONATE = "Passionate",
    GENTLE = "Gentle",
}

export enum PartnerType {
    DOM_MALE = "Dominant/Male",
    SUB_FEMALE = "Submissive/Female",
    DOM_FEMALE = "Dominant/Female",
    SUB_MALE = "Submissive/Male",
}

export enum SceneFramework {
    CUMULATIVE = "Tăng tiến Tích lũy",
    TWO_ACT = "Cấu trúc Hai hồi",
    FLASHBACK = "Flashback/Flashforward",
}

export enum DeepeningDynamics {
    PSYCHOLOGICAL = "Đấu tranh Tâm lý",
    PHYSICAL_DOM = "Thống trị Thể chất",
    POWER_SHIFT = "Chuyển đổi Quyền lực",
}

export interface AdvancedGenerationConfig {
    // Config version identifier
    version: 'v2';

    // Checkboxes
    anonymousScenario: boolean;
    explicitDialogue: boolean;
    audioDescription: boolean;

    // Core Parameters
    writingMode: WritingMode;
    partnerType: PartnerType;
    setting: string;
    focusKeywords: string;
    avoidKeywords: string;

    // Structure and Dynamics
    sceneFramework: SceneFramework;
    deepeningDynamics: DeepeningDynamics;

    // Building Blocks
    userCustomizationLayer1: string;
    baseCharacterInput: string;
    buildingBlock1_AuthorityStatement: string;
    buildingBlock2_BodyControl: string;
    userCustomizableSegment2: string;
    buildingBlock3_SensoryDetails: string;
    buildingBlock4_Dialogue: string;
    userCustomizableSegment3: string;
    buildingBlock5_Climax: string;
    buildingBlock6_Aftermath: string;
}


// --- COMMON TYPES ---

export type GenerationConfig = GenerationConfigV1 | AdvancedGenerationConfig;

export interface ApiKey {
  id: string;
  name: string;
  key: string;
}

export interface StoryFile {
  id: string;
  name:string;
  content: string;
}

export interface StorySegment {
  id: string;
  type: 'user' | 'ai';
  content: string;
  config?: GenerationConfig;
}