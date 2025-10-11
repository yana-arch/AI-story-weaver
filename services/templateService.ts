import {
  Template,
  TemplateCollection,
  UserTemplateData,
  TemplateApplication,
  TemplateSearchOptions,
  TemplateStats,
  TemplateCategory,
  TemplateType,
  PromptTemplate,
  TemplateVariable,
  TemplateRecommendation,
} from '../types/templates';

class TemplateService {
  private static instance: TemplateService;
  private userTemplateData: UserTemplateData;
  private builtInTemplates: Template[] = [];

  private constructor() {
    this.userTemplateData = this.loadUserData();
    this.initializeBuiltInTemplates();
  }

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  private loadUserData(): UserTemplateData {
    try {
      const saved = localStorage.getItem('userTemplateData');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load template data:', error);
    }

    return {
      customTemplates: [],
      favoriteTemplates: [],
      collections: [],
      recentUsed: [],
      preferences: {
        defaultLanguage: 'vi',
        favoriteCategories: [],
        autoSaveVariations: true,
      },
      // Initialize new analytics and intelligence fields
      usageAnalytics: {},
      intelligence: {
        templateSimilarities: {},
        userTemplates: [],
        contextTemplates: {},
      },
      abTests: [],
      templateRecommendations: [],
    };
  }

  private saveUserData(): void {
    try {
      localStorage.setItem('userTemplateData', JSON.stringify(this.userTemplateData));
    } catch (error) {
      console.error('Failed to save template data:', error);
    }
  }

  private initializeBuiltInTemplates(): void {
    // Initialize with some built-in Vietnamese templates
    this.builtInTemplates = [
      this.createRomanceNovelTemplate(),
      this.createFantasyAdventureTemplate(),
      this.createCharacterRomanceStarterTemplate(),
      this.createSceneBuildingTensionTemplate(),
      this.createPlotOutlineTemplate(),
    ];
  }

  private createRomanceNovelTemplate(): PromptTemplate {
    return {
      id: 'romance_novel_starter',
      name: 'Mở đầu tiểu thuyết lãng mạn',
      description: 'Template cho việc bắt đầu một câu chuyện tình cảm Việt Nam đương đại',
      category: TemplateCategory.FICTION,
      type: TemplateType.PROMPT_TEMPLATE,
      tags: ['lãng mạn', 'đương đại', 'tình yêu', 'mở đầu'],
      author: 'AI Story Weaver',
      version: '1.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: true,
      usageCount: 0,
      rating: 4.5,
      preview: 'Viết về cuộc gặp gỡ định mệnh giữa hai người trẻ...',
      content: `Viết mở đầu cho một tiểu thuyết lãng mạn đương đại Việt Nam.

Tên nhân vật chính: {{character1_name}}
Tuổi: {{character1_age}}
Nghề nghiệp: {{character1_job}}
Tên nhân vật thứ hai: {{character2_name}}
Tuổi: {{character2_age}}
Nghề nghiệp: {{character2_job}}
Bối cảnh gặp gỡ: {{meeting_place}}
Điều đặc biệt về cuộc gặp: {{meeting_special}}

Tập trung vào:
- Sự thu hút ban đầu giữa hai nhân vật
- Mô tả ngoại hình và ngôn ngữ cơ thể
- Không khí lãng lãng, hồi hộp
- Viết bằng tiếng Việt tự nhiên, hiện đại`,
      variables: [
        { name: 'character1_name', displayName: 'Tên nhân vật chính', description: 'Tên của nhân vật nữ/male lead đầu tiên', required: true, type: 'text' },
        { name: 'character1_age', displayName: 'Tuổi nhân vật 1', description: 'Tuổi của nhân vật chính', required: true, type: 'number' },
        { name: 'character1_job', displayName: 'Nghề nghiệp NV1', description: 'Công việc của nhân vật chính', required: true, type: 'text' },
        { name: 'character2_name', displayName: 'Tên nhân vật thứ hai', description: 'Tên của nhân vật love interest', required: true, type: 'text' },
        { name: 'character2_age', displayName: 'Tuổi nhân vật 2', description: 'Tuổi của nhân vật thứ hai', required: true, type: 'number' },
        { name: 'character2_job', displayName: 'Nghề nghiệp NV2', description: 'Công việc của nhân vật thứ hai', required: true, type: 'text' },
        { name: 'meeting_place', displayName: 'Nơi gặp gỡ', description: 'Bối cảnh nơi hai nhân vật gặp nhau', required: true, type: 'text', placeholder: 'cà phê, công viên, văn phòng...' },
        { name: 'meeting_special', displayName: 'Điều đặc biệt', description: 'Điều gì tạo nên sự đặc biệt trong cuộc gặp', required: false, type: 'textarea' },
      ],
      systemPrompt: 'Bạn là một nhà văn Việt Nam chuyên viết tiểu thuyết lãng mạn. Hãy tạo ra một câu chuyện thu hút, tập trung vào cảm xúc và sự phát triển mối quan hệ.',
      model: 'gemini-pro',
      temperature: 0.8,
      maxTokens: 1000,
      expectedOutput: 'story_continuation',
    };
  }

