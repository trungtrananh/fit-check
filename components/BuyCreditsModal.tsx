/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { redeemCreditCode } from '../services/creditService';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onCreditsUpdate: () => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, currentBalance, onCreditsUpdate }) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a credit code');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await redeemCreditCode(code, email.trim());
      
      if (result.success) {
        setSuccess(`Successfully added ${result.creditsAdded} credits! Your new balance is ${result.newBalance} credits.`);
        setCode('');
        setEmail('');
        onCreditsUpdate();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        setError(result.error || 'Invalid credit code');
      }
    } catch (err) {
      console.error('Redeem code error:', err);
      setError('Failed to redeem code. Please try again.');
    } finally {
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
                <h2 className="text-3xl font-bold">Redeem Credit Code</h2>
                <p className="text-purple-100 mt-1">Enter your credit code to add credits</p>
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

          {/* Payment Instructions */}
          <div className="p-6 bg-yellow-50 border-b border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">Hướng dẫn mua credit</h3>
            <p className="text-gray-800 leading-relaxed">
              Vui lòng thanh toán <strong>39.000 VNĐ</strong> để có thể sử dụng thêm <strong>100 credit</strong> thử đồ ảo mới.<br />
              Số tài khoản nhận thanh toán: <strong>123456</strong>.<br />
              Sau khi thanh toán thành công, vui lòng chụp lại màn hình thanh toán và gửi đến email <strong>thudo.ai@gmail.com</strong> để nhận mã code kích hoạt credit mới.<br />
              Cảm ơn bạn! 💜
            </p>
          </div>

          {/* Redeem Code Form */}
          <div className="p-6">
            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label htmlFor="credit-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Code
                </label>
                <input
                  id="credit-code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                    setSuccess(null);
                  }}
                  placeholder="Enter your code (e.g., ABC123)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-mono uppercase"
                  disabled={isProcessing}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  disabled={isProcessing}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Email is required to verify code ownership</p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                  <p className="font-semibold">Success!</p>
                  <p>{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || !code.trim() || !email.trim()}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redeeming...
                  </span>
                ) : (
                  'Redeem Code'
                )}
              </button>
            </form>

          <div className="p-6 bg-blue-50 border-t">
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BuyCreditsModal;

