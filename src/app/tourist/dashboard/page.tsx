'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  MapPin, Star, Calendar, Users, Camera, TrendingUp,
  Award, ArrowRight, Play, Navigation, Compass,
  RefreshCw, Heart, Leaf
} from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import EcoSensitivityBadge from '@/components/EcoSensitivityBadge';
import EcoCapacityAlert from '@/components/EcoCapacityAlert';
import ConnectionStatusIndicator from '@/components/ConnectionStatusIndicator';
import { DataFetchErrorBoundary } from '@/components/errors';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import { getEcoFriendlyAlternatives } from '@/lib/recommendationEngine';
import { Destination } from '@/types';
import { useDestinations } from '@/hooks/useDestinations';
import { useWeatherDataBatch } from '@/hooks/useWeatherData';
import { useSSE } from '@/contexts/ConnectionContext';

// BUILD FIX: Explicit interface for weather to prevent 'any' type build failures
interface WeatherData {
  temperature: number;
  humidity: number;
  weatherMain: string;
  weatherDescription: string;
  recordedAt: string;
}

export default function TouristDashboard() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);
  const [adjustedCapacities, setAdjustedCapacities] = useState<Record<string, number>>({});

  // Use the interface here instead of 'any'
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});

  // 1. Use React Query hooks for client-side caching
  const { data: destinationsData } = useDestinations();
  const { data: batchWeatherData } = useWeatherDataBatch(
    destinationsData ? destinationsData.map(d => d.id) : []
  );

  const loadTouristData = useCallback(async () => {
    if (!destinationsData) return;
    
    try {
      const policyEngine = getPolicyEngine();
      const dbService = getDbService();

      // 2. Use batch adjusted capacities calculation
      const destinationIds = destinationsData.map(d => d.id);
      
      // Batch-fetch indicators (Phase 1 method)
      const indicatorsMap = await dbService.getEcologicalIndicatorsForDestinations(destinationIds);
      
      // We already have weather from React Query or can fetch it if needed
      const weatherInputMap = batchWeatherData || new Map();
      
      const batchCapacitiesMap = await policyEngine.getBatchAdjustedCapacities(
        destinationsData,
        weatherInputMap,
        indicatorsMap as any
      );

      const calculatedAdjustedCapacities: Record<string, number> = {};
      batchCapacitiesMap.forEach((cap, id) => {
        calculatedAdjustedCapacities[id] = cap;
      });
      
      setAdjustedCapacities(calculatedAdjustedCapacities);

      const featured = destinationsData
        .filter(dest => dest.isActive)
        .sort((a, b) => {
          const aCap = calculatedAdjustedCapacities[a.id] ?? a.maxCapacity;
          const bCap = calculatedAdjustedCapacities[b.id] ?? b.maxCapacity;
          const aRate = aCap === 0 ? 0 : a.currentOccupancy / aCap;
          const bRate = bCap === 0 ? 0 : b.currentOccupancy / bCap;
          return aRate - bRate;
        })
        .slice(0, 3);

      setFeaturedDestinations(featured);
    } catch (error) {
      console.error('Error loading tourist data:', error);
    } finally {
      setLoading(false);
    }
  }, [destinationsData, batchWeatherData]);
  
  const { connectionState, reconnect } = useSSE(
    useCallback((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'weather_update_available' ||
          data.type === 'capacity_update' ||
          data.type === 'weather_update') {
          loadTouristData();
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    }, [loadTouristData])
  );

  // Sync destinations from React Query
  useEffect(() => {
    if (destinationsData) {
      setDestinations(destinationsData);
    }
  }, [destinationsData]);

  // Sync weather from React Query
  useEffect(() => {
    if (batchWeatherData) {
      const newWeatherMap: Record<string, WeatherData> = {};
      batchWeatherData.forEach((data, id) => {
        newWeatherMap[id] = {
          temperature: data.temperature,
          humidity: data.humidity,
          weatherMain: data.weather_main,
          weatherDescription: data.weather_description,
          recordedAt: data.recorded_at
        };
      });
      setWeatherMap(newWeatherMap);
    }
  }, [batchWeatherData]);

  useEffect(() => {
    if (destinationsData) {
      loadTouristData();
    }
  }, [destinationsData, loadTouristData]);

  // BOT FIX: Standardized navigation handler
  const handleNavigation = (link: string): void => {
    window.location.href = link;
  };

  if (loading) {
    return (
      <TouristLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4" role="status" aria-live="polite">
          <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Syncing Nature Data...</p>
        </div>
      </TouristLayout>
    );
  }

  return (
    <ProtectedRoute>
      <TouristLayout>
        <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">

          {/* HERO SECTION - UNTOUCHED (Premium Branding) */}
          <div className="relative h-[480px] rounded-[3.5rem] overflow-hidden group shadow-2xl shadow-emerald-900/10 bg-slate-100 shimmer">
            <Image
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              alt="Hero Nature"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-center p-12 sm:p-20 space-y-8 max-w-4xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <Leaf className="h-5 w-5 fill-current" aria-hidden="true" />
                <span className="text-[10px] font-black tracking-[0.4em] uppercase">Beautiful World Expedition</span>
                <DataFetchErrorBoundary onRetry={reconnect}>
                  <ConnectionStatusIndicator 
                    connectionState={connectionState} 
                    onRetry={reconnect} 
                    className="ml-4 bg-emerald-950/40 border-emerald-500/30"
                  />
                </DataFetchErrorBoundary>
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none">
                Travel Around The <br /> <span className="text-emerald-400">Beautiful World</span>
              </h1>
              <p className="text-emerald-50/80 font-bold text-lg max-w-xl leading-relaxed">
                Live and take your journey. See how beautiful the world is by travelling far without hesitation.
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleNavigation('/tourist/activities')}
                  aria-label="Explore Now - View available eco-friendly activities"
                  className="bg-white text-emerald-900 hover:bg-emerald-50 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" /> Explore Now
                </button>
                <button
                  type="button"
                  onClick={() => alert("Sustainability Guide Loading...")}
                  aria-label="Watch Sustainability Video Guide"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  <Play className="h-4 w-4" aria-hidden="true" /> Watch Video
                </button>
              </div>
            </div>
          </div>

          {/* TOP DESTINATIONS SECTION */}
          <div 
            className="space-y-6"
            role="region"
            aria-labelledby="top-destinations-title"
          >
            <div className="flex items-center justify-between px-1">
              <h2 id="top-destinations-title" className="text-3xl font-black text-gray-900 tracking-tighter">Top Destinations</h2>
              <button
                type="button"
                onClick={() => handleNavigation('/tourist/destinations')}
                aria-label="View all destinations"
                className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
              >
                View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            
            <DataFetchErrorBoundary onRetry={loadTouristData}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredDestinations.map((dest) => {
                  const weather = weatherMap[dest.id];
                  return (
                    <div key={dest.id} className="space-y-4">
                      <div className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                        <div className="h-60 relative overflow-hidden bg-slate-100 shimmer">
                          {/* Background visual for card */}
                          <Image
                            src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"
                            className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110"
                            alt={dest.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                          />
                          <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 text-white">
                            <div className="flex justify-between items-start">
                              <span className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 text-[10px] font-black border border-white/10">{dest.location}</span>
                              <div className="flex flex-col items-end gap-2">
                                <button 
                                  type="button" 
                                  onClick={() => alert('Saved to Journal!')} 
                                  className="bg-white/20 p-2.5 rounded-full border border-white/10 hover:bg-rose-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white active:scale-95"
                                  aria-label={`Save ${dest.name} to Journal`}
                                >
                                  <Heart className="h-4 w-4" aria-hidden="true" />
                                </button>
                                {weather && <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1 text-[10px] font-black border border-white/10" aria-label={`Current temperature: ${Math.round(weather.temperature)} degrees Celsius`}>{Math.round(weather.temperature)}°C</div>}
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="flex flex-col gap-2">
                                <EcoSensitivityBadge level={dest.ecologicalSensitivity} />
                                <EcoCapacityAlert
                                  currentOccupancy={dest.currentOccupancy}
                                  adjustedCapacity={adjustedCapacities[dest.id] ?? dest.maxCapacity}
                                />
                                <h3 className="text-3xl font-black tracking-tighter leading-none">{dest.name}</h3>
                                <button
                                  type="button"
                                  onClick={() => handleNavigation(`/tourist/destinations?search=${dest.name}`)}
                                  className="mt-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 text-[10px] font-black border border-white/10 w-fit transition-all focus:outline-none focus:ring-2 focus:ring-white"
                                  aria-label={`View details for ${dest.name}`}
                                >
                                  View Details
                                </button>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5" aria-label={`Occupancy: ${dest.currentOccupancy} out of ${adjustedCapacities[dest.id] ?? dest.maxCapacity} eco-adjusted capacity`}>
                                  <Users className="h-3 w-3" aria-hidden="true" /> {dest.currentOccupancy} / {adjustedCapacities[dest.id] ?? dest.maxCapacity}
                                </div>
                                <div className="text-[9px] text-white/70 font-medium" aria-label={`Physical maximum capacity: ${dest.maxCapacity}`}>
                                  Max: {dest.maxCapacity}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center text-[11px] text-gray-500 font-bold uppercase tracking-widest min-h-[4rem]" role="status" aria-live="polite">
                          {weather ? (
                            <div className="w-full flex items-center justify-between animate-in fade-in">
                              <span className="flex items-center gap-2"><Compass className="h-4 w-4 text-emerald-500" aria-hidden="true" /> {weather.weatherMain}</span>
                              <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Humidity: {weather.humidity}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                              <span>Syncing Weather...</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Eco-Friendly Alternatives Section */}
                      {(() => {
                        const adjCap = adjustedCapacities[dest.id] ?? dest.maxCapacity;
                        const occupancyRate = adjCap === 0 ? 0 : dest.currentOccupancy / adjCap;
                        const isHighImpact = occupancyRate >= 0.7;

                        if (!isHighImpact) return null;

                        const alternatives = getEcoFriendlyAlternatives(dest, destinations, adjustedCapacities);
                        if (alternatives.length === 0) return null;

                        return (
                          <div 
                            className="bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100 animate-in slide-in-from-bottom-4 duration-500"
                            role="region"
                            aria-labelledby={`alternatives-title-${dest.id}`}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Leaf className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                              <h4 id={`alternatives-title-${dest.id}`} className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Eco-Friendly Alternatives</h4>
                            </div>
                            <p className="text-[11px] text-emerald-800/70 font-bold mb-4">Consider these lower-impact alternatives to reduce ecological pressure on {dest.name}:</p>
                            <div className="grid grid-cols-1 gap-3">
                              {alternatives.map(alt => (
                                <button
                                  key={alt.id}
                                  onClick={() => handleNavigation(`/tourist/destinations?search=${alt.name}`)}
                                  className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-between group hover:border-emerald-300 hover:shadow-md transition-all text-left focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                  aria-label={`View alternative destination: ${alt.name}`}
                                >
                                  <div className="space-y-1">
                                    <h5 className="text-sm font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{alt.name}</h5>
                                    <div className="flex items-center gap-3">
                                      <EcoSensitivityBadge level={alt.ecologicalSensitivity} className="scale-75 origin-left" />
                                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                                        {alt.currentOccupancy} / {adjustedCapacities[alt.id] ?? alt.maxCapacity} active
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </DataFetchErrorBoundary>
          </div>

          {/* METRIC STATS ROW */}
          <div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            role="region"
            aria-label="Your statistics"
          >
            {[
              { title: "Destinations", value: destinations.length, icon: MapPin, color: "bg-emerald-500", sub: "Available locations" },
              { title: "Bookings", value: "12", icon: Calendar, color: "bg-blue-500", sub: "Current trips" },
              { title: "Score", value: "4.8", icon: Star, color: "bg-amber-500", sub: "Average rating" },
              { title: "Adventures", value: "24", icon: Award, color: "bg-purple-500", sub: "Completed" }
            ].map((stat, i) => (
              <div 
                key={i} 
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex items-center justify-between"
                role="status"
                aria-label={`${stat.title}: ${stat.value}. ${stat.sub}`}
              >
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest" aria-hidden="true">{stat.title}</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter" aria-hidden="true">{stat.value}</p>
                  <p className="text-[10px] font-bold text-gray-400" aria-hidden="true">{stat.sub}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${stat.color}`} aria-hidden="true">
                  <stat.icon className="h-7 w-7" />
                </div>
              </div>
            ))}
          </div>

          {/* QUICK ACTIONS ROW */}
          <div 
            className="bg-white rounded-[4rem] p-12 sm:p-20 border border-gray-100 text-center relative overflow-hidden"
            role="region"
            aria-labelledby="what-we-offer-title"
          >
            <Leaf className="absolute -top-10 -right-10 h-64 w-64 text-emerald-50 rotate-12" aria-hidden="true" />
            <div className="mb-16 space-y-4 relative z-10">
              <h2 id="what-we-offer-title" className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">What We Offer</h2>
              <p className="text-gray-400 font-bold text-lg max-w-2xl mx-auto">Providing the best destination services in the world with sustainable management.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                { id: 'plan', title: 'Plan Trip', desc: 'Create custom itineraries', icon: Compass, link: '/tourist/plan' },
                { id: 'gallery', title: 'Gallery', desc: 'Browse stunning photos', icon: Camera, link: '/tourist/gallery' },
                { id: 'activities', title: 'Adventures', desc: 'Find thrilling sports', icon: TrendingUp, link: '/tourist/activities' },
                { id: 'bookings', title: 'My Trips', desc: 'Manage your history', icon: Users, link: '/tourist/bookings' }
              ].map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleNavigation(action.link)}
                  className="bg-white p-10 rounded-[3rem] border border-gray-100 hover:border-emerald-200 hover:shadow-2xl transition-all group text-left active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  aria-label={`Go to ${action.title}: ${action.desc}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <action.icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="font-black text-gray-900 text-xl mb-3 tracking-tight">{action.title}</h3>
                  <p className="text-gray-500 text-xs font-bold leading-relaxed">{action.desc}</p>
                  <div className="mt-6 flex items-center text-emerald-600 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Let&apos;s Go <ArrowRight className="h-3 w-3 ml-2" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </TouristLayout>
    </ProtectedRoute>
  );
}