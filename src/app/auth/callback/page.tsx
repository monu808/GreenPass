'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          console.error('Supabase not initialized');
          router.push('/login?error=service_unavailable');
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          // Check if user is admin
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', data.session.user.id)
            .single();

          const isAdmin = userData && (userData as any).is_admin;

          if (isAdmin) {
            router.push('/admin/dashboard');
          } else {
            router.push('/tourist/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
