# Quick Start - Đẩy Code lên GitHub và Deploy

Hướng dẫn nhanh để đẩy code lên GitHub và deploy lên Google Cloud Run.

## 🚀 Bước 1: Push Code lên GitHub

### Cách 1: Dùng Script (Khuyến nghị)

**Windows (PowerShell):**
```powershell
.\push-to-github.ps1 "Initial commit: Fit Check with credit code system"
```

**Mac/Linux:**
```bash
chmod +x push-to-github.sh
./push-to-github.sh "Initial commit: Fit Check with credit code system"
```

### Cách 2: Làm Thủ Công

```bash
# Kiểm tra status
git status

# Add tất cả file
git add .

# Commit
git commit -m "Initial commit: Fit Check with credit code system"

# Push lên GitHub
git push origin main
```

**Nếu chưa có remote:**
```bash
# Thay YOUR_USERNAME và YOUR_REPO
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## ☁️ Bước 2: Deploy lên Google Cloud Run

### 2.1. Cài Đặt Google Cloud SDK

**Windows:** Download từ https://cloud.google.com/sdk/docs/install

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2.2. Đăng Nhập và Setup

```bash
# Đăng nhập
gcloud auth login

# Set project (thay YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2.3. Tạo Secret cho Gemini API Key

```bash
# Thay YOUR_GEMINI_API_KEY bằng key thật của bạn
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini_api_key --data-file=-
```

### 2.4. Deploy

```bash
gcloud run deploy fit-check \
  --source=. \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest \
  --memory=2Gi \
  --timeout=300
```

**Lưu ý:** 
- Lần đầu deploy sẽ mất vài phút để build
- Sau khi deploy xong, bạn sẽ nhận được URL của service

### 2.5. Kiểm Tra

```bash
# Xem URL của service
gcloud run services describe fit-check --region=us-central1

# Xem logs
gcloud run services logs read fit-check --region=us-central1 --limit=50
```

---

## 📋 Checklist

- [ ] Code đã được push lên GitHub
- [ ] Google Cloud SDK đã được cài đặt
- [ ] Đã đăng nhập vào Google Cloud
- [ ] Đã set project
- [ ] Đã enable các APIs cần thiết
- [ ] Đã tạo secret cho Gemini API Key
- [ ] Đã deploy thành công
- [ ] Đã test ứng dụng trên Cloud Run URL

---

## 🔧 Troubleshooting

### Lỗi: "Permission denied"
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Lỗi: "API not enabled"
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Lỗi: "Secret not found"
```bash
# Kiểm tra secrets
gcloud secrets list

# Tạo lại nếu cần
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini_api_key --data-file=-
```

---

## 📚 Tài Liệu Chi Tiết

- [DEPLOY.md](DEPLOY.md) - Hướng dẫn deploy chi tiết
- [CREDIT_CODE_SYSTEM.md](CREDIT_CODE_SYSTEM.md) - Hệ thống credit code
- [HUONG_DAN_TAO_CODE.md](HUONG_DAN_TAO_CODE.md) - Cách tạo credit codes

---

**Chúc bạn deploy thành công! 🎉**

