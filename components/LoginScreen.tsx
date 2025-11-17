/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';
import { GoogleIcon, FacebookIcon, ShirtIcon } from './icons';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-200/80"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-4">
                <ShirtIcon className="w-8 h-8 text-gray-700" />
                <h1 className="text-3xl font-serif tracking-widest text-gray-800">
                    Fit Check
                </h1>
            </div>
            <p className="text-gray-600 mb-8">
                Your personal virtual try-on studio.
            </p>

            <div className="w-full space-y-4">
                <button
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                    <GoogleIcon className="w-5 h-5" />
                    Continue with Google
                </button>
                <button
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    <FacebookIcon className="w-5 h-5" />
                    Continue with Facebook
                </button>
            </div>

            <p className="text-xs text-gray-400 mt-8">
                By continuing, you agree this is a simulated login for demo purposes. No personal data is collected or stored.
            </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
