'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { destinations, tourists, alerts } from '@/data/mockData';
import { getCapacityStatus, formatDateTime } from '@/lib/utils';
import { DashboardStats } from '@/types';

export default function Dashboard() {
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

  useEffect(() => {
    // Calculate real-time statistics
    const totalCapacity = destinations.reduce((sum, dest) => sum + dest.maxCapacity, 0);
    const currentOccupancy = destinations.reduce((sum, dest) => sum + dest.currentOccupancy, 0);
    const pendingApprovals = tourists.filter(t => t.status === 'pending').length;
    const today = new Date().toDateString();
    const todayCheckIns = tourists.filter(t => 
      t.status === 'checked-in' && new Date(t.checkInDate).toDateString() === today
    ).length;
    const todayCheckOuts = tourists.filter(t => 
      t.status === 'checked-out' && new Date(t.checkOutDate).toDateString() === today
    ).length;
    const activeAlerts = alerts.filter(a => a.isActive).length;

    setStats({
      totalTourists: tourists.length,
      currentOccupancy,
      maxCapacity: totalCapacity,
      pendingApprovals,
      todayCheckIns,
      todayCheckOuts,
      capacityUtilization: totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0,
      alertsCount: activeAlerts
    });
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time overview of tourist management system</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Current Occupancy"
            value={stats.currentOccupancy}
            icon={Users}
            color="bg-blue-100 text-blue-600"
            subtitle={`${stats.capacityUtilization.toFixed(1)}% of capacity`}
          />
          <StatCard
            title="Total Capacity"
            value={stats.maxCapacity}
            icon={MapPin}
            color="bg-green-100 text-green-600"
            subtitle="Across all destinations"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
            subtitle="Requires review"
          />
          <StatCard
            title="Active Alerts"
            value={stats.alertsCount}
            icon={AlertTriangle}
            color="bg-red-100 text-red-600"
            subtitle="Needs attention"
          />
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Today's Check-ins"
            value={stats.todayCheckIns}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Today's Check-outs"
            value={stats.todayCheckOuts}
            icon={XCircle}
            color="bg-gray-100 text-gray-600"
          />
        </div>

        {/* Destinations Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Destinations Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {destinations.map((destination) => {
                const capacity = getCapacityStatus(destination.currentOccupancy, destination.maxCapacity);
                return (
                  <div key={destination.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{destination.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          destination.ecologicalSensitivity === 'critical' ? 'bg-red-100 text-red-700' :
                          destination.ecologicalSensitivity === 'high' ? 'bg-orange-100 text-orange-700' :
                          destination.ecologicalSensitivity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {destination.ecologicalSensitivity} sensitivity
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{destination.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {destination.currentOccupancy} / {destination.maxCapacity}
                      </p>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            capacity.status === 'full' ? 'bg-red-500' :
                            capacity.status === 'high' ? 'bg-orange-500' :
                            capacity.status === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${capacity.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        {alerts.filter(a => a.isActive).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {alerts.filter(a => a.isActive).slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(alert.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
