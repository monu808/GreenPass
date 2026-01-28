"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import { useModalAccessibility } from "@/lib/accessibility";
import {
  AlertTriangle,
  Search,
  Plus,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Cloud,
  Users,
  Settings,
  Zap,
  RefreshCw,
  Leaf,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { weatherMonitoringService } from "@/lib/weatherMonitoringService";
import { Alert, Destination, WeatherCheckResult } from "@/types";
import { Database } from "@/types/database";
import { sanitizeSearchTerm } from "@/lib/utils";
import { validateInput, AlertFilterSchema } from "@/lib/validation";

type DbDestination = Database["public"]["Tables"]["destinations"]["Row"];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active"); // Show only active alerts by default
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setIsMonitoring] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [weatherResult, setWeatherResult] = useState<WeatherCheckResult | null>(null);

  // Helper function to transform database destination data (snake_case) to frontend Destination type (camelCase)
  const transformDestinationData = (dest: DbDestination): Destination => {
    return {
      id: dest.id,
      name: dest.name,
      location: dest.location,
      maxCapacity: dest.max_capacity,
      currentOccupancy: dest.current_occupancy,
      description: dest.description || "",
      guidelines: dest.guidelines || [],
      isActive: dest.is_active,
      ecologicalSensitivity: dest.ecological_sensitivity,
      coordinates: {
        latitude: Number(dest.latitude),
        longitude: Number(dest.longitude),
      },
      sustainabilityFeatures: dest.sustainability_features || undefined,
    };
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const dbService = getDbService();
      const [regularAlerts, weatherAlerts, destinationsData] =
        await Promise.all([
          dbService.getAlerts(), // Get non-weather alerts from alerts table
          dbService.getWeatherAlerts(), // Get weather alerts from weather_data table
          dbService.getDestinations(),
        ]);

      // Combine regular alerts and weather alerts
      const allAlerts = [...regularAlerts, ...weatherAlerts];
      setDestinations(destinationsData.map(transformDestinationData));

      // Remove duplicate alerts based on title, message, destination, and type
      const uniqueAlerts = allAlerts.filter((alert, index, self) => {
        // Keep only the most recent alert for each unique combination
        const duplicateIndex = self.findIndex(
          (a) =>
            a.title === alert.title &&
            a.message === alert.message &&
            a.destinationId === alert.destinationId &&
            a.type === alert.type
        );
        return duplicateIndex === index; // Keep the first occurrence (most recent due to order by created_at desc)
      });

      const duplicatesRemoved = allAlerts.length - uniqueAlerts.length;
      if (duplicatesRemoved > 0) {
        console.log(
          `🧹 Removed ${duplicatesRemoved} duplicate alerts from display`
        );
      }

      setAlerts(uniqueAlerts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading alerts data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Set up auto-refresh every 30 seconds for alerts page
    const refreshInterval = setInterval(() => {
      if (autoRefresh) {
        loadData();
      }
    }, 30000); // 30 seconds

    // Check monitoring status
    setIsMonitoring(weatherMonitoringService.isRunning);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [autoRefresh, loadData]);

  const handleManualWeatherCheck = async () => {
    try {
      setLoading(true);
      setWeatherResult(null);
      console.log("🔄 Triggering server-side weather check...");

      const response = await fetch("/api/weather-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      setWeatherResult(result);

      if (result.success) {
        console.log("✅ Weather check completed:", result.message);
        await loadData(); // Refresh alerts
      } else {
        console.error("❌ Weather check failed:", result.error);
        alert("Weather check failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Error in manual weather check:", error);
      setWeatherResult({
        success: false,
        error: "Failed to connect to weather API",
        timestamp: new Date().toISOString(),
      });
      alert("Failed to check weather. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const dbService = getDbService();
      await dbService.updateAlert(alertId, { isActive: !isActive });
      await loadData(); // Reload data
    } catch (error) {
      console.error("Error toggling alert:", error);
      alert("Failed to update alert. Please try again.");
    }
  };

  const getDestinationName = (destinationId?: string) => {
    if (!destinationId) return "All Destinations";
    const dest = destinations.find((d) => d.id === destinationId);
    return dest ? dest.name : "Unknown";
  };

  const filteredAlerts = alerts.filter((alert) => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(AlertFilterSchema, {
      searchTerm: sanitizedSearch,
      type: typeFilter === "all" ? undefined : typeFilter as Alert["type"],
      severity: severityFilter === "all" ? undefined : severityFilter as Alert["severity"],
    });

    const validFilters = filterValidation.success 
      ? filterValidation.data 
      : { searchTerm: "", type: undefined, severity: undefined };

    const matchesSearch =
      alert.title.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
      alert.message.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "");
    
    const matchesType = typeFilter === "all" || alert.type === validFilters.type;
    const matchesSeverity =
      severityFilter === "all" || alert.severity === validFilters.severity;
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && alert.isActive) ||
      (activeFilter === "inactive" && !alert.isActive);
    return matchesSearch && matchesType && matchesSeverity && matchesActive;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <Cloud className="h-4 w-4" />;
      case "capacity":
        return <Users className="h-4 w-4" />;
      case "emergency":
        return <Zap className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      case "ecological":
        return <Leaf className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const SeverityBadge = ({ severity }: { severity: string }) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(
        severity
      )}`}
    >
      {severity.toUpperCase()}
    </span>
  );

  const TypeBadge = ({ type }: { type: string }) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200">
      {getTypeIcon(type)}
      <span className="ml-1 capitalize">{type}</span>
    </span>
  );

  const CreateAlertModal = ({ onClose }: { onClose: () => void }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useModalAccessibility({ modalRef, isOpen: true, onClose });

    const [formData, setFormData] = useState({
      type: "weather",
      title: "",
      message: "",
      severity: "medium",
      destinationId: "",
      isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const dbService = getDbService();
        await dbService.addAlert({
          type: formData.type as Alert["type"],
          title: formData.title,
          message: formData.message,
          severity: formData.severity as Alert["severity"],
          destinationId: formData.destinationId || undefined,
          isActive: formData.isActive,
        });
        await loadData();
        onClose();
      } catch (error) {
        console.error("Error creating alert:", error);
        alert("Failed to create alert. Please try again.");
      }
    };

    return (
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-alert-title"
      >
        <div 
          ref={modalRef}
          className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
            <h2 id="create-alert-title" className="text-xl font-bold text-gray-900">
              Create New Alert
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <span aria-hidden="true" className="text-2xl">×</span>
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <form id="create-alert-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="alert-type" className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  id="alert-type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base min-h-[44px]"
                  required
                >
                  <option value="weather">Weather</option>
                  <option value="capacity">Capacity</option>
                  <option value="emergency">Emergency</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="ecological">Ecological</option>
                </select>
              </div>

              <div>
                <label htmlFor="alert-title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  id="alert-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Heavy Rain Warning"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="alert-message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="alert-message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Provide details about the alert..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="alert-severity" className="block text-sm font-semibold text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    id="alert-severity"
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base min-h-[44px]"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="alert-destination" className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination
                  </label>
                  <select
                    id="alert-destination"
                    value={formData.destinationId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destinationId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base min-h-[44px]"
                  >
                    <option value="">All Destinations</option>
                    {destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="isActive"
                  className="ml-3 text-sm font-medium text-gray-700 select-none cursor-pointer"
                >
                  Active alert (visible to users)
                </label>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 mt-auto flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              form="create-alert-form"
              className="flex-1 min-h-[48px] px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-[0.98]"
            >
              Create Alert
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] px-6 py-3 bg-white text-gray-700 font-bold border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Alerts Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Monitor and manage system alerts</p>
            {lastUpdated && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Manual Refresh */}
            <button
              onClick={handleManualWeatherCheck}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all min-h-[44px] shadow-sm active:scale-[0.98]"
              title="Check weather now and generate alerts"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-semibold">Check Weather</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all min-h-[44px] shadow-sm active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">New Alert</span>
            </button>
          </div>
        </div>

        {/* Status & Monitoring Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 rounded-full border border-blue-200">
            <Cloud className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Weather Monitoring Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span>Auto-refresh</span>
            </label>

            <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 border-l border-gray-300 pl-4">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>
                {alerts.filter((a) => a.isActive).length} Active
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="p-2 bg-red-50 rounded-xl mb-3">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Critical</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {alerts.filter((a) => a.severity === "critical" && a.isActive).length}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="p-2 bg-orange-50 rounded-xl mb-3">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">High</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {alerts.filter((a) => a.severity === "high" && a.isActive).length}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="p-2 bg-yellow-50 rounded-xl mb-3">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Medium</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {alerts.filter((a) => a.severity === "medium" && a.isActive).length}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="p-2 bg-green-50 rounded-xl mb-3">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Alerts</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {alerts.length}
            </p>
          </div>
        </div>

        {/* Weather Check Results */}
        {weatherResult && (
          <div
            className={`p-4 rounded-lg border ${
              weatherResult.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start">
              {weatherResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    weatherResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  Weather Check {weatherResult.success ? "Completed" : "Failed"}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    weatherResult.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {weatherResult.success
                    ? weatherResult.message
                    : weatherResult.error}
                </p>
                {weatherResult.success && (
                  <div className="mt-2 text-sm text-green-600">
                    <p>• Destinations checked: {weatherResult.destinations}</p>
                    <p>• Alerts generated: {weatherResult.alertsGenerated}</p>
                    {weatherResult.alerts &&
                      weatherResult.alerts.length > 0 && (
                        <div className="mt-1">
                          <p>• New alerts:</p>
                          <ul className="ml-4 list-disc">
                            {weatherResult.alerts.map(
                              (alert, index: number) => (
                                <li key={index} className="text-xs">
                                  {alert.destination} -{" "}
                                  {alert.severity.toUpperCase()}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(weatherResult.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setWeatherResult(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close weather check results"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <label htmlFor="search-alerts" className="sr-only">Search alerts by title or message</label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                <input
                  id="search-alerts"
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base min-h-[44px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-3">
              <div className="flex-1 lg:w-40">
                <label htmlFor="type-filter" className="sr-only">Filter by alert type</label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-h-[44px]"
                >
                  <option value="all">All Types</option>
                  <option value="weather">Weather</option>
                  <option value="capacity">Capacity</option>
                  <option value="emergency">Emergency</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex-1 lg:w-40">
                <label htmlFor="severity-filter" className="sr-only">Filter by severity</label>
                <select
                  id="severity-filter"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-h-[44px]"
                >
                  <option value="all">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-span-2 lg:w-40">
                <label htmlFor="active-filter" className="sr-only">Filter by active status</label>
                <select
                  id="active-filter"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-h-[44px]"
                >
                  <option value="active">Active Only</option>
                  <option value="all">All Status</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
              <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No alerts found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl shadow-sm border-l-8 overflow-hidden transition-all hover:shadow-md ${
                  alert.isActive
                    ? alert.severity === "critical"
                      ? "border-l-red-500"
                      : alert.severity === "high"
                      ? "border-l-orange-500"
                      : alert.severity === "medium"
                      ? "border-l-yellow-500"
                      : "border-l-green-500"
                    : "border-l-gray-300 opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start p-5 sm:p-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <TypeBadge type={alert.type} />
                      <SeverityBadge severity={alert.severity} />
                      {!alert.isActive && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                      {alert.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 font-medium">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                        {getDestinationName(alert.destinationId)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {new Date(alert.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-5 sm:mt-0 sm:ml-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                    <button
                      onClick={() =>
                        handleToggleAlert(alert.id, alert.isActive)
                      }
                      className={`flex-1 sm:flex-none flex items-center justify-center p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] ${
                        alert.isActive
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-green-600 bg-green-50 hover:bg-green-100"
                      }`}
                      title={alert.isActive ? "Deactivate" : "Activate"}
                      aria-label={alert.isActive ? `Deactivate alert: ${alert.title}` : `Activate alert: ${alert.title}`}
                    >
                      {alert.isActive ? (
                        <XCircle className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <CheckCircle className="h-5 w-5" aria-hidden="true" />
                      )}
                      <span className="sm:hidden ml-2 font-bold text-sm">
                        {alert.isActive ? "Deactivate" : "Activate"}
                      </span>
                    </button>
                    <button
                      className="flex-1 sm:flex-none flex items-center justify-center p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all min-h-[44px] min-w-[44px]"
                      title="Edit"
                      aria-label={`Edit alert: ${alert.title}`}
                    >
                      <Edit className="h-5 w-5" aria-hidden="true" />
                      <span className="sm:hidden ml-2 font-bold text-sm">Edit</span>
                    </button>
                    <button
                      className="flex-1 sm:flex-none flex items-center justify-center p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all min-h-[44px] min-w-[44px]"
                      title="Delete"
                      aria-label={`Delete alert: ${alert.title}`}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                      <span className="sm:hidden ml-2 font-bold text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Alert Modal */}
        {showCreateModal && (
          <CreateAlertModal onClose={() => setShowCreateModal(false)} />
        )}
      </div>
    </Layout>
  );
}
