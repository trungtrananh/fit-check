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
- **Credits System** - Simple code-based credit redemption system
- **No Payment Gateway** - Independent credit code system

## 💳 Pricing

| Action | Cost |
|--------|------|
| Generate Model Photo | 2 credits |
| Virtual Try-On | 3 credits |
| Change Pose | 1 credit |

**Credit Codes:**
- Admin creates credit codes with any amount
- Users redeem codes to add credits to their account
- See [CREDIT_CODE_SYSTEM.md](CREDIT_CODE_SYSTEM.md) for details

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher)
- Gemini API Key ([Get one here](https://ai.google.dev/))

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

## 💰 Credit Code System

See detailed instructions in:
- [CREDIT_CODE_SYSTEM.md](CREDIT_CODE_SYSTEM.md) - Credit code system overview
- [HUONG_DAN_TAO_CODE.md](HUONG_DAN_TAO_CODE.md) - How to create credit codes

**Quick steps:**
1. Start the server
2. Create credit codes via browser: `http://localhost:3000/api/admin/create-code?credits=25`
3. Distribute codes to users
4. Users redeem codes in the app

## ☁️ Deploy to Google Cloud Run

### 1. Create Secrets

```bash
# Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini_api_key --data-file=-
```

### 2. Deploy

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

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **AI**: Google Gemini 2.5 Flash Image
- **Backend**: Node.js + Express
- **Credits**: Simple code-based redemption system
- **Deployment**: Google Cloud Run + Docker

## 📖 How It Works

1. **Upload Photo** → User uploads a selfie
2. **AI Transforms** → Gemini AI creates a professional model photo
3. **Choose Outfit** → Select clothing from wardrobe
4. **Virtual Try-On** → AI applies the outfit to your model
5. **Change Poses** → View from different angles
6. **Need More?** → Redeem credit codes to add credits

## 🔒 Security

- ✅ No user authentication required
- ✅ Credits tracked with verified tokens
- ✅ API keys secured on server-side
- ✅ Simple credit code system (no payment gateway)

## 📝 API Endpoints

### Gemini AI
- `POST /api/gemini/model-image` - Generate model photo
- `POST /api/gemini/virtual-tryon` - Apply outfit
- `POST /api/gemini/pose-variation` - Change pose

### Credits
- `POST /api/credits/deduct` - Deduct credits
- `POST /api/credits/sync` - Sync balance
- `POST /api/credits/redeem-code` - Redeem credit code

### Admin
- `POST /api/admin/generate-code` - Generate credit code (API)
- `GET /api/admin/create-code` - Create credit code (Browser)

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
