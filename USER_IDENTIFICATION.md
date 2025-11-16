# Cách Hệ Thống Nhận Diện Người Dùng (Không Cần Đăng Nhập)

## 🔑 Cơ Chế Nhận Diện

Hệ thống sử dụng **Token-based identification** được lưu trong **localStorage** của browser.

### 1. Token System

**Frontend (Browser):**
- Token được lưu trong `localStorage` với key `user_credits`
- Format: `{ balance: number, token: string, lastUpdated: number }`
- Token ban đầu: `'free_trial'` cho người dùng mới

**Backend (Server):**
- Server lưu credits theo token trong memory: `creditStore Map`
- Key: `token` (string)
- Value: `{ balance: number, createdAt: number }`

### 2. Flow Hoạt Động

```
┌─────────────┐
│   Browser   │
│ localStorage│
│  token: xxx │
└──────┬──────┘
       │
       │ Request với token
       ▼
┌─────────────┐
│   Server    │
│ creditStore │
│ Map<token>  │
└─────────────┘
```

**Ví dụ:**
1. Người dùng lần đầu truy cập → Token: `'free_trial'`
2. Browser lưu vào localStorage: `{ balance: 5, token: 'free_trial', lastUpdated: ... }`
3. Mỗi request gửi token lên server
4. Server lookup credits theo token trong `creditStore`

### 3. Code Thực Tế

**Frontend (`services/creditService.ts`):**
```typescript
// Lấy token từ localStorage
const credits = getCredits(); // { balance: 5, token: 'free_trial', ... }

// Gửi token lên server
fetch('/api/credits/deduct', {
  body: JSON.stringify({
    token: credits.token, // 'free_trial'
    amount: 2,
  })
});
```

**Backend (`server/index.js`):**
```javascript
// Server nhận token và lookup credits
const getOrCreateCredits = (token) => {
  if (!creditStore.has(token)) {
    creditStore.set(token, {
      balance: token === 'free_trial' ? 5 : 0,
      createdAt: Date.now(),
    });
  }
  return creditStore.get(token);
};
```

## ⚠️ Hạn Chế và Vấn Đề

### 1. Token Cố Định cho Người Dùng Mới

**Vấn đề:**
- Tất cả người dùng mới đều có token `'free_trial'`
- Nếu nhiều người cùng dùng, họ sẽ share credits!

**Ví dụ:**
- User A: Token `'free_trial'`, balance: 5
- User B: Token `'free_trial'`, balance: 5
- User A dùng 2 credits → Balance còn 3
- User B refresh → Balance cũng là 3 (vì cùng token!)

### 2. Token Không Đổi

**Vấn đề:**
- Token không được generate mới cho mỗi user
- Người dùng có thể clear localStorage và nhận lại 5 credits miễn phí

### 3. Server Memory Storage

**Vấn đề:**
- Credits lưu trong memory → Mất khi server restart
- Không persistent giữa các instances (nếu có nhiều Cloud Run instances)

## ✅ Giải Pháp Đề Xuất

### Giải Pháp 1: Generate Unique Token cho Mỗi User

**Cập nhật `creditService.ts`:**
```typescript
// Generate unique token cho mỗi user
const generateUniqueToken = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const getCredits = (): UserCredits => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Generate unique token cho user mới
  const initialCredits: UserCredits = {
    balance: INITIAL_FREE_CREDITS,
    token: generateUniqueToken(), // Thay vì 'free_trial'
    lastUpdated: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCredits));
  return initialCredits;
};
```

### Giải Pháp 2: Sử Dụng Browser Fingerprint

**Kết hợp nhiều thông tin:**
- User Agent
- Screen resolution
- Timezone
- Language
- Canvas fingerprint
- WebGL fingerprint

**Ví dụ:**
```typescript
const generateFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  
  // Hash fingerprint
  return btoa(fingerprint).substring(0, 32);
};
```

### Giải Pháp 3: Sử Dụng Database

**Thay vì memory storage:**
- Lưu credits vào database (Firestore, PostgreSQL, MongoDB)
- Token là primary key
- Persistent và scalable

**Ví dụ với Firestore:**
```javascript
// Server
const getOrCreateCredits = async (token) => {
  const doc = await db.collection('credits').doc(token).get();
  if (doc.exists) {
    return doc.data();
  }
  
  // Create new
  await db.collection('credits').doc(token).set({
    balance: 5,
    createdAt: Date.now(),
  });
  return { balance: 5, createdAt: Date.now() };
};
```

## 🔒 Bảo Mật

### Vấn Đề Hiện Tại

1. **Token có thể bị giả mạo:**
   - User có thể thay đổi token trong localStorage
   - User có thể dùng token của người khác (nếu biết)

2. **Không có rate limiting:**
   - User có thể spam requests
   - Không có giới hạn số lần redeem code

3. **Credits có thể bị reset:**
   - Clear localStorage → Nhận lại 5 credits miễn phí
   - Dùng Incognito mode → Tạo user mới

### Giải Pháp Bảo Mật

1. **Server-side validation:**
   - Verify token format
   - Rate limiting per token
   - Track IP address

2. **Token expiration:**
   - Set expiration date cho tokens
   - Require refresh token

3. **Database với constraints:**
   - Unique token constraint
   - Track device/browser info
   - Limit số lần tạo token mới từ cùng IP

## 📊 Tóm Tắt

**Hiện tại:**
- ✅ Đơn giản, không cần đăng nhập
- ✅ Hoạt động ngay lập tức
- ❌ Không an toàn (share token)
- ❌ Không persistent (mất khi restart)
- ❌ Dễ bị abuse (clear localStorage)

**Khuyến nghị:**
1. **Ngay lập tức:** Generate unique token cho mỗi user
2. **Ngắn hạn:** Thêm rate limiting và validation
3. **Dài hạn:** Migrate sang database (Firestore/PostgreSQL)

---

**Bạn có muốn tôi implement giải pháp generate unique token ngay bây giờ không?**

