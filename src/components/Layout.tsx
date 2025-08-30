import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TouristLayout from './TouristLayout';
import ProtectedRoute from './ProtectedRoute';
import DatabaseStatusBanner from './DatabaseStatusBanner';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  forceAdminLayout?: boolean;
}

export default function Layout({ children, requireAdmin = false, forceAdminLayout = false }: LayoutProps) {
  const { isAdmin } = useAuth();

  // If user is not admin and we're not forcing admin layout, show tourist layout
  if (!isAdmin && !forceAdminLayout) {
    return <TouristLayout>{children}</TouristLayout>;
  }

  // Show admin layout for admins or when forced
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Header />
        <main className="ml-64 pt-16">
          <DatabaseStatusBanner />
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
