'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { dbService } from '@/lib/databaseService';
import { getCapacityStatus, getEcologicalSensitivityColor } from '@/lib/utils';
import type { Database } from '@/types/database';

type Destination = Database['public']['Tables']['destinations']['Row'];

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await dbService.getDestinations();
        setDestinations(data);
      } catch (error) {
        console.error('Error loading destinations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, []);

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading destinations...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
            <p className="text-gray-600">Manage and monitor tourist destinations in Jammu & Himachal Pradesh</p>
          </div>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {destinations.map((destination) => {
              const currentOccupancy = destination.current_occupancy;
              const availableCapacity = destination.max_capacity - currentOccupancy;
              const capacity = getCapacityStatus(currentOccupancy, destination.max_capacity);
            
            return (
              <div key={destination.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{destination.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEcologicalSensitivityColor(destination.ecological_sensitivity)}`}>
                          {destination.ecological_sensitivity} sensitivity
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {destination.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {destination.is_active ? (
                        <span className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 text-sm">
                          <XCircle className="h-4 w-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 text-sm mb-4">{destination.description}</p>

                  {/* Capacity Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Capacity Utilization</span>
                      <span className="text-sm text-gray-900">
                        {currentOccupancy} / {destination.max_capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          capacity.status === 'full' ? 'bg-red-500' :
                          capacity.status === 'high' ? 'bg-orange-500' :
                          capacity.status === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${capacity.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span className={`font-medium ${
                        capacity.status === 'full' ? 'text-red-600' :
                        capacity.status === 'high' ? 'text-orange-600' :
                        capacity.status === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {capacity.percentage.toFixed(1)}% utilized
                      </span>
                      <span>{destination.max_capacity}</span>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">{currentOccupancy}</p>
                      <p className="text-xs text-blue-700">Current</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">{availableCapacity}</p>
                      <p className="text-xs text-green-700">Available</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-600">{destination.max_capacity}</p>
                      <p className="text-xs text-gray-700">Max Capacity</p>
                    </div>
                  </div>

                  {/* Guidelines */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Guidelines</h4>
                    <div className="space-y-1">
                      {destination.guidelines.slice(0, 3).map((guideline, index) => (
                        <p key={index} className="text-xs text-gray-600 flex items-start">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {guideline}
                        </p>
                      ))}
                      {destination.guidelines.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{destination.guidelines.length - 3} more guidelines
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Location Coordinates</h4>
                    <p className="text-xs text-gray-600">
                      Lat: {destination.latitude}, Long: {destination.longitude}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alert if capacity is high */}
                {capacity.status === 'high' || capacity.status === 'full' ? (
                  <div className={`p-3 ${capacity.status === 'full' ? 'bg-red-50 border-t border-red-200' : 'bg-orange-50 border-t border-orange-200'}`}>
                    <div className="flex items-center">
                      <AlertTriangle className={`h-4 w-4 mr-2 ${capacity.status === 'full' ? 'text-red-600' : 'text-orange-600'}`} />
                      <span className={`text-xs font-medium ${capacity.status === 'full' ? 'text-red-700' : 'text-orange-700'}`}>
                        {capacity.status === 'full' ? 'Destination at full capacity' : 'High capacity utilization'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {destinations.reduce((sum, dest) => sum + dest.current_occupancy, 0)}
              </p>
              <p className="text-sm text-blue-700">Total Current Occupancy</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {destinations.reduce((sum, dest) => sum + dest.max_capacity, 0)}
              </p>
              <p className="text-sm text-green-700">Total Capacity</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {destinations.filter(dest => {
                  const capacity = getCapacityStatus(dest.current_occupancy, dest.max_capacity);
                  return capacity.status === 'high' || capacity.status === 'full';
                }).length}
              </p>
              <p className="text-sm text-yellow-700">High Utilization</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {destinations.filter(dest => dest.is_active).length}
              </p>
              <p className="text-sm text-gray-700">Active Destinations</p>
            </div>
          </div>
        </div>
      </div>
      )}
    </Layout>
  );
}
