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
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Override
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
              activeTab === "rules" ? "text-green-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active Adjustments
            {activeTab === "rules" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative flex items-center ${
              activeTab === "history" ? "text-green-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="h-4 w-4 mr-2" />
            Adjustment History
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        </div>

        {activeTab === "rules" ? (
          <div className="space-y-6">
            {/* Rule Configuration Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <CloudSun className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Weather Thresholds</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Low Alert</span>
                    <span className="font-medium">0.90x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Alert</span>
                    <span className="font-medium">0.85x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Alert</span>
                    <span className="font-medium">0.80x</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Critical Alert</span>
                    <span className="font-medium">0.75x</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Seasonal Scaling</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>High Season (May-Oct)</span>
                    <span className="font-medium">0.80x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Off Season</span>
                    <span className="font-medium">1.00x</span>
                  </div>
                  <div className="mt-4 p-2 bg-amber-50 border border-amber-100 rounded text-xs">
                    Current status: <span className="font-bold">{getPolicyEngine().getSeasonFactor() < 1 ? 'High Season Active' : 'Off Season'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Ecological Strain</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Low Strain (0-40%)</span>
                    <span className="font-medium">1.00x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Strain (40-70%)</span>
                    <span className="font-medium">0.90x</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>High Strain (&gt;70%)</span>
                    <span className="font-medium">0.80x</span>
                  </div>
                  <div className="mt-4 p-2 bg-emerald-50 border border-emerald-100 rounded text-xs">
                    Factors: Soil, Vegetation, Wildlife, Water
                  </div>
                </div>
              </div>
            </div>

            {/* Utilization Threshold */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Utilization Safeguard</h3>
                    <p className="text-xs text-gray-500">Auto-reduction when occupancy exceeds 85%</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-purple-700">0.90x Multiplier</span>
                </div>
              </div>
            </div>

            {/* Destination Status Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Active Destination Adjustments</h3>
                <div className="text-xs text-gray-500">
                  Updated {formatDateTime(new Date())}
                </div>
              </div>
              <div className="overflow-x-auto">
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
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center gap-1 ml-auto"
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
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
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
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={historyDays}
                  onChange={(e) => setHistoryDays(Number(e.target.value))}
                  className="text-sm border-gray-300 rounded-lg focus:ring-green-500 outline-none text-gray-900"
                >
                  <option value={1} className="text-gray-900">Last 24 Hours</option>
                  <option value={7} className="text-gray-900">Last 7 Days</option>
                  <option value={30} className="text-gray-900">Last 30 Days</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
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
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Mult: {Math.round(log.factors.combinedMultiplier * 100)}%
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Override Modal */}
        {isOverrideModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div 
              ref={modalRef}
              className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 id="modal-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Manual Capacity Override
                </h2>
                <button
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Close modal"
                >
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <form onSubmit={handleSetOverride} className="p-6 space-y-5">
                {overrideError && (
                  <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p>{overrideError}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="destination-select" className="block text-sm font-semibold text-gray-700 mb-1">Destination</label>
                  <select
                    id="destination-select"
                    required
                    disabled={isSavingOverride}
                    value={overrideForm.destinationId}
                    onChange={(e) => setOverrideForm({ ...overrideForm, destinationId: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none p-2 border text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="" className="text-gray-900">Select a destination...</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="multiplier-range" className="text-sm font-semibold text-gray-700">Capacity Multiplier</label>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded" id="multiplier-value">
                      {Math.round(overrideForm.multiplier * 100)}%
                    </span>
                  </div>
                  <input
                    id="multiplier-range"
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    disabled={isSavingOverride}
                    value={overrideForm.multiplier}
                    onChange={(e) => setOverrideForm({ ...overrideForm, multiplier: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 disabled:opacity-50"
                    aria-describedby="multiplier-value"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1" aria-hidden="true">
                    <span>50% (Strict)</span>
                    <span>100% (No adjustment)</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="override-reason" className="block text-sm font-semibold text-gray-700 mb-1">Justification</label>
                  <textarea
                    id="override-reason"
                    required
                    disabled={isSavingOverride}
                    placeholder="Provide reason for this override (e.g., Local festival, emergency maintenance...)"
                    value={overrideForm.reason}
                    onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none p-2 border min-h-[80px] text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="expiration-date" className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Expiration Date
                  </label>
                  <input
                    id="expiration-date"
                    type="datetime-local"
                    required
                    disabled={isSavingOverride}
                    value={overrideForm.expiresAt}
                    onChange={(e) => setOverrideForm({ ...overrideForm, expiresAt: e.target.value })}
                    className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none p-2 border text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSavingOverride}
                    onClick={() => setIsOverrideModalOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOverride}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingOverride && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {isSavingOverride ? "Applying..." : "Apply Override"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
