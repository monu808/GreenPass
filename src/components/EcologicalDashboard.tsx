"use client";

import React, { useState, useEffect } from "react";
import {
  Leaf,
  Activity,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  Legend
} from "recharts";
import { getDbService } from "@/lib/databaseService";
import { Alert, Destination, HistoricalOccupancy, EcologicalMetrics } from "@/types";
import { getPolicyEngine } from "@/lib/ecologicalPolicyEngine";
import { formatDateTime } from "@/lib/utils";
import { 
  estimateCarbonFootprint, 
  estimateWasteGeneration, 
  getWasteRiskColor 
} from "@/lib/environmentalEstimates";

export interface DestinationEcoStatus {
  id: string;
  name: string;
  location: string;
  sensitivity: string;
  currentStatus: string;
  lastAssessment: string;
}

const getEcologicalSensitivityColor = (sensitivity: string) => {
  switch (sensitivity.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRiskZoneColor = (utilization: number) => {
  if (utilization >= 85) return 'bg-red-500';
  if (utilization >= 70) return 'bg-orange-500';
  if (utilization >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
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

export default function EcologicalDashboard() {
  const [destinations, setDestinations] = useState<EcologicalMetrics[]>([]);
  const [historicalTrends, setHistoricalTrends] = useState<HistoricalOccupancy[]>([]);
  const [timeRange, setTimeRange] = useState(7);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    destinationsAtRisk: 0,
    averageUtilization: 0,
    policyViolations: 0,
    activeAlerts: 0,
    totalCarbon: 0,
    totalWaste: 0
  });

  useEffect(() => {
    loadEcologicalData();
  }, [timeRange, selectedDestinationId]);

  const loadEcologicalData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const dbService = getDbService();
      
      // Load all necessary data in parallel
      const [impactData, alertsData] = await Promise.all([
        dbService.getEcologicalImpactData(),
        dbService.getAlerts()
      ]);

      // Handle historical trends based on selection
      let trends: HistoricalOccupancy[] = [];
      if (selectedDestinationId === 'all') {
        // Aggregate trends for all destinations
        // For simplicity in mock data, we'll fetch for each and sum them up
        // In a real DB this would be a single grouped query
        const allTrends = await Promise.all(
          impactData.map(d => dbService.getHistoricalOccupancy(d.id, timeRange))
        );
        
        // Merge trends by date
      const dateMap = new Map<string, HistoricalOccupancy>();
      allTrends.forEach((destTrends: HistoricalOccupancy[]) => {
        destTrends.forEach((t: HistoricalOccupancy) => {
          const existing = dateMap.get(t.date) || { date: t.date, occupancy: 0, adjustedCapacity: 0 };
          dateMap.set(t.date, {
            date: t.date,
            occupancy: existing.occupancy + t.occupancy,
            adjustedCapacity: existing.adjustedCapacity + t.adjustedCapacity
          });
        });
      });
      trends = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } else {
      trends = await dbService.getHistoricalOccupancy(selectedDestinationId, timeRange);
    }

    const typedImpactData = impactData as EcologicalMetrics[];
    setDestinations(typedImpactData);
    setHistoricalTrends(trends);
    
    const ecologicalAlerts = alertsData.filter(a => a.type === 'ecological' && a.isActive);
    setAlerts(ecologicalAlerts);

    // Calculate summary statistics and environmental estimates
    const destinationsAtRisk = typedImpactData.filter(d => d.utilization > 70).length;
    const averageUtilization = typedImpactData.length > 0 
      ? typedImpactData.reduce((acc, d) => acc + d.utilization, 0) / typedImpactData.length 
      : 0;
    const policyViolations = typedImpactData.filter(d => 
      (d.sensitivity === 'high' || d.sensitivity === 'critical') && d.utilization > 85
    ).length;

    // Environmental impact estimations
    const totalCarbon = typedImpactData.reduce((acc, d) => 
      acc + estimateCarbonFootprint(d.currentOccupancy, d.sensitivity), 0);
    const totalWaste = typedImpactData.reduce((acc, d) => 
      acc + estimateWasteGeneration(d.currentOccupancy, d.sensitivity), 0);

      setSummaryStats({
        destinationsAtRisk,
        averageUtilization: Math.round(averageUtilization),
        policyViolations,
        activeAlerts: ecologicalAlerts.length,
        totalCarbon,
        totalWaste
      });

      // Generate dynamic alerts based on current metrics
      const dynamicAlerts = typedImpactData.map(d => {
        if (d.utilization > 85) {
          return {
            id: `gen-crit-${d.id}`,
            type: 'ecological' as const,
            title: `CRITICAL: Ecological Threshold Exceeded - ${d.name}`,
            message: `${d.name} is at ${Math.round(d.utilization)}% capacity, exceeding the 85% critical threshold for ${d.sensitivity} sensitivity zones.`,
            severity: 'critical' as const,
            destinationId: d.id,
            timestamp: new Date(),
            isActive: true
          };
        } else if (d.utilization > 70) {
          return {
            id: `gen-high-${d.id}`,
            type: 'ecological' as const,
            title: `Warning: High Ecological Load - ${d.name}`,
            message: `${d.name} has reached ${Math.round(d.utilization)}% of its adjusted ecological capacity.`,
            severity: 'high' as const,
            destinationId: d.id,
            timestamp: new Date(),
            isActive: true
          };
        }
        return null;
      }).filter(Boolean) as Alert[];

      // Combine with database alerts and sort
      const allAlerts = [...ecologicalAlerts, ...dynamicAlerts].sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setAlerts(allAlerts);
    } catch (err) {
      console.error("Error loading ecological data:", err);
      setError("Failed to load ecological dashboard data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading Ecological Data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => loadEcologicalData(false)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ecological Impact Monitoring</h1>
          <p className="text-gray-500 text-sm">Real-time environmental analysis and capacity management</p>
        </div>
        <button
          onClick={() => loadEcologicalData(true)}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Destinations at Risk"
          value={summaryStats.destinationsAtRisk}
          icon={ShieldAlert}
          color="bg-red-100 text-red-600"
          subtitle=">70% utilization"
        />
        <StatCard
          title="Avg. Utilization"
          value={`${summaryStats.averageUtilization}%`}
          icon={Leaf}
          color="bg-green-100 text-green-600"
          subtitle="Across all destinations"
        />
        <StatCard
          title="Policy Violations"
          value={summaryStats.policyViolations}
          icon={AlertTriangle}
          color="bg-orange-100 text-orange-600"
          subtitle="High risk zones"
        />
        <StatCard
          title="Active Eco Alerts"
          value={summaryStats.activeAlerts}
          icon={Activity}
          color="bg-blue-100 text-blue-600"
          subtitle="Requires attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity Utilization Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-500" />
            Ecological Capacity Utilization
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinations}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${Math.round(value)}%`, 'Utilization']}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
                  {destinations.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.riskLevel === 'critical' ? '#ef4444' : 
                        entry.riskLevel === 'high' ? '#f97316' : 
                        entry.riskLevel === 'medium' ? '#eab308' : '#22c55e'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Trends */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Historical Occupancy Trends
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">System-wide (All)</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="flex bg-gray-100 p-1 rounded-md">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimeRange(days)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timeRange === days
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(str: string) => {
                    const date = new Date(str);
                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(str: string) => new Date(str).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  name="Actual Occupancy"
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="adjustedCapacity" 
                  name="Ecological Limit"
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2} 
                  dot={false}
                />
                {/* 70% Threshold Line */}
                <Line 
                  type="monotone"
                  dataKey={(d: HistoricalOccupancy) => d.adjustedCapacity * 0.7}
                  name="Caution (70%)"
                  stroke="#eab308"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Environmental Impact Estimates Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Leaf className="h-5 w-5 mr-2 text-green-600" />
            Environmental Impact Estimations
          </h2>
          <div className="text-xs text-gray-500 italic">
            * Estimates based on industry averages and ecological sensitivity multipliers
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Aggregate Impact */}
          <div className="bg-green-50 rounded-xl p-6 flex items-center justify-around border border-green-100">
            <div className="text-center">
              <p className="text-sm text-green-700 font-medium mb-1">System-wide CO2e</p>
              <p className="text-3xl font-bold text-green-900">{summaryStats.totalCarbon.toLocaleString()} kg</p>
              <p className="text-xs text-green-600 mt-1">Estimated daily footprint</p>
            </div>
            <div className="h-12 w-px bg-green-200 mx-4"></div>
            <div className="text-center">
              <p className="text-sm text-green-700 font-medium mb-1">System-wide Waste</p>
              <p className="text-3xl font-bold text-green-900">{summaryStats.totalWaste.toLocaleString()} kg</p>
              <p className="text-xs text-green-600 mt-1">Estimated daily generation</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Carbon Methodology</p>
                <p className="text-xs text-gray-600">Base 20kg CO2e per visitor/day, adjusted by 1.0x - 2.0x multiplier based on destination sensitivity level.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Waste Management Baseline</p>
                <p className="text-xs text-gray-600">Base 1.5kg waste per visitor/day. Red indicators trigger when waste exceeds 150kg/day per destination.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily CO2e</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Waste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {destinations.map((item) => {
                const carbon = estimateCarbonFootprint(item.currentOccupancy, item.sensitivity);
                const waste = estimateWasteGeneration(item.currentOccupancy, item.sensitivity);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-2 font-semibold text-gray-700">{carbon.toLocaleString()} kg</span>
                        <div className="w-12 bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full" 
                            style={{ width: `${Math.min(100, (carbon / 500) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className={`mr-2 font-semibold ${getWasteRiskColor(waste)}`}>{waste.toLocaleString()} kg</span>
                        <div className="w-12 bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${waste > 120 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (waste / 150) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                        <span className="text-xs">-2.4% vs prev. week</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100 text-[10px] text-gray-400 leading-relaxed">
          <strong>Methodology Footnote:</strong> Environmental impact estimations are derived from the GreenPass Ecological Policy Engine. Carbon calculations use CO2e (Carbon Dioxide Equivalent) metrics incorporating transportation, energy use, and site maintenance baselines. Waste metrics include both recyclable and non-recyclable solid waste generated on-site. All multipliers are dynamically adjusted based on the ecological sensitivity of the specific destination zone.
        </div>
      </div>

      {/* Per-Destination Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination) => {
          const policyEngine = getPolicyEngine();
          const policy = policyEngine.getPolicy(destination.sensitivity);
          
          return (
            <div key={destination.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{destination.name}</h3>
                  <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getEcologicalSensitivityColor(destination.sensitivity)}`}>
                    {destination.sensitivity}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">{Math.round(destination.utilization)}%</span>
                  <p className="text-xs text-gray-500">Utilization</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Occupancy: {destination.currentOccupancy}</span>
                    <span className="text-gray-600">Eco Limit: {destination.adjustedCapacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${getRiskZoneColor(destination.utilization)}`}
                      style={{ width: `${Math.min(100, destination.utilization)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <div className="text-gray-500">
                    <p>Physical Max: {destination.maxCapacity}</p>
                    <p>Multiplier: {policy.capacityMultiplier}x</p>
                  </div>
                  <div className={`px-2 py-1 rounded ${
                    destination.utilization >= 85 ? 'bg-red-50 text-red-700' :
                    destination.utilization >= 70 ? 'bg-orange-50 text-orange-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {destination.utilization >= 85 ? 'Critical Risk' :
                     destination.utilization >= 70 ? 'High Risk' :
                     'Sustainable'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ecological Risk Table */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2 text-orange-500" />
          Destination Risk & Impact Analysis
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sensitivity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carbon Est.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {destinations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="capitalize">{item.sensitivity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div 
                          className={`h-1.5 rounded-full ${
                            item.utilization > 85 ? 'bg-red-500' : 
                            item.utilization > 70 ? 'bg-orange-500' : 
                            item.utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, item.utilization)}%` }}
                        ></div>
                      </div>
                      {Math.round(item.utilization)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.carbonFootprint} kg CO2e</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                      item.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                      item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ecological Alerts Summary */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          Active Ecological Alerts
        </h2>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
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
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <span className="text-xs text-gray-500">{formatDateTime(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No active ecological alerts</p>
          )}
        </div>
      </div>
    </div>
  );
}
