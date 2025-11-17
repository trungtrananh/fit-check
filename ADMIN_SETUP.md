# Hướng Dẫn Cấu Hình Admin Password

## 🔒 Bảo Mật Trang Admin

Trang admin đã được bảo vệ bằng password. Chỉ bạn mới có thể truy cập và quản lý codes.

## ⚙️ Cấu Hình Password

### Local Development

Tạo hoặc cập nhật file `server/.env`:

```env
# Admin Password (thay đổi password này!)
ADMIN_PASSWORD=your_secure_password_here

# Session Secret (dùng để mã hóa session)
SESSION_SECRET=your_random_secret_key_here

# Các biến khác
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### Production (Google Cloud Run)

#### Cách 1: Tạo Secret trong Secret Manager

```bash
# Tạo secret cho admin password
echo -n "your_secure_password_here" | gcloud secrets create admin_password --data-file=-

# Tạo secret cho session secret
echo -n "your_random_secret_key_here" | gcloud secrets create session_secret --data-file=-
```

#### Cách 2: Deploy với Secrets

```bash
gcloud run deploy fit-check \
  --source=. \
  --region=asia-southeast1 \
  --platform=managed \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest,ADMIN_PASSWORD=admin_password:latest,SESSION_SECRET=session_secret:latest \
  --memory=2Gi \
  --timeout=300
```

## 🔑 Mặc Định

**Nếu không set password:**
- Default password: `admin123` (⚠️ **CHỈ DÙNG CHO TEST**)
- **BẮT BUỘC** phải đổi password trong production!

## 📝 Cách Sử Dụng

### 1. Truy Cập Trang Admin

```
https://fit-check-655254713423.asia-southeast1.run.app/admintrungta
```

### 2. Nhập Password

- Nhập password bạn đã set trong environment variable
- Click "Login"

### 3. Quản Lý Codes

- Sau khi đăng nhập, bạn có thể:
  - Tạo codes mới
  - Xem danh sách tất cả codes
  - Filter và search codes
  - Xem statistics

### 4. Logout

- Click nút "Logout" ở góc trên bên phải
- Session sẽ hết hạn sau 24 giờ

## 🔒 Bảo Mật

### Session Management

- Session được lưu trong cookie (httpOnly, secure trong production)
- Session hết hạn sau 24 giờ
- Mỗi lần đăng nhập tạo session mới

### Protected Endpoints

Các endpoints sau yêu cầu authentication:

- `GET /api/admin/list-codes` - Xem danh sách codes
- `POST /api/admin/generate-code` - Tạo code mới
- `GET /api/admin/create-code` - Tạo code qua browser

### Public Endpoints

Các endpoints này không cần authentication:

- `POST /api/credits/redeem-code` - User redeem code
- `GET /api/admin/check-auth` - Check authentication status
- `POST /api/admin/login` - Login endpoint
- `POST /api/admin/logout` - Logout endpoint

## ⚠️ Lưu Ý Quan Trọng

1. **Đổi password mặc định ngay lập tức!**
   - Default password `admin123` chỉ để test
   - Trong production, dùng password mạnh

2. **Session Secret**
   - Dùng một chuỗi ngẫu nhiên dài và phức tạp
   - Không chia sẻ với ai

3. **HTTPS trong Production**
   - Cloud Run tự động dùng HTTPS
   - Session cookies sẽ được secure

4. **Rate Limiting** (Khuyến nghị)
   - Nên thêm rate limiting cho login endpoint
   - Tránh brute force attacks

## 🛠️ Troubleshooting

### Không thể đăng nhập

1. Kiểm tra password trong `.env` hoặc Cloud Run secrets
2. Kiểm tra server logs để xem lỗi
3. Đảm bảo `ADMIN_PASSWORD` được set đúng

### Session mất sau khi refresh

1. Kiểm tra cookies có được lưu không
2. Đảm bảo `credentials: 'include'` trong fetch requests
3. Kiểm tra CORS settings

### Lỗi "Unauthorized"

1. Đảm bảo đã đăng nhập thành công
2. Kiểm tra session còn valid không
3. Thử logout và login lại

---

**Bây giờ trang admin đã được bảo vệ! Chỉ bạn mới có thể truy cập với password đúng. 🔐**

