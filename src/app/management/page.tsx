"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/Layout";
import { useModalAccessibility } from "@/lib/accessibility";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Eye,
  Plus,
  Download,
  RefreshCw,
  CheckSquare,
  User,
  CalendarDays,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { Tourist, Destination } from "@/types";
import { Database } from "@/types/database";
import { 
  formatDateTime,
  sanitizeSearchTerm,
  sanitizeInput 
} from "@/lib/utils";
import { 
  validateInput, 
  SearchFilterSchema 
} from "@/lib/validation";
import { DataFetchErrorBoundary } from "@/components/errors";

type DbDestination = Database["public"]["Tables"]["destinations"]["Row"];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}

export default function TouristBookingManagement() {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar">(
    "list"
  );
  const [selectedTourists, setSelectedTourists] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    checkedIn: 0,
    rejected: 0,
    todayBookings: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const dbService = getDbService();
      const [touristData, destinationData] = await Promise.all([
        dbService.getTourists(),
        dbService.getDestinations(),
      ]);
      setTourists(touristData);
      // Transform database properties to component interface
      const transformedDestinations = destinationData.map((dest: DbDestination) => ({
        ...dest,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: { latitude: dest.latitude, longitude: dest.longitude },
      }));
      setDestinations(transformedDestinations);
      calculateStats(touristData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateStats = (touristData: Tourist[]) => {
    const today = new Date().toISOString().split("T")[0];

    setStats({
      total: touristData.length,
      approved: touristData.filter((t) => t.status === "approved").length,
      pending: touristData.filter((t) => t.status === "pending").length,
      checkedIn: touristData.filter((t) => t.status === "checked-in").length,
      rejected: touristData.filter((t) => t.status === "cancelled").length,
      todayBookings: touristData.filter(
        (t) =>
          t.checkInDate &&
          new Date(t.checkInDate).toISOString().startsWith(today)
      ).length,
    });
  };

  const handleStatusUpdate = async (
    touristId: string,
    newStatus: Tourist["status"]
  ) => {
    try {
      const dbService = getDbService();
      await dbService.updateTouristStatus(touristId, newStatus);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Error updating tourist status:", error);
    }
  };

  const handleBulkStatusUpdate = async (status: Tourist["status"]) => {
    try {
      const dbService = getDbService();
      await Promise.all(
        selectedTourists.map((id) => dbService.updateTouristStatus(id, status))
      );
      setSelectedTourists([]);
      await loadData();
    } catch (error) {
      console.error("Error updating bulk status:", error);
    }
  };

  const handlePrintReceipt = async () => {
    if (!selectedTourist) return;

    try {
      const response = await fetch("/api/print-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tourist: selectedTourist,
          destinationName: getDestinationName(selectedTourist.destination || ""),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate receipt");
      }

      const printContent = await response.text();

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("Failed to generate print receipt. Please try again.");
    }
  };

  const getDestinationName = (destinationId: string) => {
    const dest = destinations.find((d) => d.id === destinationId);
    return dest ? dest.name : "Unknown";
  };

  const getStatusColor = (status: Tourist["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "checked-out":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Tourist["status"]) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "pending":
        return Clock;
      case "cancelled":
        return XCircle;
      case "checked-in":
        return UserCheck;
      case "checked-out":
        return UserX;
      default:
        return User;
    }
  };

  const sanitizedSearch = sanitizeSearchTerm(searchTerm);
  
  const filterValidation = validateInput(SearchFilterSchema, {
    searchTerm: sanitizedSearch,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    destinationId: destinationFilter === "all" ? undefined : destinationFilter,
  });

  const validFilters = filterValidation.success ? filterValidation.data : { 
    searchTerm: sanitizedSearch, 
    status: statusFilter === "all" ? undefined : statusFilter as any, 
    destinationId: destinationFilter === "all" ? undefined : destinationFilter 
  };

  const filteredTourists = tourists.filter((tourist) => {
    const matchesSearch =
      tourist.name.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
      tourist.email.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
      tourist.phone.includes(validFilters.searchTerm || "");
    const matchesStatus =
      statusFilter === "all" || tourist.status === validFilters.status;
    const matchesDestination =
      destinationFilter === "all" || tourist.destination === validFilters.destinationId;
    return matchesSearch && matchesStatus && matchesDestination;
  });

  const StatCard = ({ title, value, icon: Icon, color, description }: StatCardProps) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  const TouristCard = ({ tourist }: { tourist: Tourist }) => {
    const StatusIcon = getStatusIcon(tourist.status);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedTourists.includes(tourist.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedTourists([...selectedTourists, tourist.id]);
                } else {
                  setSelectedTourists(
                    selectedTourists.filter((id) => id !== tourist.id)
                  );
                }
              }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              aria-label={`Select ${tourist.name}`}
            />
            <div>
              <h3 className="font-semibold text-gray-900">{tourist.name}</h3>
              <p className="text-sm text-gray-600">{tourist.email}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              tourist.status
            )}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" aria-hidden="true" />
            {tourist.status.charAt(0).toUpperCase() + tourist.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium">
              {getDestinationName(tourist.destination)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Group Size</p>
            <p className="text-sm font-medium">{tourist.groupSize}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Check-in</p>
            <p className="text-sm font-medium">
              {new Date(tourist.checkInDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Check-out</p>
            <p className="text-sm font-medium">
              {new Date(tourist.checkOutDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedTourist(tourist);
              setShowDetails(true);
            }}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center min-h-[44px]"
            aria-label={`View details for ${tourist.name}`}
          >
            <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
            View Details
          </button>

          <div className="flex space-x-2">
            {tourist.status === "pending" && (
              <>
                <button
                  onClick={() => handleStatusUpdate(tourist.id, "approved")}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  title="Approve"
                  aria-label={`Approve ${tourist.name}`}
                >
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleStatusUpdate(tourist.id, "cancelled")}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Reject"
                  aria-label={`Reject ${tourist.name}`}
                >
                  <XCircle className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
            {tourist.status === "approved" && (
              <button
                onClick={() => handleStatusUpdate(tourist.id, "checked-in")}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Check In"
                aria-label={`Check in ${tourist.name}`}
              >
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            {tourist.status === "checked-in" && (
              <button
                onClick={() => handleStatusUpdate(tourist.id, "checked-out")}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Check Out"
                aria-label={`Check out ${tourist.name}`}
              >
                <UserX className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading management data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <DataFetchErrorBoundary onRetry={loadData}>
        <div className="space-y-6">
          {/* Stats Grid */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Tourist Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage registrations and visitor flow
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all min-h-[44px] shadow-sm active:scale-[0.98] font-bold text-sm">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Registration
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all min-h-[44px] font-bold text-sm text-gray-700">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </button>
            <button
              onClick={loadData}
              className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={Users}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="Active"
            value={stats.checkedIn}
            icon={UserCheck}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title="Today"
            value={stats.todayBookings}
            icon={CalendarDays}
            color="bg-indigo-100 text-indigo-600"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <label htmlFor="search-tourists" className="sr-only">Search tourists</label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                <input
                  id="search-tourists"
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-3">
              <div className="flex-1 lg:w-44">
                <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-h-[44px] bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="checked-in">Checked In</option>
                  <option value="checked-out">Checked Out</option>
                </select>
              </div>

              <div className="flex-1 lg:w-44">
                <label htmlFor="destination-filter" className="sr-only">Filter by destination</label>
                <select
                  id="destination-filter"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-h-[44px] bg-white"
                >
                  <option value="all">All Destinations</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 lg:w-auto flex border border-gray-300 rounded-xl overflow-hidden min-h-[44px]">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 px-4 py-2 text-sm font-bold transition-all ${
                    viewMode === "list"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 px-4 py-2 text-sm font-bold transition-all ${
                    viewMode === "grid"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTourists.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedTourists.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate("approved")}
                    className="px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all min-h-[44px] shadow-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate("cancelled")}
                    className="px-4 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all min-h-[44px] shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSelectedTourists([])}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all min-h-[44px] bg-white"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Tourist Records ({filteredTourists.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const allIds = filteredTourists.map((t) => t.id);
                    setSelectedTourists(
                      selectedTourists.length === allIds.length ? [] : allIds
                    );
                  }}
                  className="text-sm text-green-600 hover:text-green-700 font-bold min-h-[44px] px-4 rounded-lg hover:bg-green-50 transition-colors"
                >
                  {selectedTourists.length === filteredTourists.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
            </div>
          </div>

          {filteredTourists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tourists found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div
              className={`p-6 ${
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }`}
            >
              {viewMode === "grid" ? (
                filteredTourists.map((tourist) => (
                  <TouristCard key={tourist.id} tourist={tourist} />
                ))
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={
                                selectedTourists.length ===
                                filteredTourists.length
                              }
                              onChange={(e) => {
                                const allIds = filteredTourists.map((t) => t.id);
                                setSelectedTourists(
                                  e.target.checked ? allIds : []
                                );
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              aria-label="Select all tourists"
                            />
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tourist
                          </th>
                          <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Destination
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dates
                          </th>
                          <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTourists.map((tourist) => {
                          const StatusIcon = getStatusIcon(tourist.status);
                          return (
                            <tr key={tourist.id} className="hover:bg-gray-50">
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedTourists.includes(tourist.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTourists([
                                        ...selectedTourists,
                                        tourist.id,
                                      ]);
                                    } else {
                                      setSelectedTourists(
                                        selectedTourists.filter(
                                          (id) => id !== tourist.id
                                        )
                                      );
                                    }
                                  }}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  aria-label={`Select ${tourist.name}`}
                                />
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {tourist.name}
                                    </div>
                                    <div className="hidden sm:block text-xs text-gray-500">
                                      {tourist.email}
                                    </div>
                                    <div className="block sm:hidden text-xs font-medium text-green-600">
                                      {tourist.status}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {getDestinationName(tourist.destination)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Group: {tourist.groupSize}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <span className="w-8 sm:w-auto text-gray-400 mr-1 sm:mr-0 sm:hidden">In:</span>
                                    {new Date(
                                      tourist.checkInDate
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-8 sm:w-auto text-gray-400 mr-1 sm:mr-0 sm:hidden">Out:</span>
                                    {new Date(
                                      tourist.checkOutDate
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </td>
                              <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                    tourist.status
                                  )}`}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                                  {tourist.status.charAt(0).toUpperCase() +
                                    tourist.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <button
                                    onClick={() => {
                                      setSelectedTourist(tourist);
                                      setShowDetails(true);
                                    }}
                                    className="flex items-center justify-center min-h-[44px] min-w-[44px] text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                    aria-label={`View details for ${tourist.name}`}
                                  >
                                    <Eye className="h-5 w-5" aria-hidden="true" />
                                  </button>

                                  {tourist.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleStatusUpdate(tourist.id, "approved")
                                        }
                                        className="flex items-center justify-center min-h-[44px] min-w-[44px] text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Approve"
                                        aria-label={`Approve ${tourist.name}`}
                                      >
                                        <CheckCircle className="h-5 w-5" aria-hidden="true" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleStatusUpdate(
                                            tourist.id,
                                            "cancelled"
                                          )
                                        }
                                        className="flex items-center justify-center min-h-[44px] min-w-[44px] text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Cancel"
                                        aria-label={`Reject ${tourist.name}`}
                                      >
                                        <XCircle className="h-5 w-5" aria-hidden="true" />
                                      </button>
                                    </>
                                  )}

                                  {tourist.status === "approved" && (
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(tourist.id, "checked-in")
                                      }
                                      className="flex items-center justify-center min-h-[44px] min-w-[44px] text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Check In"
                                      aria-label={`Check in ${tourist.name}`}
                                    >
                                      <UserCheck className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                  )}

                                  {tourist.status === "checked-in" && (
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          tourist.id,
                                          "checked-out"
                                        )
                                      }
                                      className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                      title="Check Out"
                                      aria-label={`Check out ${tourist.name}`}
                                    >
                                      <UserX className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:hidden space-y-4">
                    {filteredTourists.map((tourist) => (
                      <TouristCard key={tourist.id} tourist={tourist} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tourist Details Modal */}
        {showDetails && selectedTourist && (
          <TouristDetailsModal 
            selectedTourist={selectedTourist} 
            onClose={() => setShowDetails(false)} 
            getDestinationName={getDestinationName}
            getStatusColor={getStatusColor}
            handlePrintReceipt={handlePrintReceipt}
          />
        )}
      </div>
      </DataFetchErrorBoundary>
    </Layout>
  );
}

const TouristDetailsModal = ({ 
  selectedTourist, 
  onClose, 
  getDestinationName,
  getStatusColor,
  handlePrintReceipt
}: { 
  selectedTourist: Tourist; 
  onClose: () => void;
  getDestinationName: (id: string) => string;
  getStatusColor: (status: Tourist["status"]) => string;
  handlePrintReceipt: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ modalRef, isOpen: true, onClose });

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300 print:max-w-none print:rounded-none print:shadow-none print:max-h-none print:overflow-visible"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">
            Tourist Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close details"
          >
            <span aria-hidden="true" className="text-2xl">×</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 sm:p-8">
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-1 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-2xl">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Name
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.name}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Email
                </span>
                <p className="text-sm font-semibold text-gray-900 break-all">
                  {selectedTourist.email}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phone
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.phone}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  ID Proof
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.idProof}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Nationality
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.nationality}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Group Size
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.groupSize} People
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900">
                Travel Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Destination
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {getDestinationName(selectedTourist.destination)}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Status
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(
                    selectedTourist.status
                  )}`}
                >
                  {selectedTourist.status}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Check-in Date
                </span>
                <div className="flex items-center text-sm font-semibold text-gray-900">
                  <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                  {new Date(selectedTourist.checkInDate).toLocaleDateString(undefined, {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Check-out Date
                </span>
                <div className="flex items-center text-sm font-semibold text-gray-900">
                  <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                  {new Date(selectedTourist.checkOutDate).toLocaleDateString(undefined, {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-1 bg-orange-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900">
                Emergency Contact
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-orange-50/30 p-4 rounded-2xl border border-orange-100/50">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Contact Name
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.emergencyContact.name}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Contact Phone
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.emergencyContact.phone}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Relationship
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTourist.emergencyContact.relationship}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-bold text-sm min-h-[44px]"
          >
            Close
          </button>
          <button
            onClick={handlePrintReceipt}
            className="flex-[2] px-6 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm flex items-center justify-center min-h-[44px] shadow-lg shadow-green-200"
          >
            <Download className="h-5 w-5 mr-2" aria-hidden="true" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
