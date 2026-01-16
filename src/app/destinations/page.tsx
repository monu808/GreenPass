'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { getCapacityStatus, getEcologicalSensitivityColor } from '@/lib/utils';
import type { Database } from '@/types/database';

type Destination = Database['public']['Tables']['destinations']['Row'];

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const dbService = getDbService();
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
        <div className="space-y-6 sm:space-y-10 pb-10">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-10 text-white shadow-lg">
            <h1 className="text-2xl sm:text-4xl font-black mb-2 tracking-tight">Destinations</h1>
            <p className="text-emerald-50 text-sm sm:text-lg font-medium opacity-90">
              Manage and monitor tourist destinations in Jammu & Himachal Pradesh
            </p>
          </div>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {destinations.map((destination) => {
              const currentOccupancy = destination.current_occupancy;
              const availableCapacity = destination.max_capacity - currentOccupancy;
              const capacity = getCapacityStatus(currentOccupancy, destination.max_capacity);
            
            return (
              <div key={destination.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{destination.name}</h3>
                        <span className={`px-3 py-1 text-[10px] sm:text-xs font-black rounded-xl border-2 uppercase tracking-widest ${getEcologicalSensitivityColor(destination.ecological_sensitivity)}`}>
                          {destination.ecological_sensitivity} sensitivity
                        </span>
                      </div>
                      <p className="text-gray-500 mt-2 flex items-center text-sm font-bold">
                        <MapPin className="h-4 w-4 mr-1.5 text-emerald-500" />
                        {destination.location}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {destination.is_active ? (
                        <span className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100">
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <p className="text-gray-600 text-sm sm:text-base font-medium mb-8 leading-relaxed">{destination.description}</p>

                  {/* Capacity Utilization */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-widest">Capacity Utilization</span>
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        {currentOccupancy.toLocaleString()} / {destination.max_capacity.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-2xl h-3.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-2xl transition-all duration-1000 ease-out ${
                          capacity.status === 'full' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          capacity.status === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          capacity.status === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${capacity.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs font-black uppercase tracking-widest mt-2">
                      <span className="text-gray-400">0</span>
                      <span className={`${
                        capacity.status === 'full' ? 'text-red-600' :
                        capacity.status === 'high' ? 'text-orange-600' :
                        capacity.status === 'medium' ? 'text-yellow-600' :
                        'text-emerald-600'
                      }`}>
                        {capacity.percentage.toFixed(1)}% utilized
                      </span>
                      <span className="text-gray-400">{destination.max_capacity}</span>
                    </div>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 group-hover:scale-105 transition-transform">
                      <p className="text-xl sm:text-2xl font-black text-blue-600">{currentOccupancy}</p>
                      <p className="text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-widest mt-1">Current</p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 group-hover:scale-105 transition-transform">
                      <p className="text-xl sm:text-2xl font-black text-emerald-600">{availableCapacity}</p>
                      <p className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest mt-1">Available</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:scale-105 transition-transform col-span-2 sm:col-auto">
                      <p className="text-xl sm:text-2xl font-black text-gray-900">{destination.max_capacity}</p>
                      <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Max Capacity</p>
                    </div>
                  </div>

                  {/* Guidelines Section */}
                  <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 mb-8 border border-gray-100">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Safety & Eco Guidelines</h4>
                    <div className="space-y-3">
                      {destination.guidelines.slice(0, 3).map((guideline, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                          <p className="text-xs sm:text-sm text-gray-600 font-bold leading-relaxed">{guideline}</p>
                        </div>
                      ))}
                      {destination.guidelines.length > 3 && (
                        <p className="text-[10px] sm:text-xs text-blue-500 font-black uppercase tracking-widest pl-4.5 mt-2 cursor-pointer hover:text-blue-600">
                          + {destination.guidelines.length - 3} more guidelines
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coordinates & Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-gray-100">
                    <div className="flex-1 w-full sm:w-auto">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Coordinates</span>
                      <p className="text-xs font-mono font-black text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block tracking-tighter">
                        {destination.latitude}, {destination.longitude}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                        Details
                      </button>
                      <button className="flex-1 sm:flex-none px-6 py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alert Overlay */}
                {(capacity.status === 'high' || capacity.status === 'full') && (
                  <div className={`px-6 py-3 border-t-2 ${
                    capacity.status === 'full' 
                      ? 'bg-red-50 border-red-100 text-red-600' 
                      : 'bg-orange-50 border-orange-100 text-orange-600'
                  }`}>
                    <div className="flex items-center justify-center sm:justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.1em]">
                        {capacity.status === 'full' ? 'CRITICAL: Destination at full capacity' : 'WARNING: High capacity utilization'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Summary Statistics */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-8 tracking-tight">Overall Network Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { 
                  label: 'Total Occupancy', 
                  value: destinations.reduce((sum, dest) => sum + dest.current_occupancy, 0),
                  color: 'text-blue-600',
                  bg: 'bg-blue-50'
                },
                { 
                  label: 'Total Capacity', 
                  value: destinations.reduce((sum, dest) => sum + dest.max_capacity, 0),
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50'
                },
                { 
                  label: 'High Utilization', 
                  value: destinations.filter(dest => {
                    const capacity = getCapacityStatus(dest.current_occupancy, dest.max_capacity);
                    return capacity.status === 'high' || capacity.status === 'full';
                  }).length,
                  color: 'text-orange-600',
                  bg: 'bg-orange-50'
                },
                { 
                  label: 'Active Sites', 
                  value: destinations.filter(dest => dest.is_active).length,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50'
                }
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} rounded-2xl p-6 border border-white shadow-sm hover:scale-105 transition-transform`}>
                  <p className={`text-3xl sm:text-4xl font-black ${stat.color} mb-1 tracking-tighter`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className={`text-[10px] sm:text-xs font-black ${stat.color} opacity-70 uppercase tracking-widest`}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
