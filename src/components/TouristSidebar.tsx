'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDbService } from '@/lib/databaseService';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { useFocusTrap, useEscapeKey } from '@/lib/accessibility';

interface SidebarWeatherData {
  temperature: number;
  weatherDescription: string;
  weatherMain: string;
}
import { 
  Home, 
  MapPin, 
  Calendar, 
  Heart, 
  User, 
  Camera, 
  Mountain,
  TreePine,
  Star,
  Info,
  CloudSun,
  RefreshCw,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  X,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const touristNavItems = [
  { name: 'Explore', href: '/tourist/dashboard', icon: Home },
  { name: 'Destinations', href: '/tourist/destinations', icon: MapPin },
  { name: 'Plan Your Trip', href: '/tourist/plan', icon: Calendar },
  { name: 'My Bookings', href: '/tourist/bookings', icon: Calendar },
  { name: 'Favorites', href: '/tourist/favorites', icon: Heart },
  { name: 'Photo Gallery', href: '/tourist/gallery', icon: Camera },
  { name: 'Adventure Activities', href: '/tourist/activities', icon: Mountain },
  { name: 'Eco Tourism', href: '/tourist/eco-tourism', icon: TreePine },
  { name: 'Eco Initiatives', href: '/tourist/eco-initiatives', icon: Leaf },
  { name: 'Reviews & Ratings', href: '/tourist/reviews', icon: Star },
  { name: 'Travel Guide', href: '/tourist/guide', icon: Info },
  { name: 'Weather Monitoring', href: '/weather', icon: CloudSun },
  { name: 'My Profile', href: '/tourist/profile', icon: User },
];

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function TouristSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [weather, setWeather] = useState<SidebarWeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Focus trap and escape key for mobile drawer
  useFocusTrap(sidebarRef, !!isOpen);
  useEscapeKey(() => setIsOpen?.(false), !!isOpen);

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX; // Initialize to avoid tap being treated as swipe
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const isLeftSwipe = distance > 70;
      
      if (isLeftSwipe) {
        setIsOpen?.(false);
        // Reset refs after closing to avoid stale values
        touchStartX.current = null;
        touchEndX.current = null;
      }
    }
  };

  useEffect(() => {
    const fetchDefaultWeather = async () => {
      try {
        const dbService = getDbService();
        // Default to Srinagar for the widget
        const defaultDestId = 'srinagar';
        const coordinates = destinationCoordinates[defaultDestId];
        
        // Try DB first
        const latestWeather = await dbService.getLatestWeatherData(defaultDestId);
        if (latestWeather) {
          setWeather({
            temperature: latestWeather.temperature ?? 0,
            weatherDescription: latestWeather.weatherDescription ?? 'clear sky',
            weatherMain: latestWeather.weatherMain ?? 'Clear',
          });
          setLoadingWeather(false);
        }

        if (coordinates) {
          const freshWeather = await weatherService.getWeatherByCoordinates(
            coordinates.lat,
            coordinates.lon,
            coordinates.name || 'Srinagar'
          );
          if (freshWeather) {
            setWeather({
              temperature: freshWeather.temperature,
              weatherDescription: freshWeather.weatherDescription,
              weatherMain: freshWeather.weatherMain,
            });
            await dbService.saveWeatherData({
              destination_id: defaultDestId,
              temperature: freshWeather.temperature,
              humidity: freshWeather.humidity,
              pressure: freshWeather.pressure,
              weather_main: freshWeather.weatherMain,
              weather_description: freshWeather.weatherDescription,
              wind_speed: freshWeather.windSpeed,
              wind_direction: freshWeather.windDirection,
              visibility: freshWeather.visibility,
              recorded_at: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching sidebar weather:', error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchDefaultWeather();
    
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchDefaultWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain?.toLowerCase()) {
      case 'clear': return <Sun className="h-6 w-6 text-yellow-500" aria-hidden="true" />;
      case 'clouds': return <Cloud className="h-6 w-6 text-gray-500" aria-hidden="true" />;
      case 'rain': return <CloudRain className="h-6 w-6 text-blue-500" aria-hidden="true" />;
      case 'snow': return <CloudSnow className="h-6 w-6 text-blue-200" aria-hidden="true" />;
      case 'thunderstorm': return <CloudLightning className="h-6 w-6 text-purple-500" aria-hidden="true" />;
      default: return <Sun className="h-6 w-6 text-yellow-500" aria-hidden="true" />;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside 
        ref={sidebarRef}
        aria-label="Sidebar navigation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-2xl lg:shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <header 
            className="flex items-center justify-between h-20 px-6 bg-gradient-to-br from-green-600 via-blue-600 to-green-600"
            aria-labelledby="sidebar-logo-title"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Mountain className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <div className="text-white">
                <span id="sidebar-logo-title" className="text-lg font-semibold block">Paradise Tourism</span>
                <p className="text-xs opacity-90" aria-hidden="true">Tourism Management</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              id="close-sidebar-button"
              className="lg:hidden p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setIsOpen?.(false)}
              aria-label="Close sidebar navigation menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </header>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1" role="list">
              {touristNavItems.map((item, index) => {
                const isActive = pathname === item.href;
                const itemId = `sidebar-nav-item-${index}`;
                return (
                  <li key={item.name}>
                    <Link
                      id={itemId}
                      href={item.href}
                      onClick={() => setIsOpen?.(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        "group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset min-h-[44px]",
                        isActive
                          ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                          : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isActive 
                          ? 'text-green-600' 
                          : 'text-gray-500 group-hover:text-green-600'
                      )} aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Weather Widget */}
          <div 
            className="p-4 m-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-gray-200"
            role="region"
            aria-labelledby="sidebar-weather-title"
          >
            <h2 id="sidebar-weather-title" className="sr-only">Current Weather</h2>
            <div 
              role="status" 
              aria-live="polite"
            >
            {loadingWeather ? (
              <div className="flex items-center justify-center py-2 space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
                <span className="text-xs text-gray-500">Updating weather...</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm" aria-hidden="true">
                    {getWeatherIcon(weather?.weatherMain || '')}
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-gray-800">
                      <span className="sr-only">Current temperature in Srinagar: </span>
                      {Math.round(weather?.temperature || 0)}°C
                    </p>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Srinagar</p>
                    <p className="sr-only">Weather condition: {weather?.weatherDescription}</p>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-gray-200" role="contentinfo">
            <div className="text-center text-xs text-gray-600">
              <p className="font-medium text-gray-800">© 2026 Paradise Tourism</p>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
}
