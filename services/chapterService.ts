import type {
  ChapterTemplate,
  ChapterStatus,
  ChapterType,
  ChapterMetadata,
  ChapterAnalytics,
  ChapterDependency,
  ChapterHierarchy,
  ChapterOperation,
  ChapterTemplateStructure,
} from '../types/chapter';

class ChapterService {
  private templates: ChapterTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  generateChapterId(): string {
    return `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateOperationId(): string {
    return `operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDependencyId(): string {
    return `dependency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDefaultTemplates(): ChapterTemplate[] {
    return [
      {
        id: 'fantasy_opening',
        name: 'Fantasy Opening Chapter',
        description:
          'Perfect for beginning fantasy stories with world-building and character introduction',
        genre: ['fantasy', 'epic fantasy'],
        structure: {
          sections: [
            'The world setting and atmosphere',
            'Main character introduction',
            'Inciting incident or call to adventure',
            'Initial conflict or mystery',
          ],
          suggestedWordCount: 2500,
          keyElements: [
            'Magic system introduction',
            'World lore',
            'Character background',
            'Foreshadowing',
          ],
        },
        defaultContent: `# Chapter 1: The Awakening

In the shadowed valleys of Eldoria, where ancient magic still whispered through the wind-swept hills, a young apprentice named Elara discovered her destiny.

The村 of Willow Creek lay nestled between the Crystal Mountains and the forbidden Whispering Woods. It was a place of simple folk: farmers tending their crops, blacksmiths hammering at their forges, and children playing hide-and-seek among the towering oaks.

But Elara was different. She could hear the trees speaking, feel the earth pulsing beneath her feet, sense the subtle shift in the air when magic beckoned.

## The Vision

That fateful morning began like any other in the sleepy village. Elara rose with the sun, her dark hair tousled from dreams of flying through

[Continue writing to establish tension and mystery]

## The Prophecy

As she walked the familiar paths to the ancient oak grove, where the elders gathered for wisdom, Elara noticed something strange. The birds sang different songs, and the wind carried whispers that were not just imagination.

"What is happening?" she wondered aloud.

Little did she know that this was only the beginning of her journey, where destiny would call her to become more than she ever imagined.`,
      },
      {
        id: 'romance_meet_cute',
        name: 'Romance Meet-Cute',
        description:
          'Classic romantic comedy opening with an unexpected meeting that sparks chemistry',
        genre: ['romance', 'romantic comedy', 'contemporary'],
        structure: {
          sections: [
            'Scene setting and character setup',
            'The meet-cute incident',
            'Initial interaction and first impressions',
            'Internal monologue and chemistry recognition',
          ],
          suggestedWordCount: 2200,
          keyElements: [
            'Humorous situation',
            'Character personality sparks',
            'Physical attraction',
            'Foreshadowing conflict',
          ],
        },
        defaultContent: `# Chapter 1: Coffee Catastrophe

It was one of those Tuesday mornings where everything went wrong, and Alex Thompson was certain the universe had it out for him.

First, his alarm clock decided to malfunction at precisely 6:45 AM. Then, his shower water turned ice cold just as he lathered up the shampoo. And now, as he raced down the crowded sidewalk toward his favorite coffee shop, he was about to commit the ultimate sin: being late for work.

Work. His promotion depended on this month being perfect, and here he was, still in pajamas, umbrella-less in the pouring rain, and late by what was surely twenty minutes now.

## The Collision

The coffee shop door loomed like a beacon of hope. Alex yanked it open with desperate force, his mind already on the triple espresso he desperately needed.

What he didn't anticipate was the person coming out at exactly the same moment, carrying what appeared to be a tower of coffee cups balanced precariously.

Time seemed to slow down. Alex's forward momentum carried him into the doorway. He heard a sharp gasp, then felt the warm splash of liquid soaking through his pajama shirt. Coffee cups went flying in every direction, raining down like caffeinated meteor showers.

"Oh no!" came a voice from beneath the cascade of chaos.

Alex blinked rapidly, trying to process the scene before him. A woman—his collision victim—was now covered in coffee from head to toe, her white blouse now sporting impressive brown splotches. Her dark hair, once neatly tied back, now had stray curls escaping in every direction.

"Are you okay?" he managed to sputter, reaching helplessly toward her.

Her eyes widened as she took in his appearance—rain-soaked hair plastered to his forehead, pajamas with cartoon cats printed all over them, and now covered in coffee himself.

"I—" she started, then caught his pajama pattern and burst out laughing. "Nice cats. Is this your casual Friday look?"

Alex felt his face heat up, which at least explained why the coffee felt cooler against his skin. "Look, I'm really sorry. Let me help clean this up."

But as he bent down to retrieve the scattered cups and napkins, their hands touched accidentally, and for a split second, time really did stand still.

Her skin was warm, despite the cool coffee drenching them both. And her laugh—bright and genuine—made something in his chest tighten in a way that had nothing to do with caffeine withdrawals.

"I'm Mia," she said, once they'd restored some semblance of order to the coffee shop disaster zone.

"Alex," he replied, smiling despite the complete disaster of his morning.

Little did they know, this coffee-soaked collision was about to change everything.`,
      },
      {
        id: 'mystery_opening',
        name: 'Mystery Opening Chapter',
        description:
          'Create suspense with an unsolved puzzle that draws readers into the investigation',
        genre: ['mystery', 'thriller', 'detective'],
        structure: {
          sections: [
            'The mystery setup and initial hook',
            'Detective/investigator introduction',
            'Discovery of the central puzzle',
            'Clues and questions established',
          ],
          suggestedWordCount: 2800,
          keyElements: [
            'Unanswered questions',
            'Suspenseful atmosphere',
            'Conflict motivation',
            'Initial suspects/clues',
          ],
        },
        defaultContent: `# Chapter 1: The Locked Room

The brass key lay gleaming on the polished mahogany desk, a small but insistent reminder that some mysteries refuse to stay buried.

Detective Sarah Chen stared at it for what felt like the hundredth time that evening. The heavy curtains in her office were drawn tight, blocking out the neon glow of downtown Seattle, leaving only the soft circle of light from her desk lamp.

It wasn't the key itself that troubled her—it was what it represented. The impossible. The unsolvable. The case that broke careers.

## The Call That Changed Everything

Her phone rang at 3:17 AM, pulling her from fractured dreams. The voice on the other end was frantic, bordering on hysterical.

"Detective Chen? You have to come quickly. My... my neighbor. He's dead. In his apartment. And the door was locked from the inside."

She'd heard similar stories before. Locked room mysteries were the stuff of fiction, puzzles for armchair detectives. But this one was different.

The body belonged to renowned software mogul Richard Harrington, found slumped over his desk in his penthouse apartment. The door was locked with a deadbolt that could only be operated from inside. No windows were open, no vents large enough for a person to crawl through. Security cameras showed no one entering or leaving for hours before the discovery.

"Impossible," Sarah whispered as she stepped into the crime scene.

Yet there Richard Harrington was, pale and lifeless, a single gunshot wound to his temple. The gun lay beside him on the desk, his fingerprints the only ones on it. The window behind him showed the city lights of Seattle, mocking her with their indifferent glow.

## The Harrington Enigma

Richard Harrington wasn't just another tech billionaire. He was the tech billionaire—the man who'd revolutionized cloud computing before anyone knew what the cloud was. His companies employed thousands. His philanthropy fed millions. And his mind? Brilliant didn't begin to describe it.

So why would a man with everything to live for, barricaded in his own fortress, take his own life? And how could he possibly have done it?

Sarah picked up the brass key for the first time. It wasn't Harrington's usual style—brass instead of his preferred brushed nickel. And it didn't belong to any lock in his apartment.

"Where did this come from?" she muttered.

The answering machine beside the phone clicked on, replaying a message from only hours before Harrington's death.

"Richard, old friend. It's been too long. I know what you did all those years ago. Meet me at the usual place. Bring the key. It's time to set things right."

The voice was distorted, unidentifiable. But the implications were clear. Richard Harrington had secrets. Dangerous ones.

And someone knew about them.

Sarah slipped the key into her evidence bag, knowing deep down that this was just the beginning. Some doors, once locked, should never be opened.

But she had no choice. For Harrington. For the truth. For herself.`,
      },
      {
        id: 'sci_fi_first_contact',
        name: 'Sci-Fi First Contact',
        description:
          'Opening chapter for science fiction stories involving alien contact or discovery',
        genre: ['science fiction', 'space opera', 'hard sci-fi'],
        structure: {
          sections: [
            'Normal world establishment',
            'The discovery or contact event',
            'Scientific/technical response',
            'Personal and societal implications',
          ],
          suggestedWordCount: 3000,
          keyElements: [
            'Scientific accuracy',
            'Wonder and awe',
            'World-changing implications',
            'Character expertise',
          ],
        },
        defaultContent: `# Chapter 1: Signal from the Void

Dr. Elena Vasquez had been staring at star charts for seventeen hours straight when the anomaly first appeared.

The International Space Observatory on Mauna Kea was never meant to be glamorous work. Perched at 13,800 feet on the dormant volcano, with nothing but telescopes, supercomputers, and the occasional visiting astronomer, it was a place for patient observation.

For years, Elena had watched the cosmos through the James Webb's unblinking eyes. Planets formed, stars died, galaxies collided—all at distances measured in light-years. But tonight was different. Tonight, something watched back.

## The Impossible Signal

The alert came at 02:47 HST. A priority one notification that made her heart skip.

"SETI Algorithm activated. Confidence: 99.97%."

SETI. The Search for Extraterrestrial Intelligence. An algorithm that had been running silently in the background for decades, finding nothing but noise and false positives.

But this... this was different.

Elena rubbed her bleary eyes and focused on the data stream. The signal originated from the Kepler-452b system, 1,402 light-years away. It was structured—mathematically precise, repeating in Fibonacci sequences with embedded prime numbers.

And it was getting stronger.

"Origin confirmed," the system reported. "Signal is approaching at 0.87c. ETA to solar system boundary: 2.3 hours."

Approaching. Something was coming. Fast.

## First Contact Protocol

Deep Space Communication protocols activated automatically. Alarms echoed through the facility as the night shift astronomers were roused from their bunks. By the time the director arrived, bleary-eyed and confused, the entire Pacific Rim SETI network was online.

"Why wasn't this caught by the outer network?" Dr. Marcus Kane demanded, his military bearing still sharp even at 3 AM.

Elena pointed to the display. "It wasn't broadcasting when the automated sweeps passed through. It's using adaptive frequency modulation. It knew when to stay silent."

"Knew?" Kane repeated, his tone dangerous.

The implications hit them all at once. An intelligence that could adapt its transmissions to avoid detection. A technology advanced enough to travel near light speed. And it was heading straight for Earth.

## The Message

By dawn, every major telescope on the planet was trained on the approaching anomaly. Militaries hummed to life, though what weapons could touch a vessel traveling at 87% of light speed?

At 06:12 HST, the signal resolved into a coherent data package. Mathematics gave way to information. And then to something more.

Elena pushed her glasses up her nose, heart pounding as the translation algorithms worked.

"Greetings to the inhabitants of the third planet. We come in peace, seeking knowledge and understanding. Our approach was masked to avoid causing panic. We mean no harm."

The message repeated in every known human language, from ancient Sumerian to modern Mandarin. Each translation embedded with cultural references, showing an understanding of humanity that went far beyond what orbital reconnaissance could provide.

But how? When? And most importantly—why now?

Elena realized then that we weren't the first to receive such visitors. And we wouldn't be the last.

The real question was: what would humanity do when faced with a mirror showing how small we truly were?`,
      },
    ];
  }

  initializeDefaultTemplates(): void {
    this.templates = this.getDefaultTemplates();
  }

  // Template management
  getTemplates(): ChapterTemplate[] {
    return [...this.templates];
  }

  getTemplateById(id: string): ChapterTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  createTemplate(template: Omit<ChapterTemplate, 'id'>): ChapterTemplate {
    const newTemplate: ChapterTemplate = {
      ...template,
      id: this.generateTemplateId(),
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<ChapterTemplate>): ChapterTemplate | null {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.templates[index] = { ...this.templates[index], ...updates };
    return this.templates[index];
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }

  // Template suggestions based on genre and current story
  suggestTemplates(storyGenre: string, currentChapters: number): ChapterTemplate[] {
    let relevantTemplates = this.templates.filter((t) =>
      t.genre.some((g) => g.toLowerCase().includes(storyGenre.toLowerCase()))
    );

    // If no genre match, return popular templates
    if (relevantTemplates.length === 0) {
      relevantTemplates = [...this.templates];
    }

    // Sort by relevance to story position
    return relevantTemplates.sort((a, b) => {
      // Opening chapters are most important early on
      if (currentChapters === 0) {
        return a.genre.includes('opening') ? -1 : 1;
      }
      // Middle chapters for growing stories
      if (currentChapters > 0 && currentChapters < 5) {
        return b.structure.suggestedWordCount - a.structure.suggestedWordCount;
      }
      // Any template works for established stories
      return 0;
    });
  }

  // Analytics helpers
  calculateChapterStats(
    wordCount: number,
    characterCount: number,
    writingTime: number,
    revisionsCount: number
  ): ChapterAnalytics {
    // Simple heuristics for engagement metrics
    const readerEngagement = Math.min(
      100,
      Math.max(
        0,
        (wordCount / 2500) * 50 + // Optimal chapter length bonus
          (writingTime / 1000 / 60 / 30) * 30 + // Multiple revision sessions bonus
          Math.min(20, revisionsCount * 5) // Revision bonus, capped
      )
    );

    const popularityScore = Math.min(
      100,
      Math.max(
        0,
        readerEngagement * 0.6 +
          (wordCount > 2000 && wordCount < 4000 ? 20 : 0) +
          (writingTime > 3600000 ? 20 : writingTime > 1800000 ? 10 : 0) // Length of writing sessions
      )
    );

    return {
      wordsAdded: wordCount,
      wordsEdited: wordCount, // Initially same, increases with revisions
      writingTime,
      revisionsCount,
      readerEngagement,
      popularityScore,
    };
  }

  // Chapter validation
  validateChapterTitle(title: string): { valid: boolean; message?: string } {
    if (!title || title.trim().length === 0) {
      return { valid: false, message: 'Chapter title cannot be empty' };
    }

    if (title.length > 100) {
      return { valid: false, message: 'Chapter title must be less than 100 characters' };
    }

    if (!/^[a-zA-Z0-9\s\-_.,!?]+$/.test(title)) {
      return { valid: false, message: 'Chapter title contains invalid characters' };
    }

    return { valid: true };
  }

  // Export/Import
  exportTemplates(): string {
    return JSON.stringify({ templates: this.templates, version: '1.0' }, null, 2);
  }

  importTemplates(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.templates || !Array.isArray(parsed.templates)) {
        throw new Error('Invalid template data format');
      }

      // Validate each template
      for (const template of parsed.templates) {
        if (!template.id || !template.name || !template.structure) {
          throw new Error('Invalid template structure');
        }
      }

      this.templates = [...this.templates, ...parsed.templates];
      return true;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return false;
    }
  }
}

// Singleton instance
let chapterServiceInstance: ChapterService | null = null;

export function getChapterService(): ChapterService {
  if (!chapterServiceInstance) {
    chapterServiceInstance = new ChapterService();
  }
  return chapterServiceInstance;
}

export default getChapterService();
export { ChapterService };
