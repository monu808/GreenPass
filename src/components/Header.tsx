'use client';

import React, { useState } from 'react';
import { Bell, Search, User, LogOut, Settings, Shield, UserCircle, ChevronDown, Key, Users, BarChart3, FileText, Activity, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const router = useRouter();

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
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-64 z-30 shadow-sm">
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
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all focus:outline-none"
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
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    {isAdmin ? 'Administrator' : 'Tourist'}
                  </div>
                </div>
                
                <Link
                  href="/settings"
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserCircle className="h-4 w-4 mr-3" />
                  Profile Settings
                </Link>

                {/* Admin Panel Options - Only visible to admins */}
                {isAdmin && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Admin Panel
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={toggleAdminPanel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-3 text-purple-600" />
                          <span className="font-medium">Admin Controls</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAdminPanel ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showAdminPanel && (
                        <div className="ml-4 pl-4 border-l-2 border-purple-200">
                          <Link
                            href="/management"
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Users className="h-4 w-4 mr-3" />
                            User Management
                          </Link>
                          <Link
                            href="/analytics"
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BarChart3 className="h-4 w-4 mr-3" />
                            Analytics & Reports
                          </Link>
                          <Link
                            href="/destinations"
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Database className="h-4 w-4 mr-3" />
                            Manage Destinations
                          </Link>
                          <Link
                            href="/alerts"
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <AlertTriangle className="h-4 w-4 mr-3" />
                            System Alerts
                          </Link>
                          <Link
                            href="/settings#audit-logs"
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FileText className="h-4 w-4 mr-3" />
                            Audit Logs
                          </Link>
                          <Link
                            href="/settings#system-health"
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Activity className="h-4 w-4 mr-3" />
                            System Health
              </Link>
            </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                  </>
                )}
                
                {/* Authentication Dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleAuthDropdown}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
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
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  General Settings
                </Link>
                
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
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
