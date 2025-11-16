# Hướng Dẫn Tạo Credit Codes - Chi Tiết Từng Bước

## 🎯 Tổng Quan

Có **3 cách** để tạo credit codes:

1. **Dùng Browser** (Dễ nhất - Khuyến nghị) ⭐⭐⭐
2. **Dùng Script** (Nhanh - Khuyến nghị) ⭐⭐
3. **Dùng API trực tiếp** (Qua curl/Postman) ⭐

---

## 🌐 Cách 1: Dùng Browser (Dễ nhất!)

### Bước 1: Đảm bảo server đang chạy

Mở terminal và chạy:
```bash
cd server
npm start
```

### Bước 2: Mở browser và truy cập URL

**Tạo code 25 credits:**
```
http://localhost:3000/api/admin/create-code?credits=25
```

**Tạo code 50 credits với code tùy chỉnh:**
```
http://localhost:3000/api/admin/create-code?credits=50&code=WELCOME50
```

### Bước 3: Copy code được tạo

Browser sẽ hiển thị trang với:
- ✅ Code đã được tạo
- 📋 Nút "Copy Code" để copy dễ dàng
- Thông tin số credits

**Ví dụ:**
- `http://localhost:3000/api/admin/create-code?credits=10` → Tạo code 10 credits
- `http://localhost:3000/api/admin/create-code?credits=25` → Tạo code 25 credits  
- `http://localhost:3000/api/admin/create-code?credits=50&code=VIP50` → Tạo code "VIP50" với 50 credits

---

## 📝 Cách 2: Dùng Script (Nhanh)

### Bước 1: Đảm bảo server đang chạy

Mở terminal và chạy:
```bash
cd server
npm start
```

Bạn sẽ thấy: `Server running on port 3000`

### Bước 2: Mở terminal mới và chạy script

**Windows (PowerShell hoặc CMD):**
```bash
cd server
node create-code.mjs 25
```

**Mac/Linux:**
```bash
cd server
node create-code.mjs 25
```

### Bước 3: Xem kết quả

Script sẽ hiển thị:
```
🔄 Đang tạo code...
   Credits: 25

✅ Code đã được tạo thành công!

📋 Thông tin code:
   Code: ABC123XYZ
   Credits: 25

💡 Người dùng có thể nhập code này trong ứng dụng để nhận credits.

📝 Lưu code này lại: ABC123XYZ
```

### Ví dụ tạo nhiều codes:

```bash
# Tạo code 10 credits
node create-code.mjs 10

# Tạo code 25 credits
node create-code.mjs 25

# Tạo code 50 credits với code tùy chỉnh
node create-code.mjs 50 WELCOME50

# Tạo code 100 credits với code tùy chỉnh
node create-code.mjs 100 VIP100
```

---

## 🌐 Cách 3: Dùng API Trực Tiếp

### Với curl (Mac/Linux/Git Bash trên Windows):

```bash
curl -X POST http://localhost:3000/api/admin/generate-code \
  -H "Content-Type: application/json" \
  -d '{"credits": 25}'
```

### Với PowerShell (Windows):

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/generate-code" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"credits": 25}'
```

### Với Postman:

1. Mở Postman
2. Tạo request mới:
   - **Method**: POST
   - **URL**: `http://localhost:3000/api/admin/generate-code`
   - **Headers**: 
     - Key: `Content-Type`
     - Value: `application/json`
   - **Body** (raw JSON):
     ```json
     {
       "credits": 25
     }
     ```
3. Click "Send"
4. Xem response:
   ```json
   {
     "success": true,
     "code": "ABC123XYZ",
     "credits": 25
     }
   ```

---

## 💻 Cách 3: Tạo Code Tùy Chỉnh

Bạn có thể chỉ định code cụ thể thay vì để hệ thống tự tạo:

### Dùng Script:
```bash
node create-code.mjs 50 WELCOME50
```

