'use client';

import React from 'react';
import Link from 'next/link';
import { Mountain, MapPin, Calendar, Shield, TrendingUp, Leaf } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-green-600 rounded-lg">
                <Mountain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-none">GreenPass</h1>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Tourist Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle variant="icon" />
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Explore Paradise Responsibly
            </h1>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto px-2 leading-relaxed">
              Discover the breathtaking beauty of Jammu & Himachal Pradesh with our 
              sustainable tourism management platform. Book, explore, and protect nature.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg text-center"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-green-600 dark:text-green-400 bg-white dark:bg-slate-800 border-2 border-green-600 dark:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-slate-700 transition-all text-center"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div id="features" className="mt-20 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Explore Destinations
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Discover beautiful locations across Jammu and Himachal Pradesh with 
                real-time capacity management.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Easy Booking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Book your trips seamlessly with our intelligent booking system that 
                ensures sustainable tourism.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Eco-Friendly
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Contribute to environmental conservation with our ecological sensitivity 
                tracking system.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your data is protected with enterprise-grade security and reliable 
                infrastructure.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Real-Time Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor tourist flow and capacity in real-time with advanced analytics 
                and reporting.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-4">
                <Mountain className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Adventure Awaits
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Plan your perfect mountain adventure with curated activities and 
                expert guides.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 sm:mt-24 bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-700 dark:to-blue-700 rounded-2xl p-8 sm:p-12 text-center mx-4 sm:mx-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg sm:text-xl text-green-50 mb-8">
              Join thousands of travelers exploring responsibly
            </p>
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-block px-8 py-4 text-base sm:text-lg font-medium text-green-600 dark:text-green-700 bg-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            © 2026 GreenPass Tourist Management System. All rights reserved.
          </p>
          <p className="text-sm mt-2">
            Protecting the beauty of Jammu & Himachal Pradesh
          </p>
        </div>
      </footer>
    </div>
  );
}
