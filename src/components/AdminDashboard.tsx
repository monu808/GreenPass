"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import {
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Leaf,
  ShieldAlert,
  Settings,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { dbService } from '@/lib/databaseService';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { getCapacityStatus, formatDateTime } from '@/lib/utils';
import { DashboardStats, Destination, Alert } from '@/types';
import { policyEngine, DEFAULT_POLICIES, SensitivityLevel, EcologicalPolicy } from '@/lib/ecologicalPolicyEngine';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTourists: 0,
    currentOccupancy: 0,
    maxCapacity: 0,
    adjustedMaxCapacity: 0,
    pendingApprovals: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    capacityUtilization: 0,
    alertsCount: 0,
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, any>>({});
  
  // Ref to track the latest weatherMap state and avoid stale closures in async flows
  const weatherMapRef = useRef<Record<string, any>>({});
  
  // Sync ref with state
  useEffect(() => {
    weatherMapRef.current = weatherMap;
  }, [weatherMap]);

  const [policies, setPolicies] = useState<Record<SensitivityLevel, EcologicalPolicy>>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<SensitivityLevel | null>(null);
  const [policyForm, setPolicyForm] = useState<EcologicalPolicy | null>(null);

  useEffect(() => {
    // 1. Load initial data when the user first opens the dashboard
    loadDashboardData();
    setPolicies(policyEngine.getAllPolicies());

    // 2. Real-Time Connection (Issue #21 Requirement)
    // This connects the dashboard to the "live pipe" we created in route.ts
    const eventSource = new EventSource('/api/weather-monitor');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🚀 Real-time weather update received from server:", data);
        
        const isWeatherUpdate = data.type === 'weather_update' || data.type === 'weather_update_available';

        // If the update contains specific destination weather, update it directly
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
          // Fallback to full reload for other update types (like general available signal)
          loadDashboardData(); 
        }
      } catch (err) {
        console.error("Error parsing real-time data:", err);
      }
    };

    eventSource.onerror = (err) => {
      //  Remove .close() to allow the browser to auto-reconnect.
      // The Spec for EventSource automatically handles retries.
      console.error("SSE connection interrupted. Browser is attempting to reconnect...");
    };

    // 3. Cleanup: Stop listening if the user navigates away from the dashboard
    return () => {
      eventSource.close();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'policies'>('overview');

  const handleConfigure = (level: SensitivityLevel) => {
    const policy = policies[level] || policyEngine.getPolicy(level);
    setPolicyForm({ ...policy });
    setEditingPolicy(level);
  };

  const handleSavePolicy = () => {
    if (editingPolicy && policyForm) {
      policyEngine.updatePolicy(editingPolicy, policyForm);
      setPolicies(policyEngine.getAllPolicies());
      setEditingPolicy(null);
      setPolicyForm(null);
      // Refresh data to show changes
      loadDashboardData();
    }
  };

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, destinationsData, alertsData] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getDestinations(),
        dbService.getAlerts(),
      ]);

      setStats(dashboardStats);

      // Transform destinations data to match interface
      const transformedDestinations = destinationsData.map((dest) => ({
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
          longitude: dest.longitude,
        },
      }));

      setDestinations(transformedDestinations);
      setAlerts(alertsData);

      // Update weather data for all destinations
      updateWeatherData(transformedDestinations);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  

  const updateWeatherData = async (destinations: Destination[]) => {
    const newWeatherMap: Record<string, any> = {};

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
          newWeatherMap[destination.id] = dbData;
          
          // Update state immediately for this destination
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
            // Save weather data to database
            await dbService.saveWeatherData(destination.id, weatherData);

            const mappedData = {
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              weatherMain: weatherData.weatherMain,
              weatherDescription: weatherData.weatherDescription,
              windSpeed: weatherData.windSpeed,
              recordedAt: new Date().toISOString()
            };

            newWeatherMap[destination.id] = mappedData;
            
            // Update state with fresh API data
            setWeatherMap(prev => ({
              ...prev,
              [destination.id]: mappedData
            }));

            // Check if we should generate a weather alert
            const alertCheck = weatherService.shouldGenerateAlert(weatherData);
            if (alertCheck.shouldAlert && alertCheck.reason) {
              await dbService.addAlert({
                type: "weather",
                title: `Weather Alert - ${destination.name}`,
                message: alertCheck.reason,
                severity: "medium",
                destinationId: destination.id,
                isActive: true,
              });
            }
          }
        }
      } catch (error) {
        console.error(
          `Error updating weather for ${destination.name}:`,
          error
        );
      }
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout requireAdmin={true}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Government Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and manage tourist activities across Jammu & Himachal
              Pradesh
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {formatDateTime(new Date())}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'policies' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ecological Policies
            {activeTab === 'policies' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Tourists"
                value={stats.totalTourists}
                icon={Users}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Current Occupancy"
                value={`${stats.currentOccupancy}/${stats.maxCapacity}`}
                icon={MapPin}
                color="bg-green-100 text-green-600"
                subtitle={`${Math.round(stats.capacityUtilization)}% of ecological limit (${stats.adjustedMaxCapacity})`}
              />
              <StatCard
                title="Pending Approvals"
                value={stats.pendingApprovals}
                icon={Clock}
                color="bg-yellow-100 text-yellow-600"
              />
              <StatCard
                title="Active Alerts"
                value={stats.alertsCount}
                icon={AlertTriangle}
                color="bg-red-100 text-red-600"
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Destinations Overview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Destinations Overview
                </h2>
                <div className="space-y-4">
                  {destinations.slice(0, 5).map((destination) => {
                    const adjustedCapacity = policyEngine.getAdjustedCapacity(destination);
                    const status = getCapacityStatus(destination.currentOccupancy, adjustedCapacity).status;
                    const weather = weatherMap[destination.id];
                    
                    return (
                      <div key={destination.id} className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{destination.name}</p>
                              <div className="flex items-center text-sm text-gray-600">
                                <span>{destination.location}</span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span className={`flex items-center ${
                                  destination.ecologicalSensitivity === 'critical' ? 'text-red-600' :
                                  destination.ecologicalSensitivity === 'high' ? 'text-orange-600' :
                                  destination.ecologicalSensitivity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  <Leaf className="h-3 w-3 mr-1" />
                                  {destination.ecologicalSensitivity}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === 'low'
                                ? 'bg-green-100 text-green-800'
                                : status === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {status}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {destination.currentOccupancy}/{adjustedCapacity}
                              {adjustedCapacity < destination.maxCapacity && (
                                <span className="text-xs text-orange-500 ml-1">(! limit)</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Weather Section */}
                        <div className="mt-2 pt-3 border-t border-gray-200">
                          {weather ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl font-bold text-gray-900">
                                  {Math.round(weather.temperature)}°C
                                </span>
                                <div className="text-xs text-gray-500">
                                  <p className="font-medium text-gray-700 capitalize">
                                    {weather.weatherDescription}
                                  </p>
                                  <p>Humidity: {weather.humidity}%</p>
                                </div>
                              </div>
                              <div className="text-right text-[10px] text-gray-400">
                                <p>Wind: {weather.windSpeed}m/s</p>
                                <p>Updated: {new Date(weather.recordedAt).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span>Loading weather...</span>
                              </div>
                              <span>--°C</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Alerts
                </h2>
                <div className="space-y-4">
                  {alerts.length > 0 ? (
                    alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`mt-0.5 ${
                          alert.severity === 'high' || alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`}>
                          {alert.severity === 'high' || alert.severity === 'critical' ? (
                            <XCircle className="h-5 w-5" />
                          ) : alert.severity === 'medium' ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No alerts to display</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Policy Editor Modal/Overlay */}
            {editingPolicy && policyForm && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 transform animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 capitalize">
                      Configure {editingPolicy} Policy
                    </h3>
                    <button 
                      onClick={() => setEditingPolicy(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity Multiplier (0.1 - 1.0)
                      </label>
                      <input 
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="1.0"
                        value={policyForm.capacityMultiplier}
                        onChange={(e) => setPolicyForm({...policyForm, capacityMultiplier: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Percentage of original capacity allowed (e.g., 0.5 = 50%)
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={policyForm.requiresPermit}
                          onChange={(e) => setPolicyForm({...policyForm, requiresPermit: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Requires Permit</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={policyForm.requiresEcoBriefing}
                          onChange={(e) => setPolicyForm({...policyForm, requiresEcoBriefing: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Requires Eco-Briefing</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restriction Message
                      </label>
                      <textarea 
                        value={policyForm.bookingRestrictionMessage || ''}
                        onChange={(e) => setPolicyForm({...policyForm, bookingRestrictionMessage: e.target.value || null})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        rows={3}
                        placeholder="Message shown when booking is blocked..."
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex space-x-3">
                    <button
                      onClick={handleSavePolicy}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingPolicy(null)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(policies) as SensitivityLevel[]).map((level) => {
                const policy = policies[level];
                return (
                  <div key={level} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          level === 'critical' ? 'bg-red-100 text-red-600' :
                          level === 'high' ? 'bg-orange-100 text-orange-600' :
                          level === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                        }`}>
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold capitalize text-gray-900">{level} Sensitivity</h3>
                      </div>
                      <button 
                        onClick={() => handleConfigure(level)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Capacity Limit:</span>
                        <span className="font-semibold text-gray-900">{Math.round(policy.capacityMultiplier * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Permit Required:</span>
                        <span className={`font-semibold ${policy.requiresPermit ? 'text-red-600' : 'text-green-600'}`}>
                          {policy.requiresPermit ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Eco-Briefing:</span>
                        <span className={`font-semibold ${policy.requiresEcoBriefing ? 'text-blue-600' : 'text-green-600'}`}>
                          {policy.requiresEcoBriefing ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100">
                        <strong>Restriction Message:</strong><br />
                        {policy.bookingRestrictionMessage || 'None'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
