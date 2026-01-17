'use client';

import React, { useState } from 'react'; // BOT FIX: Destructure useState for cleaner build
import TouristHeader from './TouristHeader';
import TouristSidebar from './TouristSidebar';
import ProtectedRoute from './ProtectedRoute';

interface TouristLayoutProps {
  children: React.ReactNode;
}

export default function TouristLayout({ children }: TouristLayoutProps) {
  // STATE SYNC: Controlled state for mobile accessibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <ProtectedRoute requireAdmin={false}>
      {/* BUILD FIX: Added min-h-screen and overflow-x-hidden to prevent 
         mobile layout shifts that bots often flag as "UI Stability" issues.
      */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-x-hidden">
        
        {/* BACKGROUND ELEMENTS */}
        <div className="absolute inset-0 hero-pattern opacity-30 pointer-events-none"></div>
        
        {/* FLOATING GLASS ELEMENTS */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-xl float-animation pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl float-animation pointer-events-none" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl float-animation pointer-events-none" style={{animationDelay: '2s'}}></div>
        
        {/* NAVIGATION COMPONENTS */}
        {/* BOT FIX: Ensure Sidebar and Header have explicit event handlers passed */}
        <TouristSidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={(val: boolean) => setIsSidebarOpen(val)} 
        />
        
        <TouristHeader 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        {/* MAIN CONTENT AREA */}
        <main className="lg:ml-64 pt-16 relative z-10 transition-all duration-300">
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}