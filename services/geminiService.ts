import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { ApiKey, GenerationConfig, CharacterProfile } from '../types';
import { GenerationMode } from '../types';

interface GenerationResult {
    content: string;
    newKeyIndex: number;
    newChatSession: Chat | { messages: any[] };
}

export async function testApiKey(apiKey: ApiKey): Promise<void> {
    if (apiKey.endpoint && apiKey.modelId) {
        // Test custom OpenAI-compatible endpoint
        if (!apiKey.key) throw new Error("API key value is missing.");
        
        const response = await fetch(`${apiKey.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.key}`
            },
            body: JSON.stringify({
                model: apiKey.modelId,
                messages: [{ role: 'user', content: 'Say "OK"' }],
                max_tokens: 5,
                stream: false
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Test failed: ${errorData.error?.message || response.statusText}`);
        }
        const result = await response.json();
        if (!result.choices || result.choices.length === 0) {
          throw new Error(`Test failed: Invalid response structure.`);
        }
    } else {
        // Test Google Gemini API
        const effectiveApiKey = apiKey.id === 'default' 
            ? (process.env.API_KEY || '')
            : apiKey.key;

        if (!effectiveApiKey) {
            throw new Error("API key value is missing.");
        }

        const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say "OK"',
        });
        const text = response.text;
        if (!text || !text.includes('OK')) {
            throw new Error("Test failed: Unexpected response from Gemini API.");
        }
    }
}


export async function generateCharacterProfiles(
    storyContent: string,
    apiKeys: ApiKey[],
    currentKeyIndex: number
): Promise<{ profiles: CharacterProfile[], newKeyIndex: number }> {
     if (!apiKeys || apiKeys.length === 0) {
        throw new Error("No API keys available to generate character profiles.");
    }
    if (!storyContent.trim()) {
        throw new Error("Story content is empty. Cannot generate profiles.");
    }

    const systemInstruction = `You are an expert literary analyst. Your task is to read the provided story text and extract detailed profiles for each significant character. Identify their name, appearance, personality, background, and motivations based on the text. Provide the output as a JSON array of objects.`;

    const userMessage = `
    --- STORY CONTENT ---
    ${storyContent}

    --- YOUR TASK ---
    Analyze the story above and generate a JSON array of character profiles. Each object in the array should represent one character and have the following fields: "id" (a unique string generated from the name), "name", "appearance", "personality", "background", and "motivation". If a piece of information is not available in the text, leave the corresponding field as an empty string. Do not add any commentary before or after the JSON output.
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "A unique identifier for the character, can be generated from the name." },
                name: { type: Type.STRING },
                appearance: { type: Type.STRING },
                personality: { type: Type.STRING },
                background: { type: Type.STRING },
                motivation: { type: Type.STRING }
            },
            required: ["id", "name", "appearance", "personality", "background", "motivation"]
        }
    };
    
    let keyIndex = currentKeyIndex;
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[keyIndex];
        try {
            let generatedText: string;

            if (apiKey.endpoint && apiKey.modelId) {
                const response = await fetch(`${apiKey.endpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey.key}`
                    },
                    body: JSON.stringify({
                        model: apiKey.modelId,
                        messages: [
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: userMessage }
                        ],
                        response_format: { type: "json_object" },
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`API call failed: ${errorData.error?.message || response.statusText}`);
                }
                const result = await response.json();
                generatedText = result.choices?.[0]?.message?.content;
                const parsedResult = JSON.parse(generatedText);
                const profiles = Array.isArray(parsedResult) ? parsedResult : (parsedResult.profiles || []);
                return { profiles, newKeyIndex: keyIndex };

            } else {
                const effectiveApiKey = apiKey.id === 'default' 
                    ? (process.env.API_KEY || '')
                    : apiKey.key;
                if (!effectiveApiKey) {
                    console.warn(`API key for "${apiKey.name}" is missing. Skipping.`);
                    keyIndex = (keyIndex + 1) % apiKeys.length;
                    continue;
                }
                const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: userMessage,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: responseSchema,
                    }
                });
                generatedText = response.text;
            }

            if (!generatedText) {
              throw new Error("Received empty response from API.");
            }

            const profiles: CharacterProfile[] = JSON.parse(generatedText);
            return { profiles, newKeyIndex: keyIndex };

        } catch (error) {
            console.error(`API call for character profiles with key "${apiKey.name}" failed.`, error);
            keyIndex = (keyIndex + 1) % apiKeys.length;
        }
    }
    throw new Error("All API keys failed while generating character profiles.");
}

