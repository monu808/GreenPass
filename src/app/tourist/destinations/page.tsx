'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { 
  Users, RefreshCw, Leaf, Heart, 
  ArrowRight, Compass, Thermometer,
  Award, Zap, Scale, Trash2, X, Search, Calendar
} from 'lucide-react';
import { DataFetchErrorBoundary } from '@/components/errors';
import TouristLayout from '@/components/TouristLayout';
import EcoSensitivityBadge from '@/components/EcoSensitivityBadge';
import EcoCapacityAlert from '@/components/EcoCapacityAlert';
import ConnectionStatusIndicator from '@/components/ConnectionStatusIndicator';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import { 
  calculateSustainabilityScore, 
  calculateCarbonOffset, 
  getCommunityBenefitMetrics, 
  getEcoImpactCategory,
  findLowImpactAlternatives
} from '@/lib/sustainabilityScoring';
import { 
  isValidEcologicalSensitivity, 
} from '@/lib/typeGuards';
import { getEcoFriendlyAlternatives } from '@/lib/recommendationEngine';
import { Destination, DynamicCapacityResult } from '@/types';
import { sanitizeSearchTerm } from '@/lib/utils';
import { validateInput, SearchFilterSchema } from '@/lib/validation';
import { useSSE } from '@/contexts/ConnectionContext';
import { useModalAccessibility } from '@/lib/accessibility';

