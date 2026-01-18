import React from 'react';
import TouristHeader from './TouristHeader';
import TouristSidebar from './TouristSidebar';
import ProtectedRoute from './ProtectedRoute';

interface TouristLayoutProps {
  children: React.ReactNode;
}

export default function TouristLayout({ children }: TouristLayoutProps) {
  return (
    <ProtectedRoute requireAdmin={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 hero-pattern opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-xl float-animation"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '2s'}}></div>
        
        <TouristSidebar />
        <TouristHeader />
        <main className="ml-64 pt-16 relative z-10">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
