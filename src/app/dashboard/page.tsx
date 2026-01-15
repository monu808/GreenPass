"use client";

import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import {
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  Eye,
  UserCheck,
  UserX,
  Navigation,
} from "lucide-react";
import { dbService } from "@/lib/databaseService";
import { weatherService, destinationCoordinates } from "@/lib/weatherService";
import { getCapacityStatus, formatDateTime } from "@/lib/utils";
import { DashboardStats, Destination, Alert, Tourist } from "@/types";

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTourists: 0,
    currentOccupancy: 0,
    maxCapacity: 0,
    pendingApprovals: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    capacityUtilization: 0,
    alertsCount: 0,
    adjustedMaxCapacity: 0
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentTourists, setRecentTourists] = useState<Tourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [dashboardStats, destinationsData, alertsData, touristsData] =
        await Promise.all([
          dbService.getDashboardStats(),
          dbService.getDestinations(),
          dbService.getAlerts(),
          dbService.getTourists(),
        ]);

      setStats(dashboardStats);

      // Transform destinations data to match interface
      const transformedDestinations = destinationsData.map((dest: any) => ({
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
      setRecentTourists(touristsData.slice(0, 5));

      updateWeatherData(transformedDestinations);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial data fetch when the dashboard opens
    loadDashboardData();

    // 2. FIX for Issue #3: Establish a real-time connection to the server
    const eventSource = new EventSource('/api/weather-monitor');

    // When the server pushes a 'message', refresh all dashboard data
    eventSource.onmessage = (event) => {
      console.log("🚀 Real-time update received: Refreshing Enhanced Dashboard");
      loadDashboardData();
    };

    // Note: We avoid closing on error here (Fix for Issue #4) 
    // to allow the browser to auto-reconnect if the server blips.
    eventSource.onerror = (error) => {
      console.log("SSE connection lost. Waiting for browser to auto-reconnect...");
    };

    // 3. Cleanup: Close the stream when the user leaves this page
    return () => {
      eventSource.close();
    };
  }, [loadDashboardData]);

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const updateWeatherData = async (destinations: Destination[]) => {
    for (const destination of destinations) {
      const coordinates = destinationCoordinates[destination.id];
      if (coordinates) {
        try {
          const weatherData = await weatherService.getWeatherByCoordinates(
            coordinates.lat,
            coordinates.lon,
            coordinates.name || destination.name
          );

          if (weatherData) {
            await dbService.saveWeatherData(destination.id, weatherData);

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
        } catch (error) {
          console.error(
            `Error updating weather for ${destination.name}:`,
            error
          );
        }
      }
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading enhanced dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enhanced Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time comprehensive tourist management overview
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Current Occupancy"
            value={stats.currentOccupancy}
            icon={Users}
            color="bg-blue-100 text-blue-600"
            subtitle={`${stats.capacityUtilization.toFixed(1)}% capacity`}
            trend="Live tracking"
          />
          <StatCard
            title="Total Capacity"
            value={stats.maxCapacity}
            icon={MapPin}
            color="bg-green-100 text-green-600"
            subtitle="All destinations"
            trend={`${destinations.filter((d) => d.isActive).length} active`}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
            subtitle="Require attention"
            trend={stats.pendingApprovals > 0 ? "Action needed" : "All clear"}
          />
          <StatCard
            title="Active Alerts"
            value={stats.alertsCount}
            icon={AlertTriangle}
            color="bg-red-100 text-red-600"
            subtitle="System notifications"
            trend={stats.alertsCount > 0 ? "Monitor closely" : "Normal"}
          />
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Today's Check-ins"
            value={stats.todayCheckIns}
            icon={UserCheck}
            color="bg-purple-100 text-purple-600"
            subtitle="Visitors arrived"
            trend="Real-time"
          />
          <StatCard
            title="Today's Check-outs"
            value={stats.todayCheckOuts}
            icon={UserX}
            color="bg-indigo-100 text-indigo-600"
            subtitle="Visitors departed"
            trend="Live count"
          />
          <StatCard
            title="Total Registered"
            value={stats.totalTourists}
            icon={Activity}
            color="bg-teal-100 text-teal-600"
            subtitle="All time"
            trend="Growing"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Destinations Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Destinations Overview
                </h2>
                <span className="text-sm text-gray-500">
                  {destinations.length} total
                </span>
              </div>
            </div>
            <div className="p-6">
              {destinations.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No destinations
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add destinations to start monitoring.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {destinations.map((destination) => {
                    const capacityStatus = getCapacityStatus(
                      destination.currentOccupancy,
                      destination.maxCapacity
                    );
                    const utilizationPercent =
                      (destination.currentOccupancy / destination.maxCapacity) *
                      100;

                    return (
                      <div
                        key={destination.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {destination.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {destination.location}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                destination.ecologicalSensitivity === "critical"
                                  ? "bg-red-100 text-red-800"
                                  : destination.ecologicalSensitivity === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : destination.ecologicalSensitivity ===
                                    "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {destination.ecologicalSensitivity} risk
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                destination.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {destination.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Capacity Usage</span>
                            <span>
                              {destination.currentOccupancy}/
                              {destination.maxCapacity} (
                              {utilizationPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                capacityStatus.color === "red"
                                  ? "bg-red-500"
                                  : capacityStatus.color === "yellow"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(utilizationPercent, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              capacityStatus.color === "red"
                                ? "bg-red-100 text-red-800"
                                : capacityStatus.color === "yellow"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {capacityStatus.status}
                          </span>
                          <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                {recentTourists.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No recent activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTourists.map((tourist) => (
                      <div
                        key={tourist.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tourist.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {tourist.email}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            tourist.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : tourist.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : tourist.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : tourist.status === "checked-in"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tourist.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  System Alerts
                </h2>
              </div>
              <div className="p-6">
                {alerts.filter((a) => a.isActive).length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-400" />
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      All systems normal
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts
                      .filter((a) => a.isActive)
                      .slice(0, 3)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border-l-4 ${
                            alert.severity === "high"
                              ? "bg-red-50 border-red-400"
                              : alert.severity === "medium"
                              ? "bg-yellow-50 border-yellow-400"
                              : "bg-blue-50 border-blue-400"
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {(alert as any).created_at
                              ? formatDateTime((alert as any).created_at)
                              : "Recently"}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Weather Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Weather Conditions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((destination) => (
                <div key={destination.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {destination.name}
                    </h3>
                    <Navigation className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">--°C</p>
                  <p className="text-sm text-gray-600">Loading...</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Humidity: --%</span>
                    <span>Wind: -- km/h</span>
                  </div>
                </div>
              ))} 
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
