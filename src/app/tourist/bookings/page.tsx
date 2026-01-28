'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Users, Eye, Download, XCircle, Leaf, Award, Wind, RefreshCw, Search, CheckCircle, CreditCard, TrendingUp } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { useModalAccessibility } from '@/lib/accessibility';
import { getDbService } from '@/lib/databaseService';
import { useAuth } from '@/contexts/AuthContext';
import { DataFetchErrorBoundary } from '@/components/errors';
import { sanitizeSearchTerm } from '@/lib/utils';
import { validateInput, SearchFilterSchema } from '@/lib/validation';

// Explicit Interface for Build Success
interface Booking {
  id: string;
  title: string;
  destinationId: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  totalAmount: number;
  guests: number;
  image: string;
  carbonFootprint?: number;
  isOffset?: boolean;
  ecoPointsEarned?: number;
  breakdown?: {
    travel: number;
    accommodation: number;
    activities: number;
  };
}

export default function TouristBookings() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ecoStats, setEcoStats] = useState<{ ecoPoints: number; totalCarbonOffset: number; tripsCount: number; totalCarbonFootprint: number } | null>(null);
  const [, setIsLoading] = useState(true);
  // Track which invoice is downloading
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Calculate carbon footprint percentages for selected booking
  const breakdown = selectedBooking?.breakdown || { travel: 0, accommodation: 0, activities: 0 };
  const totalImpact = selectedBooking?.carbonFootprint || (breakdown.travel + breakdown.accommodation + breakdown.activities) || 1;
  const travelPct = (breakdown.travel / totalImpact) * 100;
  const accommodationPct = (breakdown.accommodation / totalImpact) * 100;
  const activitiesPct = (breakdown.activities / totalImpact) * 100;

  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ 
    modalRef, 
    isOpen: !!selectedBooking, 
    onClose: () => setSelectedBooking(null) 
  });

  const handleAction = (action: string, id: string) => {
    if (action === 'Download') {
      setDownloadingId(id);
      // Simulate API delay (2 seconds)
      setTimeout(() => {
        alert(`Downloading invoice for booking #${id}...`);
        setDownloadingId(null);
      }, 2000);
    }
  };

  // LOGIC: Increased data array with 4 unique bookings
  const [bookings] = useState<Booking[]>([
    { 
      id: 'BK-9901', 
      title: 'Solang Valley Expedition', 
      destinationId: 'manali-solang',
      destination: 'Manali, HP', 
      startDate: '2026-02-15', 
      endDate: '2026-02-20',
      status: 'Confirmed', 
      totalAmount: 25000,
      guests: 2,
      image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800',
      carbonFootprint: 145.5,
      isOffset: true,
      ecoPointsEarned: 120,
      breakdown: { travel: 85, accommodation: 40, activities: 20.5 }
    },
    { 
      id: 'BK-8842', 
      title: 'Spiti Winter Trek', 
      destinationId: 'spiti-kaza',
      destination: 'Kaza, HP', 
      startDate: '2026-03-10', 
      endDate: '2026-03-18',
      status: 'Pending', 
      totalAmount: 42000,
      guests: 1,
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
      carbonFootprint: 210.2,
      isOffset: false,
      ecoPointsEarned: 45,
      breakdown: { travel: 160, accommodation: 35, activities: 15.2 }
    },
    { 
      id: 'BK-7721', 
      title: 'Dal Lake Houseboat Stay', 
      destinationId: 'srinagar-dal-lake',
      destination: 'Srinagar, J&K', 
      startDate: '2026-04-05', 
      endDate: '2026-04-08',
      status: 'Confirmed', 
      totalAmount: 18500,
      guests: 3,
      image: 'https://images.unsplash.com/photo-1530866495547-0840404652c0?w=800',
      carbonFootprint: 85.0,
      isOffset: true,
      ecoPointsEarned: 95,
      breakdown: { travel: 45, accommodation: 30, activities: 10 }
    },
    { 
      id: 'BK-6610', 
      title: 'Bir Billing Paragliding', 
      destinationId: 'bir-billing',
      destination: 'Bir, HP', 
      startDate: '2025-11-12', 
      endDate: '2025-11-13',
      status: 'Completed', 
      totalAmount: 4500,
      guests: 1,
      image: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800',
      carbonFootprint: 35.5,
      isOffset: false,
      ecoPointsEarned: 15,
      breakdown: { travel: 25, accommodation: 5, activities: 5.5 }
    }
  ]);

  React.useEffect(() => {
    const fetchEcoStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const db = getDbService();
        const stats = await db.getUserEcoStats(user.id);
        setEcoStats(stats);
      } catch (error) {
        console.error('Error fetching eco stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEcoStats();
  }, [user]);

  

  const filteredBookings = bookings.filter(b => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };

    return b.title.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
    b.id.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
    b.destination.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "");
  });

  return (
    <TouristLayout>
      <DataFetchErrorBoundary onRetry={() => window.location.reload()} maxRetries={0}>
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 pb-20 px-4 sm:px-6">
        
        {/* PREMIUM HEADER */}
        <div className="pt-6 sm:pt-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-6 sm:pb-10">
          <div className="space-y-2 sm:space-y-4 text-left">
            <div className="flex items-center gap-2 text-emerald-600">
               <CheckCircle className="h-5 w-5" aria-hidden="true" />
               <span className="text-[10px] font-black tracking-[0.4em] uppercase">Expedition History</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-none">
              My <span className="text-emerald-600">Bookings</span>
            </h1>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-gray-400 font-bold max-w-xs text-sm leading-relaxed text-left md:text-right hidden sm:block">
              Review your upcoming adventures and download your eco-permits.
            </p>
          </div>
        </div>

        {/* ECO SUMMARY CARD */}
        {ecoStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Award className="h-16 sm:h-32 w-16 sm:w-32" aria-hidden="true" />
              </div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-4 opacity-80">Eco-Points</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-2xl sm:text-5xl font-black tracking-tighter leading-none">{ecoStats.ecoPoints}</span>
                <span className="text-[8px] sm:text-xs font-bold mb-0.5 sm:mb-1">PTS</span>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700 text-emerald-600">
                <Leaf className="h-16 sm:h-32 w-16 sm:w-32" aria-hidden="true" />
              </div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-4 text-gray-400">Bookings</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-2xl sm:text-5xl font-black tracking-tighter leading-none text-gray-900">{ecoStats.tripsCount}</span>
                <span className="text-[8px] sm:text-xs font-bold mb-0.5 sm:mb-1 text-gray-400 uppercase">Trips</span>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700 text-rose-600">
                <TrendingUp className="h-16 sm:h-32 w-16 sm:w-32" aria-hidden="true" />
              </div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-4 text-gray-400">Footprint</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-2xl sm:text-5xl font-black tracking-tighter leading-none text-gray-900">{ecoStats.totalCarbonFootprint.toFixed(1)}</span>
                <span className="text-[8px] sm:text-xs font-bold mb-0.5 sm:mb-1 text-gray-400 uppercase">KG</span>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700 text-emerald-600">
                <Wind className="h-16 sm:h-32 w-16 sm:w-32" aria-hidden="true" />
              </div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-4 text-emerald-600">Offset</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-2xl sm:text-5xl font-black tracking-tighter leading-none text-emerald-700">{ecoStats.totalCarbonOffset.toFixed(1)}</span>
                <span className="text-[8px] sm:text-xs font-bold mb-0.5 sm:mb-1 text-emerald-600 uppercase">KG</span>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 sm:left-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" aria-hidden="true" />
          </div>
          <label htmlFor="booking-search" className="sr-only">Search your bookings</label>
          <input
            id="booking-search"
            type="text"
            placeholder="Search bookings..."
            className="w-full bg-white border-2 border-gray-100 rounded-2xl sm:rounded-3xl py-4 sm:py-6 pl-14 sm:pl-16 pr-6 sm:pr-8 text-base sm:text-lg font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm min-h-[44px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* BOOKINGS GRID */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredBookings.map((booking, index) => (
            <div key={booking.id} className="group bg-white rounded-3xl sm:rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row">
              <div className="lg:w-80 h-48 sm:h-56 lg:h-auto relative overflow-hidden bg-slate-100 shimmer">
                <Image
                  src={booking.image}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt={booking.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 320px"
                  priority={index < 2}
                />
                <div className="absolute inset-0 bg-emerald-950/20" />
                <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
                   <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg ${
                     booking.status === 'Confirmed' ? 'bg-emerald-500 text-white' : 
                     booking.status === 'Pending' ? 'bg-amber-400 text-amber-950' : 'bg-gray-400 text-white'
                   }`}>
                     {booking.status}
                   </span>
                </div>
              </div>

              <div className="flex-1 p-6 sm:p-10 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4 text-center md:text-left w-full">
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter group-hover:text-emerald-600 transition-colors">{booking.title}</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {booking.carbonFootprint && (
                        <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                          booking.carbonFootprint < 100 ? 'bg-emerald-100 text-emerald-700' :
                          booking.carbonFootprint < 200 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          <Leaf className="h-3 w-3" aria-hidden="true" />
                          {booking.carbonFootprint} kg CO2
                        </div>
                      )}
                      {booking.isOffset && (
                        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                          <Wind className="h-3 w-3" aria-hidden="true" />
                          Offset
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-gray-400 font-bold text-[10px] sm:text-xs">
                     <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 sm:h-4 w-4 text-emerald-500" aria-hidden="true" /> {booking.destination}</span>
                     <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 sm:h-4 w-4 text-emerald-500" aria-hidden="true" /> {booking.startDate}</span>
                     <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 sm:h-4 w-4 text-emerald-500" aria-hidden="true" /> {booking.guests} Guests</span>
                     {booking.ecoPointsEarned && (
                       <span className="flex items-center gap-1.5 text-emerald-600 font-black"><Award className="h-3.5 w-3.5 sm:h-4 w-4" aria-hidden="true" /> +{booking.ecoPointsEarned} Pts</span>
                     )}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4 sm:gap-5 w-full md:w-auto">
                  <div className="text-center md:text-right">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">Amount Paid</p>
                    <p className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tighter leading-none">₹{booking.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      aria-label={`View details for booking ${booking.title}`}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 min-h-[44px]"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" /> Details
                    </button>
                   <button
                    type="button"
                    onClick={() => handleAction('Download', booking.id)}
                    disabled={downloadingId === booking.id}
                    className="p-3.5 sm:p-4 border border-gray-100 text-gray-400 rounded-xl hover:text-emerald-600 hover:border-emerald-100 transition-all disabled:opacity-70 disabled:cursor-wait focus:outline-none focus:ring-4 focus:ring-emerald-500/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Download Invoice for booking ${booking.id}`}
                  >
                    {downloadingId === booking.id ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Download className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DETAILS MODAL */}
        {selectedBooking && (
          <div 
            className="fixed inset-0 bg-emerald-950/80 backdrop-blur-2xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-details-title"
          >
            <div 
              ref={modalRef}
              className="relative w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[4rem] p-6 sm:p-12 overflow-y-auto max-h-[90vh] sm:max-h-[unset] shadow-2xl space-y-6 sm:space-y-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-500"
              tabIndex={-1}
            >
              <div className="flex justify-between items-start sticky top-0 bg-white pt-2 pb-4 z-10 border-b border-gray-50 sm:border-none sm:static sm:pt-0 sm:pb-0 sm:z-auto">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Official Expedition Log</p>
                  <h2 id="booking-details-title" className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter">Booking Details</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close booking details"
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 text-gray-400 hover:text-rose-500 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <XCircle className="h-6 w-6 sm:h-8 w-8" aria-hidden="true" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-4 sm:py-8 border-t border-gray-100">
                 <div className="space-y-1">
                   <p className="text-[8px] sm:text-[9px] font-black text-gray-300 uppercase tracking-widest">Booking Ref</p>
                   <p className="font-black text-gray-900 text-sm sm:text-base">{selectedBooking.id}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[8px] sm:text-[9px] font-black text-gray-300 uppercase tracking-widest">Expedition</p>
                   <p className="font-black text-gray-900 text-sm sm:text-base">{selectedBooking.title}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[8px] sm:text-[9px] font-black text-gray-300 uppercase tracking-widest">Travel Period</p>
                   <p className="font-black text-gray-900 text-sm sm:text-base">{selectedBooking.startDate} to {selectedBooking.endDate}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[8px] sm:text-[9px] font-black text-gray-300 uppercase tracking-widest">Status</p>
                   <p className={`font-black uppercase text-[10px] ${
                     selectedBooking.status === 'Confirmed' ? 'text-emerald-500' : 
                     selectedBooking.status === 'Completed' ? 'text-gray-500' : 
                     'text-amber-500'
                   }`}>
                     {selectedBooking.status}
                   </p>
                 </div>
              </div>

              {/* ENVIRONMENTAL IMPACT SECTION */}
              <div className="bg-emerald-50/50 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-emerald-100 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 sm:p-3 bg-emerald-500 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-emerald-200">
                      <Leaf className="h-4 w-4 sm:h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight">Environmental Impact</h4>
                      <p className="text-[8px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Eco-conscious Journey</p>
                    </div>
                  </div>
                  {selectedBooking.ecoPointsEarned && (
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg sm:rounded-xl border border-emerald-100 shadow-sm">
                      <Award className="h-3.5 w-3.5 sm:h-4 w-4 text-emerald-500" aria-hidden="true" />
                      <span className="text-[10px] sm:text-xs font-black text-emerald-700">+{selectedBooking.ecoPointsEarned} Pts</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-emerald-50 shadow-sm space-y-1">
                    <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest">Travel</p>
                    <p className="text-base sm:text-lg font-black text-gray-900">{selectedBooking.breakdown?.travel.toFixed(1)} <span className="text-[9px] sm:text-[10px] text-gray-400">kg</span></p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-emerald-50 shadow-sm space-y-1">
                    <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest">Stay</p>
                    <p className="text-base sm:text-lg font-black text-gray-900">{selectedBooking.breakdown?.accommodation.toFixed(1)} <span className="text-[9px] sm:text-[10px] text-gray-400">kg</span></p>
                  </div>
                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-emerald-50 shadow-sm space-y-1">
                    <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest">Activities</p>
                    <p className="text-base sm:text-lg font-black text-gray-900">{selectedBooking.breakdown?.activities.toFixed(1)} <span className="text-[9px] sm:text-[10px] text-gray-400">kg</span></p>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-emerald-50 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Carbon Footprint</p>
                    <p className="text-lg sm:text-xl font-black text-emerald-600">{selectedBooking.carbonFootprint?.toFixed(1)} kg CO2e</p>
                  </div>
                  
                  {/* IMPACT VISUALIZATION */}
                  <div className="space-y-3" role="img" aria-label={`Carbon footprint breakdown: Travel ${travelPct.toFixed(0)}%, Stay ${accommodationPct.toFixed(0)}%, Activities ${activitiesPct.toFixed(0)}%`}>
                    <div className="h-1.5 sm:h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${travelPct}%` }}></div>
                      <div className="h-full bg-amber-400" style={{ width: `${accommodationPct}%` }}></div>
                      <div className="h-full bg-blue-400" style={{ width: `${activitiesPct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-tighter" aria-hidden="true">
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div> Travel</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400"></div> Stay</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400"></div> Activities</span>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className={`h-4 w-4 sm:h-5 w-5 ${selectedBooking.isOffset ? 'text-blue-500' : 'text-gray-300'}`} aria-hidden="true" />
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">
                        {selectedBooking.isOffset ? 'Footprint Fully Offset' : 'Not Offset'}
                      </p>
                    </div>
                    {selectedBooking.isOffset && (
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100 text-blue-700 rounded-lg text-[7px] sm:text-[8px] font-black uppercase">Verified Clean Energy Project</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-8 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100 sticky bottom-0 z-10 sm:static">
                 <div className="flex items-center gap-3 sm:gap-4 text-emerald-600 w-full sm:w-auto">
                    <CreditCard className="h-6 w-6 sm:h-8 w-8" aria-hidden="true" />
                    <div><p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400">Total Price</p><p className="text-xl sm:text-2xl font-black">₹{selectedBooking.totalAmount.toLocaleString()}</p></div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => handleAction('Contact Support', selectedBooking.id)}
                   className="w-full sm:w-auto px-6 py-3.5 bg-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-gray-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm min-h-[44px]"
                 >
                   Help Desk
                 </button>
              </div>
            </div>
          </div>
        )}

        </div>
      </DataFetchErrorBoundary>
    </TouristLayout>
  );
}