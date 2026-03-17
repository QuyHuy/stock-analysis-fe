# Stock Analysis FE

Frontend cho hệ thống phân tích chứng khoán Việt Nam — xây dựng với Next.js, Firebase, và Gemini AI.

## Tính năng

- **💬 Hỏi AI**: Chat với Gemini về cổ phiếu VN dựa trên dữ liệu thực
- **📈 Cổ phiếu**: Tra cứu giá, biểu đồ 30 phiên của 50 mã phổ biến
- **📌 Danh mục**: Lưu cổ phiếu theo dõi cá nhân
- **🔔 Cảnh báo**: Đặt ngưỡng giá, nhận thông báo qua Telegram

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Shadcn UI, Recharts, lucide-react
- Firebase Auth + Firestore (client SDK)
- Axios với Firebase token auto-injection

## Bắt đầu nhanh

```bash
cp .env.local.example .env.local
# Điền Firebase config vào .env.local
npm install
npm run dev
```

Xem `docs/setup.md` để biết chi tiết.

## Deploy

Xem `docs/deploy.md` để hướng dẫn deploy lên Vercel.

## Cấu trúc thư mục

```
app/
  (auth)/login/          # Trang đăng nhập
  (dashboard)/
    chat/                # AI Chat
    stocks/              # Danh sách + chi tiết cổ phiếu
    watchlist/           # Danh mục theo dõi
    alerts/              # Cảnh báo giá
components/
  chat/                  # ChatMessage, ChatInput
  ui/                    # Shadcn components (không chỉnh sửa)
lib/
  firebase.ts            # Firebase config
  api.ts                 # Axios client + API helpers
  auth-context.tsx       # useAuth() hook
```

## Liên quan

Backend: [stock-analysis-be](../stock-analysis-be)