export default function TouristDestinations() {
  // 1. STATE MANAGEMENT
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [capacityResults, setCapacityResults] = useState<Record<string, DynamicCapacityResult>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'popular' | 'high-sensitivity' | 'low-carbon' | 'community-friendly' | 'wildlife-safe' | 'eco-friendly'>('all');
  const [comparisonList, setComparisonList] = useState<Destination[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, boolean>>({});

  const comparisonModalRef = useRef<HTMLDivElement>(null);

  // Modal accessibility for comparison
  useModalAccessibility({
    modalRef: comparisonModalRef,
    isOpen: isComparisonOpen,
    onClose: () => setIsComparisonOpen(false)
  });

  // 2. DATA LOADING LOGIC (Direct Database Sync)
  const loadData = useCallback(async (): Promise<void> => {
    try {
      const dbService = getDbService();
      const transformed = await dbService.getDestinations();
      const activeDestinations = transformed.filter((dest) => dest.isActive);
      setDestinations(activeDestinations);

      // Fetch dynamic capacity for each destination
      const policyEngine = getPolicyEngine();
      const results: Record<string, DynamicCapacityResult> = {};
      await Promise.all(activeDestinations.map(async (d) => {
        results[d.id] = await policyEngine.getDynamicCapacity(d);
      }));
      setCapacityResults(results);
    } catch (error) {
      console.error("Critical build error in data fetching:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const { connectionState, reconnect } = useSSE(
    useCallback((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'weather_update_available' || 
            data.type === 'capacity_update' || 
            data.type === 'weather_update') {
          loadData();
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    }, [loadData])
  );

  // 3. FILTERING ENGINE (Using Policy Engine for dynamic capacity)
  const filterData = useCallback((): void => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };
    
    let result = [...destinations];

    if (validFilters.searchTerm) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(validFilters.searchTerm!.toLowerCase()) ||
        d.location.toLowerCase().includes(validFilters.searchTerm!.toLowerCase())
      );
    }

    if (selectedFilter === 'available') {
      result = result.filter(d => {
        const adjustedCap = capacityResults[d.id]?.adjustedCapacity ?? d.maxCapacity;
        return d.currentOccupancy < adjustedCap * 0.75;
      });
    } else if (selectedFilter === 'popular') {
      result = result.filter(d => d.currentOccupancy > d.maxCapacity * 0.6);
    } else if (selectedFilter === 'high-sensitivity') {
      result = result.filter(d => d.ecologicalSensitivity === 'high');
    } else if (selectedFilter === 'low-carbon') {
      result = result.filter(d => getEcoImpactCategory(d) === 'low-carbon');
    } else if (selectedFilter === 'community-friendly') {
      result = result.filter(d => getEcoImpactCategory(d) === 'community-friendly');
    } else if (selectedFilter === 'wildlife-safe') {
      result = result.filter(d => getEcoImpactCategory(d) === 'wildlife-safe');
    } else if (selectedFilter === 'eco-friendly') {
      result = result.filter(d => d.ecologicalSensitivity === 'low' || d.ecologicalSensitivity === 'medium');
    }

    // Rank by sustainability score
    result.sort((a, b) => {
      const scoreA = calculateSustainabilityScore(a).overallScore;
      const scoreB = calculateSustainabilityScore(b).overallScore;
      return scoreB - scoreA;
    });

    setFilteredDestinations(result);
  }, [destinations, searchTerm, selectedFilter, capacityResults]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      filterData();
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterData]);

  // 4. ACTION HANDLERS
  const handleAction = (type: string, id: string): void => {
    if (type === 'book') window.location.href = `/tourist/book?destination=${id}`;
    if (type === 'like') alert(`Trail ${id} added to your eco-journal!`);
  };

  const handleCompareToggle = (destination: Destination) => {
    setComparisonList(prev => {
      const isAlreadyAdded = prev.find(d => d.id === destination.id);
      if (isAlreadyAdded) {
        return prev.filter(d => d.id !== destination.id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 destinations at a time.');
        return prev;
      }
      return [...prev, destination];
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <TouristLayout>
      <DataFetchErrorBoundary onRetry={loadData}>
        <div className="max-w-7xl mx-auto space-y-12 pb-20 px-6">
        
        {/* HEADER */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Compass className="h-5 w-5" />
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-70">Managed Eco-Trails</span>
              <ConnectionStatusIndicator 
                connectionState={connectionState} 
                onRetry={reconnect} 
                className="ml-4"
              />
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
  {isSearching ? (
    <RefreshCw className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 animate-spin" aria-hidden="true" />
  ) : (
    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" aria-hidden="true" />
  )}
  <input
    id="dest-search-input"
    type="text"
    placeholder="Search by valley, town, or state..."
    value={searchTerm}
    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
    className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
    aria-controls="destinations-results"
  />
</div>

            <div className="flex bg-gray-100 p-1.5 rounded-[1.8rem] border border-gray-100 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Destination filters">
              {(['all', 'available', 'popular', 'high-sensitivity', 'low-carbon', 'community-friendly', 'wildlife-safe', 'eco-friendly'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  role="tab"
                  aria-selected={selectedFilter === filter}
                  className={`px-6 py-3 rounded-[1.5rem] text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
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
        <div id="destinations-results" aria-live="polite" className="sr-only">
          {loading ? 'Loading trail data...' : `Found ${filteredDestinations.length} destinations.`}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin" aria-hidden="true" />
            <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Updating Trail Data...</p>
          </div>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            aria-live="polite"
            aria-atomic="true"
          >
            {filteredDestinations.map((d, index) => {
              const dynResult = capacityResults[d.id];
              const adjustedCap = dynResult?.adjustedCapacity ?? d.maxCapacity;
              const occupancyRate = adjustedCap > 0 ? (d.currentOccupancy / adjustedCap) * 100 : 0;
              
              const sustainabilityScore = calculateSustainabilityScore(d);
              const carbonOffset = calculateCarbonOffset(d);
              const communityMetrics = getCommunityBenefitMetrics(d);
              const isComparing = comparisonList.some(item => item.id === d.id);

              return (
                <div key={d.id} className="group bg-white rounded-[3.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 relative">
                  {/* COMPARISON TOGGLE */}
                  <button 
                    onClick={() => handleCompareToggle(d)}
                    aria-label={isComparing ? `Remove ${d.name} from comparison` : `Add ${d.name} to comparison`}
                    aria-pressed={isComparing}
                    className={`absolute top-6 left-8 z-10 p-3 rounded-2xl backdrop-blur-md transition-all ${
                      isComparing ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/20 text-white hover:bg-white/40'
                    }`}
                    title={isComparing ? "Remove from comparison" : "Add to comparison"}
                  >
                    <Scale className="h-5 w-5" aria-hidden="true" />
                  </button>

                  <div className="h-56 relative overflow-hidden bg-slate-100 shimmer">
                    <Image 
                      src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"
                      className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                      alt={d.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent" />
                    
                    {/* Dynamic Capacity & Sustainability Indicators */}
                    <div className="absolute top-6 right-8 flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md font-black text-[9px] uppercase tracking-tighter ${getScoreColor(sustainabilityScore.overallScore)}`}>
                        <Leaf className="h-3 w-3" />
                        Score: {sustainabilityScore.overallScore}
                      </div>
                      
                      <div className="flex gap-2">
                        {dynResult?.activeFactorFlags.weather && (
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white" title="Weather-based capacity adjustment active">
                            <Thermometer className="h-4 w-4" />
                          </div>
                        )}
                        {dynResult?.activeFactorFlags.season && (
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white" title="Seasonal capacity adjustment active">
                            <Calendar className="h-4 w-4" />
                          </div>
                        )}
                        {dynResult?.activeFactorFlags.infrastructure && (
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white" title="Infrastructure strain adjustment active">
                            <Leaf className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-8 flex flex-col gap-2">
                       <EcoSensitivityBadge level={d.ecologicalSensitivity} className="w-fit" />
                       <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{d.name}</h3>
                     </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <EcoCapacityAlert 
                      currentOccupancy={d.currentOccupancy} 
                      adjustedCapacity={adjustedCap}
                    />
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                          {dynResult?.displayMessage ? dynResult.displayMessage : 'Live Occupancy'}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-gray-900">
                            {d.currentOccupancy}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Active</p>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">
                          (Eco-Limit: {adjustedCap} <span className="mx-1 opacity-20">|</span> Max: {d.maxCapacity})
                        </p>
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

                    {/* SUSTAINABILITY QUICK METRICS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-[1.5rem] space-y-1">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Zap className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Carbon Offset</span>
                        </div>
                        <p className="text-xs font-bold text-gray-700">{carbonOffset.estimatedCO2}kg CO₂e</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-[1.5rem] space-y-1">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Users className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Local Impact</span>
                        </div>
                        <p className="text-xs font-bold text-gray-700">{communityMetrics.localEmploymentRate}% Local</p>
                      </div>
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

                    {/* Eco-Friendly Alternatives Expandable */}
                    {occupancyRate >= 70 && (
                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <button
                          onClick={() => setExpandedAlternatives(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                          aria-expanded={expandedAlternatives[d.id] || false}
                          aria-controls={`alternatives-${d.id}`}
                          className="w-full flex items-center justify-between text-[9px] font-bold text-emerald-600 uppercase tracking-wider hover:text-emerald-700 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                            {expandedAlternatives[d.id] ? 'Hide Alternatives' : 'See Eco-Friendly Alternatives'}
                          </span>
                          <ArrowRight className={`h-3.5 w-3.5 transition-transform duration-300 ${expandedAlternatives[d.id] ? 'rotate-90' : ''}`} aria-hidden="true" />
                        </button>

                        {expandedAlternatives[d.id] && (
                          <div id={`alternatives-${d.id}`} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] text-gray-400 font-bold italic">
                              High occupancy detected. Consider these lower-impact valleys:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {getEcoFriendlyAlternatives(
                                d, 
                                destinations, 
                                Object.fromEntries(Object.entries(capacityResults).map(([id, res]) => [id, res.adjustedCapacity]))
                              ).map(alt => (
                                <button
                                  key={alt.id}
                                  onClick={() => {
                                    setSearchTerm(alt.name);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left"
                                >
                                  <div className="space-y-1">
                                    <h5 className="text-[11px] font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{alt.name}</h5>
                                    <div className="flex items-center gap-2">
                                      <EcoSensitivityBadge level={alt.ecologicalSensitivity} className="scale-[0.6] origin-left" />
                                      <span className="text-[8px] font-bold text-gray-400 uppercase">
                                        {(() => {
                                          const denominator = capacityResults[alt.id]?.adjustedCapacity ?? alt.maxCapacity ?? undefined;
                                          const percent = (!denominator || denominator <= 0) ? 0 : Math.round((alt.currentOccupancy / denominator) * 100);
                                          return `${percent}% load`;
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ECO-FRIENDLY ALTERNATIVES */}
        {!loading && filteredDestinations.length > 0 && (
          <div className="bg-emerald-50 rounded-[3.5rem] p-12 border border-emerald-100 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-600 rounded-[1.5rem] text-white">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Eco-Friendly Alternatives</h2>
                <p className="text-emerald-700 font-bold text-sm">Recommended destinations with the lowest environmental impact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {findLowImpactAlternatives(destinations, filteredDestinations[0]).map((alt) => {
                const score = calculateSustainabilityScore(alt);
                return (
                  <div key={alt.id} className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 flex gap-6 items-center group hover:shadow-xl transition-all">
                    <div className="h-24 w-24 rounded-[1.8rem] bg-slate-100 shimmer overflow-hidden flex-shrink-0 relative">
                      <Image 
                        src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        alt={alt.name}
                        fill
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-gray-900">{alt.name}</h4>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${getScoreColor(score.overallScore)}`}>
                          {score.overallScore} Score
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium line-clamp-1">{alt.description}</p>
                      <button 
                        onClick={() => handleAction('book', alt.id)}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        Explore Alternative <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPARISON FLOATING TRIGGER */}
        {comparisonList.length > 0 && (
          <div className="fixed bottom-10 right-10 z-50">
            <button 
              onClick={() => setIsComparisonOpen(true)}
              className="bg-emerald-600 text-white px-8 py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              <Scale className="h-5 w-5" />
              Compare Destinations ({comparisonList.length})
            </button>
          </div>
        )}

        {/* COMPARISON MODAL */}
        {isComparisonOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="comparison-title">
            <div 
              ref={comparisonModalRef}
              className="bg-white w-full max-w-6xl rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300"
            >
              <div className="p-6 sm:p-10 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl text-emerald-600">
                    <Scale className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="comparison-title" className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter leading-none">Sustainability Comparison</h2>
                    <p className="text-gray-400 font-bold text-[10px] sm:text-xs mt-1 sm:mt-2 uppercase tracking-widest">Side-by-side impact analysis</p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4">
                  <button 
                    onClick={() => setComparisonList([])}
                    className="px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-gray-50 text-gray-400 font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[44px]"
                    aria-label="Clear all compared destinations"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" /> <span className="hidden sm:inline">Clear All</span>
                  </button>
                  <button 
                    onClick={() => setIsComparisonOpen(false)}
                    className="p-3 rounded-xl sm:rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close comparison modal"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 sm:p-10 no-scrollbar">
                <div className="grid grid-cols-4 gap-4 sm:gap-8 min-w-[800px] lg:min-w-0">
                  {/* Labels Column */}
                  <div className="space-y-12 pt-40 hidden sm:block">
                    <div className="h-10 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sustainability Score</div>
                    <div className="h-10 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Carbon Footprint</div>
                    <div className="h-10 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Eco Certifications</div>
                    <div className="h-10 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Community Benefit</div>
                    <div className="h-10 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Wildlife Safety</div>
                  </div>

                  {/* Destination Columns */}
                  {comparisonList.map(dest => {
                    const score = calculateSustainabilityScore(dest);
                    const carbon = calculateCarbonOffset(dest);
                    const community = getCommunityBenefitMetrics(dest);
                    
                    return (
                      <div key={dest.id} className="space-y-8 sm:space-y-12 col-span-4 sm:col-span-1 border sm:border-none p-6 sm:p-0 rounded-3xl bg-gray-50/50 sm:bg-transparent">
                        <div className="space-y-4">
                          <div className="h-32 sm:h-40 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-100 shimmer overflow-hidden relative">
                            <Image 
                              src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" 
                              className="w-full h-full object-cover" 
                              alt={dest.name}
                              fill
                              sizes="(max-width: 1024px) 100vw, 25vw"
                            />
                          </div>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{dest.name}</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{dest.location}</p>
                        </div>

                        <div className="space-y-6 sm:space-y-12">
                          <div className="flex sm:block justify-between items-center">
                            <span className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Sustainability Score</span>
                            <div className="h-10 flex items-center">
                              <div className={`px-4 py-2 rounded-xl font-black text-sm border-2 ${getScoreColor(score.overallScore)}`}>
                                {score.overallScore}/100
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:block justify-between items-center">
                            <span className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Carbon Footprint</span>
                            <div className="h-10 flex items-center gap-3">
                              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <Zap className="h-4 w-4" />
                              </div>
                              <span className="font-black text-gray-900 text-sm">{carbon.estimatedCO2}kg CO₂e</span>
                            </div>
                          </div>

                          <div className="flex sm:block justify-between items-center">
                            <span className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Eco Certifications</span>
                            <div className="h-10 flex items-center gap-3">
                              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Award className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-gray-600 text-sm">
                                {dest.sustainabilityFeatures?.wasteManagementLevel === 'certified' ? 'ISO 14001' : 'Eco-Verified'}
                              </span>
                            </div>
                          </div>

                          <div className="flex sm:block justify-between items-center">
                            <span className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Community Benefit</span>
                            <div className="h-10 flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Users className="h-4 w-4" />
                              </div>
                              <span className="font-black text-gray-900 text-sm">{community.localEmploymentRate}% Employment</span>
                            </div>
                          </div>

                          <div className="flex sm:block justify-between items-center">
                            <span className="sm:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Wildlife Safety</span>
                            <div className="h-10 flex items-center gap-3">
                              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                <Heart className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-gray-600 text-sm">
                                {dest.sustainabilityFeatures?.wildlifeProtectionProgram ? 'Advanced' : 'Standard'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleAction('book', dest.id)}
                          className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 min-h-[56px]"
                        >
                          Book this path
                        </button>
                      </div>
                    );
                  })}

                  {/* Empty Slots */}
                  {comparisonList.length < 3 && Array.from({ length: 3 - comparisonList.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="hidden sm:flex border-2 border-dashed border-gray-100 rounded-[3rem] flex-col items-center justify-center p-10 text-center space-y-4 opacity-50">
                      <div className="p-6 bg-gray-50 rounded-full text-gray-300">
                        <Scale className="h-10 w-10" />
                      </div>
                      <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Add destination to compare</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </DataFetchErrorBoundary>
    </TouristLayout>
  );
}
