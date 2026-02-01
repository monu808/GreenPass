'use client';

import React, { useState, useRef } from 'react';
import { Bell, User, Search, MapPin, Calendar, Heart, ChevronDown, Key, Settings, UserCircle, Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFocusTrap, useEscapeKey, useClickOutside } from '@/lib/accessibility';

interface HeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export default function TouristHeader({ onMenuClick, isMenuOpen }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useFocusTrap(userMenuRef, showUserMenu);
  useEscapeKey(() => {
    setShowUserMenu(false);
    setShowAuthDropdown(false);
  }, showUserMenu);
  useClickOutside(userMenuRef, () => {
    setShowUserMenu(false);
    setShowAuthDropdown(false);
  }, showUserMenu);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    router.push('/login');
  };

  const toggleAuthDropdown = () => {
    setShowAuthDropdown(!showAuthDropdown);
  };

  return (
    <header 
      role="banner"
      aria-label="Site header"
      className="fixed top-0 right-0 left-0 lg:left-64 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-30 shadow-sm transition-all duration-300"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center">
          <button
            id="mobile-menu-toggle"
            onClick={onMenuClick}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            aria-controls="main-sidebar"
            className="p-3 mr-2 text-gray-600 lg:hidden hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          {/* Welcome Message */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 bg-green-100 rounded-lg hidden sm:block">
              <MapPin className="h-5 w-5 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h1 id="header-title" className="text-base sm:text-lg font-semibold text-gray-900">
                Explore Paradise
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Jammu & Himachal Pradesh</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-4 lg:mx-8 hidden md:block">
          <form role="search" className="relative" onSubmit={(e) => e.preventDefault()}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <label htmlFor="global-search" className="sr-only">Search destinations, activities</label>
            <input
              id="global-search"
              type="text"
              name="search"
              placeholder="Search destinations, activities..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-500 text-sm"
            />
          </form>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Quick Actions */}
          <nav 
            className="flex items-center space-x-1 sm:space-x-2"
            aria-label="Quick actions"
          >
            <button 
              id="header-favorites-btn"
              aria-label="View favorites"
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hidden sm:block focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
            </button>
            <button 
              id="header-bookings-btn"
              aria-label="View bookings"
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </button>
            <button 
              id="header-notifications-btn"
              aria-label="View notifications"
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full">
                <span className="sr-only">New notifications</span>
              </span>
            </button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4" ref={userMenuRef}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer'}
              </p>
              <p className="text-xs text-green-600 font-medium">Adventure Seeker</p>
            </div>
            <div className="relative">
              <button 
                id="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Open user menu"
                aria-expanded={showUserMenu}
                aria-controls="user-menu-dropdown"
                className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <ul className="py-2" role="none">
                    {/* User Info */}
                    <li className="px-4 py-3 border-b border-gray-200" role="none">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.name || user?.email || 'Explorer'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                        Tourist
                      </div>
                    </li>

                    <li role="none">
                      <Link 
                        href="/tourist/profile" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <UserCircle className="h-4 w-4 mr-3" aria-hidden="true" />
                        My Profile
                      </Link>
                    </li>
                    <li role="none">
                      <Link 
                        href="/tourist/bookings" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Calendar className="h-4 w-4 mr-3" aria-hidden="true" />
                        My Bookings
                      </Link>
                    </li>
                    <li role="none">
                      <Link 
                        href="/tourist/favorites" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Heart className="h-4 w-4 mr-3" aria-hidden="true" />
                        Favorites
                      </Link>
                    </li>
                    
                    {/* Authentication Submenu */}
                    <li className="relative" role="none">
                      <button
                        id="auth-menu-button"
                        onClick={toggleAuthDropdown}
                        aria-expanded={showAuthDropdown}
                        aria-haspopup="true"
                        aria-controls="auth-menu-dropdown"
                        aria-label="Toggle authentication security options"
                        role="menuitem"
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                      >
                        <div className="flex items-center">
                          <Key className="h-4 w-4 mr-3" aria-hidden="true" />
                          Authentication
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAuthDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                      
                      {showAuthDropdown && (
                        <ul 
                          id="auth-menu-dropdown"
                          className="ml-4 pl-4 border-l border-gray-200"
                          role="menu"
                          aria-labelledby="auth-menu-button"
                        >
                          <li role="none">
                            <Link
                              href="/settings#change-password"
                              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                              onClick={() => setShowUserMenu(false)}
                              role="menuitem"
                            >
                              Change Password
                            </Link>
                          </li>
                          <li role="none">
                            <Link
                              href="/settings#two-factor"
                              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                              onClick={() => setShowUserMenu(false)}
                              role="menuitem"
                            >
                              Two-Factor Auth
                            </Link>
                          </li>
                          <li role="none">
                            <Link
                              href="/settings#sessions"
                              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                              onClick={() => setShowUserMenu(false)}
                              role="menuitem"
                            >
                              Active Sessions
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>

                    <li role="none">
                      <Link 
                        href="/settings" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4 mr-3" aria-hidden="true" />
                        Settings
                      </Link>
                    </li>
                    
                    <li role="none">
                      <hr className="my-2 border-gray-200" role="separator" />
                    </li>
                    <li role="none">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-inset"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
