'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import HomePage from '@/app/home/page';

export default function RootPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to appropriate dashboard
    if (!loading && user) {
      if (isAdmin) {
        router.push('/dashboard'); 
      } else {
        router.push('/tourist/dashboard');
      }
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  // If user is logged in, the useEffect will handle the redirect
  // We return a loading state or nothing while the redirect happens
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  // If not logged in, show home/landing page
  return <HomePage />;
}
