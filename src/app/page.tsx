'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/AdminDashboard';
import TouristDashboard from '@/app/tourist/dashboard/page';

export default function Dashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show different dashboards based on user role
  if (isAdmin) {
    return <AdminDashboard />;
  } else {
    return <TouristDashboard />;
  }
}
