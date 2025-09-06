import React from 'react';
import { Bell, User, Search, MapPin, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TouristHeader() {
  const { user, signOut } = useAuth();

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
            <div className="relative group">
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                <div className="py-2">
                  <a href="/tourist/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4 mr-3" />
                    My Profile
                  </a>
                  <a href="/tourist/bookings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Calendar className="h-4 w-4 mr-3" />
                    My Bookings
                  </a>
                  <a href="/tourist/favorites" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Heart className="h-4 w-4 mr-3" />
                    Favorites
                  </a>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={() => signOut()}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
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
