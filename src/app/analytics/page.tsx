'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin,
  Calendar,
  AlertTriangle,
  Activity,
  Target
} from 'lucide-react';
import { dbService } from '@/lib/databaseService';

interface AnalyticsData {
  totalTourists: number;
  totalDestinations: number;
  averageGroupSize: number;
  popularDestinations: { name: string; count: number }[];
  monthlyTrends: { month: string; tourists: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  capacityUtilization: { destination: string; utilization: number; max: number; current: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get raw data
      const [tourists, destinations] = await Promise.all([
        dbService.getTourists(),
        dbService.getDestinations()
      ]);

      // Process analytics data
      const totalTourists = tourists.length;
      const totalDestinations = destinations.length;
      const averageGroupSize = tourists.length > 0 
        ? tourists.reduce((sum, t) => sum + (t.groupSize || 1), 0) / tourists.length 
        : 0;

      // Popular destinations
      const destinationCounts: { [key: string]: number } = {};
      tourists.forEach(tourist => {
        const destName = tourist.destination || 'Unknown';
        destinationCounts[destName] = (destinationCounts[destName] || 0) + 1;
      });
      
      const popularDestinations = Object.entries(destinationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly trends (mock data for now)
      const monthlyTrends = [
        { month: 'Jan', tourists: 45 },
        { month: 'Feb', tourists: 52 },
        { month: 'Mar', tourists: 78 },
        { month: 'Apr', tourists: 65 },
        { month: 'May', tourists: 89 },
        { month: 'Jun', tourists: 95 },
      ];

      // Status distribution
      const statusCounts: { [key: string]: number } = {};
      tourists.forEach(tourist => {
        statusCounts[tourist.status] = (statusCounts[tourist.status] || 0) + 1;
      });

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalTourists > 0 ? (count / totalTourists) * 100 : 0
      }));

      // Capacity utilization
      const capacityUtilization = destinations.map(dest => ({
        destination: dest.name,
        utilization: dest.maxCapacity > 0 ? (dest.currentOccupancy / dest.maxCapacity) * 100 : 0,
        max: dest.maxCapacity,
        current: dest.currentOccupancy
      }));

      setAnalytics({
        totalTourists,
        totalDestinations,
        averageGroupSize,
        popularDestinations,
        monthlyTrends,
        statusDistribution,
        capacityUtilization
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
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
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color }: {
    label: string;
    value: number;
    max: number;
    color: string;
  }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
          <span>{label}</span>
          <span>{value}/{max} ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load analytics data</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Tourism insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tourists"
            value={analytics.totalTourists}
            icon={Users}
            color="text-blue-600"
            subtitle="All time registrations"
          />
          <StatCard
            title="Active Destinations"
            value={analytics.totalDestinations}
            icon={MapPin}
            color="text-green-600"
            subtitle="Available locations"
          />
          <StatCard
            title="Avg Group Size"
            value={analytics.averageGroupSize.toFixed(1)}
            icon={Users}
            color="text-purple-600"
            subtitle="People per booking"
          />
          <StatCard
            title="Pending Approvals"
            value={analytics.statusDistribution.find(s => s.status === 'pending')?.count || 0}
            icon={Activity}
            color="text-yellow-600"
            subtitle="Awaiting review"
          />
        </div>

        {/* Charts and Data Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Destinations */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Popular Destinations
            </h3>
            <div className="space-y-3">
              {analytics.popularDestinations.map((dest, index) => (
                <div key={dest.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-8">#{index + 1}</span>
                    <span className="text-sm text-gray-900">{dest.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${(dest.count / Math.max(...analytics.popularDestinations.map(d => d.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">{dest.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Booking Status Distribution
            </h3>
            <div className="space-y-3">
              {analytics.statusDistribution.map((status) => {
                const colors: { [key: string]: string } = {
                  pending: 'bg-yellow-500',
                  approved: 'bg-blue-500',
                  'checked-in': 'bg-green-500',
                  'checked-out': 'bg-gray-500',
                  cancelled: 'bg-red-500'
                };
                
                return (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${colors[status.status] || 'bg-gray-400'} mr-3`}></div>
                      <span className="text-sm text-gray-900 capitalize">{status.status.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{status.percentage.toFixed(1)}%</span>
                      <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-600" />
            Destination Capacity Utilization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.capacityUtilization.map((dest) => (
              <ProgressBar
                key={dest.destination}
                label={dest.destination}
                value={dest.current}
                max={dest.max}
                color={
                  dest.utilization > 80 ? 'bg-red-500' :
                  dest.utilization > 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }
              />
            ))}
          </div>
        </div>

        {/* Monthly Trends (Simple Chart) */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Monthly Tourism Trends
          </h3>
          <div className="flex items-end space-x-4 h-40">
            {analytics.monthlyTrends.map((trend, index) => (
              <div key={trend.month} className="flex flex-col items-center flex-1">
                <div
                  className="bg-green-500 rounded-t-sm transition-all duration-300 flex items-end justify-center"
                  style={{ 
                    height: `${(trend.tourists / Math.max(...analytics.monthlyTrends.map(t => t.tourists))) * 120}px`,
                    minHeight: '20px'
                  }}
                >
                  <span className="text-white text-xs font-medium mb-1">{trend.tourists}</span>
                </div>
                <span className="text-sm text-gray-600 mt-2">{trend.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
