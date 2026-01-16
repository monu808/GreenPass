'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Star, Calendar, Users, Camera, Heart, TrendingUp, Award, ArrowRight, Play, Navigation, Compass, RefreshCw } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { dbService } from '@/lib/databaseService';
import { policyEngine } from '@/lib/ecologicalPolicyEngine';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { Destination } from '@/types';

export default function TouristDashboard() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, any>>({});
  
  // Ref to track the latest weatherMap state and avoid stale closures in async flows
  const weatherMapRef = useRef<Record<string, any>>({});
  
  // Sync ref with state
  useEffect(() => {
    weatherMapRef.current = weatherMap;
  }, [weatherMap]);

  const loadTouristData = useCallback(async () => {
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
      
      // Get featured destinations (top 3 with lowest occupancy rate relative to adjusted capacity)
      const featured = transformedDestinations
        .filter(dest => dest.isActive)
        .sort((a, b) => {
          const aRate = a.currentOccupancy / policyEngine.getAdjustedCapacity(a);
          const bRate = b.currentOccupancy / policyEngine.getAdjustedCapacity(b);
          return aRate - bRate;
        })
        .slice(0, 3);
      
      setFeaturedDestinations(featured);
      updateWeatherData(featured);
    } catch (error) {
      console.error('Error loading tourist data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTouristData();

    // Establish a real-time connection for weather updates
    const eventSource = new EventSource('/api/weather-monitor');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🚀 Real-time update received: Refreshing Tourist Dashboard", data);
        
        const isWeatherUpdate = data.type === 'weather_update' || data.type === 'weather_update_available';
        
        if (isWeatherUpdate && data.destinationId && data.weather) {
          setWeatherMap(prev => ({
            ...prev,
            [data.destinationId]: {
              temperature: data.weather.temperature,
              humidity: data.weather.humidity,
              weatherMain: data.weather.weatherMain,
              weatherDescription: data.weather.weatherDescription,
              windSpeed: data.weather.windSpeed,
              recordedAt: new Date().toISOString()
            }
          }));
        } else {
          loadTouristData();
        }
      } catch (err) {
        console.error("Error parsing real-time data:", err);
        loadTouristData();
      }
    };

    eventSource.onerror = (error) => {
      console.log("SSE connection lost. Waiting for browser to auto-reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [loadTouristData]);

  const updateWeatherData = async (destinations: Destination[]) => {
    for (const destination of destinations) {
      try {
        // First, try to get the latest weather from the database
        const latestWeather = await dbService.getLatestWeatherData(destination.id);
        if (latestWeather) {
          const dbData = {
            temperature: latestWeather.temperature,
            humidity: latestWeather.humidity,
            weatherMain: latestWeather.weather_main,
            weatherDescription: latestWeather.weather_description,
            windSpeed: latestWeather.wind_speed,
            recordedAt: latestWeather.recorded_at
          };
          
          setWeatherMap(prev => ({
            ...prev,
            [destination.id]: dbData
          }));
        }

        const coordinates = destinationCoordinates[destination.id] || 
                          destinationCoordinates[destination.name?.toLowerCase().replace(/\s+/g, '')] ||
                          destinationCoordinates[destination.name?.toLowerCase()];
        
        // Check if we already have recent weather data for this destination using the ref
        // to avoid stale closures in this async loop
        const existingWeather = weatherMapRef.current[destination.id];
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        const isFresh = existingWeather && 
                        (new Date().getTime() - new Date(existingWeather.recordedAt).getTime() < sixHoursInMs);

        if (coordinates && !isFresh) {
          const weatherData = await weatherService.getWeatherByCoordinates(
            coordinates.lat,
            coordinates.lon,
            coordinates.name || destination.name
          );

          if (weatherData) {
            await dbService.saveWeatherData(destination.id, weatherData);
            
            const mappedData = {
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              weatherMain: weatherData.weatherMain,
              weatherDescription: weatherData.weatherDescription,
              windSpeed: weatherData.windSpeed,
              recordedAt: new Date().toISOString()
            };
            
            setWeatherMap(prev => ({
              ...prev,
              [destination.id]: mappedData
            }));
          }
        }
      } catch (error) {
        console.error(`Error updating weather for ${destination.name}:`, error);
      }
    }
  };

  const getAvailabilityColor = (destination: Destination) => {
    const adjustedCapacity = policyEngine.getAdjustedCapacity(destination);
    const occupancyRate = destination.currentOccupancy / adjustedCapacity;
    if (occupancyRate < 0.6) return 'text-emerald-600';
    if (occupancyRate < 0.8) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAvailabilityText = (destination: Destination) => {
    const adjustedCapacity = policyEngine.getAdjustedCapacity(destination);
    const occupancyRate = destination.currentOccupancy / adjustedCapacity;
    if (occupancyRate > 1) return 'Over Capacity';
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
          {featuredDestinations.map((destination, index) => {
            const weather = weatherMap[destination.id];
            return (
              <div key={destination.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-white text-sm font-medium">
                        {destination.location}
                      </span>
                      <div className="flex flex-col items-end gap-2">
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 transition-colors">
                          <Heart className="h-4 w-4 text-white" />
                        </button>
                        {weather && (
                          <div className="bg-white/20 backdrop-blur-md rounded-lg px-2 py-1 text-white text-xs font-bold flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {Math.round(weather.temperature)}°C
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">
                        {destination.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/90 ${getAvailabilityColor(destination)}`}>
                          {getAvailabilityText(destination)}
                        </span>
                        <span className="text-white text-xs font-medium">
                          {destination.currentOccupancy}/{destination.maxCapacity} spots
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Weather Quick Info */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  {weather ? (
                    <>
                      <span className="capitalize">{weather.weatherDescription}</span>
                      <span>Humidity: {weather.humidity}%</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Updating weather...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
