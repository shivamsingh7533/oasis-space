import React, { useEffect, useState } from 'react';
import { FaShieldAlt, FaCheckCircle, FaLock } from 'react-icons/fa';

export default function PaymentLoading({ status }) {
  const [message, setMessage] = useState('Initializing Secure Connection...');

  // ✨ Dynamic Messages for Real Feel
  useEffect(() => {
    if (status === 'processing') {
      const messages = [
        'Contacting Bank Server...',
        'Verifying Credentials...',
        'Securing Transaction...',
        'Almost there...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setMessage(messages[i]);
        i = (i + 1) % messages.length;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (!status) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md transition-all duration-300">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full text-center relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>

        {/* --- STATE 1: PROCESSING --- */}
        {status === 'processing' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            {/* Custom Spinner */}
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FaLock className="text-xl text-slate-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
            <p className="text-slate-400 text-sm animate-pulse">{message}</p>
            
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                <FaShieldAlt className="text-green-500" /> 256-bit SSL Encrypted
            </div>
          </div>
        )}

        {/* --- STATE 2: SUCCESS --- */}
        {status === 'success' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-500/10">
                <FaCheckCircle className="text-5xl text-green-500 drop-shadow-lg scale-110" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Payment Successful!</h3>
            <p className="text-slate-400 text-sm">Redirecting you shortly...</p>
          </div>
        )}

        {/* --- STATE 3: FAILED --- */}
        {status === 'failed' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-red-500/10">
                <span className="text-4xl font-bold text-red-500">!</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Payment Failed</h3>
            <p className="text-slate-400 text-sm">Please try again.</p>
          </div>
        )}

      </div>
    </div>
  );
}