  private createFantasyAdventureTemplate(): PromptTemplate {
    return {
      id: 'fantasy_adventure_starter',
      name: 'Mở đầu phiêu lưu kỳ ảo',
      description: 'Template cho việc bắt đầu một câu chuyện phiêu lưu trong thế giới kỳ ảo',
      category: TemplateCategory.FICTION,
      type: TemplateType.PROMPT_TEMPLATE,
      tags: ['phiêu lưu', 'kỳ ảo', 'thần bí', 'mở đầu'],
      author: 'AI Story Weaver',
      version: '1.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: true,
      usageCount: 0,
      rating: 4.2,
      preview: 'Trong thế giới phép thuật nơi...',
      content: `Viết mở đầu cho một câu chuyện phiêu lưu kỳ ảo.

Tên thế giới: {{world_name}}
Loại thế giới: {{world_type}}
Tên nhân vật chính: {{hero_name}}
Năng lực đặc biệt: {{hero_power}}
Mối đe dọa chính: {{main_threat}}
Địa điểm bắt đầu: {{starting_location}}

Kích thước văn bản: {{narrative_length}}

Viết bằng tiếng Việt, tạo sự hấp dẫn ngay từ đầu.`,
      variables: [
        { name: 'world_name', displayName: 'Tên thế giới', required: true, type: 'text', placeholder: 'Eldoria, Trung Địa...' },
        { name: 'world_type', displayName: 'Loại thế giới', required: true, type: 'select', options: ['Thần tiên', 'Không gian', 'Trung cổ kỳ ảo', 'Hiện đại với phép thuật', 'Đa vũ trụ'] },
        { name: 'hero_name', displayName: 'Tên nhân vật chính', required: true, type: 'text' },
        { name: 'hero_power', displayName: 'Năng lực đặc biệt', required: true, type: 'text', placeholder: 'phép thuật, sức mạnh, trí tuệ...' },
        { name: 'main_threat', displayName: 'Mối đe dọa chính', required: true, type: 'text' },
        { name: 'starting_location', displayName: 'Địa điểm bắt đầu', required: true, type: 'text' },
        { name: 'narrative_length', displayName: 'Độ dài', required: true, type: 'select', options: ['Ngắn (200-300 từ)', 'Trung bình (400-600 từ)', 'Dài (700-1000 từ)'] },
      ],
      systemPrompt: 'Bạn là một tác giả kỳ ảo Việt Nam, viết bằng tiếng Việt tự nhiên, thu hút người đọc ngay từ dòng đầu tiên.',
      temperature: 0.9,
      maxTokens: 800,
      expectedOutput: 'story_continuation',
    };
  }

