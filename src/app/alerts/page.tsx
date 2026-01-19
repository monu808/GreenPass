"use client";

import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
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
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Alert
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <select
                  value={formData.destinationId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      destinationId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Destinations</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
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
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Active alert
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create Alert
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Alerts Management
            </h1>
            <p className="text-gray-600">Monitor and manage system alerts</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Weather Monitoring Controls */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Cloud className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Tomorrow.io Weather API
              </span>
            </div>

            {/* Manual Refresh */}
            <button
              onClick={handleManualWeatherCheck}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              title="Check weather now and generate alerts"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Check Weather Now
            </button>

            {/* Auto-refresh toggle */}
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span>Auto-refresh</span>
            </label>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {alerts.filter((a) => a.isActive).length} active alerts
              </span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Alert
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    alerts.filter(
                      (a) => a.severity === "critical" && a.isActive
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    alerts.filter((a) => a.severity === "high" && a.isActive)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Medium</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    alerts.filter((a) => a.severity === "medium" && a.isActive)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.length}
                </p>
              </div>
            </div>
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
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="lg:w-40">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="weather">Weather</option>
                <option value="capacity">Capacity</option>
                <option value="emergency">Emergency</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="lg:w-40">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="lg:w-40">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="active">Active Only</option>
                <option value="all">All Status</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No alerts found</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
                  alert.isActive
                    ? alert.severity === "critical"
                      ? "border-l-red-500"
                      : alert.severity === "high"
                      ? "border-l-orange-500"
                      : alert.severity === "medium"
                      ? "border-l-yellow-500"
                      : "border-l-green-500"
                    : "border-l-gray-300"
                } ${!alert.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <TypeBadge type={alert.type} />
                      <SeverityBadge severity={alert.severity} />
                      {!alert.isActive && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {alert.title}
                    </h3>
                    <p className="text-gray-700 mb-3">{alert.message}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {getDestinationName(alert.destinationId)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() =>
                        handleToggleAlert(alert.id, alert.isActive)
                      }
                      className={`p-2 rounded-lg ${
                        alert.isActive
                          ? "text-red-600 hover:bg-red-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={alert.isActive ? "Deactivate" : "Activate"}
                    >
                      {alert.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
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
