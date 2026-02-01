// src/app/signup/page.tsx (Updated with OTP verification)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, User, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OTPVerification from '@/components/OTPVerification';
import { validateInput } from '@/lib/validation';
import { AccountSchema } from '@/lib/validation/schemas';
import { sanitizeObject } from '@/lib/utils';

type SignupStep = 'form' | 'otp';

export default function SignUp() {
  const [step, setStep] = useState<SignupStep>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUpWithOTP, verifyOTP, resendOTP, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sanitizedData = sanitizeObject({ name, email });
    const validation = validateInput(AccountSchema, {
      ...sanitizedData,
      role: 'tourist' // Default role for signup
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0] || 'Invalid input');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUpWithOTP(validation.data.email, validation.data.name);
      
      if (error) {
        setError(error.message);
      } else {
        // Move to OTP verification step
        setStep('otp');
      }
    } catch (error) {
  let msg = 'An unexpected error occurred. Please try again.';
  if (error instanceof Error) {
    if (error.message.includes('validation')) {
      msg = 'invalid data: verify all required fields.';
    } else if (error.message.includes('email already exists')) {
      msg = 'Email already registered. Log in or use another email.';
    } else if (error.message.includes('network')) {
      msg = 'Connection error: check your internet and try again.';
    } else if (error.message.includes('timeout')) {
      msg = 'Operation timed out. Please try again.';
    } else {
      msg = `Error: ${error.message}`;
    }
  }
  setError(msg);
}
finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      const { error } = await verifyOTP(email, otp);
      
      if (error) {
        return { 
          success: false, 
          error: error.message || 'Invalid OTP. Please try again.' 
        };
      }
      
      // Success - user will be redirected automatically by auth state change
      return { success: true };
    } catch {
      return { 
        success: false, 
        error: 'Verification failed. Please try again.' 
      };
    }
  };

  const handleResendOTP = async () => {
    try {
      const { error } = await resendOTP(email);
      
      if (error) {
        return { 
          success: false, 
          error: error.message || 'Failed to resend OTP. Please try again.' 
        };
      }
      
      return { success: true };
    } catch {
      return { 
        success: false, 
        error: 'Failed to resend OTP. Please try again.' 
      };
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setError('');
  };

  // Show OTP verification screen
  if (step === 'otp') {
    return (
      <OTPVerification
        email={email}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onBack={handleBackToForm}
      />
    );
  }

  // Show signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Join the Tourist Management System
          </p>
        </div>

        {/* Form */}
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                  placeholder="Enter your email"
                />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                We&apos;ll send a verification code to this email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending verification code...
                </div>
              ) : (
                'Continue with Email'
              )}
            </button>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Secure Sign Up:</strong> We&apos;ll send a 6-digit verification code to your email. 
                No password needed!
              </p>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-green-600 hover:text-green-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}