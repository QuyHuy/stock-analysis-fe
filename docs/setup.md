# Hướng dẫn Chạy Local

## Yêu cầu

- Node.js >= 18 (khuyến nghị v20 LTS)
- npm >= 9

## 1. Clone và cài dependencies

```bash
git clone https://github.com/YOUR_ORG/stock-analysis-fe.git
cd stock-analysis-fe
npm install
```

## 2. Cấu hình `.env.local`

```bash
cp .env.local.example .env.local
```

Điền vào `.env.local`:

```env
# Lấy từ Firebase Console → Project Settings → Your apps → Web app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stock-analysis-vn.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stock-analysis-vn
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stock-analysis-vn.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# URL của backend (chạy local hoặc Cloud Run)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 3. Chạy backend local (trong terminal khác)

Xem hướng dẫn tại `stock-analysis-be/docs/setup.md`.

## 4. Chạy frontend

```bash
npm run dev
```

Mở: http://localhost:3000

## 5. Tính năng có thể dùng

- **Đăng nhập**: Google OAuth hoặc Email/Password (tạo tài khoản trong Firebase Console trước)
- **Hỏi AI**: Chat với Gemini về cổ phiếu (cần backend chạy + dữ liệu đã sync)
- **Cổ phiếu**: Danh sách và biểu đồ giá (cần dữ liệu đã sync vào Firestore)
- **Cảnh báo**: Tạo cảnh báo giá qua Telegram

## Troubleshooting

**Lỗi `auth/invalid-api-key`**: Kiểm tra lại `NEXT_PUBLIC_FIREBASE_API_KEY` trong `.env.local`

**Lỗi CORS từ backend**: Đảm bảo `ALLOWED_ORIGINS` trong BE `.env` bao gồm `http://localhost:3000`

**Không load được cổ phiếu**: Backend chưa chạy hoặc chưa sync dữ liệu. Chạy `curl -X POST http://localhost:8080/sync`
