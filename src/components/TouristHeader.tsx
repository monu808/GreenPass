import React from 'react';
import { Bell, User, Search, MapPin, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TouristHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 glass-header z-30">
      <div className="flex items-center justify-between px-6 py-5">
        {/* Welcome Message */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="floating-icon">
              <MapPin className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-serif gradient-text font-bold">
                Explore Paradise
              </h1>
              <p className="text-sm text-gray-600">Jammu & Himachal Pradesh</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
            <input
              type="text"
              placeholder="Search destinations, activities, experiences..."
              className="glass-input w-full pl-12 pr-6 py-3 text-gray-700 placeholder-gray-500"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-6">
          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button className="glass-button p-3 text-primary-600 hover:text-primary-700 transition-all duration-300 group">
              <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
            <button className="glass-button p-3 text-primary-600 hover:text-primary-700 transition-all duration-300 group">
              <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
            <button className="glass-button p-3 text-primary-600 hover:text-primary-700 transition-all duration-300 group relative">
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="notification-badge"></span>
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800 font-serif">
                {user?.user_metadata?.name || user?.email || 'Explorer'}
              </p>
              <p className="text-xs text-primary-600 font-medium">Adventure Seeker</p>
            </div>
            <div className="relative group">
              <button className="glass-button p-3 hover:scale-105 transition-all duration-300">
                <div className="h-10 w-10 gradient-bg rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-3 w-56 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="py-3">
                  <a href="/tourist/profile" className="dropdown-item">
                    <User className="h-4 w-4" />
                    My Profile
                  </a>
                  <a href="/tourist/bookings" className="dropdown-item">
                    <Calendar className="h-4 w-4" />
                    My Bookings
                  </a>
                  <a href="/tourist/favorites" className="dropdown-item">
                    <Heart className="h-4 w-4" />
                    Favorites
                  </a>
                  <hr className="my-3 border-white/20" />
                  <button
                    onClick={() => signOut()}
                    className="dropdown-item text-red-600 hover:text-red-700 hover:bg-red-50/20"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