  private createCharacterRomanceStarterTemplate(): PromptTemplate {
    return {
      id: 'character_romance_starter',
      name: 'Tạo nhân vật lãng mạn',
      description: 'Template để tạo profile cho nhân vật trong câu chuyện tình cảm',
      category: TemplateCategory.CHARACTER,
      type: TemplateType.PROMPT_TEMPLATE,
      tags: ['nhân vật', 'lãng mạn', 'tính cách'],
      author: 'AI Story Weaver',
      version: '1.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: true,
      usageCount: 0,
      rating: 4.3,
      preview: 'Nhân vật với tính cách...',
      content: `Tạo profile chi tiết cho một nhân vật trong tiểu thuyết lãng mạn.

Tên nhân vật: {{character_name}}
Giới tính: {{gender}}
Tuổi: {{age}}
Nghề nghiệp: {{occupation}}
Đặc điểm ngoại hình nổi bật: {{appearance}}
Tính cách chính: {{personality}}
Điểm mạnh: {{strengths}}
Điểm yếu: {{weaknesses}}
Mục tiêu trong câu chuyện: {{goals}}
Niềm tin hoặc giá trị sống: {{values}}

Viết một đoạn mô tả sinh động bằng tiếng Việt.`,
      variables: [
        { name: 'character_name', displayName: 'Tên nhân vật', required: true, type: 'text' },
        { name: 'gender', displayName: 'Giới tính', required: true, type: 'select', options: ['Nam', 'Nữ', 'Khác'] },
        { name: 'age', displayName: 'Tuổi', required: true, type: 'number' },
        { name: 'occupation', displayName: 'Nghề nghiệp', required: true, type: 'text' },
        { name: 'appearance', displayName: 'Ngoại hình nổi bật', required: true, type: 'textarea' },
        { name: 'personality', displayName: 'Tính cách chính', required: true, type: 'select', options: ['Năng động', 'Nhút nhát', 'Tự tin', 'Nhạy cảm', 'Hài hước', 'Nghiêm túc'] },
        { name: 'strengths', displayName: 'Điểm mạnh', required: false, type: 'textarea' },
        { name: 'weaknesses', displayName: 'Điểm yếu', required: false, type: 'textarea' },
        { name: 'goals', displayName: 'Mục tiêu', required: false, type: 'textarea' },
        { name: 'values', displayName: 'Giá trị sống', required: false, type: 'textarea' },
      ],
      systemPrompt: 'Bạn là chuyên gia tạo nhân vật cho tiểu thuyết lãng mạn. Tạo ra nhân vật đa chiều, có chiều sâu và khả năng phát triển.',
      temperature: 0.7,
      expectedOutput: 'character_description',
    };
  }

  private createSceneBuildingTensionTemplate(): PromptTemplate {
    return {
      id: 'scene_building_tension',
      name: 'Cảnh xây dựng căng thẳng',
      description: 'Template để viết cảnh tạo sự căng thẳng, hồi hộp trong truyện',
      category: TemplateCategory.PLOT,
      type: TemplateType.PROMPT_TEMPLATE,
      tags: ['cảnh', 'căng thẳng', 'hồi hộp', 'nhịp độ'],
      author: 'AI Story Weaver',
      version: '1.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: true,
      usageCount: 0,
      rating: 4.4,
      preview: 'Không khí căng thẳng bao trùm...',
      content: `Viết một cảnh xây dựng căng thẳng trong câu chuyện.

Địa điểm: {{location}}
Thời gian trong ngày: {{time_of_day}}
Nhân vật chính: {{main_character}}
Đối thủ/người gây căng thẳng: {{antagonist}}
Mục tiêu của nhân vật: {{character_goal}}
Bí quyết của đối thủ: {{antagonist_secret}}
Hậu quả nếu thất bại: {{consequences}}

Tạo sự căng thẳng ngày càng tăng, kết thúc bằng cliffhanger nhẹ.`,
      variables: [
        { name: 'location', displayName: 'Địa điểm', required: true, type: 'text', placeholder: 'nhà hàng, công viên, văn phòng...' },
        { name: 'time_of_day', displayName: 'Thời gian', required: true, type: 'select', options: ['Buổi sáng', 'Trưa', 'Chiều', 'Tối', 'Đêm khuya'] },
        { name: 'main_character', displayName: 'Nhân vật chính', required: true, type: 'text' },
        { name: 'antagonist', displayName: 'Đối thủ', required: true, type: 'text' },
        { name: 'character_goal', displayName: 'Mục tiêu của NV chính', required: true, type: 'textarea' },
        { name: 'antagonist_secret', displayName: 'Bí mật của đối thủ', required: false, type: 'textarea' },
        { name: 'consequences', displayName: 'Hậu quả nếu thất bại', required: false, type: 'textarea' },
      ],
      systemPrompt: 'Bạn là nhà văn chuyên tạo nhịp độ trong câu chuyện. Xây dựng căng thẳng dần dần, làm người đọc hồi hộp.',
      temperature: 0.8,
      maxTokens: 600,
      expectedOutput: 'scene_description',
    };
  }

