// contexts/AuthContext.tsx (Updated with OTP functionality)
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signUpWithOTP: (email: string, name: string) => Promise<{ error: any }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error: any }>;
  resendOTP: (email: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (error) {
          console.error('Error getting session:', error);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        } else {
          setSession(session || null);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            checkAdminStatus(session.user.id, session.user.email);
          } else {
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Session error:', error);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          checkAdminStatus(session.user.id, session.user.email);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string, email?: string) => {
    try {
      console.log('Checking admin status for user:', userId, email);
      
      const adminEmails = ['admin@tms-india.gov.in'];
      const isEmailAdmin = email && adminEmails.includes(email.toLowerCase());
      
      console.log('Email-based admin check result:', isEmailAdmin);
      setIsAdmin(isEmailAdmin || false);
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    return { error };
  };

  // New OTP-based signup
  const signUpWithOTP = async (email: string, name: string) => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    
    try {
      // Send OTP to email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            name: name,
          },
          shouldCreateUser: true, // Create user if doesn't exist
        },
      });
      
      return { error };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { error };
    }
  };

  // Verify OTP
  const verifyOTP = async (email: string, otp: string) => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      
      return { error };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { error };
    }
  };

  // Resend OTP
  const resendOTP = async (email: string) => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new user on resend
        },
      });
      
      return { error };
    } catch (error) {
      console.error('Error resending OTP:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setIsAdmin(false);

    if (!supabase) return { error: null };
    
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signUpWithOTP,
    verifyOTP,
    resendOTP,
    signInWithGoogle,
    signOut,
    isAdmin,
  };

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}