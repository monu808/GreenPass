"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import { useModalAccessibility } from "@/lib/accessibility";
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
  RefreshCw,
  Trash2,
  Calendar,
  Recycle
} from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { getCapacityStatus, formatDateTime } from '@/lib/utils';
import { DashboardStats, Destination, Alert } from '@/types';
import { getPolicyEngine, DEFAULT_POLICIES, SensitivityLevel, EcologicalPolicy } from '@/lib/ecologicalPolicyEngine';
import EcologicalDashboard from './EcologicalDashboard';
import { useWeatherDataBatch } from "@/hooks/useWeatherData";
import { useSSE } from "@/contexts/ConnectionContext";
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import { DataFetchErrorBoundary } from './errors';
import { logger } from '@/lib/logger';

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
    totalWasteCollected: 0,
    activeCleanupEvents: 0,
    totalVolunteers: 0,
    recyclingRate: 0,
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [adjustedCapacities, setAdjustedCapacities] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, {
    temperature: number;
    humidity: number;
    weatherMain: string;
    weatherDescription: string;
    windSpeed: number;
    recordedAt: string;
  }>>({});
  const [policies, setPolicies] = useState<Record<SensitivityLevel, EcologicalPolicy>>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<SensitivityLevel | null>(null);
  const [policyForm, setPolicyForm] = useState<EcologicalPolicy | null>(null);
  const policyModalRef = useRef<HTMLDivElement>(null);

  useModalAccessibility({
    modalRef: policyModalRef,
    isOpen: !!editingPolicy,
    onClose: () => setEditingPolicy(null)
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'ecological'>('overview');

  // Use React Query for batch weather data display
  const { refetch: refetchWeather } = useWeatherDataBatch(
    destinations.map(d => d.id)
  );

  const updateWeatherData = useCallback(async (destinations: Destination[]) => {
    const dbService = getDbService();
    const newWeatherMap: Record<string, {
      temperature: number;
      humidity: number;
      weatherMain: string;
      weatherDescription: string;
      windSpeed: number;
      recordedAt: string;
    }> = {};
    const destinationIds = destinations.map(d => d.id);

    try {
      // 1. Batch-fetch existing weather data from DB for all destinations at once
      const latestWeatherBatch = await dbService.getWeatherDataForDestinations(destinationIds);
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      const now = Date.now();

      // 2. Process each destination sequentially for API calls (to respect rate limits)
      for (const destination of destinations) {
        try {
          const latestWeather = latestWeatherBatch.get(destination.id);
          let weatherDataForMap = null;

          if (latestWeather) {
            weatherDataForMap = {
              temperature: latestWeather.temperature,
              humidity: latestWeather.humidity,
              weatherMain: latestWeather.weather_main,
              weatherDescription: latestWeather.weather_description,
              windSpeed: latestWeather.wind_speed,
              recordedAt: latestWeather.recorded_at
            };
          }

          const coordinates = (destinationCoordinates as Record<string, { lat: number; lon: number; name?: string }>)[destination.id] ||
            (destinationCoordinates as Record<string, { lat: number; lon: number; name?: string }>)[destination.name?.toLowerCase().replace(/\s+/g, '')] ||
            (destinationCoordinates as Record<string, { lat: number; lon: number; name?: string }>)[destination.name?.toLowerCase()];

          const isFresh = weatherDataForMap &&
            (now - new Date(weatherDataForMap.recordedAt).getTime() < sixHoursInMs);

          if (coordinates && !isFresh) {
            console.log(`🌐 Refreshing weather for ${destination.name}...`);
            const weatherData = await weatherService.getWeatherByCoordinates(
              coordinates.lat,
              coordinates.lon,
              destination.id
            );

            if (weatherData) {
              newWeatherMap[destination.id] = {
                temperature: weatherData.temperature,
                humidity: weatherData.humidity,
                weatherMain: weatherData.weatherMain,
                weatherDescription: weatherData.weatherDescription,
                windSpeed: weatherData.windSpeed,
                recordedAt: new Date().toISOString()
              };
            }
          } else if (weatherDataForMap) {
            newWeatherMap[destination.id] = weatherDataForMap;
          }
        } catch (err) {
          logger.error(
            `Error updating weather for ${destination.name}`,
            err,
            { component: 'AdminDashboard', operation: 'updateWeatherData', metadata: { destinationId: destination.id, destinationName: destination.name } }
          );
        }
      }

      setWeatherMap(prev => ({ ...prev, ...newWeatherMap }));
      // Invalidate React Query cache to reflect new data
      refetchWeather();
    } catch (error) {
      logger.error(
        'Error in batch weather update',
        error,
        { component: 'AdminDashboard', operation: 'batchWeatherUpdate' }
      );
    }
  }, [refetchWeather]);

  const loadDashboardData = useCallback(async () => {
    try {
      const dbService = getDbService();
      const [
        dashboardStats,
        destinationsData,
        alertsData,
        ecologicalData
      ] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getDestinations(),
        dbService.getAlerts(),
        dbService.getEcologicalImpactData()
      ]);

      setStats(dashboardStats);

      // Check for ecological alerts
      for (const data of ecologicalData) {
        if (data.utilization > 70) {
          const severity = data.utilization > 85 ? "critical" : "high";
          const existingAlert = alertsData.find(a => a.destinationId === data.id && a.type === 'ecological' && a.isActive);

          if (!existingAlert) {
            await dbService.addAlert({
              type: "ecological",
              title: `Ecological Limit Warning - ${data.name}`,
              message: `${data.name} has reached ${Math.round(data.utilization)}% of its adjusted ecological capacity.`,
              severity: severity as 'high' | 'critical',
              destinationId: data.id,
              isActive: true,
            });
          }
        }
      }

      // Refresh alerts after potential new ones added
      const updatedAlerts = await dbService.getAlerts();
      setAlerts(updatedAlerts);

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

      // Calculate adjusted capacities in batch
      const policyEngine = getPolicyEngine();
      
      // Batch-fetch weather and indicators for capacity calculations
      const destinationIds = transformedDestinations.map(d => d.id);
      const [weatherBatch, indicatorsBatch] = await Promise.all([
        dbService.getWeatherDataForDestinations(destinationIds),
        dbService.getEcologicalIndicatorsForDestinations(destinationIds)
      ]);

      const batchCapacitiesMap = await policyEngine.getBatchAdjustedCapacities(
        transformedDestinations,
        weatherBatch,
        indicatorsBatch
      );

      const newAdjustedCapacities: Record<string, number> = {};
      batchCapacitiesMap.forEach((cap, id) => {
        newAdjustedCapacities[id] = cap;
      });
      
      setAdjustedCapacities(newAdjustedCapacities);

      // Update weather data for all destinations
      updateWeatherData(transformedDestinations);
    } catch (error) {
      logger.error(
        'Error loading dashboard data',
        error,
        { component: 'AdminDashboard', operation: 'loadDashboardData' }
      );
    } finally {
      setLoading(false);
    }
  }, [updateWeatherData]);

  const { connectionState, reconnect } = useSSE(
    useCallback((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
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
        } else if (data.type !== 'heartbeat') {
          loadDashboardData();
        }
      } catch (err) {
        logger.error(
          'Error parsing real-time data',
          err,
          { component: 'AdminDashboard', operation: 'parseRealTimeData' }
        );
      }
    }, [loadDashboardData])
  );

  const handleConfigure = (level: SensitivityLevel) => {
    const policyEngine = getPolicyEngine();
    const policy = policies[level] || policyEngine.getPolicy(level);
    setPolicyForm({ ...policy });
    setEditingPolicy(level);
  };

  const handleSavePolicy = () => {
    if (editingPolicy && policyForm) {
      const policyEngine = getPolicyEngine();
      policyEngine.updatePolicy(editingPolicy, policyForm);
      setPolicies(policyEngine.getAllPolicies());
      setEditingPolicy(null);
      setPolicyForm(null);
      // Refresh data to show changes
      loadDashboardData();
    }
  };

  // Recalculate adjusted capacities whenever weatherMap or destinations change
  useEffect(() => {
    const recalculateCapacities = async () => {
      const policyEngine = getPolicyEngine();
      const dbService = getDbService();
      
      // Batch-fetch weather and indicators for capacity calculations
      const destinationIds = destinations.map(d => d.id);
      const [weatherBatch, indicatorsBatch] = await Promise.all([
        dbService.getWeatherDataForDestinations(destinationIds),
        dbService.getEcologicalIndicatorsForDestinations(destinationIds)
      ]);

      const batchCapacitiesMap = await policyEngine.getBatchAdjustedCapacities(
        destinations,
        weatherBatch,
        indicatorsBatch
      );

      const newAdjustedCapacities: Record<string, number> = {};
      batchCapacitiesMap.forEach((cap, id) => {
        newAdjustedCapacities[id] = cap;
      });
      
      setAdjustedCapacities(newAdjustedCapacities);
    };

    if (destinations.length > 0) {
      recalculateCapacities();
    }
  }, [weatherMap, destinations]);

  useEffect(() => {
    // 1. Load initial data when the user first opens the dashboard
    loadDashboardData();
    const policyEngine = getPolicyEngine();
    setPolicies(policyEngine.getAllPolicies());
  }, [loadDashboardData]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    trend,
    iconColor,
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
    trend?: string;
    iconColor?: string;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className={`h-6 w-6 ${iconColor || ''}`} />
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
      <DataFetchErrorBoundary onRetry={loadDashboardData}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enhanced Government Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time comprehensive tourist management and ecological monitoring
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-700" aria-live="polite">{formatDateTime(new Date())}</p>
            </div>
            <ConnectionStatusIndicator 
              connectionState={connectionState} 
              onRetry={reconnect} 
            />
            <button
              onClick={() => loadDashboardData()}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              aria-label="Refresh Dashboard"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div role="tablist" aria-label="Dashboard views" className="flex space-x-4 border-b border-gray-200">
          <button
            role="tab"
            aria-selected={activeTab === 'overview'}
            aria-controls="overview-panel"
            id="overview-tab"
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'policies'}
            aria-controls="policies-panel"
            id="policies-tab"
            onClick={() => setActiveTab('policies')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'policies' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Ecological Policies
            {activeTab === 'policies' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'ecological'}
            aria-controls="ecological-panel"
            id="ecological-tab"
            onClick={() => setActiveTab('ecological')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative flex items-center ${activeTab === 'ecological' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Leaf className={`h-4 w-4 mr-2 ${activeTab === 'ecological' ? 'text-blue-600' : 'text-gray-400'}`} aria-hidden="true" />
            Ecological Impact
            {activeTab === 'ecological' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Tourists"
                value={stats.totalTourists}
                icon={Users}
                color="bg-blue-100 text-blue-600"
                trend="Cumulative"
              />
              <StatCard
                title="Current Occupancy"
                value={`${stats.currentOccupancy}/${stats.maxCapacity}`}
                icon={MapPin}
                color="bg-green-100 text-green-600"
                subtitle={`${Math.round(stats.capacityUtilization)}% of ecological limit (${stats.adjustedMaxCapacity})`}
                trend="Live tracking"
              />
              <StatCard
                title="Pending Approvals"
                value={stats.pendingApprovals}
                icon={Clock}
                color="bg-yellow-100 text-yellow-600"
                trend={stats.pendingApprovals > 0 ? "Action needed" : "All clear"}
              />
              <StatCard
                title="Active Alerts"
                value={stats.alertsCount}
                icon={AlertTriangle}
                color="bg-red-100 text-red-600"
                trend={stats.alertsCount > 0 ? "Monitor closely" : "Normal"}
              />
            </div>

            {/* Environmental Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Waste Collected"
                value={`${stats.totalWasteCollected} kg`}
                icon={Trash2}
                color="bg-emerald-100 text-emerald-600"
                subtitle="This month"
                trend="+12% from last month"
              />
              <StatCard
                title="Cleanup Activities"
                value={stats.activeCleanupEvents}
                icon={Calendar}
                color="bg-teal-100 text-teal-600"
                subtitle="Active & Scheduled"
                trend="4 upcoming events"
              />
              <StatCard
                title="Active Volunteers"
                value={stats.totalVolunteers}
                icon={Users}
                color="bg-indigo-100 text-indigo-600"
                subtitle="Community members"
                trend="+25 new this week"
              />
              <StatCard
                title="Recycling Rate"
                value={`${stats.recyclingRate}%`}
                icon={Recycle}
                color="bg-cyan-100 text-cyan-600"
                subtitle="Diverted from landfill"
                trend="Goal: 45%"
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              {/* Destinations Overview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Destinations Overview
                </h2>
                <div className="space-y-4">
                  {(() => {
                    return destinations.slice(0, 5).map((destination) => {
                      const adjustedCapacity = adjustedCapacities[destination.id] || destination.maxCapacity;
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
                                  <span className={`flex items-center ${destination.ecologicalSensitivity === 'critical' ? 'text-red-600' :
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
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'low'
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
                    });
                  })()}
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
                        <div className={`mt-0.5 ${alert.severity === 'high' || alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'medium' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`}>
                          {alert.severity === 'high' || alert.severity === 'critical' ? (
                            <XCircle className="h-5 w-5" aria-hidden="true" />
                          ) : alert.severity === 'medium' ? (
                            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <CheckCircle className="h-5 w-5" aria-hidden="true" />
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
          </div>
        ) : activeTab === 'ecological' ? (
          <div role="tabpanel" id="ecological-panel" aria-labelledby="ecological-tab">
            <EcologicalDashboard />
          </div>
        ) : (
          <div role="tabpanel" id="policies-panel" aria-labelledby="policies-tab" className="space-y-6">
            {/* Policy Editor Modal/Overlay */}
            {editingPolicy && policyForm && (
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
                role="dialog"
                aria-modal="true"
                aria-labelledby="policy-modal-title"
              >
                <div 
                  ref={policyModalRef}
                  className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 transform animate-in zoom-in-95 duration-300"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 id="policy-modal-title" className="text-xl font-bold text-gray-900 capitalize">
                      Configure {editingPolicy} Policy
                    </h3>
                    <button
                      onClick={() => setEditingPolicy(null)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                      aria-label="Close modal"
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
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
                        onChange={(e) => setPolicyForm({ ...policyForm, capacityMultiplier: parseFloat(e.target.value) })}
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
                          onChange={(e) => setPolicyForm({ ...policyForm, requiresPermit: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Requires Permit</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policyForm.requiresEcoBriefing}
                          onChange={(e) => setPolicyForm({ ...policyForm, requiresEcoBriefing: e.target.checked })}
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
                        onChange={(e) => setPolicyForm({ ...policyForm, bookingRestrictionMessage: e.target.value || null })}
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
                        <div className={`p-2 rounded-lg mr-3 ${level === 'critical' ? 'bg-red-100 text-red-600' :
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
      </DataFetchErrorBoundary>
    </Layout>
  );
}