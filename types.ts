/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceId: string; // Stripe Price ID
  popular?: boolean;
}

export interface UserCredits {
  balance: number;
  token: string; // Verified token from server
  lastUpdated: number;
}

export const CREDIT_COSTS = {
  MODEL_GENERATION: 2,
  VIRTUAL_TRYON: 3,
  POSE_VARIATION: 1,
} as const;
