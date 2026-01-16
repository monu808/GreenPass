'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Edit,
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Car,
  Home,
  Mountain,
  Camera,
  Plane,
  Train
} from 'lucide-react';

interface Booking {
  id: string;
  type: 'accommodation' | 'activity' | 'transport' | 'package';
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  guests: number;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  bookingDate: string;
  confirmationCode: string;
  provider: string;
  contact: {
    phone: string;
    email: string;
  };
  details: any;
  image: string;
}

export default function TouristBookings() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const bookings: Booking[] = [
    {
      id: 'BK001',
      type: 'package',
      title: 'Complete Manali Tour Package',
      destination: 'Manali, Himachal Pradesh',
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      guests: 2,
      totalAmount: 25000,
      status: 'confirmed',
      bookingDate: '2024-01-10',
      confirmationCode: 'MNL123456',
      provider: 'Mountain Adventures',
      contact: {
        phone: '+91 98765 43210',
        email: 'booking@mountainadv.com'
      },
      details: {
        inclusions: ['Hotel Stay', 'Meals', 'Sightseeing', 'Transport'],
        itinerary: ['Arrival in Manali', 'Rohtang Pass Visit', 'Solang Valley', 'Local Sightseeing', 'Departure']
      },
      image: '/api/placeholder/300/200'
    },
    {
      id: 'BK002',
      type: 'accommodation',
      title: 'Hotel Pine Valley',
      destination: 'Shimla, Himachal Pradesh',
      startDate: '2024-03-10',
      endDate: '2024-03-13',
      guests: 4,
      totalAmount: 12000,
      status: 'confirmed',
      bookingDate: '2024-02-01',
      confirmationCode: 'SML789012',
      provider: 'Hotel Pine Valley',
      contact: {
        phone: '+91 98765 12345',
        email: 'reservations@pinevalley.com'
      },
      details: {
        roomType: 'Deluxe Double Room',
        amenities: ['WiFi', 'Breakfast', 'Room Service', 'Parking'],
        checkIn: '14:00',
        checkOut: '11:00'
      },
      image: '/api/placeholder/300/200'
    },
    {
      id: 'BK003',
      type: 'activity',
      title: 'River Rafting Adventure',
      destination: 'Rishikesh, Uttarakhand',
      startDate: '2024-04-05',
      endDate: '2024-04-05',
      guests: 6,
      totalAmount: 3600,
      status: 'pending',
      bookingDate: '2024-03-15',
      confirmationCode: 'RSH345678',
      provider: 'Ganga Adventures',
      contact: {
        phone: '+91 98765 67890',
        email: 'info@gangaadv.com'
      },
      details: {
        duration: '4 hours',
        difficulty: 'Moderate',
        equipment: 'Provided',
        safety: 'Certified instructors'
      },
      image: '/api/placeholder/300/200'
    },
    {
      id: 'BK004',
      type: 'transport',
      title: 'Delhi to Manali Bus',
      destination: 'Manali',
      startDate: '2024-02-14',
      endDate: '2024-02-15',
      guests: 2,
      totalAmount: 1800,
      status: 'confirmed',
      bookingDate: '2024-01-08',
      confirmationCode: 'BUS901234',
      provider: 'HPTDC',
      contact: {
        phone: '+91 98765 11111',
        email: 'booking@hptdc.gov.in'
      },
      details: {
        busType: 'Volvo AC Sleeper',
        departureTime: '18:00',
        arrivalTime: '08:00',
        boardingPoint: 'Kashmere Gate ISBT'
      },
      image: '/api/placeholder/300/200'
    },
    {
      id: 'BK005',
      type: 'package',
      title: 'Kashmir Valley Tour',
      destination: 'Srinagar, Jammu & Kashmir',
      startDate: '2023-12-20',
      endDate: '2023-12-25',
      guests: 3,
      totalAmount: 35000,
      status: 'completed',
      bookingDate: '2023-11-15',
      confirmationCode: 'KSH567890',
      provider: 'Kashmir Travels',
      contact: {
        phone: '+91 98765 22222',
        email: 'info@kashmirtravels.com'
      },
      details: {
        inclusions: ['Houseboat Stay', 'Shikara Rides', 'Gulmarg Trip', 'All Meals'],
        highlights: ['Dal Lake', 'Gulmarg', 'Pahalgam', 'Sonamarg']
      },
      image: '/api/placeholder/300/200'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation':
        return <Home className="h-5 w-5" />;
      case 'activity':
        return <Mountain className="h-5 w-5" />;
      case 'transport':
        return <Car className="h-5 w-5" />;
      case 'package':
        return <Camera className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const filteredBookings = bookings
    .filter(booking => 
      (activeTab === 'all' || booking.status === activeTab) &&
      (booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       booking.destination.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
      } else if (sortBy === 'amount') {
        return b.totalAmount - a.totalAmount;
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  const tabs = [
    { id: 'all', label: 'All Bookings', count: bookings.length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
  ];

  return (
    <TouristLayout>
      <div className="space-y-4 sm:space-y-8 pb-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"></div>
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">My Bookings</h1>
            <p className="text-blue-100 text-sm sm:text-lg font-medium max-w-xl">
              Manage and track all your travel bookings in one place
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: 'Total', count: bookings.length, icon: Calendar, color: 'from-blue-500 to-indigo-600' },
            { label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
            { label: 'Pending', count: bookings.filter(b => b.status === 'pending').length, icon: Clock, color: 'from-amber-500 to-orange-600' },
            { label: 'Completed', count: bookings.filter(b => b.status === 'completed').length, icon: Star, color: 'from-purple-500 to-pink-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4 group hover:border-blue-200 transition-all">
              <div className={`p-2.5 sm:p-3.5 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none mt-1">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by title or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm sm:text-base font-medium transition-all"
              />
            </div>
            <div className="flex flex-row gap-2 sm:gap-4">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm sm:text-base font-bold transition-all cursor-pointer"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="name">Sort by Name</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>
              <button className="flex items-center justify-center px-6 py-3.5 sm:py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all text-sm sm:text-base font-bold whitespace-nowrap active:scale-95">
                <Filter className="h-5 w-5 mr-2 text-blue-600" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2.5 px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-black whitespace-nowrap border-b-4 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 sm:p-20 text-center shadow-sm border border-gray-100">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium max-w-xs mx-auto">Try adjusting your search or filter criteria to find what you're looking for.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-6">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 w-full">
                    <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                      <div className="bg-white p-3.5 rounded-2xl shadow-md z-10">
                        {getTypeIcon(booking.type)}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{booking.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black border-2 shadow-sm ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1.5 uppercase tracking-wider">{booking.status}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-gray-500 font-bold">
                        <div className="flex items-center text-xs sm:text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="truncate">{booking.destination}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{new Date(booking.startDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})} - {new Date(booking.endDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm">
                          <Users className="h-4 w-4 mr-2 text-emerald-500" />
                          <span>{booking.guests} {booking.guests > 1 ? 'guests' : 'guest'}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm sm:hidden">
                          <CreditCard className="h-4 w-4 mr-2 text-amber-500" />
                          <span className="font-black text-gray-900 text-lg">₹{booking.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-3xl font-black text-gray-900 mb-1 tracking-tight">₹{booking.totalAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 font-black bg-gray-50 px-3 py-1 rounded-lg inline-block uppercase tracking-widest border border-gray-100">ID: {booking.id}</div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-widest">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-2 text-gray-300" />
                        <span>Booked: {new Date(booking.bookingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="hidden sm:block text-gray-200">/</div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3.5 w-3.5 mr-2 text-gray-300" />
                        <span>Code: {booking.confirmationCode}</span>
                      </div>
                      <div className="hidden sm:block text-gray-200">/</div>
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-2 text-gray-300" />
                        <span>{booking.provider}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex items-center gap-3">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="flex items-center justify-center px-5 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </button>
                      {booking.status === 'confirmed' && (
                        <button className="flex items-center justify-center px-5 py-3 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95">
                          <Edit className="h-4 w-4 mr-2" />
                          Modify
                        </button>
                      )}
                      <button className="flex items-center justify-center px-5 py-3 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95">
                        <Download className="h-4 w-4 mr-2" />
                        Receipt
                      </button>
                      {booking.status === 'pending' && (
                        <button className="flex items-center justify-center px-5 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all text-xs font-black uppercase tracking-wider col-span-2 sm:col-auto active:scale-95">
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto transform animate-in slide-in-from-bottom sm:zoom-in-95 duration-400">
              <div className="p-6 sm:p-10">
                <div className="flex items-center justify-between mb-8 sticky top-0 bg-white z-10 py-2 border-b-2 border-gray-50">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Booking Details</h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-2.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all active:scale-90"
                  >
                    <XCircle className="h-7 w-7" />
                  </button>
                </div>

                <div className="space-y-8 sm:space-y-10">
                  {/* Basic Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center space-x-4">
                          <div className="bg-white p-3.5 rounded-2xl shadow-md">
                            {getTypeIcon(selectedBooking.type)}
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{selectedBooking.title}</h3>
                        </div>
                        <span className={`self-start sm:self-auto px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-black border-2 shadow-sm uppercase tracking-widest ${getStatusColor(selectedBooking.status)}`}>
                          <span className="flex items-center">
                            {getStatusIcon(selectedBooking.status)}
                            <span className="ml-2">{selectedBooking.status}</span>
                          </span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Destination</span>
                          <p className="text-gray-900 font-bold text-base flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                            {selectedBooking.destination}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Dates</span>
                          <p className="text-gray-900 font-bold text-base flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                            {new Date(selectedBooking.startDate).toLocaleDateString()} - {new Date(selectedBooking.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Guests</span>
                          <p className="text-gray-900 font-bold text-base flex items-center">
                            <Users className="h-4 w-4 mr-2 text-emerald-500" />
                            {selectedBooking.guests} people
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Total Amount</span>
                          <p className="text-blue-700 font-black text-2xl tracking-tight">₹{selectedBooking.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div className="space-y-4">
                    <h4 className="font-black text-gray-900 flex items-center text-xs uppercase tracking-[0.2em]">
                      Provider Information
                    </h4>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-blue-100 transition-colors">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</span>
                          <p className="text-gray-900 font-bold text-base">{selectedBooking.provider}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</span>
                          <a href={`tel:${selectedBooking.contact.phone}`} className="text-blue-600 font-bold text-base flex items-center hover:text-blue-700 transition-colors">
                            <Phone className="h-4 w-4 mr-2" />
                            {selectedBooking.contact.phone}
                          </a>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</span>
                          <a href={`mailto:${selectedBooking.contact.email}`} className="text-blue-600 font-bold text-base flex items-center hover:text-blue-700 transition-colors truncate">
                            <Mail className="h-4 w-4 mr-2" />
                            {selectedBooking.contact.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-4">
                    <h4 className="font-black text-gray-900 flex items-center text-xs uppercase tracking-[0.2em]">
                      Booking Information
                    </h4>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>
                          <p className="text-gray-900 font-black font-mono text-sm tracking-tighter uppercase">{selectedBooking.id}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conf. Code</span>
                          <p className="text-indigo-600 font-black font-mono text-sm bg-indigo-50 px-2 py-0.5 rounded-lg inline-block tracking-widest">{selectedBooking.confirmationCode}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booked On</span>
                          <p className="text-gray-900 font-bold">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                          <p className="text-gray-900 font-bold capitalize">{selectedBooking.type}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {selectedBooking.details && (
                    <div className="space-y-4">
                      <h4 className="font-black text-gray-900 flex items-center text-xs uppercase tracking-[0.2em]">
                        Service Details
                      </h4>
                      <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-6">
                          {Object.entries(selectedBooking.details).map(([key, value]) => (
                            <div key={key} className="space-y-2.5">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{key.replace(/([A-Z])/g, ' $1')}</span>
                              {Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-2.5 mt-1">
                                  {value.map((item, index) => (
                                    <span key={index} className="bg-white px-4 py-1.5 rounded-xl border border-gray-100 text-xs text-gray-700 font-bold shadow-sm">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-900 font-bold text-base">{String(value)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-10 border-t-2 border-gray-50">
                  <button className="flex-1 flex items-center justify-center px-6 py-4 text-gray-700 bg-white border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm active:scale-95">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </button>
                  {selectedBooking.status === 'confirmed' && (
                    <button className="flex-1 flex items-center justify-center px-6 py-4 text-white bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95">
                      <Edit className="h-4 w-4 mr-2" />
                      Modify Booking
                    </button>
                  )}
                  {selectedBooking.status === 'pending' && (
                    <button className="flex-1 flex items-center justify-center px-6 py-4 text-white bg-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200 active:scale-95">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TouristLayout>
  );
}
