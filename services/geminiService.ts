
import { GoogleGenAI } from "@google/genai";
import type { ApiKey, GenerationConfig, GenerationConfigV1, AdvancedGenerationConfig } from '../types';

interface GenerationResult {
    content: string;
    newKeyIndex: number;
}

function buildPrompt(storyContext: string, config: GenerationConfig): { systemInstruction: string, prompt: string } {
    if ('version' in config && config.version === 'v2') {
        // V2 Advanced Prompt
        const advConfig = config as AdvancedGenerationConfig;
        const systemInstruction = `Bạn là một trợ lý viết văn sáng tạo chuyên nghiệp, chuyên sâu về việc xây dựng các phân cảnh người lớn (18+) phức tạp và chi tiết. Nhiệm vụ của bạn là tạo ra một phân cảnh mới, liền mạch với câu chuyện hiện tại, dựa trên một bộ quy tắc và các khối xây dựng (building blocks) cực kỳ chi tiết do người dùng cung cấp. Hãy tuân thủ nghiêm ngặt cấu trúc và chỉ dẫn sau đây.`;

        const prompt = `
--- BỐI CẢNH TRUYỆN HIỆN TẠI ---
${storyContext}

--- CẤU HÌNH CHI TIẾT CHO PHÂN CẢNH 18+ (V2) ---

**TÙY CHỌN BẬT/TẮT:**
- Kịch bản Vô danh/Ba người: ${advConfig.anonymousScenario ? 'Bật' : 'Tắt'}
- Hội thoại Tường thuật: ${advConfig.explicitDialogue ? 'Bật' : 'Tắt'}
- Mô tả Âm thanh: ${advConfig.audioDescription ? 'Bật' : 'Tắt'}

**THAM SỐ CỐT LÕI:**
- Chế độ Viết: ${advConfig.writingMode}
- Loại Đối tác: ${advConfig.partnerType}
- Bối cảnh: ${advConfig.setting}
- Từ khóa Tập trung: "${advConfig.focusKeywords}"
- Từ khóa Tránh: "${advConfig.avoidKeywords}"

**CẤU TRÚC & ĐỘNG LỰC:**
- Khuôn khổ Cảnh: ${advConfig.sceneFramework}
- Động lực Chiều sâu: ${advConfig.deepeningDynamics}

**CÁC KHỐI XÂY DỰNG KỊCH BẢN:**
Đây là các chỉ dẫn chi tiết, hãy bám sát và lồng ghép chúng một cách tự nhiên.

[User Customization Layer #1]:
${advConfig.userCustomizationLayer1 || '(Không có chỉ dẫn)'}

[Base Character Input]:
${advConfig.baseCharacterInput || 'Hành động và cảm xúc dựa trên bối cảnh truyện sẵn có.'}

[Building Block #1: Authority Statement]:
${advConfig.buildingBlock1_AuthorityStatement || '(Không có chỉ dẫn)'}

[Building Block #2: Body Control]:
${advConfig.buildingBlock2_BodyControl || '(Không có chỉ dẫn)'}

[User Customizable Segment #2]:
${advConfig.userCustomizableSegment2 || '(Không có chỉ dẫn)'}

[Building Block #3: Sensory Details]:
${advConfig.buildingBlock3_SensoryDetails || '(Không có chỉ dẫn)'}

[Building Block #4: Dialogue]:
${advConfig.buildingBlock4_Dialogue || '(Không có chỉ dẫn)'}

[User Customizable Segment #3]:
${advConfig.userCustomizableSegment3 || '(Không có chỉ dẫn)'}

[Building Block #5: Climax]:
${advConfig.buildingBlock5_Climax || '(Không có chỉ dẫn)'}

[Building Block #6: Aftermath]:
${advConfig.buildingBlock6_Aftermath || '(Không có chỉ dẫn)'}

--- NHIỆM VỤ CỦA BẠN ---
Viết phân cảnh tiếp theo bằng tiếng Việt, tích hợp mượt mà vào bối cảnh truyện. Phân cảnh phải tuân thủ nghiêm ngặt **tất cả** các tham số, tùy chọn và khối xây dựng đã được định nghĩa ở trên. Chỉ cung cấp phân cảnh mới được tạo ra, không lặp lại bối cảnh.
`;
        return { systemInstruction, prompt };

    } else {
        // V1 Basic Prompt
        const v1Config = config as GenerationConfigV1;
        const systemInstruction = `Bạn là một trợ lý viết văn sáng tạo đẳng cấp thế giới, chuyên về tiểu thuyết người lớn. Nhiệm vụ của bạn là tiếp nối đoạn truyện được cung cấp bằng cách viết một phân cảnh mới dựa trên định hướng sáng tạo cụ thể của người dùng. Phân cảnh phải được tích hợp một cách liền mạch với văn bản hiện có và được viết bằng tiếng Việt. Tuân thủ nghiêm ngặt các tham số sau.`;
        const prompt = `
--- BỐI CẢNH TRUYỆN ---
${storyContext}

--- ĐỊNH HƯỚNG SÁNG TẠO ---
- Kịch bản: ${v1Config.scenario}
- Động lực nhân vật: ${v1Config.dynamics}
- Nhịp độ: ${v1Config.pacing}
- Mức độ NSFW: ${v1Config.nsfwLevel}
- Từ khóa cần nhấn mạnh: "${v1Config.focusKeywords}"
- Từ khóa cần tránh: "${v1Config.avoidKeywords}"

--- NHIỆM VỤ CỦA BẠN ---
Viết phân cảnh tiếp theo bằng tiếng Việt. Phân cảnh phải là sự tiếp nối tự nhiên của bối cảnh truyện, phù hợp với đối tượng 18+, và tuân thủ tất cả các định hướng sáng tạo đã được cung cấp ở trên. Không lặp lại bối cảnh. Chỉ cung cấp phân cảnh mới được tạo ra.
`;
        return { systemInstruction, prompt };
    }
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

    const { systemInstruction, prompt } = buildPrompt(storyContext, config);

    let keyIndex = currentKeyIndex;
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[keyIndex];
        try {
            const genAI = new GoogleGenAI(apiKey.key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (!text) {
              throw new Error("Nhận được phản hồi trống từ API.");
            }
            return { content: text, newKeyIndex: keyIndex };
        } catch (error: any) {
            console.warn(`API call with key "${apiKey.name}" failed.`, error);
            // Specific check for blocked content
            if (error.toString().includes('SAFETY')) {
                 throw new Error(`Nội dung bị chặn bởi bộ lọc an toàn của Google với key "${apiKey.name}". Hãy thử một key khác hoặc điều chỉnh lại prompt.`);
            }
            keyIndex = (keyIndex + 1) % apiKeys.length;
        }
    }

    throw new Error("Tất cả các API key đều thất bại. Vui lòng kiểm tra lại key, kết nối mạng, hoặc nội dung bạn yêu cầu có thể đã bị chặn.");
}