export async function generateStorySegment(
    prompt: string,
    fullStoryForRewrite: string,
    config: GenerationConfig,
    customPromptsContent: string[],
    characterProfiles: CharacterProfile[],
    apiKeys: ApiKey[],
    currentKeyIndex: number,
    chatSession: Chat | { messages: any[] } | null
): Promise<GenerationResult> {
    if (!apiKeys || apiKeys.length === 0) {
        throw new Error("Không có API key nào được cung cấp. Vui lòng thêm API key hoặc bật key mặc định trong phần cài đặt.");
    }
    
    const isNewChat = !chatSession;

    const customPromptsSection = customPromptsContent.length > 0
        ? `
--- YÊU CẦU TÙY CHỈNH ---
${customPromptsContent.map(p => `- ${p}`).join('\n')}`
        : '';
        
    const adultContentSection = config.adultContentOptions.length > 0
        ? `
--- HƯỚNG DẪN NỘI DUNG 18+ ---
${config.adultContentOptions.map(opt => `- Tập trung vào: ${opt}`).join('\n')}`
        : `
--- HƯỚNG DẪN NỘI DUNG 18+ ---
- Giữ cho câu chuyện phù hợp với mọi lứa tuổi. Tránh mọi nội dung người lớn.`;
    
    const characterProfilesSection = characterProfiles.length > 0
        ? `
--- HỒ SƠ NHÂN VẬT ---
${characterProfiles.map(p => 
`Tên: ${p.name}
- Ngoại hình: ${p.appearance || 'Chưa xác định'}
- Tính cách: ${p.personality || 'Chưa xác định'}
- Động lực: ${p.motivation || 'Chưa xác định'}`
).join('\n---\n')}`
        : '';

    
    const creativeDirection = `
--- ĐỊNH HƯỚNG SÁNG TẠO ---
- Kịch bản: ${config.scenario}
- Động lực nhân vật: ${config.dynamics}
- Nhịp độ: ${config.pacing}
- Từ khóa cần nhấn mạnh: "${config.focusKeywords}"
- Từ khóa cần tránh: "${config.avoidKeywords}"
${adultContentSection}
${customPromptsSection}
${characterProfilesSection}`;

    let systemInstruction: string;
    let userMessage: string;

    if (config.generationMode === GenerationMode.REWRITE) {
        systemInstruction = `Bạn là một biên tập viên viết văn sáng tạo đẳng cấp thế giới, chuyên về tiểu thuyết người lớn. Nhiệm vụ của bạn là đọc và viết lại một đoạn truyện được cung cấp. Bạn phải phân tích văn bản, xác định những cơ hội tự nhiên để chèn các cảnh 18+ chi tiết, và sau đó viết lại toàn bộ đoạn văn, lồng ghép các cảnh mới này một cách liền mạch. Đầu ra cuối cùng phải là một văn bản duy nhất, mạch lạc bằng tiếng Việt.`;
        userMessage = `
    --- NỘI DUNG GỐC CẦN VIẾT LẠI ---
    ${fullStoryForRewrite}

    --- NHIỆM VỤ CỦA BẠN ---
    Viết lại toàn bộ câu chuyện được cung cấp ở trên bằng tiếng Việt. Bản viết lại của bạn phải kết hợp các cảnh 18+ chi tiết mới dựa trên định hướng sáng tạo. Các cảnh này nên được chèn vào những thời điểm thích hợp để tăng cường cốt truyện và phát triển nhân vật. Đừng chỉ nối thêm cảnh mới vào cuối. Kết quả cuối cùng phải là câu chuyện hoàn chỉnh đã được viết lại. Không thêm bất kỳ bình luận hay giải thích nào trước hoặc sau câu chuyện.`;

    } else { // GenerationMode.CONTINUE
        systemInstruction = `Bạn là một trợ lý viết văn sáng tạo đẳng cấp thế giới, chuyên về tiểu thuyết người lớn. Nhiệm vụ của bạn là tiếp nối đoạn truyện được cung cấp bằng cách viết một phân cảnh mới dựa trên định hướng sáng tạo cụ thể của người dùng. Phân cảnh phải được tích hợp một cách liền mạch với văn bản hiện có và được viết bằng tiếng Việt. Tuân thủ nghiêm ngặt các tham số sau.`;
        if (isNewChat) {
             userMessage = `
    --- BỐI CẢNH TRUYỆN ---
    ${prompt}

    --- NHIỆM VỤ CỦA BẠN ---
    Viết phân cảnh tiếp theo bằng tiếng Việt. Phân cảnh phải là sự tiếp nối tự nhiên của bối cảnh truyện, phù hợp với đối tượng 18+, và tuân thủ tất cả các định hướng sáng tạo và yêu cầu tùy chỉnh đã được cung cấp ở trên. Không lặp lại bối cảnh. Chỉ cung cấp phân cảnh mới được tạo ra.`;
        } else {
            userMessage = `
    --- PHẦN TIẾP THEO TỪ NGƯỜI DÙNG ---
    ${prompt}
    
    --- NHIỆM VỤ CỦA BẠN ---
    Tiếp tục viết câu chuyện, tuân thủ các định hướng đã cho. Không lặp lại bối cảnh. Chỉ cung cấp phân cảnh mới được tạo ra.`
        }
    }

    const finalUserMessage = `${userMessage}\n\n${creativeDirection}`;

    let keyIndex = currentKeyIndex;
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[keyIndex];
        try {
            let generatedText: string;
            let newChatSession: Chat | { messages: any[] };

            if (apiKey.endpoint && apiKey.modelId) {
                 const currentMessages = isNewChat ? [] : (chatSession as { messages: any[] }).messages;
                 const messages = [...currentMessages];
                 if (messages.length === 0) {
                     messages.push({ role: 'system', content: systemInstruction });
                 }
                 messages.push({ role: 'user', content: finalUserMessage });

                const response = await fetch(`${apiKey.endpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey.key}`
                    },
                    body: JSON.stringify({
                        model: apiKey.modelId,
                        messages,
                        temperature: 0.95,
                        top_p: 0.95,
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`API call failed: ${errorData.error?.message || response.statusText}`);
                }
                const result = await response.json();
                generatedText = result.choices?.[0]?.message?.content;
                messages.push({ role: 'assistant', content: generatedText });
                newChatSession = { messages };

            } else {
                const effectiveApiKey = apiKey.id === 'default' 
                    ? (process.env.API_KEY || '')
                    : apiKey.key;

                if (!effectiveApiKey) {
                    console.warn(`API key for "${apiKey.name}" is missing. Skipping.`);
                    keyIndex = (keyIndex + 1) % apiKeys.length;
                    continue;
                }

                const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
                let chat: Chat;
                if (isNewChat) {
                    chat = ai.chats.create({
                        model: 'gemini-2.5-flash',
                        config: {
                            systemInstruction: systemInstruction,
                            temperature: 0.95,
                            topP: 0.95,
                        }
                    });
                } else {
                    chat = chatSession as Chat;
                }
                
                const response = await chat.sendMessage({ message: finalUserMessage });
                generatedText = response.text;
                newChatSession = chat;
            }

            if (!generatedText) {
              throw new Error("Nhận được phản hồi trống từ API.");
            }
            return { content: generatedText, newKeyIndex: keyIndex, newChatSession };
        } catch (error) {
            console.warn(`API call with key "${apiKey.name}" failed.`, error);
            keyIndex = (keyIndex + 1) % apiKeys.length;
        }
    }

    throw new Error("Tất cả các API key đều thất bại. Vui lòng kiểm tra lại key hoặc kết nối mạng của bạn.");
}