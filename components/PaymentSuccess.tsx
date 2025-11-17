/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { addCredits } from '../services/creditService';

interface PaymentSuccessProps {
  onComplete: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const token = params.get('token');
    const credits = params.get('credits');

    if (!sessionId || !token || !credits) {
      setStatus('error');
      setMessage('Invalid payment session');
      return;
    }

    // Verify payment with server
    fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        token,
        credits: parseInt(credits, 10),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Verification failed');
        const result = await res.json();
        
        // Add credits locally
        addCredits(parseInt(credits, 10), token);
        
        setStatus('success');
        setMessage(`Successfully added ${credits} credits to your account!`);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      })
      .catch((error) => {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('Failed to verify payment. Please contact support.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="mb-4"
            >
              <svg
                className="w-16 h-16 mx-auto text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you back to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Return to App
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;

