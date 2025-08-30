'use client';

import React, { useState, useEffect } from 'react';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import type { WeatherData } from '@/lib/weatherService';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Wind,
  Eye,
  Droplets,
  Thermometer,
  Gauge,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface WeatherCardProps {
  destinationId: string;
  destinationName: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ destinationId, destinationName }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    const coordinates = destinationCoordinates[destinationId];
    if (!coordinates) {
      setError('Location not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherService.getWeatherByCoordinates(
        coordinates.lat,
        coordinates.lon,
        coordinates.name || destinationName
      );
      
      if (data) {
        setWeatherData(data);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch (err) {
      setError('Error fetching weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [destinationId]);

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'clouds':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rain':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'snow':
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      case 'thunderstorm':
        return <CloudLightning className="h-8 w-8 text-purple-500" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return 'text-red-600';
    if (temp > 25) return 'text-orange-500';
    if (temp > 15) return 'text-green-500';
    if (temp > 5) return 'text-blue-500';
    return 'text-blue-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{destinationName}</h3>
            <p className="text-red-600">{error || 'No weather data available'}</p>
          </div>
          <button 
            onClick={fetchWeatherData}
            className="p-2 text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  const alertCheck = weatherService.shouldGenerateAlert(weatherData);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      alertCheck.shouldAlert ? 'border-red-500' : 'border-green-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{destinationName}</h3>
          <p className="text-sm text-gray-500">{weatherData.cityName}</p>
        </div>
        <button 
          onClick={fetchWeatherData}
          className="p-2 text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alert Banner */}
      {alertCheck.shouldAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">Weather Alert</p>
              <p className="text-sm text-red-700">{alertCheck.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Weather Info */}
      <div className="flex items-center mb-4">
        {getWeatherIcon(weatherData.weatherMain)}
        <div className="ml-4">
          <div className={`text-3xl font-bold ${getTemperatureColor(weatherData.temperature)}`}>
            {weatherData.temperature}°C
          </div>
          <div className="text-gray-600 capitalize">
            {weatherData.weatherDescription}
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center">
          <Droplets className="h-4 w-4 text-blue-500 mr-2" />
          <span>Humidity: {weatherData.humidity}%</span>
        </div>
        
        <div className="flex items-center">
          <Gauge className="h-4 w-4 text-gray-500 mr-2" />
          <span>Pressure: {weatherData.pressure} hPa</span>
        </div>
        
        <div className="flex items-center">
          <Wind className="h-4 w-4 text-gray-500 mr-2" />
          <span>Wind: {weatherData.windSpeed} m/s</span>
        </div>
        
        <div className="flex items-center">
          <Eye className="h-4 w-4 text-gray-500 mr-2" />
          <span>Visibility: {weatherData.visibility} km</span>
        </div>

        {/* Enhanced Tomorrow.io specific data */}
        {weatherData.uvIndex !== undefined && (
          <div className="flex items-center">
            <Zap className="h-4 w-4 text-yellow-500 mr-2" />
            <span>UV Index: {weatherData.uvIndex}</span>
          </div>
        )}
        
        {weatherData.cloudCover !== undefined && (
          <div className="flex items-center">
            <Cloud className="h-4 w-4 text-gray-500 mr-2" />
            <span>Cloud Cover: {weatherData.cloudCover}%</span>
          </div>
        )}
        
        {weatherData.precipitationProbability !== undefined && (
          <div className="flex items-center">
            <CloudRain className="h-4 w-4 text-blue-500 mr-2" />
            <span>Rain Chance: {weatherData.precipitationProbability}%</span>
          </div>
        )}
        
        {weatherData.precipitationType && weatherData.precipitationType !== 'None' && (
          <div className="flex items-center">
            <Droplets className="h-4 w-4 text-blue-600 mr-2" />
            <span>Precipitation: {weatherData.precipitationType}</span>
          </div>
        )}
      </div>

      {/* Powered by Tomorrow.io */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Powered by Tomorrow.io Weather API
        </p>
      </div>
    </div>
  );
};

const WeatherDashboard: React.FC = () => {
  const destinations = [
    { id: 'manali', name: 'Manali' },
    { id: 'shimla', name: 'Shimla' },
    { id: 'dharamshala', name: 'Dharamshala' },
    { id: 'srinagar', name: 'Srinagar' },
    { id: 'jammu', name: 'Jammu' },
    { id: 'gulmarg', name: 'Gulmarg' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Weather Dashboard</h2>
        <p className="text-gray-600">
          Real-time weather monitoring for tourist destinations using Tomorrow.io API
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination) => (
          <WeatherCard 
            key={destination.id}
            destinationId={destination.id}
            destinationName={destination.name}
          />
        ))}
      </div>
    </div>
  );
};

export default WeatherDashboard;
