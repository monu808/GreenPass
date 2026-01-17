"use client";

import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Eye,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckSquare,
  User,
  CalendarDays,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { Tourist, Destination } from "@/types";
import { formatDateTime } from "@/lib/utils";

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
      const transformedDestinations = destinationData.map((dest: any) => ({
        ...dest,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: { lat: dest.latitude, lng: dest.longitude },
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

  const handlePrintReceipt = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: black;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin: 10px 0;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .label {
            font-weight: bold;
            font-size: 12px;
            color: #555;
          }
          .value {
            font-size: 14px;
            margin-top: 2px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #333;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .status-info {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Tourist Management System</div>
          <div class="subtitle">Jammu and Himachal Pradesh Tourism</div>
          <div class="receipt-title">BOOKING RECEIPT</div>
          <div class="subtitle">Booking ID: TMS-${selectedTourist?.id
            .slice(0, 8)
            .toUpperCase()}</div>
          <div class="subtitle">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Personal Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Name</div>
              <div class="value">${selectedTourist?.name}</div>
            </div>
            <div class="info-item">
              <div class="label">Email</div>
              <div class="value">${selectedTourist?.email}</div>
            </div>
            <div class="info-item">
              <div class="label">Phone</div>
              <div class="value">${selectedTourist?.phone}</div>
            </div>
            <div class="info-item">
              <div class="label">ID Proof</div>
              <div class="value">${selectedTourist?.idProof}</div>
            </div>
            <div class="info-item">
              <div class="label">Nationality</div>
              <div class="value">${selectedTourist?.nationality}</div>
            </div>
            <div class="info-item">
              <div class="label">Group Size</div>
              <div class="value">${selectedTourist?.groupSize}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Travel Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Destination</div>
              <div class="value">${getDestinationName(
                selectedTourist?.destination || ""
              )}</div>
            </div>
            <div class="info-item">
              <div class="label">Status</div>
              <div className="value">{selectedTourist?.status ? selectedTourist.status.charAt(0).toUpperCase() + selectedTourist.status.slice(1) : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="label">Check-in Date</div>
              <div class="value">${new Date(
                selectedTourist?.checkInDate || ""
              ).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="label">Check-out Date</div>
              <div class="value">${new Date(
                selectedTourist?.checkOutDate || ""
              ).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Emergency Contact</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Contact Name</div>
              <div class="value">${selectedTourist?.emergencyContact.name}</div>
            </div>
            <div class="info-item">
              <div class="label">Contact Phone</div>
              <div class="value">${
                selectedTourist?.emergencyContact.phone
              }</div>
            </div>
            <div class="info-item">
              <div class="label">Relationship</div>
              <div class="value">${
                selectedTourist?.emergencyContact.relationship
              }</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>This is an official booking receipt issued by the Tourist Management System</div>
          <div>For inquiries, contact: support@tms-india.gov.in | +91-180-2500100</div>
          <div>Government of India | Ministry of Tourism</div>
          <div class="status-info">
            <span>Status: ${selectedTourist?.status.toUpperCase()}</span>
            <span>Valid until: ${new Date(
              selectedTourist?.checkOutDate || ""
            ).toLocaleDateString()}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
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

  const filteredTourists = tourists.filter((tourist) => {
    const matchesSearch =
      tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourist.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || tourist.status === statusFilter;
    const matchesDestination =
      destinationFilter === "all" || tourist.destination === destinationFilter;

    return matchesSearch && matchesStatus && matchesDestination;
  });

  const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
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
          <Icon className="h-6 w-6" />
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
            <StatusIcon className="h-3 w-3 mr-1" />
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
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </button>

          <div className="flex space-x-2">
            {tourist.status === "pending" && (
              <>
                <button
                  onClick={() => handleStatusUpdate(tourist.id, "approved")}
                  className="p-1 text-green-600 hover:text-green-700"
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleStatusUpdate(tourist.id, "cancelled")}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {tourist.status === "approved" && (
              <button
                onClick={() => handleStatusUpdate(tourist.id, "checked-in")}
                className="p-1 text-blue-600 hover:text-blue-700"
                title="Check In"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            )}
            {tourist.status === "checked-in" && (
              <button
                onClick={() => handleStatusUpdate(tourist.id, "checked-out")}
                className="p-1 text-gray-600 hover:text-gray-700"
                title="Check Out"
              >
                <UserX className="h-4 w-4" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Tourist & Booking Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Comprehensive management of tourist registrations and bookings
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:space-x-3 sm:gap-0">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
              <Plus className="h-4 w-4 mr-2" />
              New
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={loadData}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Tourists"
            value={stats.total}
            icon={Users}
            color="bg-blue-100 text-blue-600"
            description="All registrations"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
            description="Ready to visit"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
            description="Awaiting approval"
          />
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon={UserCheck}
            color="bg-purple-100 text-purple-600"
            description="Currently visiting"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="bg-red-100 text-red-600"
            description="Not approved"
          />
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon={CalendarDays}
            color="bg-indigo-100 text-indigo-600"
            description="Starting today"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3 flex-1">
              <div className="relative col-span-1 sm:col-span-2 lg:flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white text-gray-900"
              >
                <option value="all" className="text-gray-900">All Status</option>
                <option value="pending" className="text-gray-900">Pending</option>
                <option value="approved" className="text-gray-900">Approved</option>
                <option value="cancelled" className="text-gray-900">Cancelled</option>
                <option value="checked-in" className="text-gray-900">Checked In</option>
                <option value="checked-out" className="text-gray-900">Checked Out</option>
              </select>

              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white text-gray-900"
              >
                <option value="all" className="text-gray-900">All Destinations</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id} className="text-gray-900">
                    {dest.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <span className="text-sm text-gray-500 lg:hidden">View:</span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === "list"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === "grid"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTourists.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedTourists.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate("approved")}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate("cancelled")}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSelectedTourists([])}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors bg-white"
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
                  className="text-sm text-green-600 hover:text-green-700"
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
              <Users className="mx-auto h-12 w-12 text-gray-400" />
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
                <div className="overflow-x-auto">
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
                                <StatusIcon className="h-3 w-3 mr-1" />
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
                                  className="text-green-600 hover:text-green-900 p-1"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {tourist.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(tourist.id, "approved")
                                      }
                                      className="text-green-600 hover:text-green-900 p-1"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusUpdate(
                                          tourist.id,
                                          "cancelled"
                                        )
                                      }
                                      className="text-red-600 hover:text-red-900 p-1"
                                      title="Cancel"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  </>
                                )}

                                {tourist.status === "approved" && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(tourist.id, "checked-in")
                                    }
                                    className="text-blue-600 hover:text-blue-900 p-1"
                                    title="Check In"
                                  >
                                    <UserCheck className="h-4 w-4" />
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
                                    className="text-gray-600 hover:text-gray-900 p-1"
                                    title="Check Out"
                                  >
                                    <UserX className="h-4 w-4" />
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
              )}
            </div>
          )}
        </div>

        {/* Tourist Details Modal */}
        {showDetails && selectedTourist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-w-none print:rounded-none print:shadow-none print:max-h-none print:overflow-visible">
              <div className="p-6 print:p-8">
                {/* Screen-only content */}
                <div className="print:hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Tourist Details
                    </h2>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.name}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.email}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.phone}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            ID Proof
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.idProof}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nationality
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.nationality}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Group Size
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.groupSize}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Travel Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Destination
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {getDestinationName(selectedTourist.destination)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              selectedTourist.status
                            )}`}
                          >
                            {selectedTourist.status.charAt(0).toUpperCase() +
                              selectedTourist.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Check-in Date
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(
                              selectedTourist.checkInDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Check-out Date
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(
                              selectedTourist.checkOutDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Emergency Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Contact Name
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.emergencyContact.name}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Contact Phone
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.emergencyContact.phone}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Relationship
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTourist.emergencyContact.relationship}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowDetails(false)}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      >
                        Close
                      </button>
                      <button
                        onClick={handlePrintReceipt}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Print Receipt
                      </button>
                      {selectedTourist.status === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              handleStatusUpdate(
                                selectedTourist.id,
                                "approved"
                              );
                              setShowDetails(false);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              handleStatusUpdate(
                                selectedTourist.id,
                                "cancelled"
                              );
                              setShowDetails(false);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
