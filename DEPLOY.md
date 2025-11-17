# Hướng Dẫn Deploy lên GitHub và Google Cloud Run

Hướng dẫn chi tiết để đẩy code lên GitHub và deploy tự động lên Google Cloud Run.

## 📋 Mục Lục

1. [Chuẩn Bị](#1-chuẩn-bị)
2. [Đẩy Code lên GitHub](#2-đẩy-code-lên-github)
3. [Setup Google Cloud](#3-setup-google-cloud)
4. [Deploy lên Cloud Run](#4-deploy-lên-cloud-run)
5. [Cấu Hình Secrets](#5-cấu-hình-secrets)
6. [Tự Động Deploy với GitHub Actions](#6-tự-động-deploy-với-github-actions)

---

## 1. Chuẩn Bị

### 1.1. Kiểm tra Git Repository

Kiểm tra xem đã có git repository chưa:

```bash
git status
```

Nếu chưa có, khởi tạo:

```bash
git init
```

### 1.2. Kiểm tra .gitignore

Đảm bảo file `.gitignore` đã có và bao gồm:
- `node_modules/`
- `server/node_modules/`
- `.env` và `server/.env`
- `dist/`

---

## 2. Đẩy Code lên GitHub

### Bước 1: Tạo Repository trên GitHub

1. Đăng nhập vào [GitHub](https://github.com)
2. Click **"New repository"**
3. Đặt tên: `fit-check` (hoặc tên bạn muốn)
4. Chọn **Public** hoặc **Private**
5. **KHÔNG** tích "Initialize with README" (vì đã có code)
6. Click **"Create repository"**

### Bước 2: Add và Commit Code

```bash
# Kiểm tra các file sẽ được commit
git status

# Add tất cả các file (trừ những file trong .gitignore)
git add .

# Commit với message
git commit -m "Initial commit: Fit Check app with credit code system"

# Kiểm tra lại
git status
```

### Bước 3: Kết Nối với GitHub và Push

```bash
# Thay YOUR_USERNAME và YOUR_REPO bằng thông tin của bạn
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Đổi tên branch thành main (nếu cần)
git branch -M main

# Push code lên GitHub
git push -u origin main
```

**Ví dụ:**
```bash
git remote add origin https://github.com/trungtrananh/fit-check.git
git push -u origin main
```

### Bước 4: Xác Nhận

Truy cập repository trên GitHub để xác nhận code đã được đẩy lên.

---

## 3. Setup Google Cloud

### 3.1. Cài Đặt Google Cloud SDK

**Windows:**
- Download từ: https://cloud.google.com/sdk/docs/install
- Chạy installer và làm theo hướng dẫn

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 3.2. Đăng Nhập và Cấu Hình

```bash
# Đăng nhập
gcloud auth login

# Chọn project (hoặc tạo mới)
gcloud projects list

# Set project hiện tại
gcloud config set project YOUR_PROJECT_ID

# Enable các APIs cần thiết
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 3.3. Cấu Hình Docker (nếu chưa có)

```bash
# Enable Docker authentication
gcloud auth configure-docker
```

---

## 4. Deploy lên Cloud Run

### 4.1. Tạo Secrets cho Environment Variables

```bash
# Tạo secret cho Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini_api_key --data-file=-

# Kiểm tra secret đã tạo
gcloud secrets list
```

**Lưu ý:** 
- Thay `YOUR_GEMINI_API_KEY` bằng API key thật của bạn
- Secrets sẽ được dùng trong Cloud Run deployment

### 4.2. Deploy từ Source Code

```bash
# Deploy từ thư mục hiện tại
gcloud run deploy fit-check \
  --source=. \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest \
  --memory=2Gi \
  --timeout=300 \
  --port=8080
```

**Giải thích các tham số:**
- `--source=.` - Build từ source code trong thư mục hiện tại
- `--region=us-central1` - Chọn region (có thể đổi: asia-southeast1, europe-west1)
- `--allow-unauthenticated` - Cho phép truy cập công khai
- `--update-secrets` - Sử dụng secrets từ Secret Manager
- `--memory=2Gi` - Cấp phát 2GB RAM
- `--timeout=300` - Timeout 5 phút (cần cho AI generation)

### 4.3. Deploy từ GitHub Repository

Nếu muốn deploy trực tiếp từ GitHub:

```bash
gcloud run deploy fit-check \
  --source=https://source.developers.google.com/projects/YOUR_PROJECT_ID/repos/github_YOUR_USERNAME_YOUR_REPO \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest \
  --memory=2Gi \
  --timeout=300
```

### 4.4. Xem Logs và URL

Sau khi deploy xong, bạn sẽ nhận được URL:

```
Service [fit-check] revision [fit-check-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://fit-check-xxxxx-uc.a.run.app
```

**Lưu URL này lại!**

### 4.5. Kiểm Tra Deployment

```bash
# Xem thông tin service
gcloud run services describe fit-check --region=us-central1

# Xem logs
gcloud run services logs read fit-check --region=us-central1

# Mở URL trong browser
# https://fit-check-xxxxx-uc.a.run.app
```

---

## 5. Cấu Hình Secrets

### 5.1. Tạo Secret Mới

```bash
# Tạo secret
echo -n "YOUR_SECRET_VALUE" | gcloud secrets create secret_name --data-file=-
```

### 5.2. Cập Nhật Secret

```bash
# Cập nhật secret
echo -n "NEW_VALUE" | gcloud secrets versions add secret_name --data-file=-
```

### 5.3. Xem Danh Sách Secrets

```bash
gcloud secrets list
```

### 5.4. Cập Nhật Service với Secret Mới

```bash
gcloud run services update fit-check \
  --region=us-central1 \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest
```

---

## 6. Tự Động Deploy với GitHub Actions

Tạo file `.github/workflows/deploy.yml` để tự động deploy khi push code:

### 6.1. Tạo GitHub Actions Workflow

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy fit-check \
            --source=. \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --update-secrets=GEMINI_API_KEY=gemini_api_key:latest \
            --memory=2Gi \
            --timeout=300 \
            --quiet
```

### 6.2. Tạo Service Account cho GitHub Actions

```bash
# Tạo service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account"

# Gán quyền
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Tạo key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 6.3. Thêm Secrets vào GitHub

1. Vào GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Thêm các secrets:
   - `GCP_SA_KEY`: Nội dung file `key.json` vừa tạo
   - `GCP_PROJECT_ID`: ID của Google Cloud project

### 6.4. Test Auto-Deploy

```bash
# Push một thay đổi nhỏ
echo "# Test" >> README.md
git add .
git commit -m "Test auto-deploy"
git push
```

Kiểm tra GitHub Actions tab để xem deployment progress.

---

## 🔧 Troubleshooting

### Lỗi: "Permission denied"

**Giải pháp:**
```bash
# Kiểm tra authentication
gcloud auth list

# Login lại
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### Lỗi: "API not enabled"

**Giải pháp:**
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Lỗi: "Secret not found"

**Giải pháp:**
```bash
# Kiểm tra secrets
gcloud secrets list

# Tạo secret nếu chưa có
echo -n "YOUR_VALUE" | gcloud secrets create secret_name --data-file=-
```

### Build Failed

**Kiểm tra:**
1. Dockerfile có đúng không
2. Dependencies trong package.json
3. Logs: `gcloud run services logs read fit-check --region=us-central1`

---

## 📝 Checklist Deploy

- [ ] Code đã được push lên GitHub
- [ ] Google Cloud SDK đã được cài đặt
- [ ] Đã đăng nhập vào Google Cloud
- [ ] Đã enable các APIs cần thiết
- [ ] Đã tạo secrets trong Secret Manager
- [ ] Đã deploy thành công
- [ ] Đã test ứng dụng trên Cloud Run URL
- [ ] (Tùy chọn) Đã setup GitHub Actions

---

## 🚀 Sau Khi Deploy

1. **Lưu URL** của Cloud Run service
2. **Test ứng dụng** trên production URL
3. **Monitor logs** để đảm bảo không có lỗi
4. **Setup custom domain** (nếu cần) trong Cloud Run console

---

**Chúc bạn deploy thành công! 🎉**

