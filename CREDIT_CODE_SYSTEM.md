# Hệ Thống Credit Code - Hướng Dẫn Sử Dụng

Ứng dụng đã được cập nhật để sử dụng hệ thống **Credit Code** đơn giản thay vì thanh toán qua Stripe. Người dùng có thể nhập code để nhận credits.

## 📋 Tổng Quan

- ✅ **Không cần payment gateway** - Hoàn toàn độc lập
- ✅ **Đơn giản** - Chỉ cần nhập code để nhận credits
- ✅ **Dễ quản lý** - Admin tạo code và phân phối cho người dùng

## 🔑 Cách Tạo Credit Code

### Qua API (Khuyến nghị)

Gọi API để tạo code mới:

```bash
curl -X POST http://localhost:3000/api/admin/generate-code \
  -H "Content-Type: application/json" \
  -d '{"credits": 25}'
```

Response:
```json
{
  "success": true,
  "code": "ABC123XYZ",
  "credits": 25
}
```

### Tạo Code Tùy Chỉnh

Bạn cũng có thể chỉ định code cụ thể:

```bash
curl -X POST http://localhost:3000/api/admin/generate-code \
  -H "Content-Type: application/json" \
  -d '{"credits": 50, "code": "WELCOME50"}'
```

## 👤 Cách Người Dùng Sử Dụng Code

1. **Mở ứng dụng** và click vào nút "Buy Credits" hoặc hiển thị credits
2. **Nhập code** vào form (ví dụ: `ABC123XYZ`)
3. **Click "Redeem Code"**
4. **Credits sẽ được cộng** vào tài khoản ngay lập tức

## 🔒 Bảo Mật

### Trong Production

⚠️ **QUAN TRỌNG**: API `/api/admin/generate-code` hiện tại không có authentication. Bạn cần:

1. **Thêm authentication** cho endpoint admin:
   ```javascript
   // Thêm middleware authentication
   const authenticateAdmin = (req, res, next) => {
     const adminToken = req.headers['admin-token'];
     if (adminToken !== process.env.ADMIN_SECRET_TOKEN) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   };

   app.post('/api/admin/generate-code', authenticateAdmin, (req, res) => {
     // ... existing code
   });
   ```

2. **Sử dụng database** thay vì in-memory store:
   - Lưu codes vào database (PostgreSQL, MongoDB, etc.)
   - Track usage và prevent duplicate redemption
   - Set expiration dates cho codes

3. **Rate limiting** để tránh abuse

## 📊 Quản Lý Codes

### Xem Codes Đã Tạo

Hiện tại codes được lưu trong memory, sẽ mất khi server restart. Trong production, bạn nên:

- Lưu vào database
- Tạo admin dashboard để quản lý codes
- Track usage statistics

### Ví Dụ Database Schema

```sql
CREATE TABLE credit_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by_token VARCHAR(255),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

## 🎯 Use Cases

### 1. Promotional Codes
Tạo codes cho chiến dịch marketing:
- `WELCOME10` - 10 credits cho người dùng mới
- `SUMMER2024` - 25 credits cho event mùa hè
- `VIP50` - 50 credits cho khách hàng VIP

### 2. Gift Codes
Phân phối codes như quà tặng:
- Tạo codes với số credits khác nhau
- Gửi cho người dùng qua email, SMS, hoặc social media

### 3. Referral System
Tích hợp với hệ thống referral:
- Tự động tạo code khi người dùng giới thiệu bạn bè
- Reward cả người giới thiệu và người được giới thiệu

## 🔧 API Endpoints

### Redeem Code
```
POST /api/credits/redeem-code
Body: {
  "code": "ABC123",
  "token": "user_token"
}
```

### Generate Code (Admin)
```
POST /api/admin/generate-code
Body: {
  "credits": 25,
  "code": "OPTIONAL_CUSTOM_CODE"
}
```

## 📝 Ví Dụ Workflow

### Scenario: Tạo và phân phối codes

1. **Admin tạo codes**:
   ```bash
   # Tạo 10 codes, mỗi code 25 credits
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/admin/generate-code \
       -H "Content-Type: application/json" \
       -d '{"credits": 25}'
   done
   ```

2. **Lưu codes vào file hoặc database**:
   ```
   CODE1: ABC123XYZ - 25 credits
   CODE2: DEF456UVW - 25 credits
   ...
   ```

3. **Phân phối cho người dùng**:
   - Gửi qua email
   - Hiển thị trên website
   - Share trên social media

4. **Người dùng redeem**:
   - Mở app → Click "Buy Credits"
   - Nhập code → Nhận credits

## ⚠️ Lưu Ý

1. **Codes sẽ mất khi server restart** (nếu dùng in-memory store)
2. **Mỗi code chỉ dùng được 1 lần**
3. **Không có expiration date** (cần thêm trong production)
4. **Không có giới hạn số lần redeem** (cần thêm rate limiting)

## 🚀 Cải Tiến Cho Production

1. **Database Integration**
   - Lưu codes vào database
   - Track usage và analytics

2. **Admin Dashboard**
   - UI để tạo và quản lý codes
   - Xem statistics và usage

3. **Code Features**
   - Expiration dates
   - Usage limits (số lần có thể dùng)
   - Minimum/maximum credits

4. **Security**
   - Authentication cho admin endpoints
   - Rate limiting
   - Code validation và sanitization

5. **Notifications**
   - Email khi code được redeem
   - Alert khi code sắp hết hạn

---

**Hệ thống này đơn giản và dễ sử dụng, phù hợp cho MVP hoặc ứng dụng nhỏ. Với production scale lớn, nên tích hợp database và các tính năng bảo mật nâng cao.**

