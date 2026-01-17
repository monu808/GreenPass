'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Calendar, MapPin, Users, CheckCircle, Eye, 
  Search, Leaf, XCircle, CreditCard, Clock, ChevronRight, Download 
} from 'lucide-react';

// Explicit Interface for Build Success
interface Booking {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  totalAmount: number;
  guests: number;
  image: string;
}

export default function TouristBookings() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // LOGIC: Increased data array with 4 unique bookings
  const [bookings] = useState<Booking[]>([
    { 
      id: 'BK-9901', 
      title: 'Solang Valley Expedition', 
      destination: 'Manali, HP', 
      startDate: '2026-02-15', 
      endDate: '2026-02-20',
      status: 'Confirmed', 
      totalAmount: 25000,
      guests: 2,
      image: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800'
    },
    { 
      id: 'BK-8842', 
      title: 'Spiti Winter Trek', 
      destination: 'Kaza, HP', 
      startDate: '2026-03-10', 
      endDate: '2026-03-18',
      status: 'Pending', 
      totalAmount: 42000,
      guests: 1,
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800'
    },
    { 
      id: 'BK-7721', 
      title: 'Dal Lake Houseboat Stay', 
      destination: 'Srinagar, J&K', 
      startDate: '2026-04-05', 
      endDate: '2026-04-08',
      status: 'Confirmed', 
      totalAmount: 18500,
      guests: 3,
      image: 'https://images.unsplash.com/photo-1530866495547-0840404652c0?w=800'
    },
    { 
      id: 'BK-6610', 
      title: 'Bir Billing Paragliding', 
      destination: 'Bir, HP', 
      startDate: '2025-11-12', 
      endDate: '2025-11-13',
      status: 'Completed', 
      totalAmount: 4500,
      guests: 1,
      image: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800'
    }
  ]);

  const handleAction = (type: string, id: string): void => {
    alert(`${type} requested for Booking ID: ${id}`);
  };

  const filteredBookings = bookings.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p className="text-gray-400 font-bold max-w-xs text-sm leading-relaxed text-right hidden md:block">
            Review your upcoming adventures and download your eco-permits.
          </p>
        </div>

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
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-emerald-600 transition-colors">{booking.title}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-bold text-xs">
                     <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-500" /> {booking.destination}</span>
                     <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-emerald-500" /> {booking.startDate}</span>
                     <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-emerald-500" /> {booking.guests} Guests</span>
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
                      className="p-3.5 border border-gray-100 text-gray-400 rounded-xl hover:text-emerald-600 hover:border-emerald-100 transition-all"
                      aria-label="Download Invoice"
                    >
                      <Download className="h-5 w-5" />
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

              <div className="grid grid-cols-2 gap-8 py-8 border-y border-gray-100">
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