// src/components/OTPVerification.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
}

export default function OTPVerification({ 
  email, 
  onVerify, 
  onResend, 
  onBack 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus trap for modal-like behavior if needed, though this is usually a full page component
  useEffect(() => {
    // Focus first input on mount
    const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && value) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      setError('Please paste only numbers');
      return;
    }

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);

    // Focus last filled input or first empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (otpCode: string) => {
    setLoading(true);
    setError('');

    try {
      const result = await onVerify(otpCode);
      
      if (result.success) {
        setSuccess(true);
        // User will be redirected by parent component
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      const result = await onResend();
      
      if (result.success) {
        setResendCooldown(60); // 60 second cooldown
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a 6-digit code to
          </p>
          <p className="text-sm font-medium text-gray-900">{email}</p>
        </div>

        {/* OTP Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-600">Verification successful!</p>
            </div>
          )}

          {/* OTP Input */}
          <div role="group" aria-labelledby="otp-label">
            <label id="otp-label" className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  disabled={loading || success}
                  aria-label={`Digit ${index + 1}`}
                  className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition-all focus:ring-4 focus:ring-green-500/10 ${
                    digit
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white'
                  } ${
                    loading || success ? 'opacity-50 cursor-not-allowed' : 'focus:border-green-500 focus:ring-2 focus:ring-green-200'
                  } ${
                    error ? 'border-red-300 shake' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Resend Section */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">Didn&apos;t receive the code?</p>
            <button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className={`text-sm font-medium ${
                resendCooldown > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-green-600 hover:text-green-700'
              } flex items-center justify-center mx-auto`}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Code'}
            </button>
          </div>

          {/* Back Button */}
          <button
            onClick={onBack}
            disabled={loading}
            className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 py-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign Up
          </button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Check your spam folder if you don&apos;t see the email. 
            The code is valid for 10 minutes.
          </p>
        </div>
      </div>

      {/* Shake Animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}