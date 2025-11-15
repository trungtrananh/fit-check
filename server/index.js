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
const PORT = process.env.PORT || 3000;

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

// API Routes
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

