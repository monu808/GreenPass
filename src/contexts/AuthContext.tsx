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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        } else {
          setSession(session);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
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
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string, email?: string) => {
    try {
      console.log('Checking admin status for user:', userId, email);
      
      // Simplified admin check - only use email-based authentication
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      // Clear local state regardless of API result
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear local state on any error
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
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
