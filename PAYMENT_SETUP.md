# Payment System Setup Guide

## Overview

This app uses a **Credits-Based Payment System** with Stripe integration. Users don't need to log in - credits are tracked using unique tokens stored in localStorage.

## Features

- ✅ **No Login Required**: Users start with 5 free trial credits
- ✅ **Pay-as-you-go**: Buy credits only when needed
- ✅ **Secure**: Stripe handles all payment processing
- ✅ **Simple**: Credits tracked with verified tokens

## Credit Costs

| Action | Cost |
|--------|------|
| Generate Model Photo | 2 credits |
| Virtual Try-On | 3 credits |
| Pose Variation | 1 credit |

## Setup Instructions

### 1. Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a Stripe account
3. Complete your business profile

### 2. Get Stripe API Keys

1. Go to **Developers** → **API keys**
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)

### 3. Create Credit Packages as Products

In Stripe Dashboard:

1. Go to **Products** → **Add Product**

Create these 4 products:

#### Starter Pack
- **Name**: Starter Pack
- **Description**: 10 credits for Fit Check
- **Price**: $4.99 USD (One-time payment)
- **Copy the Price ID** (starts with `price_`)

#### Popular Pack
- **Name**: Popular Pack  
- **Description**: 25 credits for Fit Check
- **Price**: $9.99 USD
- **Copy the Price ID**

#### Pro Pack
- **Name**: Pro Pack
- **Description**: 50 credits for Fit Check
- **Price**: $14.99 USD
- **Copy the Price ID**

#### Mega Pack
- **Name**: Mega Pack
- **Description**: 100 credits for Fit Check
- **Price**: $24.99 USD
- **Copy the Price ID**

### 4. Update Price IDs in Code

Edit `components/BuyCreditsModal.tsx`:

```typescript
const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 4.99,
    priceId: 'price_YOUR_STARTER_ID_HERE', // ← Update this
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 25,
    price: 9.99,
    priceId: 'price_YOUR_POPULAR_ID_HERE', // ← Update this
    popular: true,
  },
  // ... update others
];
```

### 5. Configure Environment Variables

#### Local Development

Create `server/.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=3000
```

#### Cloud Run Deployment

```bash
# Create secrets
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini_api_key --data-file=-
echo -n "YOUR_STRIPE_SECRET_KEY" | gcloud secrets create stripe_secret_key --data-file=-

# Deploy with secrets
gcloud run deploy fit-check \
  --source=. \
  --region=us-central1 \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest,STRIPE_SECRET_KEY=stripe_secret_key:latest \
  --set-build-env-vars VITE_GOOGLE_CLIENT_ID=optional \
  --memory=2Gi \
  --timeout=300
```

### 6. Set Up Stripe Webhooks (Production)

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://your-app-url.com/api/payment/webhook`
3. **Events to send**: Select `checkout.session.completed`
4. Copy the **Signing secret** (starts with `whsec_`)
5. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

## Testing

### Test Mode

Stripe test mode uses test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future date for expiry
- Any 3 digits for CVC

### Test Flow

1. Start app → Get 5 free credits
2. Generate model (costs 2 credits) → 3 remaining
3. Try on outfit (costs 3 credits) → 0 remaining
4. Click "Buy More Credits"
5. Select a package
6. Use test card `4242 4242 4242 4242`
7. Complete payment
8. Get redirected back with credits added

## Going Live

1. Switch Stripe to **Live mode**
2. Replace test API keys with live keys
3. Update webhook endpoint for production URL
4. Test with real card (small amount)
5. Monitor transactions in Stripe Dashboard

## Architecture

```
User → Frontend (localStorage) → Server APIs → Stripe
                                    ↓
                                In-Memory Store
                                (use DB in production)
```

### Security Notes

- ✅ API keys only on server-side
- ✅ Credits verified by server
- ✅ Stripe handles PCI compliance
- ✅ Webhooks validate payment
- ⚠️ In production: Replace in-memory store with database (PostgreSQL/MongoDB)

## API Endpoints

### Credit Management
- `POST /api/credits/deduct` - Deduct credits
- `POST /api/credits/sync` - Sync credits

### Payment
- `POST /api/payment/create-checkout` - Create Stripe checkout
- `POST /api/payment/webhook` - Stripe webhook handler
- `POST /api/payment/verify` - Verify payment manually

## Troubleshooting

### Credits not updating after payment
- Check webhook is configured
- Verify webhook secret is correct
- Check server logs for webhook events

### Payment fails
- Verify Stripe secret key is correct
- Check product Price IDs match
- Ensure test mode matches (test key = test products)

### Credits show 0 immediately
- Check server is returning correct balance
- Verify credit deduction logic
- Check browser localStorage

## Support

For issues:
1. Check server logs
2. Check browser console
3. Check Stripe Dashboard → Logs
4. Contact: your-support-email@domain.com

