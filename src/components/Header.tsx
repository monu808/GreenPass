'use client';

import React, { useState, useRef } from 'react';
import { Bell, Search, LogOut, Settings, Shield, UserCircle, ChevronDown, Key, Users, BarChart3, FileText, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFocusTrap, useEscapeKey, useClickOutside } from '@/lib/accessibility';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  return (
    <header 
      role="banner"
      aria-label="Admin header" 
      className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-16 fixed top-0 right-0 left-0 lg:left-64 z-30 shadow-sm transition-all duration-300"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center flex-1">
          <button
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="p-3 mr-2 text-gray-600 dark:text-gray-300 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          {/* Search */}
          <form role="search" className="flex-1 max-w-md hidden md:block" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <label htmlFor="admin-search" className="sr-only">Search tourists, destinations</label>
              <input
                id="admin-search"
                type="text"
                name="search"
                placeholder="Search tourists, destinations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle variant="dropdown" />
          
          {/* Notifications */}
          <button 
            aria-label="View notifications"
            aria-haspopup="true"
            className="relative p-2 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full">
              <span className="sr-only">New notifications available</span>
            </span>
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Open user menu"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              aria-controls="user-menu-dropdown"
              className="flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAdmin ? 'Administrator' : 'Staff'}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" aria-hidden="true">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div
                id="user-menu-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden"
                role="menu"
                aria-labelledby="user-menu-button"
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700" role="none">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100" id="user-email-label">{user?.email}</p>
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" aria-describedby="user-email-label">
                    <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                    {isAdmin ? 'Admin Access' : 'Staff Access'}
                  </div>
                </div>

                <div className="py-1" role="none">
                  <Link
                    href="/management/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    <UserCircle className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    My Profile
                  </Link>
                </div>

                {isAdmin && (
                  <div className="py-1 border-t border-gray-100 dark:border-slate-700" role="none">
                    <button
                      id="admin-panel-button"
                      onClick={toggleAdminPanel}
                      aria-expanded={showAdminPanel}
                      aria-haspopup="true"
                      aria-controls="admin-panel-dropdown"
                      aria-label="Toggle admin management options"
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                        Admin Controls
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdminPanel ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    
                    {showAdminPanel && (
                      <div
                        id="admin-panel-dropdown"
                        className="bg-gray-50 dark:bg-slate-700/50 py-1"
                        role="group"
                        aria-labelledby="admin-panel-button"
                      >
                        <Link
                          href="/admin/users"
                          className="flex items-center px-8 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <Users className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                          User Management
                        </Link>
                        <Link
                          href="/admin/analytics"
                          className="flex items-center px-8 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <BarChart3 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                          System Analytics
                        </Link>
                        <Link
                          href="/admin/logs"
                          className="flex items-center px-8 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          <FileText className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                          Audit Logs
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="py-1" role="none">
                  <button
                    id="auth-menu-button"
                    onClick={toggleAuthDropdown}
                    aria-expanded={showAuthDropdown}
                    aria-haspopup="true"
                    aria-controls="auth-menu-dropdown"
                    aria-label="Toggle security and authentication options"
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <Key className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                      Security
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAuthDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  
                  {showAuthDropdown && (
                    <div
                      id="auth-menu-dropdown"
                      className="bg-gray-50 dark:bg-slate-700/50 py-1"
                      role="group"
                      aria-labelledby="auth-menu-button"
                    >
                      <Link
                        href="/management/settings#security"
                        className="flex items-center px-8 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        Password & 2FA
                      </Link>
                      <Link
                        href="/management/settings#sessions"
                        className="flex items-center px-8 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        Active Sessions
                      </Link>
                    </div>
                  )}
                </div>

                <div className="py-1" role="none">
                  <Link
                    href="/management/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    Settings
                  </Link>
                </div>

                <div className="py-1 border-t border-gray-100 dark:border-slate-700" role="none">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
