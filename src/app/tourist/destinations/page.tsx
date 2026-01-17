'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { 
  MapPin, Users, Navigation, Search, RefreshCw, Leaf, Heart, 
  Filter, ArrowRight, ShieldCheck, Compass, Thermometer, Droplets 
} from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import { Destination } from '@/types';

export default function TouristDestinations() {
  // 1. STATE MANAGEMENT
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'popular' | 'high-sensitivity'>('all');

  // 2. DATA LOADING LOGIC (Direct Database Sync)
  const loadData = async (): Promise<void> => {
    try {
      const dbService = getDbService();
      const data = await dbService.getDestinations();
      const transformed: Destination[] = data.map((dest) => ({
        id: dest.id,
        name: dest.name,
        location: dest.location,
        maxCapacity: dest.max_capacity,
        currentOccupancy: dest.current_occupancy,
        description: dest.description,
        guidelines: dest.guidelines || [],
        isActive: dest.is_active,
        ecologicalSensitivity: dest.ecological_sensitivity,
        coordinates: { latitude: dest.latitude, longitude: dest.longitude },
      }));
      setDestinations(transformed.filter((dest) => dest.isActive));
    } catch (error) {
      console.error("Critical build error in data fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. FILTERING ENGINE (Using Policy Engine for dynamic capacity)
  const filterData = useCallback((): void => {
    let result = [...destinations];
    const policy = getPolicyEngine();

    if (searchTerm) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilter === 'available') {
      result = result.filter(d => {
        const adjustedCap = policy.getAdjustedCapacity(d);
        return d.currentOccupancy < adjustedCap * 0.75;
      });
    } else if (selectedFilter === 'popular') {
      result = result.filter(d => d.currentOccupancy > d.maxCapacity * 0.6);
    } else if (selectedFilter === 'high-sensitivity') {
      result = result.filter(d => d.ecologicalSensitivity === 'high');
    }

    setFilteredDestinations(result);
  }, [destinations, searchTerm, selectedFilter]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterData(); }, [filterData]);

  // 4. ACTION HANDLERS
  const handleAction = (type: string, id: string): void => {
    if (type === 'book') window.location.href = `/tourist/book?destination=${id}`;
    if (type === 'like') alert(`Trail ${id} added to your eco-journal!`);
  };

  return (
    <TouristLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20 px-6">
        
        {/* HEADER */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Compass className="h-5 w-5" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase">Managed Eco-Trails</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
              Explore <span className="text-emerald-600">Nature</span>
            </h1>
          </div>
          <div className="text-right space-y-2">
            <p className="text-gray-400 font-bold max-w-sm text-sm leading-relaxed">
              Live occupancy tracking across Himalayan valleys to ensure sustainable tourism.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <label htmlFor="dest-search-input" className="sr-only">Search valley destinations</label>
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                id="dest-search-input"
                type="text"
                placeholder="Search by valley, town, or state..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-[1.8rem] border border-gray-100 overflow-x-auto">
              {['all', 'available', 'popular', 'high-sensitivity'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter as any)}
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedFilter === filter ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {filter.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESTINATIONS LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin" />
            <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Updating Trail Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredDestinations.map((d) => {
              const policy = getPolicyEngine();
              const adjustedCap = policy.getAdjustedCapacity(d);
              // FIX: Added guard to check if adjustedCap is greater than 0
              const occupancyRate = adjustedCap > 0 ? (d.currentOccupancy / adjustedCap) * 100 : 0;

              return (
                <div key={d.id} className="group bg-white rounded-[3.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <div className="h-56 relative overflow-hidden bg-emerald-900">
                    <img 
                      src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"
                      className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                      alt={d.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent" />
                    <h3 className="absolute bottom-6 left-8 text-3xl font-black text-white tracking-tighter leading-none">{d.name}</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Eco-Load Factor</p>
                        {/* FIX: Guarded display text for adjustedCap */}
                        <p className="text-xl font-black text-gray-900">{d.currentOccupancy} / {adjustedCap > 0 ? adjustedCap : 0}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase ${occupancyRate > 80 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {Math.round(occupancyRate)}% Full
                      </div>
                    </div>

                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${occupancyRate > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                         style={{ width: `${Math.min(100, occupancyRate)}%` }} 
                       />
                    </div>

                    <p className="text-gray-400 text-sm font-medium line-clamp-2">{d.description}</p>

                    <div className="flex gap-3">
                       <button 
                         type="button"
                         onClick={() => handleAction('book', d.id)}
                         className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 hover:bg-emerald-700 transition-all"
                       >
                         Secure Permit
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TouristLayout>
  );
}
