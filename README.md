<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Fit Check - AI Virtual Try-On App 👗✨

A powerful virtual try-on application powered by Google Gemini AI. Upload your photo, try on clothes virtually, and see how they look on you in different poses - all without needing to log in!

**View in AI Studio**: https://ai.studio/apps/drive/1jD2dbucTnyqPkbC1t7IJ8Et8aGPjBH-X

## 🎯 Features

- **No Login Required** - Start using immediately with 5 free trial credits
- **AI Model Generation** - Transform your selfie into a professional fashion model photo
- **Virtual Try-On** - See how clothes look on you with photorealistic AI
- **Multiple Poses** - View your outfit from 6 different angles
- **Credits System** - Pay only for what you use with flexible credit packages
- **Secure Payments** - Powered by Stripe for safe transactions

## 💳 Pricing

| Action | Cost |
|--------|------|
| Generate Model Photo | 2 credits |
| Virtual Try-On | 3 credits |
| Change Pose | 1 credit |

**Credit Packages:**
- Starter Pack: 10 credits - $4.99
- Popular Pack: 25 credits - $9.99
- Pro Pack: 50 credits - $14.99
- Mega Pack: 100 credits - $24.99

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher)
- Gemini API Key ([Get one here](https://ai.google.dev/))
- Stripe Account (for payment processing)

### Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/trungtrananh/fit-check.git
   cd fit-check
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Set up environment variables**
   
   Create `server/.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   PORT=3000
   ```

4. **Build the frontend**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   cd server
   npm start
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 💰 Payment Setup

See detailed setup instructions in [PAYMENT_SETUP.md](PAYMENT_SETUP.md)

**Quick steps:**
1. Create Stripe account
2. Get API keys
3. Create products in Stripe Dashboard
4. Update Price IDs in `components/BuyCreditsModal.tsx`
5. Configure environment variables

## ☁️ Deploy to Google Cloud Run

### 1. Create Secrets

```bash
# Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini_api_key --data-file=-

# Stripe Secret Key
echo -n "YOUR_STRIPE_SECRET_KEY" | gcloud secrets create stripe_secret_key --data-file=-
```

### 2. Deploy

```bash
gcloud run deploy fit-check \
  --source=. \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest,STRIPE_SECRET_KEY=stripe_secret_key:latest \
  --memory=2Gi \
  --timeout=300
```

### 3. Configure Stripe Webhook

After deployment:
1. Get your Cloud Run URL
2. Add webhook in Stripe Dashboard: `https://your-url.com/api/payment/webhook`
3. Select event: `checkout.session.completed`
4. Create secret for webhook and add to Cloud Run

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **AI**: Google Gemini 2.5 Flash Image
- **Backend**: Node.js + Express
- **Payment**: Stripe
- **Deployment**: Google Cloud Run + Docker

## 📖 How It Works

1. **Upload Photo** → User uploads a selfie
2. **AI Transforms** → Gemini AI creates a professional model photo
3. **Choose Outfit** → Select clothing from wardrobe
4. **Virtual Try-On** → AI applies the outfit to your model
5. **Change Poses** → View from different angles
6. **Need More?** → Buy credits when you run out

## 🔒 Security

- ✅ No user authentication required
- ✅ Credits tracked with verified tokens
- ✅ API keys secured on server-side
- ✅ Stripe handles all payment processing
- ✅ PCI DSS compliant

## 📝 API Endpoints

### Gemini AI
- `POST /api/gemini/model-image` - Generate model photo
- `POST /api/gemini/virtual-tryon` - Apply outfit
- `POST /api/gemini/pose-variation` - Change pose

### Credits
- `POST /api/credits/deduct` - Deduct credits
- `POST /api/credits/sync` - Sync balance

### Payment
- `POST /api/payment/create-checkout` - Create Stripe session
- `POST /api/payment/webhook` - Handle Stripe events
- `POST /api/payment/verify` - Verify payment

## 🧪 Testing

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date
- Any 3-digit CVC

## 📄 License

Apache-2.0

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Check [PAYMENT_SETUP.md](PAYMENT_SETUP.md) for payment issues

---

Built with ❤️ using Google Gemini AI
