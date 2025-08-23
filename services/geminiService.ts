
import { GoogleGenAI } from "@google/genai";
import type { ApiKey, GenerationConfig } from '../types';

interface GenerationResult {
    content: string;
    newKeyIndex: number;
}

export async function generateStorySegment(
    storyContext: string,
    config: GenerationConfig,
    apiKeys: ApiKey[],
    currentKeyIndex: number
): Promise<GenerationResult> {
    if (!apiKeys || apiKeys.length === 0) {
        throw new Error("Không có API key nào được cung cấp. Vui lòng thêm API key trong phần cài đặt.");
    }

    const systemInstruction = `Bạn là một trợ lý viết văn sáng tạo đẳng cấp thế giới, chuyên về tiểu thuyết người lớn. Nhiệm vụ của bạn là tiếp nối đoạn truyện được cung cấp bằng cách viết một phân cảnh mới dựa trên định hướng sáng tạo cụ thể của người dùng. Phân cảnh phải được tích hợp một cách liền mạch với văn bản hiện có và được viết bằng tiếng Việt. Tuân thủ nghiêm ngặt các tham số sau.`;
    
    const prompt = `
    --- BỐI CẢNH TRUYỆN ---
    ${storyContext}

    --- ĐỊNH HƯỚNG SÁNG TẠO ---
    - Kịch bản: ${config.scenario}
    - Động lực nhân vật: ${config.dynamics}
    - Nhịp độ: ${config.pacing}
    - Mức độ NSFW: ${config.nsfwLevel}
    - Từ khóa cần nhấn mạnh: "${config.focusKeywords}"
    - Từ khóa cần tránh: "${config.avoidKeywords}"

    --- NHIỆM VỤ CỦA BẠN ---
    Viết phân cảnh tiếp theo bằng tiếng Việt. Phân cảnh phải là sự tiếp nối tự nhiên của bối cảnh truyện, phù hợp với đối tượng 18+, và tuân thủ tất cả các định hướng sáng tạo đã được cung cấp ở trên. Không lặp lại bối cảnh. Chỉ cung cấp phân cảnh mới được tạo ra.
    `;

    let keyIndex = currentKeyIndex;
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[keyIndex];
        try {
            const ai = new GoogleGenAI({ apiKey: apiKey.key });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.95,
                    topP: 0.95,
                }
            });
            const text = response.text;
            if (!text) {
              throw new Error("Nhận được phản hồi trống từ API.");
            }
            return { content: text, newKeyIndex: keyIndex };
        } catch (error) {
            console.warn(`API call with key "${apiKey.name}" failed.`, error);
            keyIndex = (keyIndex + 1) % apiKeys.length;
        }
    }

    throw new Error("Tất cả các API key đều thất bại. Vui lòng kiểm tra lại key hoặc kết nối mạng của bạn.");
}