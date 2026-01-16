import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dbService } from '@/lib/databaseService';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
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
  CloudLightning
} from 'lucide-react';

const touristNavItems = [
  { name: 'Explore', href: '/tourist/dashboard', icon: Home },
  { name: 'Destinations', href: '/tourist/destinations', icon: MapPin },
  { name: 'Plan Your Trip', href: '/tourist/plan', icon: Calendar },
  { name: 'My Bookings', href: '/tourist/bookings', icon: Calendar },
  { name: 'Favorites', href: '/tourist/favorites', icon: Heart },
  { name: 'Photo Gallery', href: '/tourist/gallery', icon: Camera },
  { name: 'Adventure Activities', href: '/tourist/activities', icon: Mountain },
  { name: 'Eco Tourism', href: '/tourist/eco-tourism', icon: TreePine },
  { name: 'Reviews & Ratings', href: '/tourist/reviews', icon: Star },
  { name: 'Travel Guide', href: '/tourist/guide', icon: Info },
  { name: 'Weather Monitoring', href: '/weather', icon: CloudSun },
  { name: 'My Profile', href: '/tourist/profile', icon: User },
];

export default function TouristSidebar() {
  const pathname = usePathname();
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  useEffect(() => {
    const fetchDefaultWeather = async () => {
      try {
        // Default to Srinagar for the widget
        const defaultDestId = 'srinagar';
        const coordinates = destinationCoordinates[defaultDestId];
        
        // Try DB first
        const latestWeather = await dbService.getLatestWeatherData(defaultDestId);
        if (latestWeather) {
          setWeather({
            temperature: latestWeather.temperature,
            weatherDescription: latestWeather.weather_description,
            weatherMain: latestWeather.weather_main,
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
            await dbService.saveWeatherData(defaultDestId, freshWeather);
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
      case 'clear': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'clouds': return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain': return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'snow': return <CloudSnow className="h-6 w-6 text-blue-200" />;
      case 'thunderstorm': return <CloudLightning className="h-6 w-6 text-purple-500" />;
      default: return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-br from-green-600 via-blue-600 to-green-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mountain className="h-8 w-8 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-lg font-semibold">Paradise Tourism</h1>
              <p className="text-sm opacity-90">Jammu & Himachal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {touristNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-colors duration-200 ${
                  isActive 
                    ? 'text-green-600' 
                    : 'text-gray-500 group-hover:text-green-600'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Weather Widget */}
        <div className="p-4 m-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-gray-200">
          {loadingWeather ? (
            <div className="flex items-center justify-center py-2 space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-xs text-gray-500">Updating weather...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getWeatherIcon(weather?.weatherMain)}
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-800">{Math.round(weather?.temperature || 0)}°C</p>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Srinagar</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200/50">
                <p className="text-xs text-green-600 font-medium capitalize">
                  {weather?.weatherDescription || 'Clear skies'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-center text-xs text-gray-600">
            <p className="font-medium text-gray-800">© 2026 Paradise Tourism</p>
            <p className="text-green-600 font-medium mt-1">Sustainable Adventure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