### Dùng API:
```bash
curl -X POST http://localhost:3000/api/admin/generate-code \
  -H "Content-Type: application/json" \
  -d '{"credits": 50, "code": "WELCOME50"}'
```

**Lưu ý**: Code sẽ tự động được chuyển thành chữ HOA.

---

## 📋 Ví Dụ Thực Tế

### Tạo codes cho chiến dịch marketing:

```bash
# Code chào mừng - 10 credits
node create-code.mjs 10 WELCOME10

# Code mùa hè - 25 credits  
node create-code.mjs 25 SUMMER2024

# Code VIP - 50 credits
node create-code.mjs 50 VIP50

# Code đặc biệt - 100 credits
node create-code.mjs 100 SPECIAL100
```

### Tạo nhiều codes cùng lúc:

**Windows PowerShell:**
```powershell
# Tạo 5 codes, mỗi code 25 credits
1..5 | ForEach-Object {
    node create-code.mjs 25
    Start-Sleep -Seconds 1
}
```

**Mac/Linux:**
```bash
# Tạo 5 codes, mỗi code 25 credits
for i in {1..5}; do
    node create-code.mjs 25
    sleep 1
done
```

---

## ✅ Kiểm Tra Code Đã Tạo

Hiện tại codes được lưu trong memory của server. Bạn có thể:

1. **Xem trong server logs** khi tạo code:
   ```
   Generated credit code: ABC123XYZ for 25 credits
   ```

2. **Test code trong ứng dụng**:
   - Mở app
   - Click "Buy Credits"
   - Nhập code vừa tạo
   - Kiểm tra credits được cộng

---

## ⚠️ Lưu Ý Quan Trọng

1. **Codes sẽ mất khi server restart** (vì đang dùng memory)
   - Giải pháp: Lưu codes vào file hoặc database

2. **Mỗi code chỉ dùng được 1 lần**
   - Sau khi redeem, code sẽ bị đánh dấu "used"

3. **Code không có expiration date**
   - Có thể dùng bất cứ lúc nào (cho đến khi được dùng)

4. **Không có giới hạn số lần tạo code**
   - Có thể tạo bao nhiêu code cũng được

---

## 🔧 Troubleshooting

### Lỗi: "ECONNREFUSED" hoặc "Failed to fetch"

**Nguyên nhân**: Server chưa chạy

**Giải pháp**:
```bash
cd server
npm start
```

Đảm bảo thấy: `Server running on port 3000`

### Lỗi: "Invalid credits amount"

**Nguyên nhân**: Số credits không hợp lệ

**Giải pháp**: Đảm bảo số credits là số nguyên dương:
```bash
# ✅ Đúng
node create-code.mjs 25

# ❌ Sai
node create-code.mjs -5
node create-code.mjs abc
```

### Lỗi: "Code already exists"

**Nguyên nhân**: Code tùy chỉnh đã tồn tại

**Giải pháp**: Dùng code khác hoặc để hệ thống tự tạo:
```bash
# Để hệ thống tự tạo (không chỉ định code)
node create-code.mjs 25
```

---

## 📝 Checklist Tạo Code

- [ ] Server đang chạy (`npm start` trong thư mục `server`)
- [ ] Đã chọn số credits muốn tạo
- [ ] (Tùy chọn) Đã nghĩ ra code tùy chỉnh
- [ ] Chạy script hoặc gọi API
- [ ] Copy code được tạo
- [ ] Lưu code vào file/notepad để phân phối
- [ ] Test code trong ứng dụng

---

## 🎁 Gợi Ý Codes Phổ Biến

- `WELCOME10` - 10 credits cho người mới
- `WELCOME25` - 25 credits cho người mới  
- `SUMMER2024` - Codes theo mùa
- `VIP50` - Codes cho khách VIP
- `FRIEND25` - Codes cho referral
- `BIRTHDAY100` - Codes đặc biệt

---

**Bây giờ bạn đã biết cách tạo codes! Hãy thử tạo code đầu tiên của bạn! 🚀**

