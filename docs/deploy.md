# Hướng dẫn Deploy Frontend lên Vercel

## Yêu cầu

- Tài khoản Vercel (https://vercel.com)
- Tài khoản GitHub
- Firebase project đã cấu hình (xem Task 1 trong implementation plan)
- Backend đã deploy lên Cloud Run (xem `stock-analysis-be/docs/deploy.md`)

## 1. Kết nối Vercel với GitHub

1. Vào https://vercel.com → "Add New" → "Project"
2. Import repository `stock-analysis-fe` từ GitHub
3. Vercel tự nhận diện Next.js — nhấn "Deploy"
4. Lấy thông tin cần thiết:
   - Project ID: xem trong Vercel Dashboard → Project → Settings → General
   - Org ID: xem trong Vercel Dashboard → Team Settings → General

## 2. Lấy Vercel Token

1. Vào https://vercel.com/account/tokens
2. "Create Token" → đặt tên và scope
3. Copy token (chỉ hiển thị 1 lần)

## 3. Thêm GitHub Secrets

Trong GitHub repo → Settings → Secrets and variables → Actions, thêm:

| Secret | Cách lấy |
|--------|----------|
| `VERCEL_TOKEN` | Từ bước 2 |
| `VERCEL_ORG_ID` | Vercel → Account Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings → Web app config |
| `NEXT_PUBLIC_API_URL` | URL của Cloud Run service (từ `stock-analysis-be/docs/deploy.md`) |

## 4. Cấu hình Firebase Auth — thêm Authorized Domain

Firebase Auth mặc định chỉ cho phép `localhost`. Cần thêm domain Vercel:

1. Firebase Console → Authentication → Settings → Authorized domains
2. Thêm: `your-app.vercel.app`

## 5. Deploy lần đầu

```bash
git push origin main
```

Workflow sẽ tự động build và deploy.

Theo dõi tại: https://github.com/YOUR_ORG/stock-analysis-fe/actions

## 6. Kiểm tra sau deploy

1. Mở URL Vercel của bạn
2. Đăng nhập với Google hoặc Email
3. Thử hỏi AI: "VNM đang ở giá bao nhiêu?"
4. Thử xem danh sách cổ phiếu

## Cập nhật sau khi backend URL thay đổi

Cập nhật secret `NEXT_PUBLIC_API_URL` trong GitHub và push lại để redeploy.
