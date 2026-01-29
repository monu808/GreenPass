'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null | { message: string } }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null | { message: string } }>;
  signUpWithOTP: (email: string, name: string) => Promise<{ error: AuthError | null | { message: string } }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error: AuthError | null | { message: string } }>;
  resendOTP: (email: string) => Promise<{ error: AuthError | null | { message: string } }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null | { message: string } }>;
  signOut: () => Promise<{ error: AuthError | null | { message: string } }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Get initial session
    const getSession = async () => {
      try {
        if (!supabase) {
          if (mountedRef.current) setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          if (mountedRef.current) {
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          if (mountedRef.current) {
            setSession(session || null);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              checkAdminStatus(session.user.id, session.user.email);
            } else {
              setIsAdmin(false);
            }
          }
        }
      } catch (error) {
        console.error('Session error:', error);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
      }
      
      if (mountedRef.current) setLoading(false);
    };

    getSession();

    // Trigger weather monitoring initialization on app load with a small delay
    // to ensure the server is ready, especially during dev restarts
    const triggerMonitor = setTimeout(() => {
      fetch('/api/weather-monitor', { method: 'POST' })
        .then(res => {
          if (!res.ok) console.warn('Weather monitor trigger status:', res.status);
        })
        .catch(err => {
          // Only log if it's not a standard abort or common dev-mode fetch error
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ Weather monitor trigger deferred or failed (normal during dev restarts)');
          } else {
            console.error('Failed to trigger weather monitor:', err);
          }
        });
    }, 2000);

    // Listen for auth changes
    if (!supabase) {
      clearTimeout(triggerMonitor);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mountedRef.current) {
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            setSession(session);
            setUser(session?.user ?? null);
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
          
          if (session?.user) {
            checkAdminStatus(session.user.id, session.user.email);
          } else {
            setIsAdmin(false);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(triggerMonitor);
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string, email?: string) => {
    try {
      console.log('Checking admin status for user:', userId, email);
      
      // Simplified admin check - only use email-based authentication
      const adminEmails = ['admin@tms-india.gov.in'];
      const isEmailAdmin = email && adminEmails.includes(email.toLowerCase());
      
      console.log('Email-based admin check result:', isEmailAdmin);
      if (mountedRef.current) {
        setIsAdmin(isEmailAdmin || false);
      }
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      if (mountedRef.current) {
        setIsAdmin(false);
      }
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
      },
    });
    
    // Note: Admin status will be determined by email during login
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
      return { error: error as AuthError || { message: 'An unknown error occurred' } };
    }
  };

  // Verify OTP token
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
      return { error: error as AuthError || { message: 'An unknown error occurred' } };
    }
  };

  // Resend OTP
  const resendOTP = async (email: string) => {
    if (!supabase) return { error: { message: 'Authentication service not available' } };
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      return { error };
    } catch (error) {
      return { error: error as AuthError || { message: 'An unknown error occurred' } };
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
      return { error: error as AuthError || { message: 'An unknown error occurred' } };
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
