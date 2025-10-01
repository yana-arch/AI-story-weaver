import { Story, StorySegment } from '../types';

export interface WritingSession {
  startTime: number;
  endTime: number;
  wordCount: number;
  segmentId: string;
}

export interface WritingStats {
  totalWords: number;
  totalCharacters: number;
  wordsPerHour: number;
  sessionsCount: number;
  averageSessionDuration: number; // minutes
  totalWritingTime: number; // minutes
  lastActivity: number;
  streakDays: number;
  favoriteWritingHour: number; // 0-23
}

export interface CharacterAnalytics {
  name: string;
  mentionCount: number;
  wordCount: number;
  appearanceCount: number;
  dialogCount: number;
  relationships: CharacterRelationship[];
  traits: string[];
  developmentArc: string[];
}

export interface CharacterRelationship {
  character: string;
  interactions: number;
  type: 'positive' | 'negative' | 'neutral' | 'romantic';
  strength: number; // 0-10
}

export interface StoryStructureAnalytics {
  chapterCount: number;
  sceneCount: number;
  actStructure: {
    act1Percentage: number;
    act2Percentage: number;
    act3Percentage: number;
  };
  tensionCurve: Array<{ position: number; tension: number }>;
  pacingMetrics: {
    slowSections: number;
    mediumSections: number;
    fastSections: number;
  };
  characterPresence: Record<string, number>; // percentage of story
}

export class AnalyticsService {
  private writingSessions: WritingSession[] = [];

  constructor() {
    this.loadWritingSessions();
  }

  private loadWritingSessions(): void {
    try {
      const sessions = localStorage.getItem('writingSessions');
      if (sessions) {
        this.writingSessions = JSON.parse(sessions);
      }
    } catch (error) {
      console.error('Failed to load writing sessions:', error);
      this.writingSessions = [];
    }
  }

  private saveWritingSessions(): void {
    try {
      localStorage.setItem('writingSessions', JSON.stringify(this.writingSessions.slice(-100))); // Keep last 100 sessions
    } catch (error) {
      console.error('Failed to save writing sessions:', error);
    }
  }

  recordWritingSession(startTime: number, endTime: number, wordCount: number, segmentId: string): void {
    const session: WritingSession = {
      startTime,
      endTime,
      wordCount,
      segmentId
    };

    this.writingSessions.push(session);
    this.saveWritingSessions();
  }

  getWritingStats(currentStory?: Story): WritingStats {
    const sessions = currentStory
      ? this.writingSessions.filter(s => s.segmentId === currentStory.id)
      : this.writingSessions;

    if (sessions.length === 0) {
      return {
        totalWords: 0,
        totalCharacters: 0,
        wordsPerHour: 0,
        sessionsCount: 0,
        averageSessionDuration: 0,
        totalWritingTime: 0,
        lastActivity: 0,
        streakDays: 0,
        favoriteWritingHour: 0
      };
    }

    const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
    const totalTime = sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / (1000 * 60); // minutes
    const averageSessionDuration = totalTime / sessions.length;
    const wordsPerHour = totalTime > 0 ? (totalWords / totalTime) * 60 : 0;

    // Calculate writing hours distribution
    const hourCounts: Record<number, number> = {};
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const favoriteWritingHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;

    // Calculate streak
    const dates = [...new Set(sessions.map(s => new Date(s.startTime).toDateString()))]
      .map(d => new Date(d).getTime())
      .sort();

    let streakDays = 0;
    const today = new Date().toDateString();
    for (let i = dates.length - 1; i >= 0; i--) {
      const dateStr = new Date(dates[i]).toDateString();
      const daysDiff = Math.floor((new Date(today).getTime() - dates[i]) / (1000 * 60 * 60 * 24));
      if (dateStr === today || daysDiff === streakDays) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalWords,
      totalCharacters: totalWords * 5, // Rough estimate
      wordsPerHour,
      sessionsCount: sessions.length,
      averageSessionDuration,
      totalWritingTime: totalTime,
      lastActivity: sessions[sessions.length - 1]?.endTime || 0,
      streakDays,
      favoriteWritingHour: parseInt(favoriteWritingHour.toString())
    };
  }

  getCharacterAnalytics(story: Story): CharacterAnalytics[] {
    if (!story.characterProfiles) return [];

    const content = this.extractStoryContent(story);

    return story.characterProfiles.map(profile => {
      const mentions = this.countCharacterMentions(content, profile.name);
      const dialogs = this.countCharacterDialogs(content, profile.name);
      const appearanceRate = this.calculateAppearanceRate(content, profile.name);
      const wordCount = this.calculateCharacterWordCount(content, profile.name);

      // Analyze relationships with other characters
      const relationships = this.analyzeCharacterRelationships(content, profile.name, story.characterProfiles);

      // Extract traits from profile (this would be enhanced with AI analysis in future)
      const traits = this.extractCharacterTraits(profile);

      return {
        name: profile.name,
        mentionCount: mentions,
        wordCount,
        appearanceCount: appearanceRate,
        dialogCount: dialogs,
        relationships,
        traits,
        developmentArc: this.analyzeCharacterDevelopment(content, profile.name)
      };
    });
  }

  private extractStoryContent(story: Story): string {
    return story.storySegments
      .filter(seg => seg.type === 'ai' || seg.type === 'chapter')
      .map(seg => seg.content)
      .join('\n\n');
  }

  private countCharacterMentions(content: string, characterName: string): number {
    const regex = new RegExp(`\\b${characterName}\\b`, 'gi');
    return (content.match(regex) || []).length;
  }

  private countCharacterDialogs(content: string, characterName: string): number {
    // Simple heuristic: count lines that start with character name
    const lines = content.split('\n');
    return lines.filter(line =>
      line.trim().startsWith(characterName + ':') ||
      line.trim().startsWith('"' + characterName)
    ).length;
  }

