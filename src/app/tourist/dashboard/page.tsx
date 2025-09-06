'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Star, Calendar, Users, Camera, Heart, TrendingUp, Award, ArrowRight, Play, Navigation, Compass } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { dbService } from '@/lib/databaseService';
import { Destination } from '@/types';

export default function TouristDashboard() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    loadTouristData();
  }, []);

  const loadTouristData = async () => {
    try {
      const destinationsData = await dbService.getDestinations();
      
      // Transform data to match interface
      const transformedDestinations = destinationsData.map(dest => ({
        id: dest.id,
        name: dest.name,
        location: dest.location,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        description: dest.description,
        guidelines: dest.guidelines,
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: {
          latitude: dest.latitude,
          longitude: dest.longitude
        }
      }));

      setDestinations(transformedDestinations);
      
      // Get featured destinations (top 3 with lowest occupancy)
      const featured = transformedDestinations
        .filter(dest => dest.isActive)
        .sort((a, b) => (a.currentOccupancy / a.maxCapacity) - (b.currentOccupancy / b.maxCapacity))
        .slice(0, 3);
      
      setFeaturedDestinations(featured);
    } catch (error) {
      console.error('Error loading tourist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (destination: Destination) => {
    const occupancyRate = destination.currentOccupancy / destination.maxCapacity;
    if (occupancyRate < 0.6) return 'text-emerald-600';
    if (occupancyRate < 0.8) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAvailabilityText = (destination: Destination) => {
    const occupancyRate = destination.currentOccupancy / destination.maxCapacity;
    if (occupancyRate < 0.6) return 'Available';
    if (occupancyRate < 0.8) return 'Limited';
    return 'Full';
  };

  const StatCard = ({ title, value, icon: Icon, gradient, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${gradient} shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <TouristLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
        </div>
      </TouristLayout>
    );
  }

  return (
    <TouristLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-green-800 rounded-lg p-8 text-white shadow-lg mb-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Travel Around The Beautiful World
            </h1>
            <p className="text-lg text-green-100 mb-6 leading-relaxed">
              Live And Take Your Journey, See How Beautiful The World Is By Travelling So Far
              Without Hesitation. Because We Are Responsible For Your Trip Happiness.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                <Navigation className="h-5 w-5" />
                Explore Now
              </button>
              <button className="bg-green-500/20 hover:bg-green-500/30 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                <Play className="h-5 w-5" />
                Watch Video
              </button>
            </div>
          </div>
        </div>

        {/* Featured Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {featuredDestinations.map((destination, index) => (
            <div key={destination.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 relative">
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="bg-white/20 rounded-lg px-3 py-1 text-white text-sm font-medium">
                      {destination.location}
                    </span>
                    <button className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                      <Heart className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">
                      {destination.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${getAvailabilityColor(destination)}`}>
                        {getAvailabilityText(destination)}
                      </span>
                      <span className="text-white text-xs">
                        {destination.currentOccupancy}/{destination.maxCapacity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Destinations"
            value={destinations.length}
            icon={MapPin}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            subtitle="Available locations"
          />
          <StatCard
            title="Active Bookings"
            value="12"
            icon={Calendar}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            subtitle="Current trips"
          />
          <StatCard
            title="Travel Score"
            value="4.8"
            icon={Star}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            subtitle="Average rating"
          />
          <StatCard
            title="Adventures"
            value="24"
            icon={Award}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
            subtitle="Completed"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Provide The Best Destination Services In The World
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              onClick={() => window.location.href = '/tourist/plan'}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Plan Your Trip</h3>
              <p className="text-gray-600 text-sm">Create customized itineraries for your perfect adventure</p>
            </div>
            
            <div 
              onClick={() => window.location.href = '/tourist/gallery'}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Browse Gallery</h3>
              <p className="text-gray-600 text-sm">Discover stunning photos from travelers around the world</p>
            </div>
            
            <div 
              onClick={() => window.location.href = '/tourist/activities'}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Adventure Activities</h3>
              <p className="text-gray-600 text-sm">Find thrilling activities and outdoor adventures</p>
            </div>
            
            <div 
              onClick={() => window.location.href = '/tourist/bookings'}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">My Bookings</h3>
              <p className="text-gray-600 text-sm">Manage your trips and track your travel history</p>
            </div>
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}