  private createPlotOutlineTemplate(): PromptTemplate {
    return {
      id: 'plot_outline_comprehensive',
      name: 'Dàn ý cốt truyện chi tiết',
      description: 'Template để tạo dàn ý cốt truyện chi tiết với cấu trúc 3 hồi',
      category: TemplateCategory.STORY_STRUCTURE,
      type: TemplateType.PROMPT_TEMPLATE,
      tags: ['cốt truyện', 'dàn ý', 'cấu trúc', '3 hồi'],
      author: 'AI Story Weaver',
      version: '1.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: true,
      usageCount: 0,
      rating: 4.6,
      preview: 'Cốt truyện với cấu trúc chặt chẽ...',
      content: `Tạo dàn ý cốt truyện chi tiết với cấu trúc 3 hồi kinh điển.

Thể loại: {{genre}}
Tiều đề đề xuất: {{title}}
Nhân vật chính: {{protagonist}}
Mục tiêu của nhân vật: {{protagonist_goal}}
Xung đột chính: {{main_conflict}}
Bối cảnh: {{setting}}

Hồi 1 - Thiết lập (25% câu chuyện):
- Giới thiệu nhân vật và thế giới: {{setup_intro}}
- Sự kiện kích hoạt: {{inciting_incident}}

Hồi 2 - Đối đầu (50% câu chuyện):
- Thử thách và phát triển: {{rising_action}}
- Đỉnh điểm của hồi 2: {{act2_climax}}
- Phát triển nhân vật: {{character_development}}

Hồi 3 - Giải quyết (25% câu chuyện):
- Sự kiện then chốt: {{final_confrontation}}
- Giải quyết xung đột: {{resolution}}
- Kết thúc: {{ending}}

Chi tiết hóa dàn ý này bằng tiếng Việt.`,
      variables: [
        { name: 'genre', displayName: 'Thể loại', required: true, type: 'select', options: ['Lãng mạn', 'Phiêu lưu', 'Tâm lý', 'Kinh dị', 'Khoa học viễn tưởng', 'Hài hước'] },
        { name: 'title', displayName: 'Tựa đề', required: true, type: 'text' },
        { name: 'protagonist', displayName: 'Nhân vật chính', required: true, type: 'text' },
        { name: 'protagonist_goal', displayName: 'Mục tiêu chính', required: true, type: 'textarea' },
        { name: 'main_conflict', displayName: 'Xung đột chính', required: true, type: 'textarea' },
        { name: 'setting', displayName: 'Bối cảnh', required: true, type: 'text' },
        { name: 'setup_intro', displayName: 'Giới thiệu hồi 1', required: false, type: 'textarea' },
        { name: 'inciting_incident', displayName: 'Sự kiện kích hoạt', required: false, type: 'textarea' },
        { name: 'rising_action', displayName: 'Thử thách hồi 2', required: false, type: 'textarea' },
        { name: 'act2_climax', displayName: 'Đỉnh điểm hồi 2', required: false, type: 'textarea' },
        { name: 'character_development', displayName: 'Phát triển NV', required: false, type: 'textarea' },
        { name: 'final_confrontation', displayName: 'Đối đầu cuối', required: false, type: 'textarea' },
        { name: 'resolution', displayName: 'Giải quyết', required: false, type: 'textarea' },
        { name: 'ending', displayName: 'Kết thúc', required: false, type: 'textarea' },
      ],
      systemPrompt: 'Bạn là biên kịch chuyên nghiệp. Tạo ra cấu trúc cốt truyện chặt chẽ, logic và hấp dẫn.',
      temperature: 0.6,
      maxTokens: 1200,
      expectedOutput: 'plot_outline',
    };
  }

  // Public API methods
  getAllTemplates(includeCustom: boolean = true): Template[] {
    const allTemplates = [...this.builtInTemplates];

    if (includeCustom) {
      allTemplates.push(...this.userTemplateData.customTemplates);
    }

    return allTemplates;
  }

  getTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  getTemplatesByType(type: TemplateType): Template[] {
    return this.getAllTemplates().filter(template => template.type === type);
  }

