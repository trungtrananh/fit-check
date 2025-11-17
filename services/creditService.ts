/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { UserCredits, CREDIT_COSTS } from '../types';

const STORAGE_KEY = 'user_credits';
const INITIAL_FREE_CREDITS = 100;

// Generate unique token for each new user
const generateUniqueToken = (): string => {
  // Combine timestamp + random string for uniqueness
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `user_${timestamp}_${random}`;
};

// Get credits from localStorage
export const getCredits = (): UserCredits => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const credits = JSON.parse(stored) as UserCredits;
      return credits;
    }
  } catch (error) {
    console.error('Error reading credits:', error);
  }
  
  // Initialize with free credits and unique token
  const initialCredits: UserCredits = {
    balance: INITIAL_FREE_CREDITS,
    token: generateUniqueToken(), // Unique token for each user
    lastUpdated: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCredits));
  return initialCredits;
};

// Save credits to localStorage
export const saveCredits = (credits: UserCredits): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
  } catch (error) {
    console.error('Error saving credits:', error);
  }
};

// Check if user has enough credits
export const hasEnoughCredits = (cost: number): boolean => {
  const credits = getCredits();
  return credits.balance >= cost;
};

// Deduct credits (will be verified by server)
export const deductCredits = async (cost: number, action: string): Promise<boolean> => {
  const credits = getCredits();
  
  if (credits.balance < cost) {
    return false;
  }

  // Verify with server
  try {
    const response = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: cost,
        token: credits.token,
        action,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to deduct credits');
    }

    const result = await response.json();
    
    // Update local balance with verified amount from server
    const updatedCredits: UserCredits = {
      balance: result.newBalance,
      token: result.token,
      lastUpdated: Date.now(),
    };
    
    saveCredits(updatedCredits);
    return true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
};

// Add credits after successful payment
export const addCredits = (amount: number, newToken: string): void => {
  const credits = getCredits();
  const updatedCredits: UserCredits = {
    balance: credits.balance + amount,
    token: newToken,
    lastUpdated: Date.now(),
  };
  saveCredits(updatedCredits);
};

// Get credit cost for an action
export const getCreditCost = (action: keyof typeof CREDIT_COSTS): number => {
  return CREDIT_COSTS[action];
};

// Sync credits with server (verify token is still valid)
export const syncCredits = async (): Promise<UserCredits> => {
  const credits = getCredits();
  
  try {
    const response = await fetch('/api/credits/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credits.token }),
    });

    if (response.ok) {
      const result = await response.json();
      const syncedCredits: UserCredits = {
        balance: result.balance,
        token: result.token,
        lastUpdated: Date.now(),
      };
      saveCredits(syncedCredits);
      return syncedCredits;
    }
  } catch (error) {
    console.error('Error syncing credits:', error);
  }
  
  return credits;
};

// Redeem credit code
export const redeemCreditCode = async (code: string, email: string): Promise<{ success: boolean; creditsAdded?: number; newBalance?: number; error?: string }> => {
  const credits = getCredits();
  
  try {
    const response = await fetch('/api/credits/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.toUpperCase().trim(),
        email: email.toLowerCase().trim(),
        token: credits.token,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to redeem code' }));
      return { success: false, error: error.error || 'Invalid credit code' };
    }

    const result = await response.json();
    
    // Update local balance
    const updatedCredits: UserCredits = {
      balance: result.newBalance,
      token: result.token,
      lastUpdated: Date.now(),
    };
    
    saveCredits(updatedCredits);
    return {
      success: true,
      creditsAdded: result.creditsAdded,
      newBalance: result.newBalance,
    };
  } catch (error) {
    console.error('Error redeeming credit code:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

