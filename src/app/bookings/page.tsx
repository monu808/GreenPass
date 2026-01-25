"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  Calendar,
  Search,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { Tourist, Destination } from "@/types";
import type { Database } from "@/types/database";
import { sanitizeSearchTerm } from "@/lib/utils";
import { validateInput, SearchFilterSchema } from "@/lib/validation";

type DbDestination = Database['public']['Tables']['destinations']['Row'];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Tourist[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const dbService = getDbService();
      const [touristData, destinationData] = await Promise.all([
        dbService.getTourists(),
        dbService.getDestinations(),
      ]);
      setBookings(touristData);
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
    } catch (error) {
      console.error("Error loading bookings data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewBooking = (bookingId: string) => {
    router.push(`/management?id=${bookingId}`);
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const dbService = getDbService();
      await dbService.updateTouristStatus(bookingId, "approved");
      // Optimistic update
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "approved" } : b))
      );
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking. Please try again.");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const dbService = getDbService();
      await dbService.updateTouristStatus(bookingId, "cancelled");
      // Optimistic update
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const getDestinationName = (destinationId: string) => {
    const dest = destinations.find((d) => d.id === destinationId);
    return dest ? dest.name : "Unknown";
  };

  const filteredBookings = bookings.filter((booking) => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      destinationId: destinationFilter === "all" ? undefined : destinationFilter,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "", status: undefined, destinationId: undefined };

    const matchesSearch =
      booking.name.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
      booking.email.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
      booking.phone.includes(validFilters.searchTerm || "");
    const matchesStatus =
      statusFilter === "all" || booking.status === validFilters.status;
    const matchesDestination =
      destinationFilter === "all" || booking.destination === validFilters.destinationId;
    return matchesSearch && matchesStatus && matchesDestination;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "approved":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "checked-in":
        return "text-green-600 bg-green-50 border-green-200";
      case "checked-out":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "checked-in":
        return <CheckCircle className="h-4 w-4" />;
      case "checked-out":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {getStatusIcon(status)}
      <span className="ml-1 capitalize">{status.replace("-", " ")}</span>
    </span>
  );

  const formatDateRange = (checkIn: Date, checkOut: Date) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)
    );
    return `${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()} (${nights} nights)`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Bookings Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage tourist bookings and reservations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{filteredBookings.length} bookings</span>
            </div>
            <button className="flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="text-sm font-medium">New Booking</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === "approved").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === "checked-in").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" aria-hidden="true" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === "checked-out").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <label htmlFor="search-bookings" className="sr-only">Search bookings</label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
                <input
                  id="search-bookings"
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4">
              <div className="lg:w-48">
                <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="checked-in">Checked In</option>
                  <option value="checked-out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="lg:w-48">
                <label htmlFor="destination-filter" className="sr-only">Filter by destination</label>
                <select
                  id="destination-filter"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Destinations</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List/Table */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden" role="region" aria-label="Bookings list">
          {loading ? (
            <div className="p-8 text-center" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center" role="status" aria-live="polite">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-600 text-sm">No bookings found</p>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Booking Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" aria-hidden="true" />
                            {getDestinationName(booking.destination)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDateRange(
                              booking.checkInDate,
                              booking.checkOutDate
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 text-gray-400 mr-2" aria-hidden="true" />
                            {booking.groupSize}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(booking.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewBooking(booking.id)}
                              className="text-green-600 hover:text-green-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-green-50"
                              title="View Details"
                              aria-label="View booking"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {booking.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApproveBooking(booking.id)}
                                  className="text-blue-600 hover:text-blue-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-blue-50"
                                  title="Approve Booking"
                                  aria-label="Approve booking"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-red-600 hover:text-red-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50"
                                  title="Cancel Booking"
                                  aria-label="Cancel booking"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{booking.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{booking.email}</p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                        <span className="truncate">{getDestinationName(booking.destination)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                        {booking.groupSize} members
                      </div>
                      <div className="col-span-2 flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                        {formatDateRange(booking.checkInDate, booking.checkOutDate)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => handleViewBooking(booking.id)}
                        className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-semibold text-green-700 bg-green-50 border border-green-100 px-4 py-2 rounded-xl active:bg-green-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </button>
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveBooking(booking.id)}
                            className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl active:bg-blue-100 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-semibold text-red-700 bg-red-50 border border-red-100 px-4 py-2 rounded-xl active:bg-red-100 transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