  searchTemplates(options: TemplateSearchOptions): Template[] {
    let results = this.getAllTemplates();

    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      results = results.filter(template => template.category === options.category);
    }

    if (options.type) {
      results = results.filter(template => template.type === options.type);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(template =>
        options.tags!.some(tag => template.tags.includes(tag))
      );
    }

    if (options.author) {
      results = results.filter(template => template.author === options.author);
    }

    // Sort results
    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';

    results.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Template];
      let bValue: any = b[sortBy as keyof Template];

      if (sortBy === 'rating' || sortBy === 'usage') {
        // Larger numbers first for rating/usage
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }

      // String comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  getTemplateById(id: string): Template | null {
    return this.getAllTemplates().find(template => template.id === id) || null;
  }

  addCustomTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>): Template {
    const newTemplate = {
      ...template,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      rating: 0,
      author: 'User',
    } as Template;

    this.userTemplateData.customTemplates.push(newTemplate);
    this.saveUserData();

    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<Template>): boolean {
    const templateIndex = this.userTemplateData.customTemplates.findIndex(t => t.id === id);

    if (templateIndex === -1) return false;

    this.userTemplateData.customTemplates[templateIndex] = {
      ...this.userTemplateData.customTemplates[templateIndex],
      ...updates,
      updatedAt: Date.now(),
    } as Template;

    this.saveUserData();
    return true;
  }

  deleteTemplate(id: string): boolean {
    const templateIndex = this.userTemplateData.customTemplates.findIndex(t => t.id === id);

    if (templateIndex === -1) return false;

    this.userTemplateData.customTemplates.splice(templateIndex, 1);
    this.saveUserData();

    // Remove from favorites and recent if exists
    this.userTemplateData.favoriteTemplates = this.userTemplateData.favoriteTemplates.filter(tid => tid !== id);
    this.userTemplateData.recentUsed = this.userTemplateData.recentUsed.filter(item => item.templateId !== id);

    return true;
  }

  toggleFavorite(templateId: string): void {
    const index = this.userTemplateData.favoriteTemplates.indexOf(templateId);

    if (index === -1) {
      this.userTemplateData.favoriteTemplates.push(templateId);
    } else {
      this.userTemplateData.favoriteTemplates.splice(index, 1);
    }

    this.saveUserData();
  }

  isFavorite(templateId: string): boolean {
    return this.userTemplateData.favoriteTemplates.includes(templateId);
  }

  getFavoriteTemplates(): Template[] {
    return this.userTemplateData.favoriteTemplates
      .map(id => this.getTemplateById(id))
      .filter(Boolean) as Template[];
  }

  recordTemplateUsage(templateId: string, resultQuality?: number): void {
    const template = this.getTemplateById(templateId);
    if (template) {
      template.usageCount++;
    }

    this.userTemplateData.recentUsed.unshift({
      templateId,
      usedAt: Date.now(),
      rating: resultQuality,
    });

    // Keep only last 50 recent used items
    this.userTemplateData.recentUsed = this.userTemplateData.recentUsed.slice(0, 50);

    this.saveUserData();
  }

  getTemplateStats(): TemplateStats {
    const allTemplates = this.getAllTemplates();

    const templatesByCategory = allTemplates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<TemplateCategory, number>);

    const templatesByType = allTemplates.reduce((acc, template) => {
      acc[template.type] = (acc[template.type] || 0) + 1;
      return acc;
    }, {} as Record<TemplateType, number>);

    const topRatedTemplates = allTemplates
      .filter(t => t.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
      .map(t => ({ id: t.id, name: t.name, rating: t.rating }));

    const mostUsedTemplates = allTemplates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(t => ({ id: t.id, name: t.name, usageCount: t.usageCount }));

    const recentTemplates = allTemplates
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);

    return {
      totalTemplates: allTemplates.length,
      templatesByCategory,
      templatesByType,
      topRatedTemplates,
      mostUsedTemplates,
      recentTemplates,
    };
  }

  createCollection(name: string, description: string, templateIds: string[]): TemplateCollection {
    const collection: TemplateCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      templates: templateIds.map(id => this.getTemplateById(id)).filter(Boolean) as Template[],
      author: 'User',
      isPublic: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.userTemplateData.collections.push(collection);
    this.saveUserData();

    return collection;
  }

  getCollections(): TemplateCollection[] {
    return this.userTemplateData.collections;
  }

  // Template variable substitution
  applyTemplate(template: PromptTemplate, variables: Record<string, string>): string {
    let result = template.content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  validateTemplateVariables(template: PromptTemplate, variables: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    template.variables.forEach(variable => {
      const value = variables[variable.name];

      if (variable.required && (!value || value.trim() === '')) {
        errors.push(`"${variable.displayName}" là bắt buộc`);
      }

      // Advanced validation
      if (value) {
        if (variable.validation?.pattern && !new RegExp(variable.validation.pattern).test(value)) {
          errors.push(`"${variable.displayName}" không đúng định dạng`);
        }

        if (variable.validation?.customValidator && typeof window !== 'undefined') {
          try {
            const validator = new Function('value', variable.validation.customValidator);
            if (!validator(value)) {
              errors.push(variable.validation.customValidator + ' failed for ' + variable.displayName);
            }
          } catch (e) {
            errors.push(`Lỗi validation cho "${variable.displayName}"`);
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Advanced template features
  applyTemplateWithComposition(templateId: string, userVariables: Record<string, string>, context: {
    storySegments?: Array<{ type: string; content: string }>;
    characterProfiles?: Array<{ name: string; personality?: string; background?: string }>;
    generationConfig?: any;
  } = {}): { content: string; variables: Record<string, string>; metadata: any } {
    const template = this.getTemplateById(templateId);
    if (!template || template.type !== TemplateType.PROMPT_TEMPLATE) {
      throw new Error('Template not found or not supported');
    }

    const promptTemplate = template as PromptTemplate;
    const resolvedVariables = this.resolveVariables(promptTemplate.variables, userVariables, context);

    // Apply parent template inheritance
    let finalContent = promptTemplate.content;
    if (promptTemplate.parentTemplateId) {
      const parentTemplate = this.getTemplateById(promptTemplate.parentTemplateId);
      if (parentTemplate && parentTemplate.type === TemplateType.PROMPT_TEMPLATE) {
        // Inherit parent content and merge variables
        finalContent = (parentTemplate as PromptTemplate).content + '\n\n' + finalContent;
      }
    }

    // Apply sub-templates (composition)
    if (promptTemplate.subTemplates) {
      for (const composition of promptTemplate.subTemplates) {
        if (this.evaluateCompositionCondition(composition, resolvedVariables, context)) {
          const subTemplate = promptTemplate.subTemplates.find(st => st.templateId === composition.templateId);
          if (subTemplate) {
            const subTemplateData = this.getTemplateById(subTemplate.templateId);
            if (subTemplateData && subTemplateData.type === TemplateType.PROMPT_TEMPLATE) {
              const subContent = this.applyTemplate(subTemplateData as PromptTemplate, subTemplate.variables || {});
              finalContent = this.insertSubTemplateContent(finalContent, subContent, subTemplate.insertionPoint);
            }
          }
        }
      }
    }

    // Apply variable substitution
    const content = this.applyTemplateComposed({ ...promptTemplate, content: finalContent }, resolvedVariables);

    return {
      content,
      variables: resolvedVariables,
      metadata: {
        templateId,
        composition: promptTemplate.subTemplates,
        inheritance: promptTemplate.parentTemplateId,
        resolvedVariables: Object.keys(resolvedVariables)
      }
    };
  }

  private resolveVariables(variables: TemplateVariable[], userVariables: Record<string, string>, context: any): Record<string, string> {
    const resolved: Record<string, string> = { ...userVariables };

    variables.forEach(variable => {
      const userValue = userVariables[variable.name];

      if (userValue) {
        resolved[variable.name] = userValue;
      } else {
        // Try to auto-fill from context
        const contextValue = this.getValueFromContext(variable, context);
        if (contextValue) {
          resolved[variable.name] = contextValue;
        } else if (variable.fallbackExpression) {
          resolved[variable.name] = this.computeFallback(variable.fallbackExpression, resolved);
        } else if (variable.defaultValue) {
          resolved[variable.name] = variable.defaultValue;
        }
      }
    });

    // Handle dependent variables (run multiple times to resolve dependencies)
    for (let i = 0; i < 3; i++) {
      variables.forEach(variable => {
        if (variable.type === 'computed' && variable.fallbackExpression) {
          resolved[variable.name] = this.computeFallback(variable.fallbackExpression, resolved);
        }
      });
    }

    return resolved;
  }

  private getValueFromContext(variable: TemplateVariable, context: any): string | null {
    if (!variable.source) return null;

    switch (variable.source) {
      case 'character_profile':
        if (context.characterProfiles && variable.name.includes('character')) {
          // Extract character name from variable name
          const charName = variable.name.replace(/character[0-9]*_/, '').replace(/_.*$/, '');
          const charProfile = context.characterProfiles.find((c: any) => c.name.toLowerCase().includes(charName));
          if (charProfile) {
            return variable.name.includes('age') ? charProfile.age :
                   variable.name.includes('job') || variable.name.includes('occupation') ? charProfile.occupation :
                   variable.name.includes('appearance') ? charProfile.appearance :
                   charProfile.name;
          }
        }
        break;

      case 'story_context':
        if (variable.name.includes('scene') && context.storySegments) {
          const lastScene = context.storySegments.findLast((s: any) => s.type === 'ai' || s.type === 'user');
          if (lastScene) return lastScene.content.substring(0, 100) + '...';
        }
        break;

      case 'generation_config':
        if (context.generationConfig && context.generationConfig[variable.name]) {
          return context.generationConfig[variable.name];
        }
        break;
    }

    return null;
  }

  private computeFallback(expression: string, resolvedVariables: Record<string, string>): string {
    try {
      // Simple expression evaluator - expand as needed
      if (expression === 'join_spaces') {
        return Object.values(resolvedVariables).filter(v => v).join(' ');
      }
      if (expression === 'random_choice') {
        const values = Object.values(resolvedVariables).filter(v => v);
        return values[Math.floor(Math.random() * values.length)];
      }
      if (expression.startsWith('concat:')) {
        const parts = expression.replace('concat:', '').split(',');
        return parts.map(part => resolvedVariables[part.trim()] || part.trim()).join('');
      }
      return '';
    } catch (e) {
      console.warn(`Fallback expression failed: ${expression}`, e);
      return '';
    }
  }

  private evaluateCompositionCondition(composition: any, variables: Record<string, string>, context: any): boolean {
    if (!composition.condition) return true;

    try {
      // Simple condition evaluator
      const condition = composition.condition;
      if (condition.startsWith('variable:')) {
        const varName = condition.replace('variable:', '');
        return !!variables[varName];
      }
      if (condition === 'has_characters') {
        return context.characterProfiles && context.characterProfiles.length > 0;
      }
      if (condition === 'story_length_long') {
        return context.storySegments && context.storySegments.length > 5;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  private insertSubTemplateContent(parentContent: string, subContent: string, insertionPoint: string): string {
    if (insertionPoint === 'before') {
      return subContent + '\n\n' + parentContent;
    }
    if (insertionPoint === 'after') {
      return parentContent + '\n\n' + subContent;
    }
    if (insertionPoint.startsWith('replace:')) {
      const varName = insertionPoint.replace('replace:', '');
      const placeholder = `{{${varName}}}`;
      return parentContent.replace(placeholder, subContent);
    }
    return parentContent;
  }

  private applyTemplateComposed(template: PromptTemplate, variables: Record<string, string>): string {
    let result = template.content;

    // Apply pre-processing
    if (template.preProcessing) {
      for (const preProcess of template.preProcessing) {
        try {
          const processor = new Function('content', 'variables', preProcess);
          result = processor(result, variables);
        } catch (e) {
          console.warn('Pre-processing failed:', e);
        }
      }
    }

    // Variable substitution
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });

    // Apply post-processing
    if (template.postProcessing) {
      for (const postProcess of template.postProcessing) {
        try {
          const processor = new Function('content', postProcess);
          result = processor(result);
        } catch (e) {
          console.warn('Post-processing failed:', e);
        }
      }
    }

    return result;
  }

  // Analytics and intelligence
  recordTemplatePerformance(templateId: string, metrics: {
    generationTime: number;
    tokenCount: number;
    success: boolean;
    qualityRating: number;
    userFeedback?: string;
    contextFeatures: string[];
  }): void {
    let analytics = this.userTemplateData.usageAnalytics[templateId];
    if (!analytics) {
      analytics = {
        templateId,
        usageStats: {
          totalUsage: 0,
          successfulGenerations: 0,
          averageGenerationTime: 0,
          averageTokenCount: 0,
          popularVariables: {},
          commonContexts: []
        },
        qualityMetrics: {
          averageRating: 0,
          userFeedback: [],
          coherence: 0,
          creativity: 0,
          consistency: 0
        },
        performanceHistory: []
      };
      this.userTemplateData.usageAnalytics[templateId] = analytics;
    }

    // Update usage stats
    analytics.usageStats.totalUsage++;
    if (metrics.success) analytics.usageStats.successfulGenerations++;
    analytics.usageStats.averageGenerationTime = (analytics.usageStats.averageGenerationTime * (analytics.usageStats.totalUsage - 1) + metrics.generationTime) / analytics.usageStats.totalUsage;
    analytics.usageStats.averageTokenCount = (analytics.usageStats.averageTokenCount * (analytics.usageStats.totalUsage - 1) + metrics.tokenCount) / analytics.usageStats.totalUsage;

    // Update quality metrics
    analytics.qualityMetrics.averageRating = (analytics.qualityMetrics.averageRating * (analytics.qualityMetrics.userFeedback.length) + metrics.qualityRating) / (analytics.qualityMetrics.userFeedback.length + 1);
    analytics.qualityMetrics.userFeedback.push({
      rating: metrics.qualityRating,
      comment: metrics.userFeedback,
      date: Date.now(),
      context: 'technical'
    });

    // Add performance point
    analytics.performanceHistory.push({
      date: Date.now(),
      usageCount: analytics.usageStats.totalUsage,
      successRate: analytics.usageStats.successfulGenerations / analytics.usageStats.totalUsage,
      averageRating: analytics.qualityMetrics.averageRating,
      contextFeatures: metrics.contextFeatures
    });

    // Keep last 100 history points
    analytics.performanceHistory = analytics.performanceHistory.slice(-100);

    this.saveUserData();
  }

  getTemplateRecommendations(context?: {
    storyType?: string;
    generationMode?: string;
    hasCharacters?: boolean;
    storyLength?: number;
  }): Promise<TemplateRecommendation[]> {
    return new Promise((resolve) => {
      setTimeout(() => { // Simulate async processing
        const recommendations: TemplateRecommendation[] = [];
        const allTemplates = this.getAllTemplates();

        allTemplates.forEach(template => {
          if (template.type !== TemplateType.PROMPT_TEMPLATE) return;

          const promptTemplate = template as PromptTemplate;
          let confidence = 0;
          let reasons: string[] = [];

          // Match compatibility
          if (promptTemplate.compatibility && context) {
            if (context.storyType && promptTemplate.compatibility.storyTypes.includes(context.storyType)) {
              confidence += 0.4;
              reasons.push('Phù hợp với thể loại truyện');
            }
            if (context.generationMode && promptTemplate.compatibility.generationModes.includes(context.generationMode)) {
              confidence += 0.3;
              reasons.push('Phù hợp với chế độ tạo');
            }
          }

          // Usage history
          const analytics = this.userTemplateData.usageAnalytics[template.id];
          if (analytics && analytics.qualityMetrics.averageRating > 4) {
            confidence += 0.3;
            reasons.push('Đánh giá cao');
          }

          // Popularity
          if (template.usageCount > 10) {
            confidence += 0.2;
            reasons.push('Được sử dụng phổ biến');
          }

          if (confidence > 0.1) {
            recommendations.push({
              templateId: template.id,
              confidence,
              reasoning: reasons.join(', '),
              contextMatch: {
                category: template.category.includes(context?.storyType || '') ? 1 : 0,
                compatibility: confidence > 0.3 ? 1 : 0,
                popularity: template.usageCount > 5 ? 1 : 0
              }
            });
          }
        });

        recommendations.sort((a, b) => b.confidence - a.confidence);
        resolve(recommendations.slice(0, 5));
      }, 100);
    });
  }
}

// Export singleton instance
export const templateService = TemplateService.getInstance();
