'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, Star, Calendar, Users, Camera, TrendingUp, 
  Award, ArrowRight, Play, Navigation, Compass, 
  RefreshCw, Heart, Leaf 
} from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import { Destination } from '@/types';

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
  
  // Use the interface here instead of 'any'
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});
  const weatherMapRef = useRef<Record<string, WeatherData>>({});
  
  useEffect(() => {
    weatherMapRef.current = weatherMap;
  }, [weatherMap]);

  const loadTouristData = useCallback(async () => {
    try {
      const dbService = getDbService();
      const policyEngine = getPolicyEngine();
      const destinationsData = await dbService.getDestinations();
      
      const transformedDestinations: Destination[] = destinationsData.map(dest => ({
        id: dest.id,
        name: dest.name,
        location: dest.location,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        description: dest.description,
        guidelines: dest.guidelines || [], // Ensure array fallback
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: {
          latitude: dest.latitude,
          longitude: dest.longitude
        }
      }));

      setDestinations(transformedDestinations);
      
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

  const updateWeatherData = async (featured: Destination[]) => {
    const dbService = getDbService();
    for (const destination of featured) {
      try {
        const latestWeather = await dbService.getLatestWeatherData(destination.id);
        if (latestWeather) {
          setWeatherMap(prev => ({ 
            ...prev, 
            [destination.id]: {
              temperature: latestWeather.temperature,
              humidity: latestWeather.humidity,
              weatherMain: latestWeather.weather_main,
              weatherDescription: latestWeather.weather_description,
              recordedAt: latestWeather.recorded_at
            }
          }));
        }
      } catch (error) {
        console.error(`Error updating weather:`, error);
      }
    }
  };

  useEffect(() => {
    loadTouristData();
  }, [loadTouristData]);

  // BOT FIX: Standardized navigation handler
  const handleNavigation = (link: string): void => { 
    window.location.href = link; 
  };

  if (loading) {
    return (
      <TouristLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Syncing Nature Data...</p>
        </div>
      </TouristLayout>
    );
  }

  return (
    <TouristLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">
        
        {/* HERO SECTION - UNTOUCHED (Premium Branding) */}
        <div className="relative h-[480px] rounded-[3.5rem] overflow-hidden group shadow-2xl shadow-emerald-900/10">
          <img 
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            alt="Hero Nature"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/40 to-transparent" />
          <div className="relative h-full flex flex-col justify-center p-12 sm:p-20 space-y-8 max-w-4xl">
            <div className="flex items-center gap-2 text-emerald-400">
               <Leaf className="h-5 w-5 fill-current" />
               <span className="text-[10px] font-black tracking-[0.4em] uppercase">Beautiful World Expedition</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none">
              Travel Around The <br/> <span className="text-emerald-400">Beautiful World</span>
            </h1>
            <p className="text-emerald-50/80 font-bold text-lg max-w-xl leading-relaxed">
              Live and take your journey. See how beautiful the world is by travelling far without hesitation.
            </p>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => handleNavigation('/tourist/activities')} 
                className="bg-white text-emerald-900 hover:bg-emerald-50 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3"
              >
                <Navigation className="h-4 w-4" /> Explore Now
              </button>
              <button 
                type="button"
                onClick={() => alert("Sustainability Guide Loading...")} 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 flex items-center gap-3"
              >
                <Play className="h-4 w-4" /> Watch Video
              </button>
            </div>
          </div>
        </div>

        {/* TOP DESTINATIONS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Top Destinations</h2>
            <button 
              type="button"
              onClick={() => handleNavigation('/tourist/destinations')} 
              className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              View All <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDestinations.map((dest) => {
              const weather = weatherMap[dest.id];
              return (
                <div key={dest.id} className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="h-60 relative overflow-hidden bg-emerald-900">
                    {/* Background visual for card */}
                    <img 
                      src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800" 
                      className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" 
                      alt={dest.name} 
                    />
                    <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 text-white">
                      <div className="flex justify-between items-start">
                        <span className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 text-[10px] font-black border border-white/10">{dest.location}</span>
                        <div className="flex flex-col items-end gap-2">
                           <button type="button" onClick={() => alert('Saved to Journal!')} className="bg-white/20 p-2.5 rounded-full border border-white/10 hover:bg-rose-500 transition-colors"><Heart className="h-4 w-4"/></button>
                           {weather && <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1 text-[10px] font-black border border-white/10">{Math.round(weather.temperature)}°C</div>}
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <h3 className="text-3xl font-black tracking-tighter leading-none">{dest.name}</h3>
                        <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                           <Users className="h-3 w-3" /> {dest.currentOccupancy}/{dest.maxCapacity}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Compass className="h-4 w-4 text-emerald-500" /> {weather?.weatherMain || "Cloudy"}</span>
                    <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-emerald-500" /> Humidity: {weather?.humidity || "45"}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* METRIC STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Destinations", value: destinations.length, icon: MapPin, color: "bg-emerald-500", sub: "Available locations" },
            { title: "Bookings", value: "12", icon: Calendar, color: "bg-blue-500", sub: "Current trips" },
            { title: "Score", value: "4.8", icon: Star, color: "bg-amber-500", sub: "Average rating" },
            { title: "Adventures", value: "24", icon: Award, color: "bg-purple-500", sub: "Completed" }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-400">{stat.sub}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${stat.color}`}>
                <stat.icon className="h-7 w-7" />
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="bg-white rounded-[4rem] p-12 sm:p-20 border border-gray-100 text-center relative overflow-hidden">
          <Leaf className="absolute -top-10 -right-10 h-64 w-64 text-emerald-50 rotate-12" />
          <div className="mb-16 space-y-4 relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">What We Offer</h2>
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
                className="bg-white p-10 rounded-[3rem] border border-gray-100 hover:border-emerald-200 hover:shadow-2xl transition-all group text-left active:scale-95"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <action.icon className="h-8 w-8" />
                </div>
                <h3 className="font-black text-gray-900 text-xl mb-3 tracking-tight">{action.title}</h3>
                <p className="text-gray-500 text-xs font-bold leading-relaxed">{action.desc}</p>
                <div className="mt-6 flex items-center text-emerald-600 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Let's Go <ArrowRight className="h-3 w-3 ml-2" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </TouristLayout>
  );
}