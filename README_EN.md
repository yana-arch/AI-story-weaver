<a href="./README.md"> Tiếng Việt </a> | <a href="./README_EN.md"> English </a>

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Story Weaver

AI Story Weaver is an AI-powered creative storytelling tool that helps you craft interactive stories, manage characters, and experience unique writing adventures.

## Key Features

- **Powerful AI Integration**: Supports multiple AI models including Google Gemini, OpenAI GPT, and Anthropic Claude
- **Multi-Story Management**: Create and manage multiple independent story projects
- **Smart Character Creation**: Automatically analyze and generate character profiles from story content
- **Flexible Story Structure**: Support for chapter-based, continuous, or freeform writing
- **Advanced Prompt Customization**: Use custom prompts and keywords to guide AI generation
- **Professional Publishing**: Export stories in formats like PDF, DOCX, and Markdown
- **Analytics and Statistics**: Track writing progress, word frequency, character networks, and story structure
- **Text-to-Speech**: Integrated TTS for listening to stories
- **Responsive Design**: Supports mobile and desktop devices
- **Dark Mode**: Eye-friendly dark theme interface
- **Security**: Local data storage with secure API key support

## System Requirements

- **Node.js** (>= 14.0)
- **npm** or **yarn** or **pnpm**
- **API Key** for at least one AI service (Google Gemini, OpenAI, or Anthropic)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yana-arch/AI-story-weaver.git
   cd ai-story-weaver
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure API settings:**
   Create a `.env.local` file in the root directory and add your API keys:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Add other keys as needed
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

4. **Run the application:**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Usage

1. **Start a new story:**
   - Click the "New Story" button to create a new story project
   - Enter the opening segment of your story

2. **Use AI for creative writing:**
   - Open the AI control panel on the right side
   - Set up scenario, story structure, character dynamics
   - Use custom prompts to guide the AI
   - Click "Generate with AI" to create content

3. **Manage characters:**
   - Use analysis tools to automatically extract characters
   - Edit detailed character profiles

4. **Export and share:**
   - Use export tools to download stories in multiple formats
   - Save sessions for later recovery

## Contributing

We welcome contributions from the community! Please:

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Project Structure

```
ai-story-weaver/
├── components/          # React components
├── services/            # API services and business logic
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── types/               # Type definitions
├── locales/             # Language files
└── public/              # Static assets
```

## License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact

- **GitHub**: [yana-arch/AI-story-weaver](https://github.com/yana-arch/AI-story-weaver)
- **Issues**: [GitHub Issues](https://github.com/yana-arch/AI-story-weaver/issues)

---

_Powered by AI, crafted by creativity_
