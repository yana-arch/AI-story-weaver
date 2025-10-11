<a href="./README.md"> Tiếng Việt </a> | <a href="./README_EN.md"> English </a>

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Story Weaver

AI Story Weaver là một công cụ viết truyện sáng tạo được hỗ trợ bởi trí tuệ nhân tạo, giúp bạn tạo ra các câu chuyện tương tác, quản lý nhân vật và trải nghiệm viết văn độc đáo.

## Tính năng chính

- **Tích hợp AI mạnh mẽ**: Hỗ trợ nhiều mô hình AI như Google Gemini, OpenAI GPT, và Anthropic Claude
- **Quản lý nhiều truyện**: Tạo và quản lý nhiều dự án truyện độc lập
- **Tạo nhân vật thông minh**: Phân tích và tạo hồ sơ nhân vật tự động từ nội dung truyện
- **Cấu trúc truyện linh hoạt**: Hỗ trợ viết theo chương, liên tục hoặc tự do
- **Tùy chỉnh prompt nâng cao**: Sử dụng prompt tùy chỉnh và từ khóa để hướng dẫn AI
- **Xuất bản chuyên nghiệp**: Xuất truyện sang các định dạng như PDF, DOCX, và Markdown
- **Phân tích và thống kê**: Theo dõi tiến trình viết, tần suất từ, mạng lưới nhân vật, và cấu trúc truyện
- **Đọc bằng giọng nói**: Tích hợp Text-to-Speech (TTS) để nghe truyện
- **Giao diện responsive**: Hỗ trợ thiết bị di động và máy tính để bàn
- **Chế độ tối**: Giao diện dark mode thân thiện với mắt
- **Bảo mật**: Lưu trữ dữ liệu cục bộ và hỗ trợ khóa API bảo mật

## Yêu cầu hệ thống

- **Node.js** (>= 14.0)
- **npm** hoặc **yarn** hoặc **pnpm**
- **API Key** cho ít nhất một dịch vụ AI (Google Gemini, OpenAI, hoặc Anthropic)

## Cài đặt

1. **Clone repository:**

   ```bash
   git clone https://github.com/yana-arch/AI-story-weaver.git
   cd ai-story-weaver
   ```

2. **Cài đặt dependencies:**

   ```bash
   npm install
   ```

3. **Tạo file cấu hình API:**
   Tạo file `.env.local` trong thư mục gốc và thêm API key của bạn:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Thêm các key khác nếu cần
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

4. **Chạy ứng dụng:**

   ```bash
   npm run dev
   ```

   Ứng dụng sẽ chạy tại `http://localhost:5173`

## Cách sử dụng

1. **Bắt đầu truyện mới:**

   - Nhấp vào nút "New Story" để tạo dự án truyện mới
   - Nhập đoạn mở đầu của truyện

2. **Sử dụng AI để sáng tạo:**

   - Mở bảng điều khiển AI ở bên phải
   - Thiết lập kịch bản, cấu trúc truyện, động lực nhân vật
   - Sử dụng prompt tùy chỉnh để hướng dẫn AI
   - Nhấp "Sáng tạo với AI" để tạo nội dung

3. **Quản lý nhân vật:**

   - Sử dụng công cụ phân tích để trích xuất nhân vật tự động
   - Chỉnh sửa hồ sơ nhân vật chi tiết

4. **Xuất và chia sẻ:**
   - Sử dụng công cụ export để tải xuống truyện dưới nhiều định dạng
   - Lưu phiên làm việc để khôi phục sau này

## Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng! Vui lòng:

1. Fork dự án
2. Tạo nhánh tính năng: `git checkout -b feature/amazing-feature`
3. Commit thay đổi: `git commit -m 'Add amazing feature'`
4. Push vào nhánh: `git push origin feature/amazing-feature`
5. Mở Pull Request

## Cấu trúc dự án

```
ai-story-weaver/
├── components/          # Component React
├── services/            # Dịch vụ API và logic nghiệp vụ
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── types/               # Type definitions
├── locales/             # File ngôn ngữ
└── public/              # Static assets
```

## License

Dự án này được phát hành dưới giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Tính năng mới (v1.0.0)

### ✨ Cải tiến Giao diện & Trải nghiệm

- **Settings Modal Redesigned**: Các tùy chọn Settings giờ hiển thị trong modal riêng biệt thay vì tab navigation, giúp tránh xung đột hiển thị
- **TTS Settings Enhanced**: Sửa lỗi hiển thị modal cài đặt Text-to-Speech
- **Responsive Design**: Tối ưu hóa giao diện cho cả thiết bị di động và máy tính

### 🚀 Hiệu suất & Ổn định

- **Build Optimization**: Cải thiện quá trình build và gói ứng dụng
- **Error Handling Improved**: Xử lý lỗi tốt hơn với thông báo cụ thể
- **Performance Monitoring**: Giám sát hiệu suất ứng dụng

### 🛠️ Sửa lỗi

- Sửa modal settings bị đè lên nhau
- Sửa TTS modal không hiển thị
- Cải thiện trải nghiệm người dùng với dropdown settings

## Liên hệ

- **GitHub**: [yana-arch/AI-story-weaver](https://github.com/yana-arch/AI-story-weaver)
- **Issues**: [GitHub Issues](https://github.com/yana-arch/AI-story-weaver/issues)

---

_Powered by AI, crafted by creativity_
