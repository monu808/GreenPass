"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import { useModalAccessibility } from "@/lib/accessibility";
import {
  History,
  AlertTriangle,
  Calendar,
  CloudSun,
  Activity,
  Users,
  Plus,
  ArrowRight,
  ShieldAlert,
  Clock,
  Filter,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { getPolicyEngine } from "@/lib/ecologicalPolicyEngine";
import { formatDateTime } from "@/lib/utils";
import { Destination, AdjustmentLog, DynamicCapacityResult } from "@/types";
import { format } from "date-fns";
import { Database } from "@/types/database";
import { sanitizeSearchTerm, sanitizeObject, sanitizeForDatabase } from "@/lib/utils";
import { validateInput, SearchFilterSchema } from "@/lib/validation";

type DbDestination = Database['public']['Tables']['destinations']['Row'];

export default function CapacityRulesPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [capacityResults, setCapacityResults] = useState<Record<string, DynamicCapacityResult>>({});
  const [history, setHistory] = useState<AdjustmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [historyDays, setHistoryDays] = useState(7);
  const [historySearch, setHistorySearch] = useState("");
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Modal accessibility
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({
    modalRef,
    isOpen: isOverrideModalOpen,
    onClose: () => setIsOverrideModalOpen(false)
  });

  // Override Form State
  const [overrideForm, setOverrideForm] = useState<{
    destinationId: string;
    multiplier: number;
    reason: string;
    expiresAt: string;
  }>({
    destinationId: "",
    multiplier: 0.8,
    reason: "",
    expiresAt: format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const dbService = getDbService();
      const policyEngine = getPolicyEngine();
      
      const [destData, historyData] = await Promise.all([
        dbService.getDestinations(),
        dbService.getCapacityAdjustmentHistory(undefined, historyDays),
      ]);

      const transformedDestinations = destData.map((dest: DbDestination) => ({
        ...dest,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: { latitude: dest.latitude, longitude: dest.longitude },
      }));

      setDestinations(transformedDestinations);
      setHistory(historyData);

      // Calculate results for all destinations
      const results: Record<string, DynamicCapacityResult> = {};
      for (const dest of transformedDestinations) {
        results[dest.id] = await policyEngine.getDynamicCapacity(dest);
      }
      setCapacityResults(results);
    } catch (error) {
      console.error("Error loading capacity data:", error);
    } finally {
      setLoading(false);
    }
  }, [historyDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSetOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideForm.destinationId || !overrideForm.reason) return;

    setIsSavingOverride(true);
    setOverrideError(null);

    try {
      const sanitizedForm = {
        ...overrideForm,
        reason: sanitizeForDatabase(overrideForm.reason)
      };

      const policyEngine = getPolicyEngine();
      policyEngine.setCapacityOverride({
        destinationId: sanitizedForm.destinationId,
        multiplier: sanitizedForm.multiplier,
        reason: sanitizedForm.reason,
        expiresAt: new Date(sanitizedForm.expiresAt),
        active: true,
      });

      await loadData();
      setIsOverrideModalOpen(false);
      // Reset form on success
      setOverrideForm({
        destinationId: "",
        multiplier: 0.8,
        reason: "",
        expiresAt: format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      });
    } catch (error) {
      console.error("Error setting capacity override:", error);
      setOverrideError(error instanceof Error ? error.message : "Failed to set capacity override. Please try again.");
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleClearOverride = async (destinationId: string) => {
    setIsSavingOverride(true);
    try {
      const policyEngine = getPolicyEngine();
      policyEngine.clearCapacityOverride(destinationId);
      await loadData();
    } catch (error) {
      console.error("Error clearing capacity override:", error);
      alert("Failed to clear override. Please try again.");
    } finally {
      setIsSavingOverride(false);
    }
  };

  const filteredHistory = history.filter(log => {
    const sanitizedSearch = sanitizeSearchTerm(historySearch);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };
    const searchTerm = validFilters.searchTerm?.toLowerCase() || "";

    const destinationName = destinations.find(d => d.id === log.destinationId)?.name || "";
    return destinationName.toLowerCase().includes(searchTerm) ||
           log.reason.toLowerCase().includes(searchTerm);
  });

  return (
    <Layout requireAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-green-600" />
              Dynamic Capacity Management
            </h1>
            <p className="text-gray-600">
              Configure environmental factors and manage manual overrides for destination capacities.
            </p>
          </div>
          <button
            onClick={() => setIsOverrideModalOpen(true)}
            className="inline-flex items-center justify-center px-4 min-h-[44px] bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-bold text-base w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Manual Override
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-4 px-6 text-sm font-bold transition-colors relative whitespace-nowrap min-h-[44px] flex items-center ${
              activeTab === "rules" ? "text-green-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active Adjustments
            {activeTab === "rules" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-6 text-sm font-bold transition-colors relative flex items-center whitespace-nowrap min-h-[44px] ${
              activeTab === "history" ? "text-green-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="h-4 w-4 mr-2" />
            Adjustment History
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === "rules" ? (
          <div className="space-y-6">
            {/* Rule Configuration Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <CloudSun className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Weather Thresholds</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">Low Alert</span>
                    <span className="font-bold text-gray-900">0.90x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">Medium Alert</span>
                    <span className="font-bold text-gray-900">0.85x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">High Alert</span>
                    <span className="font-bold text-gray-900">0.80x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 text-red-700">
                    <span className="font-bold">Critical Alert</span>
                    <span className="font-bold">0.75x</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Seasonal Scaling</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">High Season (May-Oct)</span>
                    <span className="font-bold text-gray-900">0.80x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">Off Season</span>
                    <span className="font-bold text-gray-900">1.00x</span>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs flex items-center">
                    <div className="h-2 w-2 rounded-full bg-amber-400 mr-2 animate-pulse" />
                    <span className="text-amber-800 font-bold">
                      Current: {getPolicyEngine().getSeasonFactor() < 1 ? 'High Season Active' : 'Off Season'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Ecological Strain</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">Low (0-40%)</span>
                    <span className="font-bold text-gray-900">1.00x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50">
                    <span className="font-medium">Medium (40-70%)</span>
                    <span className="font-bold text-gray-900">0.90x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-rose-50 text-rose-700">
                    <span className="font-bold">High (&gt;70%)</span>
                    <span className="font-bold">0.80x</span>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] sm:text-xs">
                    <span className="font-semibold text-emerald-800">Factors: Soil, Vegetation, Wildlife, Water</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Utilization Threshold */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Utilization Safeguard</h3>
                    <p className="text-sm text-gray-500">Auto-reduction when occupancy exceeds 85%</p>
                  </div>
                </div>
                <div className="flex items-center justify-center px-6 py-2 bg-purple-100 text-purple-700 rounded-xl border border-purple-200">
                  <span className="text-lg font-black">0.90x</span>
                  <span className="ml-2 text-xs font-bold uppercase tracking-wider">Multiplier</span>
                </div>
              </div>
            </div>

            {/* Destination Status - Responsive View */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Active Destination Adjustments</h3>
                <div className="text-xs text-gray-500">
                  Updated {formatDateTime(new Date())}
                </div>
              </div>

              {/* Table View (Desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base / Adjusted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Factors</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiplier</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <RefreshCw className="h-8 w-8 text-green-500 animate-spin mx-auto" />
                          <p className="mt-2 text-gray-500">Loading capacity data...</p>
                        </td>
                      </tr>
                    ) : (
                      destinations.map((dest) => {
                        const result = capacityResults[dest.id];
                        const hasOverride = getPolicyEngine().getCapacityOverride(dest.id);
                        
                        return (
                          <tr key={dest.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{dest.name}</div>
                              <div className="text-xs text-gray-500">{dest.ecologicalSensitivity} sensitivity</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <span className="text-gray-400">{dest.maxCapacity}</span>
                                <ArrowRight className="h-3 w-3 inline mx-2 text-gray-300" />
                                <span className="font-bold text-gray-900">{result?.adjustedCapacity || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {result?.activeFactors.map((factor, i) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {factor}
                                  </span>
                                ))}
                                {result?.activeFactors.length === 0 && (
                                  <span className="text-xs text-gray-400 italic">None</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${
                                (result?.factors.combinedMultiplier || 1) < 0.7 ? 'text-red-600' :
                                (result?.factors.combinedMultiplier || 1) < 0.9 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {Math.round((result?.factors.combinedMultiplier || 1) * 100)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {hasOverride ? (
                                <button
                                  onClick={() => handleClearOverride(dest.id)}
                                  disabled={isSavingOverride}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center gap-1 ml-auto min-h-[44px] px-3"
                                >
                                  {isSavingOverride ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Clear Override
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setOverrideForm({ ...overrideForm, destinationId: dest.id });
                                    setOverrideError(null);
                                    setIsOverrideModalOpen(true);
                                  }}
                                  disabled={isSavingOverride}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 min-h-[44px] px-3"
                                >
                                  Override
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Card View (Mobile) */}
              <div className="md:hidden divide-y divide-gray-100">
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <RefreshCw className="h-8 w-8 text-green-500 animate-spin mx-auto" />
                    <p className="mt-2 text-gray-500 font-medium">Loading capacity data...</p>
                  </div>
                ) : (
                  destinations.map((dest) => {
                    const result = capacityResults[dest.id];
                    const hasOverride = getPolicyEngine().getCapacityOverride(dest.id);
                    
                    return (
                      <div key={dest.id} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900 text-lg leading-tight">{dest.name}</div>
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                              {dest.ecologicalSensitivity} sensitivity
                            </div>
                          </div>
                          <div className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl border ${
                            (result?.factors.combinedMultiplier || 1) < 0.7 ? 'bg-red-50 text-red-700 border-red-100' :
                            (result?.factors.combinedMultiplier || 1) < 0.9 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'
                          }`}>
                            <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Limit</span>
                            <span className="text-lg font-black leading-none">
                              {Math.round((result?.factors.combinedMultiplier || 1) * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                          <div className="space-y-1">
                            <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider">Capacity</span>
                            <div className="flex items-center">
                              <span className="text-gray-400 text-xs line-through decoration-gray-300">{dest.maxCapacity}</span>
                              <ArrowRight className="h-3 w-3 mx-2 text-gray-300" />
                              <span className="font-bold text-gray-900 text-base">{result?.adjustedCapacity || 0}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider">Active Factors</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {result?.activeFactors.map((factor, i) => (
                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-sm">
                                  {factor}
                                </span>
                              ))}
                              {result?.activeFactors.length === 0 && (
                                <span className="text-xs text-gray-400 italic font-medium">No active factors</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-1">
                          {hasOverride ? (
                            <button
                              onClick={() => handleClearOverride(dest.id)}
                              disabled={isSavingOverride}
                              className="w-full py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-bold transition-all border border-red-100 min-h-[48px] shadow-sm active:scale-[0.98]"
                            >
                              {isSavingOverride ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                              Clear Manual Override
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setOverrideForm({ ...overrideForm, destinationId: dest.id });
                                setOverrideError(null);
                                setIsOverrideModalOpen(true);
                              }}
                              disabled={isSavingOverride}
                              className="w-full py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 disabled:opacity-50 text-sm font-bold transition-all border border-green-100 min-h-[48px] shadow-sm active:scale-[0.98]"
                            >
                              Apply Manual Override
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={historyDays}
                  onChange={(e) => setHistoryDays(Number(e.target.value))}
                  className="text-sm border-gray-300 rounded-lg focus:ring-green-500 outline-none text-gray-900 bg-white flex-1 sm:flex-none"
                >
                  <option value={1}>Last 24 Hours</option>
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* Desktop History Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason / Factors</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                        No adjustment logs found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(log.timestamp, "MMM d, HH:mm")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {destinations.find(d => d.id === log.destinationId)?.name || log.destinationId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="font-bold text-gray-900">{log.adjustedCapacity}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-500">{log.originalCapacity}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{log.reason}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tighter">
                            Multiplier: {Math.round(log.factors.combinedMultiplier * 100)}%
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile History Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">
                  No adjustment logs found.
                </div>
              ) : (
                filteredHistory.map((log) => (
                  <div key={log.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">
                          {destinations.find(d => d.id === log.destinationId)?.name || log.destinationId}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(log.timestamp, "MMM d, HH:mm")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {log.adjustedCapacity} <span className="text-[10px] text-gray-400 font-normal">limit</span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          from {log.originalCapacity} base
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="text-sm text-gray-700 font-medium leading-relaxed">{log.reason}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Multiplier</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          log.factors.combinedMultiplier < 0.7 ? 'bg-red-50 text-red-700' :
                          log.factors.combinedMultiplier < 0.9 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {Math.round(log.factors.combinedMultiplier * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Override Modal */}
        {isOverrideModalOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div 
              ref={modalRef}
              className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 id="modal-title" className="text-xl font-bold text-gray-900">Add Capacity Override</h2>
                    <p className="text-xs text-gray-500">Manually adjust visitor capacity</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <span aria-hidden="true" className="text-2xl">×</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <form id="override-form" onSubmit={handleSetOverride} className="space-y-5">
                  {overrideError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p className="font-medium">{overrideError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="destination" className="block text-sm font-bold text-gray-700">
                      Target Destination
                    </label>
                    <select
                      id="destination"
                      value={overrideForm.destinationId}
                      onChange={(e) => setOverrideForm({ ...overrideForm, destinationId: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base min-h-[44px] bg-white shadow-sm"
                    >
                      <option value="">Select a destination...</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id}>
                          {dest.name} ({dest.maxCapacity} base)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="multiplier" className="block text-sm font-bold text-gray-700">
                        Capacity Multiplier
                      </label>
                      <span className="text-lg font-black text-green-600">
                        {Math.round(overrideForm.multiplier * 100)}%
                      </span>
                    </div>
                    <input
                      id="multiplier"
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={overrideForm.multiplier}
                      onChange={(e) => setOverrideForm({ ...overrideForm, multiplier: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span>Extreme Limit (10%)</span>
                      <span>Increase (150%)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="reason" className="block text-sm font-bold text-gray-700">
                      Reason for Override
                    </label>
                    <textarea
                      id="reason"
                      rows={3}
                      value={overrideForm.reason}
                      onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                      placeholder="e.g., Special event, maintenance, emergency restriction..."
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="expiresAt" className="block text-sm font-bold text-gray-700">
                      Expiry Date & Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="expiresAt"
                        type="datetime-local"
                        value={overrideForm.expiresAt}
                        onChange={(e) => setOverrideForm({ ...overrideForm, expiresAt: e.target.value })}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base min-h-[44px] shadow-sm"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="flex-1 px-6 py-3.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-bold text-sm min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="override-form"
                  disabled={isSavingOverride}
                  className="flex-[2] px-6 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm flex items-center justify-center min-h-[44px] shadow-lg shadow-green-200 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSavingOverride ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Apply Override'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
