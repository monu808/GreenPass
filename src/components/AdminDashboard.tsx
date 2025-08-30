'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { dbService } from '@/lib/databaseService';
import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { getCapacityStatus, formatDateTime } from '@/lib/utils';
import { DashboardStats, Destination, Alert } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTourists: 0,
    currentOccupancy: 0,
    maxCapacity: 0,
    pendingApprovals: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    capacityUtilization: 0,
    alertsCount: 0
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, destinationsData, alertsData] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getDestinations(),
        dbService.getAlerts(),
      ]);

      setStats(dashboardStats);

      // Transform destinations data to match interface
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
      setAlerts(alertsData);

      // Update weather data for all destinations
      updateWeatherData(transformedDestinations);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
            // Save weather data to database
            await dbService.saveWeatherData(destination.id, weatherData);

            // Check if we should generate a weather alert
            const alertCheck = weatherService.shouldGenerateAlert(weatherData);
            if (alertCheck.shouldAlert && alertCheck.reason) {
              await dbService.addAlert({
                type: 'weather',
                title: `Weather Alert - ${destination.name}`,
                message: alertCheck.reason,
                severity: 'medium',
                destinationId: destination.id,
                isActive: true,
              });
            }
          }
        } catch (error) {
          console.error(`Error updating weather for ${destination.name}:`, error);
        }
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
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
              Monitor and manage tourist activities across Jammu & Himachal Pradesh
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {formatDateTime(new Date())}
          </div>
        </div>

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
            subtitle={`${Math.round(stats.capacityUtilization)}% capacity`}
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
              {destinations.slice(0, 5).map((destination) => (
                <div key={destination.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{destination.name}</p>
                      <p className="text-sm text-gray-600">{destination.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getCapacityStatus(destination.currentOccupancy, destination.maxCapacity).status === 'low'
                        ? 'bg-green-100 text-green-800'
                        : getCapacityStatus(destination.currentOccupancy, destination.maxCapacity).status === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getCapacityStatus(destination.currentOccupancy, destination.maxCapacity).status}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {destination.currentOccupancy}/{destination.maxCapacity}
                    </p>
                  </div>
                </div>
              ))}
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
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {alert.severity === 'high' ? (
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
      </div>
    </Layout>
  );
}
