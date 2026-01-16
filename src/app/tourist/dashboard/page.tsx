'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Star, Calendar, Users, Camera, Heart, TrendingUp, Award, ArrowRight, Play, Navigation, Compass, RefreshCw } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
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
      const dbService = getDbService();
      const policyEngine = getPolicyEngine();
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
    const dbService = getDbService();
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
    const policyEngine = getPolicyEngine();
    const adjustedCapacity = policyEngine.getAdjustedCapacity(destination);
    const occupancyRate = destination.currentOccupancy / adjustedCapacity;
    if (occupancyRate > 1) return 'text-red-800';
    if (occupancyRate < 0.6) return 'text-emerald-600';
    if (occupancyRate < 0.8) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAvailabilityText = (destination: Destination) => {
    const policyEngine = getPolicyEngine();
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
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:border-emerald-200 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${gradient} shadow-md`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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
      <div className="space-y-6 sm:space-y-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-green-800 rounded-2xl p-6 sm:p-12 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-black mb-4 sm:mb-6 leading-tight">
              Travel Around The <span className="text-green-300">Beautiful World</span>
            </h1>
            <p className="text-sm sm:text-lg text-green-50/90 mb-8 sm:mb-10 leading-relaxed max-w-2xl">
              Live And Take Your Journey, See How Beautiful The World Is By Travelling So Far
              Without Hesitation. Because We Are Responsible For Your Trip Happiness.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <button className="bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95">
                <Navigation className="h-5 w-5" />
                Explore Now
              </button>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20">
                <Play className="h-5 w-5" />
                Watch Video
              </button>
            </div>
          </div>
        </div>

        {/* Featured Destinations Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Top Destinations</h2>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredDestinations.map((destination, index) => {
              const weather = weatherMap[destination.id];
              return (
                <div key={destination.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="h-56 bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-white text-xs font-bold border border-white/20">
                          {destination.location}
                        </span>
                        <div className="flex flex-col items-end gap-2">
                          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2.5 transition-colors border border-white/20">
                            <Heart className="h-4 w-4 text-white" />
                          </button>
                          {weather && (
                            <div className="bg-white/20 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-xs font-black flex items-center gap-1.5 border border-white/20">
                              <RefreshCw className="h-3 w-3" />
                              {Math.round(weather.temperature)}°C
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="transform group-hover:translate-y-[-4px] transition-transform">
                        <h3 className="text-white font-black text-xl mb-2 drop-shadow-md">
                          {destination.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg bg-white shadow-sm ${getAvailabilityColor(destination)}`}>
                            {getAvailabilityText(destination)}
                          </span>
                          <span className="text-white text-xs font-bold flex items-center bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">
                            <Users className="h-3 w-3 mr-1" />
                            {destination.currentOccupancy}/{destination.maxCapacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Weather Quick Info */}
                  <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                    {weather ? (
                      <>
                        <span className="capitalize flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-blue-500" />
                          {weather.weatherDescription}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                          Humidity: {weather.humidity}%
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-2 w-full justify-center">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        Updating weather...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            title="Destinations"
            value={destinations.length}
            icon={MapPin}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            subtitle="Available locations"
          />
          <StatCard
            title="Bookings"
            value="12"
            icon={Calendar}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            subtitle="Current trips"
          />
          <StatCard
            title="Score"
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
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-3 sm:mb-4">What We Offer</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-medium">
              Provide The Best Destination Services In The World
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { id: 'plan', title: 'Plan Your Trip', desc: 'Create customized itineraries for your adventure', icon: Compass, color: 'from-emerald-500 to-teal-600', link: '/tourist/plan' },
              { id: 'gallery', title: 'Browse Gallery', desc: 'Discover stunning photos from travelers', icon: Camera, color: 'from-blue-500 to-indigo-600', link: '/tourist/gallery' },
              { id: 'activities', title: 'Adventures', desc: 'Find thrilling activities and outdoor fun', icon: TrendingUp, color: 'from-purple-500 to-pink-600', link: '/tourist/activities' },
              { id: 'bookings', title: 'My Bookings', desc: 'Manage your trips and track history', icon: Users, color: 'from-amber-500 to-orange-600', link: '/tourist/bookings' }
            ].map((action) => (
              <div 
                key={action.id}
                onClick={() => window.location.href = action.link}
                className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0"
              >
                <div className={`w-12 h-12 flex-shrink-0 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{action.title}</h3>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}
