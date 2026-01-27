"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useModalAccessibility } from "@/lib/accessibility";
import {
  Trash2,
  Calendar,
  Users,
  Plus,
  Search,
  Edit2,
  Trash,
  CheckCircle,
  XCircle,
  Award,
  BarChart3,
  Recycle,
  MapPin,
  Clock,
  ChevronRight,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { 
  WasteData, 
  CleanupActivity, 
  CleanupRegistration, 
  Destination,
} from "@/types";
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
} from "recharts";
import { ChartErrorBoundary, DataFetchErrorBoundary } from "@/components/errors";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { cn, sanitizeSearchTerm, sanitizeObject, sanitizeForDatabase } from "@/lib/utils";
import { validateInput, SearchFilterSchema } from "@/lib/validation";
import { Database } from "@/types/database";

type DbDestination = Database['public']['Tables']['destinations']['Row'];

interface TrendDataItem {
  date: string;
  displayDate: string;
  quantity: number;
}

interface DistributionDataItem {
  name: string;
  value: number;
}

export default function WasteTrackingPage() {
  const [activeTab, setActiveTab] = useState<"waste" | "cleanup" | "analytics">("waste");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteData[]>([]);
  const [cleanupActivities, setCleanupActivities] = useState<CleanupActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalWaste: 0,
    recyclingRate: 0,
    activeEvents: 0,
    totalVolunteers: 0
  });
  const [trendTimeRange, setTrendTimeRange] = useState(30);
  const [trendData, setTrendData] = useState<TrendDataItem[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionDataItem[]>([]);

  const dbService = getDbService();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTrendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendTimeRange]);

  const loadTrendData = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, trendTimeRange);
      const data = await dbService.getWasteDataByDateRange(startDate, endDate);
      
      // Process trend data (grouped by day)
      const dayInterval = eachDayOfInterval({ start: startDate, end: endDate });
      const trend: TrendDataItem[] = dayInterval.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayWaste = data
          .filter(w => format(new Date(w.collectedAt), "yyyy-MM-dd") === dayStr)
          .reduce((sum, w) => sum + w.quantity, 0);
        
        return {
          date: dayStr,
          displayDate: format(day, "MMM dd"),
          quantity: dayWaste
        };
      });
      setTrendData(trend);

      // Process distribution data (grouped by type)
      const types: Record<string, number> = {};
      data.forEach(w => {
        types[w.wasteType] = (types[w.wasteType] || 0) + w.quantity;
      });
      
      const distribution: DistributionDataItem[] = Object.entries(types).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      })).sort((a, b) => b.value - a.value);
      
      setDistributionData(distribution);
    } catch (error) {
      console.error("Error loading trend data:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [destData, wasteData, activitiesData] = await Promise.all([
        dbService.getDestinations(),
        dbService.getWasteData(),
        dbService.getCleanupActivities(),
      ]);

      const transformedDestinations = destData.map(d => dbService.transformDbDestinationToDestination(d as DbDestination));
      setDestinations(transformedDestinations);
      setWasteRecords(wasteData);
      setCleanupActivities(activitiesData);

      // Calculate stats
      const totalWaste = wasteData.reduce((sum, r) => sum + r.quantity, 0);
      const recycledWaste = wasteData
        .filter(r => ['plastic', 'glass', 'metal', 'paper'].includes(r.wasteType))
        .reduce((sum, r) => sum + r.quantity, 0);
      
      const recyclingRate = totalWaste > 0 ? (recycledWaste / totalWaste) * 100 : 0;
      const activeEvents = activitiesData.filter(a => a.status === 'upcoming' || a.status === 'ongoing').length;
      const totalVolunteers = activitiesData.reduce((sum, a) => sum + a.currentParticipants, 0);

      setStats({
        totalWaste,
        recyclingRate,
        activeEvents,
        totalVolunteers
      });

      // Initial trend data load
      loadTrendData();
    } catch (error) {
      console.error("Error loading waste tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="p-6 max-w-7xl mx-auto">
          <DataFetchErrorBoundary onRetry={loadData}>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="h-8 w-8 text-green-600" />
                Waste & Cleanup Management
              </h1>
              <p className="text-gray-500 mt-1">
                Monitor waste collection metrics and organize ecological cleanup events.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Trash2 className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Waste Collected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWaste.toLocaleString()} kg</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Recycle className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Recycling Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recyclingRate.toFixed(1)}%</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Active Cleanup Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVolunteers}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("waste")}
                  className={cn(
                    "py-4 px-6 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "waste"
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Waste Collection
                </button>
                <button
                  onClick={() => setActiveTab("cleanup")}
                  className={cn(
                    "py-4 px-6 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "cleanup"
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Cleanup Activities
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={cn(
                    "py-4 px-6 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "analytics"
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Historical Analytics
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "waste" ? (
                <WasteCollectionTab 
                  destinations={destinations} 
                  records={wasteRecords} 
                  onRefresh={loadData}
                />
              ) : activeTab === "cleanup" ? (
                <CleanupActivitiesTab 
                  destinations={destinations} 
                  activities={cleanupActivities} 
                  onRefresh={loadData}
                />
              ) : (
                <WasteAnalyticsTab 
                  trendData={trendData}
                  distributionData={distributionData}
                  timeRange={trendTimeRange}
                  setTimeRange={setTrendTimeRange}
                />
              )}
            </div>
          </DataFetchErrorBoundary>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

// --- Waste Analytics Tab Component ---
function WasteAnalyticsTab({ trendData, distributionData, timeRange, setTimeRange }: {
  trendData: TrendDataItem[],
  distributionData: DistributionDataItem[],
  timeRange: number,
  setTimeRange: (days: number) => void
}) {
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Waste Trends & Distribution</h2>
          <p className="text-sm text-gray-500">Analyze historical waste collection patterns and composition.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg" role="group" aria-label="Select time range for analytics">
          {[30, 90, 365].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              aria-pressed={timeRange === days}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                timeRange === days
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {days === 30 ? "30 Days" : days === 90 ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Collection Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Waste Collection Trend (kg)
          </h3>
          <div className="h-80 w-full">
            <ChartErrorBoundary chartTitle="Waste Collection Trend">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quantity" 
                    name="Waste Collected"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Waste Type Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Waste Type Distribution
          </h3>
          <div className="h-80 w-full">
            <ChartErrorBoundary chartTitle="Waste Type Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" name="Quantity (kg)" radius={[0, 4, 4, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Waste Collection Tab Component ---
function WasteCollectionTab({ destinations, records, onRefresh }: { 
  destinations: Destination[], 
  records: WasteData[],
  onRefresh: () => void 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDestination, setFilterDestination] = useState("all");

  const filteredRecords = records.filter(r => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };
    const term = validFilters.searchTerm?.toLowerCase() || "";

    const destName = destinations.find(d => d.id === r.destinationId)?.name || "";
    const matchesSearch = destName.toLowerCase().includes(term) || 
                         r.wasteType.toLowerCase().includes(term);
    const matchesDest = filterDestination === "all" || r.destinationId === filterDestination;
    return matchesSearch && matchesDest;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <label htmlFor="search-waste-records" className="sr-only">Search waste records</label>
            <input
              id="search-waste-records"
              type="text"
              placeholder="Search waste records..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-destination" className="sr-only">Filter by destination</label>
            <select
              id="filter-destination"
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-900"
              value={filterDestination}
              onChange={(e) => setFilterDestination(e.target.value)}
            >
              <option value="all" className="text-gray-900">All Destinations</option>
              {destinations.map(d => (
                <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Log Waste Data
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Waste Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Collected At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {destinations.find(d => d.id === record.destinationId)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      record.wasteType === 'plastic' ? "bg-blue-50 text-blue-700" :
                      record.wasteType === 'organic' ? "bg-green-50 text-green-700" :
                      record.wasteType === 'glass' ? "bg-purple-50 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {record.wasteType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(record.collectedAt), "MMM dd, yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        aria-label={`Edit record for ${destinations.find(d => d.id === record.destinationId)?.name || 'Unknown'}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button 
                        aria-label={`Delete record for ${destinations.find(d => d.id === record.destinationId)?.name || 'Unknown'}`}
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this record?")) {
                            await getDbService().deleteWasteData(record.id);
                            onRefresh();
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No waste records found.</div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {destinations.find(d => d.id === record.destinationId)?.name || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(record.collectedAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    record.wasteType === 'plastic' ? "bg-blue-50 text-blue-700" :
                    record.wasteType === 'organic' ? "bg-green-50 text-green-700" :
                    record.wasteType === 'glass' ? "bg-purple-50 text-purple-700" :
                    "bg-gray-100 text-gray-700"
                  )}>
                    {record.wasteType}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-y border-gray-50">
                  <span className="text-sm text-gray-500">Quantity Collected</span>
                  <span className="font-bold text-gray-900">{record.quantity} {record.unit}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    aria-label={`Edit record for ${destinations.find(d => d.id === record.destinationId)?.name || 'Unknown'}`}
                    className="flex-1 flex items-center justify-center min-h-[44px] gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                  <button 
                    aria-label={`Delete record for ${destinations.find(d => d.id === record.destinationId)?.name || 'Unknown'}`}
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this record?")) {
                        await getDbService().deleteWasteData(record.id);
                        onRefresh();
                      }
                    }}
                    className="flex-1 flex items-center justify-center min-h-[44px] gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl border border-red-100 transition-colors"
                  >
                    <Trash className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <WasteLogModal 
          destinations={destinations} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

type WasteType = 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other';

function WasteLogModal({ destinations, onClose, onSuccess }: { 
  destinations: Destination[], 
  onClose: () => void,
  onSuccess: () => void 
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ modalRef, isOpen: true, onClose });

  const [formData, setFormData] = useState({
    destination_id: destinations[0]?.id || "",
    waste_type: "plastic" as WasteType,
    quantity: "",
    unit: "kg",
    collected_at: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sanitizedForm = {
        ...formData,
        unit: sanitizeForDatabase(formData.unit)
      };

      const dbService = getDbService();
      await dbService.addWasteData({
        destination_id: sanitizedForm.destination_id,
        waste_type: sanitizedForm.waste_type,
        quantity: parseFloat(sanitizedForm.quantity),
        unit: sanitizedForm.unit,
        collected_at: new Date(sanitizedForm.collected_at).toISOString()
      });
      onSuccess();
    } catch (error) {
      console.error("Error adding waste data:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waste-log-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 id="waste-log-title" className="text-xl font-bold text-gray-900">Log Waste Collection</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="waste-destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <select
              id="waste-destination"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              value={formData.destination_id}
              onChange={(e) => setFormData({...formData, destination_id: e.target.value})}
            >
              {destinations.map(d => (
                <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="waste-type" className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
              <select
                id="waste-type"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                value={formData.waste_type}
                onChange={(e) => setFormData({...formData, waste_type: e.target.value as WasteType})}
              >
                <option value="plastic" className="text-gray-900">Plastic</option>
                <option value="glass" className="text-gray-900">Glass</option>
                <option value="metal" className="text-gray-900">Metal</option>
                <option value="organic" className="text-gray-900">Organic</option>
                <option value="paper" className="text-gray-900">Paper</option>
                <option value="other" className="text-gray-900">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="waste-quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
              <input
                id="waste-quantity"
                type="number"
                required
                step="0.1"
                min="0"
                placeholder="0.0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 bg-white"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label htmlFor="waste-date" className="block text-sm font-medium text-gray-700 mb-1">Collection Date & Time</label>
            <input
              id="waste-date"
              type="datetime-local"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              value={formData.collected_at}
              onChange={(e) => setFormData({...formData, collected_at: e.target.value})}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Log Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Cleanup Activities Tab Component ---
function CleanupActivitiesTab({ destinations, activities, onRefresh }: { 
  destinations: Destination[], 
  activities: CleanupActivity[],
  onRefresh: () => void 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CleanupActivity | null>(null);
  const [registrations, setRegistrations] = useState<CleanupRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const handleViewActivity = async (activity: CleanupActivity) => {
    setSelectedActivity(activity);
    setLoadingRegs(true);
    try {
      const dbService = getDbService();
      const regs = await dbService.getCleanupRegistrationsByActivity(activity.id);
      setRegistrations(regs);
    } catch (error) {
      console.error("Error loading registrations:", error);
    } finally {
      setLoadingRegs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Environmental Cleanup Events</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Activity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider",
                  activity.status === 'upcoming' ? "bg-blue-50 text-blue-700" :
                  activity.status === 'ongoing' ? "bg-yellow-50 text-yellow-700" :
                  activity.status === 'completed' ? "bg-green-50 text-green-700" :
                  "bg-red-50 text-red-700"
                )}>
                  {activity.status}
                </span>
                <div className="flex items-center text-green-600 font-bold text-sm">
                  <Award className="h-4 w-4 mr-1" />
                  {activity.ecoPointsReward} pts
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{activity.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">{activity.description}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                {activity.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {format(new Date(activity.startTime), "MMM dd, HH:mm")}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium text-gray-900">{activity.currentParticipants}</span>
                  <span className="text-gray-500 mx-1">/</span>
                  <span className="text-gray-500">{activity.maxParticipants}</span>
                </div>
                <button 
                  onClick={() => handleViewActivity(activity)}
                  aria-label={`Manage activity: ${activity.title}`}
                  className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                >
                  Manage <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <CleanupActivityModal 
          destinations={destinations} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {selectedActivity && (
        <ActivityManagementModal 
          activity={selectedActivity}
          registrations={registrations}
          loading={loadingRegs}
          onClose={() => setSelectedActivity(null)}
          onRefresh={() => {
            handleViewActivity(selectedActivity);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function CleanupActivityModal({ destinations, onClose, onSuccess }: { 
  destinations: Destination[], 
  onClose: () => void,
  onSuccess: () => void 
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ modalRef, isOpen: true, onClose });

  const [formData, setFormData] = useState({
    destination_id: destinations[0]?.id || "",
    title: "",
    description: "",
    location: "",
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(Date.now() + 3600000 * 2), "yyyy-MM-dd'T'HH:mm"),
    max_participants: "20",
    eco_points_reward: "50"
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sanitizedForm = {
        ...formData,
        title: sanitizeForDatabase(formData.title),
        description: sanitizeForDatabase(formData.description),
        location: sanitizeForDatabase(formData.location)
      };

      const dbService = getDbService();
      await dbService.createCleanupActivity({
        destination_id: sanitizedForm.destination_id,
        title: sanitizedForm.title,
        description: sanitizedForm.description,
        location: sanitizedForm.location,
        start_time: new Date(sanitizedForm.start_time).toISOString(),
        end_time: new Date(sanitizedForm.end_time).toISOString(),
        max_participants: parseInt(sanitizedForm.max_participants),
        eco_points_reward: parseInt(sanitizedForm.eco_points_reward),
        status: 'upcoming'
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating cleanup activity:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cleanup-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 id="cleanup-modal-title" className="text-xl font-bold text-gray-900">Create Cleanup Activity</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="cleanup-destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <select
              id="cleanup-destination"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              value={formData.destination_id}
              onChange={(e) => setFormData({...formData, destination_id: e.target.value})}
            >
              {destinations.map(d => (
                <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cleanup-title" className="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
            <input
              id="cleanup-title"
              type="text"
              required
              placeholder="e.g. Beach Cleanup Drive"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 bg-white"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label htmlFor="cleanup-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="cleanup-description"
              required
              rows={3}
              placeholder="Describe the activity and what volunteers should bring..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 bg-white"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label htmlFor="cleanup-location" className="block text-sm font-medium text-gray-700 mb-1">Specific Location</label>
            <input
              id="cleanup-location"
              type="text"
              required
              placeholder="e.g. Main Beach, near North Tower"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400 bg-white"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cleanup-start-time" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                id="cleanup-start-time"
                type="datetime-local"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="cleanup-end-time" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                id="cleanup-end-time"
                type="datetime-local"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cleanup-max-participants" className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                id="cleanup-max-participants"
                type="number"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="cleanup-eco-points" className="block text-sm font-medium text-gray-700 mb-1">Eco-Points Reward</label>
              <input
                id="cleanup-eco-points"
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                value={formData.eco_points_reward}
                onChange={(e) => setFormData({...formData, eco_points_reward: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivityManagementModal({ activity, registrations, loading, onClose, onRefresh }: {
  activity: CleanupActivity,
  registrations: CleanupRegistration[],
  loading: boolean,
  onClose: () => void,
  onRefresh: () => void
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ modalRef, isOpen: true, onClose });

  const [cancelling, setCancelling] = useState(false);

  const handleConfirmAttendance = async (regId: string, currentStatus: string) => {
    try {
      const dbService = getDbService();
      if (currentStatus === 'attended') {
        // Toggle off attendance
        await dbService.updateCleanupRegistration(regId, { status: 'registered', attended: false });
      } else {
        // Toggle on attendance
        await dbService.confirmCleanupAttendance(regId);
      }
      onRefresh();
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const handleCancelActivity = async () => {
    if (!confirm("Are you sure you want to cancel this activity? All participants will be notified.")) return;
    setCancelling(true);
    try {
      const dbService = getDbService();
      await dbService.cancelCleanupActivity(activity.id);
      onClose();
      onRefresh();
    } catch (error) {
      console.error("Error cancelling activity:", error);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-mgmt-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 id="activity-mgmt-title" className="text-xl font-bold text-gray-900">{activity.title}</h3>
            <p className="text-sm text-gray-500">{activity.location}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Participant List ({registrations.length})
            </h4>
            {activity.status !== 'cancelled' && activity.status !== 'completed' && (
              <button 
                onClick={handleCancelActivity}
                disabled={cancelling}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <Trash className="h-4 w-4" />
                Cancel Activity
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading participants...</div>
          ) : registrations.length === 0 ? (
            <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
              No participants registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                      {reg.userId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">User ID: {reg.userId.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-500">Registered {format(new Date(reg.registeredAt), "MMM dd, HH:mm")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reg.status === 'attended' ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Attended
                        </span>
                        <button 
                          onClick={() => handleConfirmAttendance(reg.id, reg.status)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                          Undo
                        </button>
                      </div>
                    ) : reg.status === 'cancelled' ? (
                      <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
                        Cancelled
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleConfirmAttendance(reg.id, reg.status)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        <UserCheck className="h-4 w-4" />
                        Confirm Attendance
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
