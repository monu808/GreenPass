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
    <div className="relative overflow-hidden">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2 heading-section">{value}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-4 rounded-xl ${gradient} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {/* Decorative element */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
      </div>
    </div>
  );

  const HeroDestinationCard = ({ destination, index }: { destination: Destination; index: number }) => (
    <div className={`relative overflow-hidden rounded-3xl shadow-2xl card-hover group ${
      index === 0 ? 'col-span-2 row-span-2' : 'col-span-1'
    }`}>
      {/* Background Image Effect */}
      <div className={`${
        index === 0 ? 'h-96' : 'h-48'
      } bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 relative image-overlay`}>
        
        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="glass rounded-xl px-3 py-1">
              <span className="text-white text-sm font-medium">{destination.location}</span>
            </div>
            <button className="glass rounded-full p-2 hover:bg-white/20 transition-colors">
              <Heart className="h-5 w-5 text-white" />
            </button>
          </div>
          
          <div>
            <h3 className={`text-white font-bold mb-2 heading-section ${
              index === 0 ? 'text-3xl' : 'text-xl'
            }`}>
              {destination.name}
            </h3>
            <p className="text-white/90 text-sm mb-4 line-clamp-2">
              {destination.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="glass rounded-lg px-3 py-1">
                  <span className={`text-white text-xs font-medium ${getAvailabilityColor(destination)}`}>
                    {getAvailabilityText(destination)}
                  </span>
                </div>
                <div className="glass rounded-lg px-3 py-1">
                  <span className="text-white text-xs">
                    {destination.currentOccupancy}/{destination.maxCapacity}
                  </span>
                </div>
              </div>
              
              <button className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    onClick: () => void;
  }) => (
    <div 
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 card-hover cursor-pointer group"
    >
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-2 heading-section">{title}</h3>
      <p className="text-slate-600 text-sm text-body">{description}</p>
      <div className="flex items-center mt-4 text-slate-700 group-hover:text-emerald-600 transition-colors">
        <span className="text-sm font-medium">Explore</span>
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
        <div className="relative">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-slate-900 mb-4 heading-display gradient-text">
              Travel Around The Beautiful World
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto text-body">
              Live And Take Tour Journey, See How Beautiful The World Is By Travelling So Far 
              Without Hesitation. Because We Are Responsible For You Trip Happiness.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button className="btn-primary">
                <Navigation className="h-5 w-5" />
                Explore Now
              </button>
              <button className="btn-secondary">
                <Play className="h-5 w-5" />
                Watch Video
              </button>
            </div>
          </div>

          {/* Featured Destinations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {featuredDestinations.map((destination, index) => (
              <HeroDestinationCard 
                key={destination.id} 
                destination={destination} 
                index={index}
              />
            ))}
          </div>
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
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 heading-section">What We Offer</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-body">
              Provide The Best Destination Services In The World
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Plan Your Trip"
              description="Create customized itineraries for your perfect adventure"
              icon={Compass}
              color="bg-gradient-to-br from-emerald-500 to-teal-600"
              onClick={() => window.location.href = '/tourist/plan'}
            />
            <QuickActionCard
              title="Browse Gallery"
              description="Discover stunning photos from travelers around the world"
              icon={Camera}
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
              onClick={() => window.location.href = '/tourist/gallery'}
            />
            <QuickActionCard
              title="Adventure Activities"
              description="Find thrilling activities and outdoor adventures"
              icon={TrendingUp}
              color="bg-gradient-to-br from-purple-500 to-pink-600"
              onClick={() => window.location.href = '/tourist/activities'}
            />
            <QuickActionCard
              title="My Bookings"
              description="Manage your trips and track your travel history"
              icon={Users}
              color="bg-gradient-to-br from-amber-500 to-orange-600"
              onClick={() => window.location.href = '/tourist/bookings'}
            />
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}