  private calculateAppearanceRate(content: string, characterName: string): number {
    const segments = content.split('\n\n').filter(seg => seg.trim().length > 0);
    let appearances = 0;

    segments.forEach(segment => {
      if (segment.includes(characterName)) {
        appearances++;
      }
    });

    return segments.length > 0 ? Math.round((appearances / segments.length) * 100) : 0;
  }

  private calculateCharacterWordCount(content: string, characterName: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.includes(characterName));
    return sentences.reduce((count, sentence) => count + sentence.split(/\s+/).length, 0);
  }

  private analyzeCharacterRelationships(content: string, characterName: string, allProfiles: any[]): CharacterRelationship[] {
    return allProfiles
      .filter(profile => profile.name !== characterName)
      .map(profile => {
        const interactions = this.countCharacterInteractions(content, characterName, profile.name);
        const type = this.determineRelationshipType(content, characterName, profile.name);
        const strength = this.calculateRelationshipStrength(content, characterName, profile.name, interactions);

        return {
          character: profile.name,
          interactions,
          type,
          strength
        };
      })
      .filter(rel => rel.interactions > 0);
  }

  private countCharacterInteractions(content: string, char1: string, char2: string): number {
    const segments = content.split('\n\n');
    return segments.filter(segment =>
      segment.includes(char1) && segment.includes(char2)
    ).length;
  }

  private determineRelationshipType(content: string, char1: string, char2: string): 'positive' | 'negative' | 'neutral' | 'romantic' {
    const combinedContent = content.toLowerCase();

    const romanticKeywords = ['yêu', 'thương', 'hôn', 'ôm', 'nhìn', 'cười', 'hạnh phúc'];
    const negativeKeywords = ['ghi', 'thù', 'sợ', 'đau khổ', 'cãi vã', 'la mắng'];
    const positiveKeywords = ['thân thiện', 'hỗ trợ', 'giúp đỡ', 'cùng nhau', 'bạn bè'];

    if (romanticKeywords.some(keyword => combinedContent.includes(keyword))) {
      return 'romantic';
    }
    if (negativeKeywords.some(keyword => combinedContent.includes(keyword))) {
      return 'negative';
    }
    if (positiveKeywords.some(keyword => combinedContent.includes(keyword))) {
      return 'positive';
    }
    return 'neutral';
  }

  private calculateRelationshipStrength(content: string, char1: string, char2: string, interactions: number): number {
    const maxStrength = 10;
    let baseStrength = Math.min(interactions * 0.5, 5);

    if (this.determineRelationshipType(content, char1, char2) === 'romantic') {
      baseStrength += 3;
    }

    return Math.min(Math.max(baseStrength, 1), maxStrength);
  }

  private extractCharacterTraits(profile: any): string[] {
    const traits: string[] = [];

    if (profile.personality) {
      traits.push(...profile.personality.split(',').map((t: string) => t.trim()));
    }
    if (profile.flaws) {
      traits.push(...profile.flaws.split(',').map((t: string) => t.trim()));
    }

    return traits;
  }

  private analyzeCharacterDevelopment(content: string, characterName: string): string[] {
    // Simple development arc detection based on content changes
    const segments = content.split('\n\n').filter(seg => seg.includes(characterName));

    if (segments.length < 3) return ['Giới thiệu'];

    // This would be enhanced with AI analysis in future to detect actual character development
    return ['Giới thiệu', 'Phát triển', 'Climax', 'Kết thúc'];
  }

  getStoryStructureAnalytics(story: Story): StoryStructureAnalytics {
    const content = this.extractStoryContent(story);
    const segments = content.split('\n\n').filter(seg => seg.trim().length > 0);

    // Chapter count - assuming each major section is a chapter
    const chapterCount = story.storySegments.filter(seg => seg.type === 'chapter').length || Math.max(1, segments.length / 10);

    // Scene count - rough estimate
    const sceneCount = segments.length;

    // Simple act structure analysis (very basic)
    const act1Percentage = 25;
    const act2Percentage = 50;
    const act3Percentage = 25;

    // Tension curve - simplified
    const tensionCurve = segments.map((_, index) => ({
      position: (index / segments.length) * 100,
      tension: Math.sin((index / segments.length) * Math.PI) * 5 + 5 // Simple sine wave
    }));

    // Pacing analysis
    const pacingMetrics = this.analyzePacing(content);

    // Character presence
    const characterPresence: Record<string, number> = {};
    if (story.characterProfiles) {
      story.characterProfiles.forEach(profile => {
        characterPresence[profile.name] = this.calculateAppearanceRate(content, profile.name);
      });
    }

    return {
      chapterCount,
      sceneCount,
      actStructure: { act1Percentage, act2Percentage, act3Percentage },
      tensionCurve,
      pacingMetrics,
      characterPresence
    };
  }

  private analyzePacing(content: string): { slowSections: number; mediumSections: number; fastSections: number } {
    const sentences = content.split(/[.!?]+/);
    let slowSections = 0;
    let mediumSections = 0;
    let fastSections = 0;

    sentences.forEach(sentence => {
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 30) slowSections++;
      else if (wordCount > 15) mediumSections++;
      else fastSections++;
    });

    return { slowSections, mediumSections, fastSections };
  }

  // Utility methods for real-time tracking
  startWritingSession(segmentId: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // This could store the session ID in localStorage or state
    return sessionId;
  }

  endWritingSession(sessionId: string, wordCount: number): void {
    const startTime = parseInt(sessionId.split('_')[1]);
    const endTime = Date.now();

    this.recordWritingSession(startTime, endTime, wordCount, 'current_story'); // Would use actual segment ID
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}
