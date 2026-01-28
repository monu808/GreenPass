'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin,
  AlertTriangle,
  Activity,
  Target
} from 'lucide-react';
import { Tourist, Destination } from '@/types';
import { useTourists } from '@/hooks/useTourists';
import { useDestinations } from '@/hooks/useDestinations';
import { DataFetchErrorBoundary, ChartErrorBoundary } from '@/components/errors';

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

  const { data: tourists, isLoading: touristsLoading } = useTourists();
  const { data: destinations, isLoading: destinationsLoading } = useDestinations();

  useEffect(() => {
    if (tourists && destinations) {
      processAnalytics(tourists, destinations);
    }
  }, [tourists, destinations, selectedTimeRange]);

  const processAnalytics = (tourists: Tourist[], destinations: Destination[]) => {
    try {
      setLoading(true);
      
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
      console.error('Error processing analytics:', error);
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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl bg-gray-50 ${color.replace('text-', 'bg-').replace('600', '50')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {subtitle && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{subtitle}</span>}
      </div>
      <div className="mt-4">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">{title}</p>
        <p className={`text-2xl font-black ${color} leading-none mt-1`}>{value}</p>
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
      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
        <div className="flex justify-between items-end mb-2">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-gray-900 block">{label}</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Capacity Utilization</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-gray-900">{value}</span>
            <span className="text-xs text-gray-400 font-bold">/{max}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`${color} h-full rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <div className="mt-2 flex justify-end">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
            percentage > 80 ? 'bg-red-50 text-red-600' :
            percentage > 60 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
          }`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const isDataLoading = touristsLoading || destinationsLoading || loading;

  if (isDataLoading && !analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
      <DataFetchErrorBoundary onRetry={() => window.location.reload()} maxRetries={0}>
        <div className="space-y-6">
          {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Tourism insights and performance metrics</p>
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          <ChartErrorBoundary chartTitle="Popular Destinations">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 h-full">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                Popular Destinations
              </h3>
              <div className="space-y-5">
                {analytics.popularDestinations.map((dest, index) => (
                  <div key={dest.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 text-[10px] font-black text-gray-400 border border-gray-100">
                          {index + 1}
                        </span>
                        <span className="text-sm font-bold text-gray-800 truncate max-w-[150px] sm:max-w-none">{dest.name}</span>
                      </div>
                      <span className="text-sm font-black text-gray-900 ml-2">{dest.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${(dest.count / Math.max(...analytics.popularDestinations.map(d => d.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartErrorBoundary>

          {/* Status Distribution */}
          <ChartErrorBoundary chartTitle="Booking Status Distribution">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 h-full">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                Booking Status Distribution
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {analytics.statusDistribution.map((status) => {
                  const colors: { [key: string]: string } = {
                    pending: 'bg-yellow-500',
                    approved: 'bg-blue-500',
                    'checked-in': 'bg-green-500',
                    'checked-out': 'bg-gray-500',
                    cancelled: 'bg-red-500'
                  };
                  
                  const bgColors: { [key: string]: string } = {
                    pending: 'bg-yellow-50',
                    approved: 'bg-blue-50',
                    'checked-in': 'bg-green-50',
                    'checked-out': 'bg-gray-50',
                    cancelled: 'bg-red-50'
                  };

                  const textColors: { [key: string]: string } = {
                    pending: 'text-yellow-700',
                    approved: 'text-blue-700',
                    'checked-in': 'text-green-700',
                    'checked-out': 'text-gray-700',
                    cancelled: 'text-red-700'
                  };
                  
                  return (
                    <div key={status.status} className={`${bgColors[status.status] || 'bg-gray-50'} p-3 sm:p-4 rounded-xl border border-white/50 shadow-sm flex flex-col justify-between min-h-[90px] sm:min-h-[100px]`}>
                      <div className="flex items-center justify-between">
                        <div className={`w-2 h-2 rounded-full ${colors[status.status] || 'bg-gray-400'}`}></div>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">Status</span>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-gray-500 capitalize mb-1 truncate">{status.status.replace('-', ' ')}</div>
                        <div className="flex items-end justify-between">
                          <span className={`text-lg sm:text-xl font-black ${textColors[status.status] || 'text-gray-900'}`}>{status.count}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold opacity-70 mb-1">{status.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartErrorBoundary>
        </div>

        {/* Capacity Utilization */}
        <ChartErrorBoundary chartTitle="Destination Capacity Utilization">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              Destination Capacity Utilization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </ChartErrorBoundary>

        {/* Monthly Trends (Simple Chart) */}
        <ChartErrorBoundary chartTitle="Monthly Tourism Trends">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              Monthly Tourism Trends
            </h3>
            <div className="flex items-end justify-between min-h-[12rem] sm:h-48 px-2 sm:px-6 gap-1.5 sm:gap-4 overflow-x-auto pb-2">
              {analytics.monthlyTrends.map((trend) => {
                const maxVal = Math.max(...analytics.monthlyTrends.map(t => t.tourists));
                const heightPercentage = (trend.tourists / maxVal) * 100;
                
                return (
                  <div key={trend.month} className="flex flex-col items-center flex-1 min-w-[40px] group">
                    <div className="relative w-full flex justify-center h-full items-end">
                      <div
                        className="w-full max-w-[32px] sm:max-w-[40px] bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-1000 ease-out flex items-start justify-center pt-2 group-hover:from-green-500 group-hover:to-green-300 shadow-sm"
                        style={{ 
                          height: `${Math.max(heightPercentage, 15)}%`,
                        }}
                      >
                        <span className="text-[9px] sm:text-xs font-black text-white drop-shadow-sm">{trend.tourists}</span>
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-xs font-bold text-gray-400 mt-3 uppercase tracking-tighter">{trend.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartErrorBoundary>
      </div>
      </DataFetchErrorBoundary>
    </Layout>
  );
}
