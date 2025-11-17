import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run sets PORT automatically, default to 3000 for local development
const PORT = process.env.PORT || 3000;

// In-memory credit store (in production, use a database)
const creditStore = new Map();

// Simple credit codes for adding credits (in production, use a database)
// Format: { code: string, credits: number, used: boolean }
const creditCodes = new Map();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini AI
const model = 'gemini-2.5-flash-image';
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (error) {
    console.error('Failed to initialize Google Gemini client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY not configured. Gemini endpoints will return 500.');
}

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

// Simple Credit Code System
// Admin can generate codes to add credits
app.post('/api/credits/redeem-code', (req, res) => {
  try {
    const { code, token, email } = req.body;
    
    if (!code || !token) {
      return res.status(400).json({ error: 'Missing code or token' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required to redeem code' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Normalize code to uppercase for lookup
    const normalizedCode = code.toUpperCase().trim();
    
    console.log(`Attempting to redeem code: "${normalizedCode}" with email: "${normalizedEmail}"`);
    console.log(`Available codes:`, Array.from(creditCodes.keys()));
    console.log(`Total codes in memory: ${creditCodes.size}`);

    // Check if code exists and is valid (case-insensitive)
    let creditCode = null;
    let originalCodeKey = null;
    for (const [storedCode, codeData] of creditCodes.entries()) {
      if (storedCode.toUpperCase() === normalizedCode) {
        creditCode = codeData;
        originalCodeKey = storedCode;
        break;
      }
    }
    
    if (!creditCode) {
      console.log(`Code "${normalizedCode}" not found in creditCodes map`);
      return res.status(404).json({ error: 'Invalid credit code' });
    }

    // Check if code is already used
    if (creditCode.used) {
      console.log(`Code "${normalizedCode}" has already been used by email: ${creditCode.usedByEmail}`);
      return res.status(400).json({ error: 'Credit code already used' });
    }

    // Check if email matches (if code has email restriction)
    if (creditCode.email && creditCode.email.toLowerCase() !== normalizedEmail) {
      console.log(`Email mismatch. Code email: ${creditCode.email}, provided email: ${normalizedEmail}`);
      return res.status(403).json({ error: 'This code is restricted to a different email address' });
    }

    // Add credits to user account
    const userCredits = getOrCreateCredits(token);
    userCredits.balance += creditCode.credits;
    creditStore.set(token, userCredits);

    // Mark code as used
    if (originalCodeKey) {
      creditCode.used = true;
      creditCode.usedBy = token;
      creditCode.usedByEmail = normalizedEmail;
      creditCode.usedAt = Date.now();
      creditCodes.set(originalCodeKey, creditCode);
    }

    console.log(`✅ Successfully redeemed code ${normalizedCode} for ${creditCode.credits} credits. Email: ${normalizedEmail}. Token: ${token}. New balance: ${userCredits.balance}`);

    res.json({
      success: true,
      creditsAdded: creditCode.credits,
      newBalance: userCredits.balance,
      token,
    });
  } catch (error) {
    console.error('Credit code redemption error:', error);
    res.status(500).json({ error: 'Failed to redeem credit code' });
  }
});

// Admin API: Generate credit codes (open access)
app.post('/api/admin/generate-code', (req, res) => {
  try {
    const { credits, code, email } = req.body;
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credits amount' });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Generate or use provided code (always uppercase)
    const creditCode = (code ? code.toUpperCase().trim() : Math.random().toString(36).substring(2, 15).toUpperCase());
    
    // Check if code already exists
    if (creditCodes.has(creditCode)) {
      return res.status(400).json({ error: 'Code already exists' });
    }
    
    creditCodes.set(creditCode, {
      code: creditCode,
      credits: parseInt(credits, 10),
      email: email ? email.toLowerCase().trim() : null, // Store email if provided
      used: false,
      createdAt: Date.now(),
    });

    console.log(`✅ Generated credit code: ${creditCode} for ${credits} credits${email ? ` (restricted to: ${email})` : ''}`);
    console.log(`Total codes in memory: ${creditCodes.size}`);

    res.json({
      success: true,
      code: creditCode,
      credits: parseInt(credits, 10),
      email: email ? email.toLowerCase().trim() : null,
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate credit code' });
  }
});

// Admin login endpoint (passwordless)
app.post('/api/admin/login', (req, res) => {
  res.json({ success: true, message: 'Admin login not required. Access granted.' });
});

// Admin logout endpoint (noop)
app.post('/api/admin/logout', (req, res) => {
  res.json({ success: true, message: 'Logout not required.' });
});

// Check admin authentication status
app.get('/api/admin/check-auth', (req, res) => {
  res.json({
    authenticated: true,
  });
});

// Admin endpoint: List all codes (open access)
app.get('/api/admin/list-codes', (req, res) => {
  try {
    const codes = Array.from(creditCodes.entries()).map(([code, data]) => ({
      code,
      credits: data.credits,
      email: data.email || null,
      used: data.used,
      usedBy: data.usedBy || null,
      usedByEmail: data.usedByEmail || null,
      usedAt: data.usedAt ? new Date(data.usedAt).toISOString() : null,
      createdAt: new Date(data.createdAt).toISOString(),
    }));
    
    // Sort by created date (newest first)
    codes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      total: creditCodes.size,
      used: codes.filter(c => c.used).length,
      unused: codes.filter(c => !c.used).length,
      codes,
    });
  } catch (error) {
    console.error('List codes error:', error);
    res.status(500).json({ error: 'Failed to list codes' });
  }
});

// Simple GET endpoint to create codes via browser (open access)
// Usage: http://localhost:3000/api/admin/create-code?credits=25&code=WELCOME25
app.get('/api/admin/create-code', (req, res) => {
  try {
    const credits = parseInt(req.query.credits, 10);
    const code = req.query.code;
    
    if (!credits || credits <= 0) {
      return res.status(400).send(`
        <html>
          <head><title>Create Credit Code</title></head>
          <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>❌ Lỗi: Thiếu số credits</h1>
            <p>Cách sử dụng:</p>
            <ul>
              <li><code>http://localhost:3000/api/admin/create-code?credits=25</code></li>
              <li><code>http://localhost:3000/api/admin/create-code?credits=50&code=WELCOME50</code></li>
            </ul>
            <p><a href="/api/admin/create-code?credits=25">Ví dụ: Tạo code 25 credits</a></p>
          </body>
        </html>
      `);
    }

    // Get email from query parameter
    const email = req.query.email;

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).send(`
          <html>
            <head><title>Error</title></head>
            <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
              <h1>❌ Email không hợp lệ!</h1>
              <p>Email "${email}" không đúng định dạng.</p>
              <p><a href="/api/admin/create-code?credits=${credits}">Thử lại</a></p>
            </body>
          </html>
        `);
      }
    }

    // Generate or use provided code (always uppercase)
    const creditCode = code ? code.toUpperCase().trim() : Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // Check if code already exists
    if (creditCodes.has(creditCode)) {
      return res.status(400).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>❌ Code đã tồn tại!</h1>
            <p>Code "${creditCode}" đã được tạo trước đó.</p>
            <p><a href="/api/admin/create-code?credits=${credits}">Tạo code mới</a></p>
          </body>
        </html>
      `);
    }
    
    creditCodes.set(creditCode, {
      code: creditCode,
      credits: credits,
      email: email ? email.toLowerCase().trim() : null,
      used: false,
      createdAt: Date.now(),
    });

    console.log(`✅ Generated credit code: ${creditCode} for ${credits} credits${email ? ` (restricted to: ${email})` : ''}`);
    console.log(`Total codes in memory: ${creditCodes.size}`);

    res.send(`
      <html>
        <head>
          <title>Code Created Successfully</title>
          <style>
            body { font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #10b981; font-size: 24px; margin-bottom: 20px; }
            .code { background: #f3f4f6; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
            .info { color: #6b7280; margin: 10px 0; }
            button { background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px; }
            button:hover { background: #7c3aed; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Code đã được tạo thành công!</div>
            <h2>📋 Thông tin code:</h2>
            <div class="code">${creditCode}</div>
            <p class="info"><strong>Credits:</strong> ${credits}</p>
            ${email ? `<p class="info"><strong>Email restriction:</strong> ${email}</p>` : '<p class="info"><strong>Email restriction:</strong> None (anyone can use)</p>'}
            <p class="info">💡 Người dùng có thể nhập code này trong ứng dụng để nhận credits.</p>
            ${email ? `<p class="info">⚠️ Code này chỉ có thể được dùng bởi email: <strong>${email}</strong></p>` : ''}
            <p class="info">📝 <strong>Hãy copy và lưu code này lại!</strong></p>
            <button onclick="navigator.clipboard.writeText('${creditCode}')">📋 Copy Code</button>
            <br><br>
            <a href="/api/admin/create-code?credits=25">Tạo code khác (25 credits)</a> | 
            <a href="/api/admin/create-code?credits=50">Tạo code khác (50 credits)</a> |
            <a href="/admin">Admin Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).send(`<html><body><h1>Error: ${error.message}</h1></body></html>`);
  }
});

// Gemini API Routes
app.post('/api/gemini/model-image', async (req, res) => {
  try {
    const { userImage, prompt } = req.body;

    if (!ai) {
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

    if (!ai) {
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

    if (!ai) {
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
    geminiConfigured: !!ai 
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Cloud Run requires listening on 0.0.0.0, not localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Gemini API Key configured: ${!!ai}`);
  console.log(`Credit system: Simple code-based redemption (no payment gateway)`);
});

