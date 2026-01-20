'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Calendar, MapPin, Users, CheckCircle, Eye, 
  Search, Leaf, XCircle, CreditCard, Download,
  TrendingUp, Award, Wind , RefreshCw
} from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { useAuth } from '@/contexts/AuthContext';
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
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">
        
        {/* PREMIUM HEADER */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-2 text-emerald-600 justify-center md:justify-start">
               <CheckCircle className="h-5 w-5" />
               <span className="text-[10px] font-black tracking-[0.4em] uppercase">Expedition History</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
              My <span className="text-emerald-600">Bookings</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-gray-400 font-bold max-w-xs text-sm leading-relaxed text-right hidden md:block">
              Review your upcoming adventures and download your eco-permits.
            </p>
          </div>
        </div>

        {/* ECO SUMMARY CARD */}
        {ecoStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Award className="h-32 w-32" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Total Eco-Points</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tracking-tighter leading-none">{ecoStats.ecoPoints}</span>
                <span className="text-xs font-bold mb-1">PTS</span>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700 text-emerald-600">
                <Leaf className="h-32 w-32" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Total Bookings</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tracking-tighter leading-none text-gray-900">{ecoStats.tripsCount}</span>
                <span className="text-xs font-bold mb-1 text-gray-400 uppercase">Trips</span>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700 text-rose-600">
                <TrendingUp className="h-32 w-32" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Cumulative Footprint</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tracking-tighter leading-none text-gray-900">{ecoStats.totalCarbonFootprint.toFixed(1)}</span>
                <span className="text-xs font-bold mb-1 text-gray-400 uppercase">KG CO2</span>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700 text-emerald-600">
                <Wind className="h-32 w-32" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-600">Offset Contribution</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tracking-tighter leading-none text-emerald-700">{ecoStats.totalCarbonOffset.toFixed(1)}</span>
                <span className="text-xs font-bold mb-1 text-emerald-600 uppercase">KG CO2</span>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="relative group max-w-2xl">
          <label htmlFor="booking-search" className="sr-only">Search bookings</label>
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            id="booking-search"
            type="text"
            placeholder="Search by ID or destination..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
          />
        </div>

        {/* BOOKINGS LIST (More images here) */}
        <div className="grid grid-cols-1 gap-8">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="group bg-white rounded-[3rem] border border-gray-50 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row">
              <div className="lg:w-80 h-56 lg:h-auto relative overflow-hidden">
                <img src={booking.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={booking.title} />
                <div className="absolute inset-0 bg-emerald-950/20" />
                <div className="absolute top-6 left-6">
                   <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                     booking.status === 'Confirmed' ? 'bg-emerald-500 text-white' : 
                     booking.status === 'Pending' ? 'bg-amber-400 text-amber-950' : 'bg-gray-400 text-white'
                   }`}>
                     {booking.status}
                   </span>
                </div>
              </div>

              <div className="flex-1 p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-emerald-600 transition-colors">{booking.title}</h3>
                    {booking.carbonFootprint && (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        booking.carbonFootprint < 100 ? 'bg-emerald-100 text-emerald-700' :
                        booking.carbonFootprint < 200 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        <Leaf className="h-3 w-3" />
                        {booking.carbonFootprint} kg CO2
                      </div>
                    )}
                    {booking.isOffset && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Wind className="h-3 w-3" />
                        Offset
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-bold text-xs">
                     <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-500" /> {booking.destination}</span>
                     <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-emerald-500" /> {booking.startDate}</span>
                     <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-emerald-500" /> {booking.guests} Guests</span>
                     {booking.ecoPointsEarned && (
                       <span className="flex items-center gap-1.5 text-emerald-600 font-black"><Award className="h-4 w-4" /> +{booking.ecoPointsEarned} Pts</span>
                     )}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-5">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Amount Paid</p>
                    <p className="text-4xl font-black text-emerald-600 tracking-tighter leading-none">₹{booking.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95 shadow-xl"
                    >
                      <Eye className="h-4 w-4" /> Details
                    </button>
                   <button
  type="button"
  onClick={() => handleAction('Download', booking.id)}
  disabled={downloadingId === booking.id}
  className="p-3.5 border border-gray-100 text-gray-400 rounded-xl hover:text-emerald-600 hover:border-emerald-100 transition-all disabled:opacity-70 disabled:cursor-wait"
  aria-label="Download Invoice"
>
  {downloadingId === booking.id ? (
    <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
  ) : (
    <Download className="h-5 w-5" />
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
          <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-white rounded-[4rem] p-12 overflow-hidden shadow-2xl space-y-10">
              <button
                type="button"
                aria-label="Close booking details"
                onClick={() => setSelectedBooking(null)}
                className="absolute top-10 right-10 p-2 text-gray-400 hover:text-rose-500 transition-all"
              >
                <XCircle className="h-8 w-8" />
              </button>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Official Expedition Log</p>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Booking Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-t border-gray-100">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Booking Ref</p>
                   <p className="font-black text-gray-900">{selectedBooking.id}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Expedition</p>
                   <p className="font-black text-gray-900">{selectedBooking.title}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Travel Period</p>
                   <p className="font-black text-gray-900">{selectedBooking.startDate} to {selectedBooking.endDate}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Status</p>
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
              <div className="bg-emerald-50/50 rounded-[2.5rem] p-8 border border-emerald-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Environmental Impact</h4>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Eco-conscious Journey</p>
                    </div>
                  </div>
                  {selectedBooking.ecoPointsEarned && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-emerald-100 shadow-sm">
                      <Award className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-black text-emerald-700">+{selectedBooking.ecoPointsEarned} Pts</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Travel</p>
                    <p className="text-lg font-black text-gray-900">{selectedBooking.breakdown?.travel.toFixed(1)} <span className="text-[10px] text-gray-400">kg</span></p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Stay</p>
                    <p className="text-lg font-black text-gray-900">{selectedBooking.breakdown?.accommodation.toFixed(1)} <span className="text-[10px] text-gray-400">kg</span></p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Activities</p>
                    <p className="text-lg font-black text-gray-900">{selectedBooking.breakdown?.activities.toFixed(1)} <span className="text-[10px] text-gray-400">kg</span></p>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Carbon Footprint</p>
                    <p className="text-xl font-black text-emerald-600">{selectedBooking.carbonFootprint?.toFixed(1)} kg CO2e</p>
                  </div>
                  
                  {/* IMPACT VISUALIZATION */}
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: '40%' }}></div>
                      <div className="h-full bg-amber-400" style={{ width: '30%' }}></div>
                      <div className="h-full bg-blue-400" style={{ width: '30%' }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Travel</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Accommodation</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Activities</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className={`h-5 w-5 ${selectedBooking.isOffset ? 'text-blue-500' : 'text-gray-300'}`} />
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                        {selectedBooking.isOffset ? 'Footprint Fully Offset' : 'Not Offset'}
                      </p>
                    </div>
                    {selectedBooking.isOffset && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[8px] font-black uppercase">Verified Clean Energy Project</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-8 bg-gray-50 rounded-3xl border border-gray-100">
                 <div className="flex items-center gap-4 text-emerald-600">
                    <CreditCard className="h-8 w-8" />
                    <div><p className="text-[9px] font-black uppercase text-gray-400">Total Price</p><p className="text-2xl font-black">₹{selectedBooking.totalAmount.toLocaleString()}</p></div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => handleAction('Contact Support', selectedBooking.id)}
                   className="px-6 py-3 bg-white text-[10px] font-black uppercase tracking-widest border border-gray-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                 >
                   Help Desk
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </TouristLayout>
  );
}