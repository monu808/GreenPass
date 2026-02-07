"use client";

import React, { useState, useEffect, useCallback } from "react";
import { weatherService, destinationCoordinates } from "@/lib/weatherService";
import type { WeatherData } from "@/lib/weatherService";
import { getDbService } from "@/lib/databaseService";
import { getPolicyEngine } from "@/lib/ecologicalPolicyEngine";
import { getEcoFriendlyAlternatives } from "@/lib/recommendationEngine";
import EcoSensitivityBadge from "./EcoSensitivityBadge";
import EcoCapacityAlert from "./EcoCapacityAlert";
import { logger } from '@/lib/logger';
import { Destination } from "@/types";
import { DataFetchErrorBoundary } from "@/components/errors";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Zap,
  AlertTriangle,
  RefreshCw,
  Leaf,
  Users,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface WeatherCardProps {
  destination: Destination;
  allDestinations?: Destination[];
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  destination,
  allDestinations = [],
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustedCapacity, setAdjustedCapacity] = useState<number>(destination.maxCapacity);
  const [alternatives, setAlternatives] = useState<Destination[]>([]);

  const fetchWeatherData = useCallback(async () => {
    const coordinates = destinationCoordinates[destination.id] || 
                      destinationCoordinates[destination.name?.toLowerCase().replace(/\s+/g, '')] ||
                      destinationCoordinates[destination.name?.toLowerCase()];
    if (!coordinates) {
      setError("Location not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherService.getWeatherByCoordinates(
        coordinates.lat,
        coordinates.lon,
        coordinates.name || destination.name
      );

      if (data) {
        setWeatherData(data);
        // Calculate adjusted capacity based on weather data
        const alertCheck = weatherService.shouldGenerateAlert(data);
        const result = await getPolicyEngine().getDynamicCapacity(destination, {
          alertLevel: alertCheck.shouldAlert ? "medium" : "none"
        });
        setAdjustedCapacity(result.adjustedCapacity);
        
        // Find alternatives if occupancy is high
        const occupancyRate = (destination.currentOccupancy / result.adjustedCapacity) * 100;
        if (occupancyRate >= 70 && allDestinations.length > 0) {
          // We need a map of adjusted capacities for all destinations for the recommendation engine
          // Since we only have weather for this one, we'll use a simplified version or assume others are at max for now
          // In a real app, this would be pre-calculated
          const mockAdjustedCaps: Record<string, number> = {
            [destination.id]: result.adjustedCapacity
          };
          allDestinations.forEach(d => {
            if (d.id !== destination.id) mockAdjustedCaps[d.id] = d.maxCapacity;
          });
          
          setAlternatives(getEcoFriendlyAlternatives(destination, allDestinations, mockAdjustedCaps));
        }
      } else {
        setError("Failed to fetch weather data");
      }
    } catch (err) {
      setError("Error fetching weather data");
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [destination, allDestinations]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case "clouds":
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case "rain":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case "snow":
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      case "thunderstorm":
        return <CloudLightning className="h-8 w-8 text-purple-500" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return "text-red-600";
    if (temp > 25) return "text-orange-500";
    if (temp > 15) return "text-green-500";
    if (temp > 5) return "text-blue-500";
    return "text-blue-700";
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
            <h3 className="text-lg font-semibold text-gray-900">
              {destination.name}
            </h3>
            <p className="text-red-600">
              {error || "No weather data available"}
            </p>
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
  const occupancyRate = (destination.currentOccupancy / adjustedCapacity) * 100;
  const isCapacityCritical = occupancyRate >= 80;

  return (
    <div
      className={`bg-white rounded-[2rem] shadow-xl p-6 border-l-8 transition-all duration-300 hover:shadow-2xl flex flex-col gap-6 ${
        alertCheck.shouldAlert || isCapacityCritical ? "border-red-500" : "border-emerald-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              {destination.name}
            </h3>
            <EcoSensitivityBadge level={destination.ecologicalSensitivity} className="scale-75 origin-left" />
          </div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {destination.location}
          </p>
        </div>
        <button
          onClick={fetchWeatherData}
          className="p-2.5 bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Holistic Alert System */}
      <div className="space-y-3">
        <EcoCapacityAlert 
          currentOccupancy={destination.currentOccupancy} 
          adjustedCapacity={adjustedCapacity}
        />
        
        {alertCheck.shouldAlert && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-red-900 uppercase tracking-widest">Weather Alert</p>
                <p className="text-[11px] font-medium text-red-700/80 mt-0.5 leading-relaxed">{alertCheck.reason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Environmental Awareness Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weather Status */}
        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
          <div className="flex items-center gap-3 mb-2">
            {getWeatherIcon(weatherData.weatherMain)}
            <div className={`text-2xl font-black tracking-tighter ${getTemperatureColor(weatherData.temperature)}`}>
              {Math.round(weatherData.temperature)}°C
            </div>
          </div>
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest">{weatherData.weatherDescription}</p>
        </div>

        {/* Ecological Status */}
        <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-100 p-1.5 rounded-lg">
              <Leaf className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-emerald-900 tracking-tight">
              {Math.round(occupancyRate)}%
            </div>
          </div>
          <p className="text-[9px] font-semibold text-emerald-700/70 uppercase tracking-widest">Eco-Load Factor</p>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              <Users className="h-3 w-3" /> Live Occupancy
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900">{destination.currentOccupancy}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Active</span>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${occupancyRate >= 80 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {Math.round(occupancyRate)}% Full
          </div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${
              occupancyRate >= 90 ? 'bg-red-500' : 
              occupancyRate >= 75 ? 'bg-orange-500' : 
              'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>

        <div className="text-[9px] font-bold text-gray-400 text-center">
          (Eco-Limit: {adjustedCapacity} <span className="mx-1 opacity-20">|</span> Max: {destination.maxCapacity})
        </div>
      </div>

      {/* Eco-Friendly Alternatives Section */}
      {alternatives.length > 0 && (
        <div className="bg-emerald-50/50 rounded-[1.5rem] p-4 border border-emerald-100 space-y-3">
          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Low-Impact Alternatives</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {alternatives.map(alt => (
              <div
                key={alt.id}
                className="bg-white p-3 rounded-xl border border-emerald-50 flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <h5 className="text-[11px] font-black text-gray-900">{alt.name}</h5>
                  <div className="flex items-center gap-2">
                    <EcoSensitivityBadge level={alt.ecologicalSensitivity} className="scale-[0.6] origin-left" />
                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                      {alt.currentOccupancy} Active
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Weather Metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
          <Droplets className="h-3.5 w-3.5 text-blue-400" />
          <span>Humidity: {weatherData.humidity}%</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
          <Wind className="h-3.5 w-3.5 text-emerald-400" />
          <span>Wind: {weatherData.windSpeed} m/s</span>
        </div>
        {weatherData.uvIndex !== undefined && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span>UV Index: {weatherData.uvIndex}</span>
          </div>
        )}
        {weatherData.precipitationProbability !== undefined && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
            <CloudRain className="h-3.5 w-3.5 text-blue-500" />
            <span>Rain: {weatherData.precipitationProbability}%</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-2 text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em] text-center">
        Tomorrow.io × GreenPass Ecological Engine
      </p>
    </div>
  );
};

const WeatherDashboard: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        setError(null);
        const dbService = getDbService();
        const rawData = await dbService.getDestinations();
        
        if (!Array.isArray(rawData)) {
          throw new Error("Invalid data format received from server");
        }

        // The dbService.getDestinations() already returns transformed Destination[] objects
        setDestinations(rawData);
      } catch (err) {
        logger.error(
          'Error fetching destinations',
          err,
          { component: 'WeatherDashboard', operation: 'fetchDestinations' }
        );
        setError("Failed to load environmental data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-gray-500 font-medium animate-pulse">Syncing with ecological sensors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Sync Error</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary onRetry={() => window.location.reload()} maxRetries={0}>
      <div aria-live="polite" className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            Environmental Intelligence
          </h2>
          <p className="text-gray-500 font-medium">
            Real-time weather monitoring integrated with ecological capacity data for sustainable tourism.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination) => (
            <WeatherCard
              key={destination.id}
              destination={destination}
              allDestinations={destinations}
            />
          ))}
        </div>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default WeatherDashboard;
