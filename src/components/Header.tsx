'use client';

import React, { useState } from 'react';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-64 z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tourists, destinations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 focus:outline-none"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Administrator' : 'Tourist'}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
