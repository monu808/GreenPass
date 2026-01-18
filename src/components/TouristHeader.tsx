'use client';

import React, { useState } from 'react';
import { Bell, User, Search, MapPin, Calendar, Heart, ChevronDown, Key, Settings, UserCircle, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TouristHeader() {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    router.push('/login');
  };

  const toggleAuthDropdown = () => {
    setShowAuthDropdown(!showAuthDropdown);
  };

  return (
    <header className="fixed top-0 right-0 left-64 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-30 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Welcome Message */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Explore Paradise
              </h1>
              <p className="text-sm text-gray-600">Jammu & Himachal Pradesh</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations, activities..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-500"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200">
              <Heart className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200">
              <Calendar className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {user?.user_metadata?.name || user?.email || 'Explorer'}
              </p>
              <p className="text-xs text-green-600 font-medium">Adventure Seeker</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 focus:outline-none"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.name || user?.email || 'Explorer'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Tourist
                      </div>
                    </div>

                    <Link 
                      href="/tourist/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <Link 
                      href="/tourist/bookings" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Calendar className="h-4 w-4 mr-3" />
                      My Bookings
                    </Link>
                    <Link 
                      href="/tourist/favorites" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart className="h-4 w-4 mr-3" />
                      Favorites
                    </Link>
                    
                    {/* Authentication Dropdown */}
                    <div className="relative">
                      <button
                        onClick={toggleAuthDropdown}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Key className="h-4 w-4 mr-3" />
                          Authentication
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAuthDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showAuthDropdown && (
                        <div className="ml-4 pl-4 border-l border-gray-200">
                          <Link
                            href="/settings#change-password"
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Change Password
                          </Link>
                          <Link
                            href="/settings#two-factor"
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Two-Factor Auth
                          </Link>
                          <Link
                            href="/settings#sessions"
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Active Sessions
                          </Link>
                        </div>
                      )}
                    </div>

                    <Link 
                      href="/settings" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowAuthDropdown(false);
          }}
        />
      )}
    </header>
  );
}
