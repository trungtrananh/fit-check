/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditPackage } from '../types';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 4.99,
    priceId: 'price_starter', // Replace with real Stripe Price ID
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 25,
    price: 9.99,
    priceId: 'price_popular',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 50,
    price: 14.99,
    priceId: 'price_pro',
  },
  {
    id: 'unlimited',
    name: 'Mega Pack',
    credits: 100,
    price: 24.99,
    priceId: 'price_unlimited',
  },
];

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, currentBalance }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyPackage = async (pkg: CreditPackage) => {
    setIsProcessing(true);
    
    try {
      // Call server to create Stripe Checkout session
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: pkg.priceId,
          credits: pkg.credits,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Buy Credits</h2>
                <p className="text-purple-100 mt-1">Choose a package to continue creating</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                disabled={isProcessing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Current Balance */}
            <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-3 inline-block">
              <span className="text-sm text-purple-100">Current Balance:</span>
              <span className="ml-2 text-2xl font-bold">{currentBalance} credits</span>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="p-6 bg-blue-50 border-b">
            <h3 className="font-semibold text-gray-800 mb-2">Credit Costs:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                <span className="text-gray-700">Generate Model Photo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                <span className="text-gray-700">Virtual Try-On</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                <span className="text-gray-700">Change Pose</span>
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    pkg.popular
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                  }`}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isProcessing && handleBuyPackage(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{pkg.credits}</span>
                      <span className="text-gray-600 ml-1">credits</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-purple-600">${pkg.price}</span>
                    </div>
                    <button
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Buy Now'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      ${(pkg.price / pkg.credits).toFixed(2)} per credit
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 rounded-b-2xl border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BuyCreditsModal;

