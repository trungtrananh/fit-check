# Hướng Dẫn Setup Cloud Storage cho Fit-Check

## Tổng Quan

Ứng dụng đã được migrate từ Firestore sang Cloud Storage để lưu trữ credits persistent. Cloud Storage sẽ lưu các file JSON chứa:
- Credits của users (`credits-data/credits.json`)
- Credit codes (`credits-data/creditCodes.json`)
- Free trial claims (`credits-data/freeTrialClaims.json`)

## Bước 1: Tạo Cloud Storage Bucket

### Cách 1: Sử dụng Google Cloud Console (Khuyến nghị)

1. **Truy cập Google Cloud Console**
   - Vào: https://console.cloud.google.com/
   - Chọn project của bạn: `gen-lang-client-0724533138`

2. **Tạo Bucket**
   - Vào menu **Cloud Storage** > **Buckets**
   - Click **CREATE BUCKET**
   - Đặt tên bucket: `fit-check-data` (hoặc tên khác nếu muốn)
   - Chọn **Location type**: `Region`
   - Chọn **Region**: `asia-southeast1` (Singapore) hoặc region gần nhất
   - Chọn **Storage class**: `Standard`
   - Chọn **Access control**: `Uniform`
   - Click **CREATE**

### Cách 2: Sử dụng gcloud CLI

```bash
# Set project
gcloud config set project gen-lang-client-0724533138

# Tạo bucket
gsutil mb -p gen-lang-client-0724533138 -c STANDARD -l asia-southeast1 gs://fit-check-data
```

## Bước 2: Cấp Quyền cho Cloud Run Service Account

Cloud Run service account cần quyền ghi vào bucket.

### Cách 1: Sử dụng Google Cloud Console

1. **Tìm Cloud Run Service Account**
   - Vào **Cloud Run** > chọn service `fit-check`
   - Xem **Service account** (thường là: `PROJECT_NUMBER-compute@developer.gserviceaccount.com`)
   - Hoặc vào **IAM & Admin** > **Service Accounts** để tìm

2. **Cấp quyền Storage Admin**
   - Vào **IAM & Admin** > **IAM**
   - Tìm service account của Cloud Run
   - Click **Edit** (icon bút chì)
   - Click **ADD ANOTHER ROLE**
   - Chọn role: **Storage Admin** hoặc **Storage Object Admin**
   - Click **SAVE**

### Cách 2: Sử dụng gcloud CLI

```bash
# Lấy project number
PROJECT_NUMBER=$(gcloud projects describe gen-lang-client-0724533138 --format="value(projectNumber)")

# Cấp quyền Storage Admin cho Cloud Run service account
gcloud projects add-iam-policy-binding gen-lang-client-0724533138 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.admin"
```

**Lưu ý**: Nếu muốn quyền hạn chế hơn, có thể dùng:
- `roles/storage.objectAdmin` - Chỉ quản lý objects, không quản lý bucket
- `roles/storage.objectCreator` - Chỉ tạo objects, không xóa

## Bước 3: Cấu Hình Environment Variable (Tùy chọn)

Nếu bạn đặt tên bucket khác `fit-check-data`, cần set environment variable:

1. Vào **Cloud Run** > chọn service `fit-check`
2. Click **EDIT & DEPLOY NEW REVISION**
3. Vào tab **Variables & Secrets**
4. Click **ADD VARIABLE**
5. Thêm:
   - **Name**: `GCS_BUCKET_NAME`
   - **Value**: `your-bucket-name`
6. Click **DEPLOY**

## Bước 4: Kiểm Tra

Sau khi deploy, kiểm tra logs:

1. Vào **Cloud Run** > chọn service `fit-check`
2. Click tab **LOGS**
3. Tìm dòng: `✅ Cloud Storage initialized (bucket: fit-check-data)`
4. Nếu thấy dòng này, Cloud Storage đã hoạt động!

## Bước 5: Xem Dữ Liệu (Tùy chọn)

Để xem dữ liệu đã lưu:

1. Vào **Cloud Storage** > **Buckets** > `fit-check-data`
2. Vào folder `credits-data/`
3. Sẽ thấy 3 files:
   - `credits.json` - Credits của users
   - `creditCodes.json` - Credit codes
   - `freeTrialClaims.json` - Free trial claims

## Troubleshooting

### Lỗi: "Bucket does not exist"
- Kiểm tra tên bucket đã đúng chưa
- Kiểm tra bucket đã được tạo trong cùng project chưa
- Set environment variable `GCS_BUCKET_NAME` nếu cần

### Lỗi: "Permission denied"
- Kiểm tra Cloud Run service account đã có quyền Storage Admin chưa
- Đợi vài phút để IAM permissions propagate

### Server vẫn dùng in-memory storage
- Kiểm tra logs xem có lỗi gì không
- Kiểm tra bucket name và permissions
- Server sẽ tự động fallback về in-memory nếu Cloud Storage không khả dụng

## Lưu Ý

- **Chi phí**: Cloud Storage rất rẻ, khoảng $0.020/GB/tháng
- **Backup**: Files JSON có thể dễ dàng backup/restore
- **Performance**: Cloud Storage có latency thấp, phù hợp cho use case này
- **Scalability**: Cloud Storage tự động scale, không cần lo lắng

## Cấu Trúc Files

```
fit-check-data/
└── credits-data/
    ├── credits.json          # { "token1": { balance: 100, ... }, ... }
    ├── creditCodes.json      # { "CODE123": { credits: 100, used: false, ... }, ... }
    └── freeTrialClaims.json  # { "192.168.1.1": { token: "...", claimedAt: ... }, ... }
```

