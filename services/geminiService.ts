/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// API endpoint - use proxy server in production
const API_BASE_URL = window.location.origin;

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    return dataUrl;
};

const callGeminiAPI = async (endpoint: string, data: any): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/gemini/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.imageData;
};

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImageData = await fileToPart(userImage);
    const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
    
    return await callGeminiAPI('model-image', {
        userImage: userImageData,
        prompt
    });
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const garmentImageData = await fileToPart(garmentImage);
    const prompt = `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.

**Crucial Rules:**
1.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image.
2.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.
3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.
4.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.
5.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
    
    return await callGeminiAPI('virtual-tryon', {
        modelImage: modelImageUrl,
        garmentImage: garmentImageData,
        prompt
    });
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
    
    return await callGeminiAPI('pose-variation', {
        tryOnImage: tryOnImageUrl,
        poseInstruction,
        prompt
    });
};