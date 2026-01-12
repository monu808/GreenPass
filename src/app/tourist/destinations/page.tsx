"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Star,
  Users,
  Heart,
  Camera,
  Calendar,
  Navigation,
} from "lucide-react";
import TouristLayout from "@/components/TouristLayout";
import { dbService } from "@/lib/databaseService";
import { Destination } from "@/types";

export default function TouristDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<
    Destination[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "available" | "popular"
  >("all");

  const filterDestinations = useCallback(() => {
    let filtered = destinations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (dest) =>
          dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dest.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case "available":
        filtered = filtered.filter(
          (dest) => dest.currentOccupancy < dest.maxCapacity * 0.8
        );
        break;
      case "popular":
        filtered = filtered.filter(
          (dest) => dest.currentOccupancy > dest.maxCapacity * 0.5
        );
        break;
    }

    setFilteredDestinations(filtered);
  }, [destinations, searchTerm, selectedFilter]);

  const loadDestinations = async () => {
    try {
      const destinationsData = await dbService.getDestinations();

      const transformedDestinations = destinationsData.map((dest) => ({
        id: dest.id,
        name: dest.name,
        location: dest.location,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        description: dest.description,
        guidelines: dest.guidelines,
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: {
          latitude: dest.latitude,
          longitude: dest.longitude,
        },
      }));

      setDestinations(transformedDestinations.filter((dest) => dest.isActive));
    } catch (error) {
      console.error("Error loading destinations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  useEffect(() => {
    filterDestinations();
  }, [filterDestinations]);

  const getAvailabilityStatus = (destination: Destination) => {
    const occupancyRate =
      destination.currentOccupancy / destination.maxCapacity;
    if (occupancyRate < 0.6)
      return {
        text: "Great Availability",
        color: "text-green-600 bg-green-100",
      };
    if (occupancyRate < 0.8)
      return { text: "Limited Spots", color: "text-yellow-600 bg-yellow-100" };
    return { text: "Almost Full", color: "text-red-600 bg-red-100" };
  };

  const getEcoSensitivityIcon = (level: string) => {
    switch (level) {
      case "low":
        return "🌱";
      case "medium":
        return "🍃";
      case "high":
        return "🌿";
      case "critical":
        return "🌲";
      default:
        return "🌱";
    }
  };

  const DestinationCard = ({ destination }: { destination: Destination }) => {
    const availability = getAvailabilityStatus(destination);

    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image Placeholder with Gradient */}
        <div className="h-56 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <button className="bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all">
              <Heart className="h-4 w-4 text-gray-600" />
            </button>
            <button className="bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all">
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${availability.color}`}
            >
              {availability.text}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {destination.name}
              </h3>
              <p className="text-gray-600 flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {destination.location}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">
                  4.{Math.floor(Math.random() * 5) + 3}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {getEcoSensitivityIcon(destination.ecologicalSensitivity)}{" "}
                Eco-friendly
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {destination.description}
          </p>

          {/* Capacity Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>
                {destination.currentOccupancy}/{destination.maxCapacity}{" "}
                visitors
              </span>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  destination.currentOccupancy / destination.maxCapacity < 0.6
                    ? "bg-green-500"
                    : destination.currentOccupancy / destination.maxCapacity <
                      0.8
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${
                    (destination.currentOccupancy / destination.maxCapacity) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() =>
                (window.location.href = `/tourist/book?destination=${destination.id}`)
              }
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-colors flex items-center justify-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Now
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TouristLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Destinations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the breathtaking beauty of Jammu & Himachal Pradesh. From
            snow-capped mountains to serene valleys.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search destinations, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              {[
                { key: "all", label: "All Places" },
                { key: "available", label: "Available" },
                { key: "popular", label: "Popular" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    selectedFilter === filter.key
                      ? "bg-gradient-to-r from-green-600 to-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredDestinations.length} destination
            {filteredDestinations.length !== 1 ? "s" : ""} found
          </p>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Sort by Popularity</option>
            <option>Sort by Availability</option>
            <option>Sort by Name</option>
          </select>
        </div>

        {/* Destinations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDestinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}

        {filteredDestinations.length === 0 && !loading && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No destinations found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </TouristLayout>
  );
}
