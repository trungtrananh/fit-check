import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// In-memory credit store (in production, use a database)
const creditStore = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const model = 'gemini-2.5-flash-image';

// Helper function to parse data URL
const dataUrlToPart = (dataUrl) => {
  const arr = dataUrl.split(',');
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
  const mimeType = mimeMatch[1];
  const data = arr[1];
  return { inlineData: { mimeType, data } };
};

// Helper function to handle API response
const handleApiResponse = (response) => {
  if (response.promptFeedback?.blockReason) {
    const { blockReason, blockReasonMessage } = response.promptFeedback;
    const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
    throw new Error(errorMessage);
  }

  // Find the first image part in any candidate
  for (const candidate of response.candidates ?? []) {
    const imagePart = candidate.content?.parts?.find(part => part.inlineData);
    if (imagePart?.inlineData) {
      const { mimeType, data } = imagePart.inlineData;
      return `data:${mimeType};base64,${data}`;
    }
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
    throw new Error(errorMessage);
  }
  const textFeedback = response.text?.trim();
  const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
  throw new Error(errorMessage);
};

// Credit Management APIs
const INITIAL_FREE_CREDITS = 5;

// Initialize or get credits for a token
const getOrCreateCredits = (token) => {
  if (!creditStore.has(token)) {
    creditStore.set(token, {
      balance: token === 'free_trial' ? INITIAL_FREE_CREDITS : 0,
      createdAt: Date.now(),
    });
  }
  return creditStore.get(token);
};

// Deduct credits API
app.post('/api/credits/deduct', (req, res) => {
  try {
    const { amount, token, action } = req.body;
    
    if (!token || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const credits = getOrCreateCredits(token);
    
    if (credits.balance < amount) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        balance: credits.balance 
      });
    }

    credits.balance -= amount;
    creditStore.set(token, credits);

    console.log(`Deducted ${amount} credits for ${action}. New balance: ${credits.balance}`);

    res.json({
      success: true,
      newBalance: credits.balance,
      token,
    });
  } catch (error) {
    console.error('Credit deduction error:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

// Sync credits API
app.post('/api/credits/sync', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    const credits = getOrCreateCredits(token);

    res.json({
      balance: credits.balance,
      token,
    });
  } catch (error) {
    console.error('Credit sync error:', error);
    res.status(500).json({ error: 'Failed to sync credits' });
  }
});

// Stripe Payment APIs
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { priceId, credits } = req.body;
    
    // Generate a unique token for this purchase
    const purchaseToken = uuidv4();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${req.headers.origin || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}&token=${purchaseToken}&credits=${credits}`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/`,
      metadata: {
        token: purchaseToken,
        credits: credits.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Payment success webhook/handler
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).send('Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { token, credits } = session.metadata;

      // Add credits to the user's account
      const userCredits = getOrCreateCredits(token);
      userCredits.balance += parseInt(credits, 10);
      creditStore.set(token, userCredits);

      console.log(`Added ${credits} credits to token ${token}. New balance: ${userCredits.balance}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Manual payment verification (for success page)
app.post('/api/payment/verify', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { sessionId, token, credits } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Add credits
      const userCredits = getOrCreateCredits(token);
      userCredits.balance += parseInt(credits, 10);
      creditStore.set(token, userCredits);

      console.log(`Verified payment and added ${credits} credits to token ${token}`);

      res.json({
        success: true,
        newBalance: userCredits.balance,
        token,
      });
    } else {
      res.status(402).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Gemini API Routes
app.post('/api/gemini/model-image', async (req, res) => {
  try {
    const { userImage, prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const userImagePart = dataUrlToPart(userImage);
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [userImagePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imageData = handleApiResponse(response);
    res.json({ imageData });
  } catch (error) {
    console.error('Gemini API Error (model-image):', error);
    res.status(500).json({ 
      error: 'Failed to generate model image',
      details: error.message 
    });
  }
});

app.post('/api/gemini/virtual-tryon', async (req, res) => {
  try {
    const { modelImage, garmentImage, prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const modelImagePart = dataUrlToPart(modelImage);
    const garmentImagePart = dataUrlToPart(garmentImage);
    
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imageData = handleApiResponse(response);
    res.json({ imageData });
  } catch (error) {
    console.error('Gemini API Error (virtual-tryon):', error);
    res.status(500).json({ 
      error: 'Failed to generate virtual try-on image',
      details: error.message 
    });
  }
});

app.post('/api/gemini/pose-variation', async (req, res) => {
  try {
    const { tryOnImage, prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const tryOnImagePart = dataUrlToPart(tryOnImage);
    
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [tryOnImagePart, { text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imageData = handleApiResponse(response);
    res.json({ imageData });
  } catch (error) {
    console.error('Gemini API Error (pose-variation):', error);
    res.status(500).json({ 
      error: 'Failed to generate pose variation',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY 
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
});

