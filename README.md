# 括弧AI — Kakko Trainer
## Hướng dẫn deploy (15 phút, miễn phí hoàn toàn)

---

## BƯỚC 1 — Lấy Gemini API Key (miễn phí)

1. Vào: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng Google account
3. Nhấn **"Create API Key"**
4. Copy API key (dạng: AIza...)
5. Lưu lại, dùng ở Bước 4

---

## BƯỚC 2 — Tạo tài khoản GitHub (nếu chưa có)

1. Vào: https://github.com/join
2. Tạo tài khoản miễn phí
3. Xác nhận email

---

## BƯỚC 3 — Upload code lên GitHub

### Cách đơn giản nhất (không cần cài git):

1. Vào: https://github.com/new
2. Tên repo: `kakko-trainer`
3. Chọn **Public**
4. Nhấn **"Create repository"**
5. Nhấn **"uploading an existing file"**
6. Kéo thả toàn bộ thư mục `kakko-trainer` vào
7. Nhấn **"Commit changes"**

---

## BƯỚC 4 — Deploy lên Vercel

1. Vào: https://vercel.com
2. Nhấn **"Sign Up"** → chọn **"Continue with GitHub"**
3. Nhấn **"Add New Project"**
4. Chọn repo `kakko-trainer`
5. Nhấn **"Deploy"** (Vercel tự nhận Next.js)

### Sau khi deploy xong:

6. Vào **Settings → Environment Variables**
7. Thêm:
   - Name: `GEMINI_API_KEY`
   - Value: API key bạn copy ở Bước 1
8. Nhấn **Save**
9. Vào **Deployments → Redeploy**

---

## BƯỚC 5 — Kết nối Vercel KV (database)

1. Trong project Vercel, vào tab **Storage**
2. Nhấn **"Create Database"** → chọn **KV**
3. Tên: `kakko-db`, chọn Free tier
4. Nhấn **"Connect"** → chọn project kakko-trainer
5. Vercel tự thêm env variables KV vào project

### Redeploy lần cuối:
6. Vào **Deployments → Redeploy**

---

## XONG! 🎉

App của bạn đang chạy tại: `https://kakko-trainer.vercel.app`

- ✅ Gemini AI đóng ngoặc miễn phí (1,500 request/ngày)
- ✅ Database Vercel KV lưu rules vĩnh viễn
- ✅ Truy cập từ mọi thiết bị

---

## Nếu gặp lỗi

**Lỗi "GEMINI_API_KEY not set":**
→ Kiểm tra lại Environment Variables trong Vercel Settings

**Lỗi "KV connection failed":**
→ Kiểm tra Storage tab đã Connect chưa, rồi Redeploy

**Lỗi build:**
→ Chụp màn hình lỗi gửi cho tôi để fix

---

## Cập nhật app sau này

Mỗi khi muốn thay đổi gì:
1. Sửa file trong GitHub (nhấn biểu tượng bút chì)
2. Vercel tự động deploy lại trong 1-2 phút
