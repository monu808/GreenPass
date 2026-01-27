// src/app/login/page.tsx (Updated with OTP login option)
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OTPVerification from '@/components/OTPVerification';
import { validateInput } from '@/lib/validation';
import { AccountSchema } from '@/lib/validation/schemas';
import { sanitizeObject, sanitizeForDatabase } from '@/lib/utils';

type LoginMethod = 'password' | 'otp';
type LoginStep = 'method' | 'otp';

function LoginForm() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [step, setStep] = useState<LoginStep>('method');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUpWithOTP, verifyOTP, resendOTP, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      router.push('/');
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'auth_callback_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'unexpected_error':
          setError('An unexpected error occurred. Please try again.');
          break;
        default:
          setError('An error occurred during authentication.');
      }
    }
  }, [user, router, searchParams]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizedData = sanitizeObject({ email });
    const validation = validateInput(AccountSchema.partial().extend({ 
      email: z.email('Invalid email address') 
    }), sanitizedData);

    if (!validation.success) {
      setError(validation.errors?.email || 'Invalid email');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(validation.data.email, password);
      
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
      }
    } catch (_err) {
     let msg = 'Login failed.';
  if (_err instanceof Error) {
    if (_err.message.includes('Invalid credentials')) {
      msg = 'Email or senha incorrects.Check the credentials and try again';
    } else if (_err.message.includes('network') || _err.message.includes('Network')) {
      msg = 'Network connection error: verify your internet and try again.';
    } else if (_err.message.includes('user not found')) {
      msg = 'User not found. Verify the email.';
    } else if (_err.message.includes('timeout')) {
      msg = 'Request timed out. Try again.';
    } else {
      msg = `Login failed: ${_err.message}`;
    }
    alert(msg);
  }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizedData = sanitizeObject({ email });
    const validation = validateInput(AccountSchema.partial().extend({ 
      email: z.email('Invalid email address') 
    }), sanitizedData);

    if (!validation.success) {
      setError(validation.errors?.email || 'Invalid email');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUpWithOTP(validation.data.email, '');
      
      if (error) {
        setError(error.message);
      } else {
        setStep('otp');
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
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
      
      return { success: true };
    } catch (_err) {
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
    } catch (_err) {
      return { 
        success: false, 
        error: 'Failed to resend OTP. Please try again.' 
      };
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@tms-india.gov.in');
    setPassword('TMS_Admin_2025!');
    setLoginMethod('password');
  };

  // Show OTP verification screen
  if (step === 'otp') {
    return (
      <OTPVerification
        email={email}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onBack={() => setStep('method')}
      />
    );
  }

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
            Welcome Back
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Sign in to your Tourist Management System account
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-100">
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              loginMethod === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('otp')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              loginMethod === 'otp'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email OTP
          </button>
        </div>

        {/* Form */}
        <form 
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" 
          onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleOTPLogin}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

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
            </div>

            {/* Password (only for password login) */}
            {loginMethod === 'password' && (
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Info */}
            {loginMethod === 'otp' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Click continue to receive a 6-digit verification code via email
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {loginMethod === 'otp' ? 'Sending code...' : 'Signing in...'}
                </div>
              ) : (
                loginMethod === 'otp' ? 'Continue with Email' : 'Sign In'
              )}
            </button>

            {/* Admin Login Button */}
            {loginMethod === 'password' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="w-full bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  <Lock className="h-4 w-4" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('tourist@example.com');
                    setPassword('tourist123');
                  }}
                  className="w-full bg-green-100 text-green-700 py-2.5 sm:py-2 px-4 rounded-lg hover:bg-green-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Tourist</span>
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-green-600 hover:text-green-500">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}