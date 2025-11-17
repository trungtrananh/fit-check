# Hướng Dẫn Cài Đặt Stripe - Thanh Toán Tự Động và Kích Hoạt Credits

Hướng dẫn từng bước để tích hợp Stripe vào ứng dụng Fit Check, cho phép người dùng thanh toán tự động và nhận credits ngay lập tức.

## 📋 Mục Lục

1. [Tạo Tài Khoản Stripe](#1-tạo-tài-khoản-stripe)
2. [Lấy API Keys](#2-lấy-api-keys)
3. [Tạo Sản Phẩm Credit Packages](#3-tạo-sản-phẩm-credit-packages)
4. [Cài Đặt Dependencies](#4-cài-đặt-dependencies)
5. [Cấu Hình Environment Variables](#5-cấu-hình-environment-variables)
6. [Cập Nhật Price IDs trong Code](#6-cập-nhật-price-ids-trong-code)
7. [Thiết Lập Webhook (Cho Production)](#7-thiết-lập-webhook-cho-production)
8. [Kiểm Tra và Test](#8-kiểm-tra-và-test)
9. [Xử Lý Routing Payment Success](#9-xử-lý-routing-payment-success)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Tạo Tài Khoản Stripe

### Bước 1.1: Đăng Ký
1. Truy cập [https://stripe.com](https://stripe.com)
2. Click **"Start now"** hoặc **"Sign up"**
3. Điền thông tin:
   - Email
   - Mật khẩu
   - Tên công ty/cá nhân
   - Quốc gia (chọn quốc gia bạn đang ở)

### Bước 1.2: Xác Thực Tài Khoản
- Stripe sẽ gửi email xác thực
- Đăng nhập vào Dashboard
- Hoàn tất thông tin business profile (có thể bỏ qua nếu đang test)

---

## 2. Lấy API Keys

### Bước 2.1: Vào Developer Dashboard
1. Đăng nhập vào [Stripe Dashboard](https://dashboard.stripe.com)
2. Click vào **"Developers"** ở menu bên trái
3. Chọn **"API keys"**

### Bước 2.2: Copy Keys
Bạn sẽ thấy 2 keys quan trọng:

**🔴 Secret Key** (giữ bí mật, chỉ dùng ở server):
- Test mode: `sk_test_...`
- Live mode: `sk_live_...`
- **Lưu lại** để dùng ở bước 5

**🟢 Publishable Key** (có thể dùng ở client, nhưng không cần trong project này):
- Test mode: `pk_test_...`
- Live mode: `pk_live_...`

> ⚠️ **Lưu ý**: Đảm bảo bạn đang ở **Test mode** (toggle ở góc trên bên phải) khi đang phát triển.

---

## 3. Tạo Sản Phẩm Credit Packages

Bạn cần tạo 4 sản phẩm trong Stripe Dashboard, mỗi sản phẩm tương ứng với một gói credits.

### Bước 3.1: Vào Products
1. Trong Stripe Dashboard, click **"Products"** ở menu bên trái
2. Click **"+ Add product"**

### Bước 3.2: Tạo Starter Pack (10 credits - $4.99)

1. **Name**: `Starter Pack`
2. **Description**: `10 credits for Fit Check virtual try-on`
3. **Pricing**:
   - Chọn **"One time"** (thanh toán một lần)
   - **Price**: `4.99`
   - **Currency**: `USD`
4. Click **"Save product"**
5. **QUAN TRỌNG**: Copy **Price ID** (bắt đầu bằng `price_...`) - ví dụ: `price_1ABC123xyz...`
   - Price ID sẽ hiển thị sau khi tạo xong
   - Click vào product vừa tạo để xem Price ID

### Bước 3.3: Tạo Popular Pack (25 credits - $9.99)

Lặp lại bước 3.2 với:
- **Name**: `Popular Pack`
- **Description**: `25 credits for Fit Check virtual try-on`
- **Price**: `9.99`
- Copy **Price ID**

### Bước 3.4: Tạo Pro Pack (50 credits - $14.99)

- **Name**: `Pro Pack`
- **Description**: `50 credits for Fit Check virtual try-on`
- **Price**: `14.99`
- Copy **Price ID**

### Bước 3.5: Tạo Mega Pack (100 credits - $24.99)

- **Name**: `Mega Pack`
- **Description**: `100 credits for Fit Check virtual try-on`
- **Price**: `24.99`
- Copy **Price ID**

### 📝 Lưu ý:
- Ghi lại tất cả 4 Price IDs vào một file tạm
- Format: `price_xxxxxxxxxxxxx`

---

## 4. Cài Đặt Dependencies

Dependencies đã được cài đặt trong `server/package.json`, nhưng hãy đảm bảo chúng đã được cài:

```bash
cd server
npm install
```

Kiểm tra `server/package.json` đã có:
- `stripe`: ^17.5.0
- `uuid`: ^11.0.3

---

## 5. Cấu Hình Environment Variables

### Bước 5.1: Tạo File .env

Trong thư mục `server/`, tạo file `.env`:

```bash
cd server
touch .env
```

Hoặc tạo file `.env` với nội dung:

### Bước 5.2: Thêm Variables

Mở file `server/.env` và thêm:

```env
# Gemini API Key (nếu chưa có)
GEMINI_API_KEY=your_gemini_api_key_here

# Stripe Secret Key (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Webhook Secret (sẽ lấy ở bước 7, để trống tạm thời)
STRIPE_WEBHOOK_SECRET=

# Server Port
PORT=3000
```

### Bước 5.3: Thay Thế Values

1. Thay `sk_test_your_secret_key_here` bằng Secret Key bạn đã copy ở bước 2
2. Thay `your_gemini_api_key_here` bằng Gemini API key của bạn (nếu chưa có)

> ⚠️ **QUAN TRỌNG**: 
> - File `.env` không được commit lên Git (đã có trong `.gitignore`)
> - Không chia sẻ Secret Key với ai
> - Test mode dùng `sk_test_...`, Live mode dùng `sk_live_...`

---

## 6. Cập Nhật Price IDs trong Code

Bây giờ bạn cần cập nhật các Price IDs vào code để ứng dụng biết sản phẩm nào tương ứng với gói nào.

### Bước 6.1: Mở File BuyCreditsModal.tsx

Mở file `components/BuyCreditsModal.tsx`

### Bước 6.2: Cập Nhật CREDIT_PACKAGES

Tìm đến dòng 16-46 và thay thế các `priceId` bằng Price IDs thật từ Stripe:

```typescript
const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 4.99,
    priceId: 'price_1ABC123xyz...', // ← Thay bằng Price ID thật từ Stripe
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 25,
    price: 9.99,
    priceId: 'price_1DEF456abc...', // ← Thay bằng Price ID thật
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 50,
    price: 14.99,
    priceId: 'price_1GHI789def...', // ← Thay bằng Price ID thật
  },
  {
    id: 'unlimited',
    name: 'Mega Pack',
    credits: 100,
    price: 24.99,
    priceId: 'price_1JKL012ghi...', // ← Thay bằng Price ID thật
  },
];
```

### Ví dụ thực tế:

```typescript
priceId: 'price_1Q2w3e4r5t6y7u8i9o0p', // Price ID từ Stripe Dashboard
```

---

## 7. Thiết Lập Webhook (Cho Production)

Webhook cho phép Stripe tự động thông báo server khi thanh toán thành công, giúp credits được cộng tự động.

### Bước 7.1: Local Development (Dùng Stripe CLI)

#### Cài Stripe CLI:
- **Windows**: Download từ [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Mac**: `brew install stripe/stripe-cli/stripe`
- **Linux**: Xem hướng dẫn trên trang Stripe

#### Login Stripe CLI:
```bash
stripe login
```

#### Forward Webhook Events:
```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

CLI sẽ hiển thị webhook signing secret (bắt đầu bằng `whsec_...`). Copy và thêm vào `server/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Bước 7.2: Production (Deploy lên Server)

#### 7.2.1: Lấy URL Production
Sau khi deploy ứng dụng lên server (ví dụ: Google Cloud Run), bạn sẽ có URL như:
```
https://your-app-name.run.app
```

#### 7.2.2: Tạo Webhook Endpoint trong Stripe Dashboard

1. Vào Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"+ Add endpoint"**
3. **Endpoint URL**: `https://your-app-name.run.app/api/payment/webhook`
4. **Description**: `Fit Check Payment Webhook`
5. **Events to send**: Chọn `checkout.session.completed`
6. Click **"Add endpoint"**
7. Copy **Signing secret** (bắt đầu bằng `whsec_...`)
8. Thêm vào environment variables trên server:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 8. Kiểm Tra và Test

### Bước 8.1: Khởi Động Server

```bash
cd server
npm start
```

Server sẽ chạy tại `http://localhost:3000`

### Bước 8.2: Khởi Động Frontend (nếu chưa build)

```bash
npm run dev
```

Hoặc build và chạy qua server:
```bash
npm run build
```

### Bước 8.3: Test Flow Thanh Toán

1. **Mở ứng dụng** trong browser: `http://localhost:3000`
2. **Kiểm tra credits**: Bạn sẽ có 5 credits miễn phí
3. **Dùng hết credits**: 
   - Generate model (2 credits)
   - Try on outfit (3 credits)
   - → Còn 0 credits
4. **Click "Buy More Credits"** hoặc nút credits ở góc trên
5. **Chọn một gói** (ví dụ: Starter Pack)
6. **Test Card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Bất kỳ ngày trong tương lai (ví dụ: `12/25`)
   - CVC: Bất kỳ 3 số (ví dụ: `123`)
   - ZIP: Bất kỳ 5 số (ví dụ: `12345`)
7. **Complete payment**
8. **Kiểm tra**: Credits sẽ được cộng vào tài khoản

### Bước 8.4: Test Cards Khác

Stripe cung cấp nhiều test cards để test các trường hợp khác:

| Mục đích | Card Number |
|----------|-------------|
| Thanh toán thành công | `4242 4242 4242 4242` |
| Thanh toán bị từ chối | `4000 0000 0000 0002` |
| Cần xác thực 3D Secure | `4000 0025 0000 3155` |

Xem thêm: [Stripe Test Cards](https://stripe.com/docs/testing)

---

## 9. Xử Lý Routing Payment Success

Ứng dụng cần xử lý route `/payment-success` để hiển thị trang thành công sau khi thanh toán.

### Kiểm tra xem đã có routing chưa:

File `server/index.js` đã có xử lý:
- Success URL: `/payment-success?session_id=...&token=...&credits=...`
- Server serve static files từ `dist/` folder

### Nếu cần thêm routing trong React:

Nếu bạn muốn dùng React Router, có thể thêm vào `App.tsx` hoặc tạo file routing riêng. Nhưng hiện tại ứng dụng đang dùng SPA đơn giản, nên có thể thêm logic kiểm tra URL:

```typescript
// Trong App.tsx hoặc index.tsx
useEffect(() => {
  if (window.location.pathname === '/payment-success') {
    // Component PaymentSuccess sẽ tự xử lý
  }
}, []);
```

Hoặc tạo file `index.tsx` mới với routing:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PaymentSuccess from './components/PaymentSuccess';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);

// Simple routing based on pathname
const currentPath = window.location.pathname;

if (currentPath === '/payment-success') {
  root.render(
    <React.StrictMode>
      <PaymentSuccess onComplete={() => window.location.href = '/'} />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
```

---

## 10. Troubleshooting

### ❌ Lỗi: "Failed to create checkout session"

**Nguyên nhân có thể:**
- Stripe Secret Key sai hoặc chưa được set
- Price ID không đúng
- Server chưa khởi động

**Giải pháp:**
1. Kiểm tra `server/.env` có `STRIPE_SECRET_KEY` đúng không
2. Kiểm tra Price IDs trong `BuyCreditsModal.tsx` có khớp với Stripe Dashboard không
3. Kiểm tra server logs: `cd server && npm start`
4. Đảm bảo đang dùng Test mode keys với Test mode products

### ❌ Lỗi: "Credits not updating after payment"

**Nguyên nhân:**
- Webhook chưa được cấu hình
- Webhook secret sai
- Payment verification failed

**Giải pháp:**
1. Kiểm tra webhook đã được setup chưa (bước 7)
2. Kiểm tra `STRIPE_WEBHOOK_SECRET` trong `.env`
3. Kiểm tra server logs khi thanh toán
4. Thử verify payment manually qua `/api/payment/verify`

### ❌ Lỗi: "Payment verification failed"

**Nguyên nhân:**
- Session ID không hợp lệ
- Payment chưa hoàn tất

**Giải pháp:**
1. Đảm bảo đã complete payment trên Stripe Checkout
2. Kiểm tra URL redirect có đầy đủ params không
3. Kiểm tra server logs

### ❌ Lỗi: "Stripe not configured"

**Nguyên nhân:**
- `STRIPE_SECRET_KEY` không được set trong `.env`
- Server chưa restart sau khi thêm `.env`

**Giải pháp:**
1. Kiểm tra file `server/.env` tồn tại
2. Kiểm tra `STRIPE_SECRET_KEY` có giá trị
3. Restart server: `cd server && npm start`

### ⚠️ Credits bị reset khi refresh trang

**Nguyên nhân:**
- Credits được lưu trong localStorage
- Server dùng in-memory store (sẽ mất khi restart)

**Giải pháp:**
- Hiện tại đây là behavior mong muốn cho demo
- Trong production, nên dùng database (PostgreSQL/MongoDB) để lưu credits

---

## ✅ Checklist Hoàn Thành

Trước khi deploy production, đảm bảo:

- [ ] Đã tạo 4 products trong Stripe Dashboard
- [ ] Đã copy tất cả Price IDs
- [ ] Đã cập nhật Price IDs vào `BuyCreditsModal.tsx`
- [ ] Đã tạo file `server/.env` với Stripe Secret Key
- [ ] Đã test thanh toán thành công với test card
- [ ] Đã setup webhook cho production (nếu deploy)
- [ ] Đã test credits được cộng sau thanh toán
- [ ] Đã kiểm tra error handling

---

## 🚀 Chuyển Sang Live Mode

Khi sẵn sàng nhận thanh toán thật:

1. **Switch Stripe sang Live Mode**
   - Toggle ở góc trên Dashboard
   
2. **Tạo lại Products trong Live Mode**
   - Products trong Test mode không dùng được ở Live mode
   - Tạo lại 4 products với cùng giá
   - Copy Price IDs mới

3. **Cập Nhật Code**
   - Thay Price IDs trong `BuyCreditsModal.tsx`
   - Thay `sk_test_...` bằng `sk_live_...` trong `.env`

4. **Setup Webhook Live Mode**
   - Tạo webhook endpoint mới trong Live mode
   - Copy webhook secret mới

5. **Test với Card Thật**
   - Test với số tiền nhỏ trước
   - Kiểm tra credits được cộng đúng

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra [Stripe Documentation](https://stripe.com/docs)
2. Kiểm tra server logs: `cd server && npm start`
3. Kiểm tra browser console (F12)
4. Kiểm tra Stripe Dashboard → Logs

---

**Chúc bạn cài đặt thành công! 🎉**


