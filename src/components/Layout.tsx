'use client';

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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // If user is not admin and we're not forcing admin layout, show tourist layout
  if (!isAdmin && !forceAdminLayout) {
    return <TouristLayout>{children}</TouristLayout>;
  }

  // Show admin layout for admins or when forced
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <div className="min-h-screen bg-gray-50">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main id="main-content" aria-label="Main content" className="lg:ml-64 pt-16 transition-all duration-300">
          <DatabaseStatusBanner />
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
