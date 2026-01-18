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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-blue-100">Manage and track all your travel bookings</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="name">Sort by Name</option>
              </select>
              <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(booking.type)}
                        <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{booking.destination}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm">{booking.guests} guests</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">₹{booking.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Booking ID: {booking.id}</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Booked on {new Date(booking.bookingDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Confirmation: {booking.confirmationCode}</span>
                      <span>•</span>
                      <span>Provider: {booking.provider}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      {booking.status === 'confirmed' && (
                        <button className="flex items-center px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <Edit className="h-4 w-4 mr-1" />
                          Modify
                        </button>
                      )}
                      <button className="flex items-center px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      {booking.status === 'pending' && (
                        <button className="flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <XCircle className="h-4 w-4 mr-1" />
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-in zoom-in-95 duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(selectedBooking.type)}
                        <h3 className="text-xl font-semibold text-gray-900">{selectedBooking.title}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusIcon(selectedBooking.status)}
                        <span className="ml-1 capitalize">{selectedBooking.status}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Destination:</span>
                        <p className="text-gray-900">{selectedBooking.destination}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dates:</span>
                        <p className="text-gray-900">
                          {new Date(selectedBooking.startDate).toLocaleDateString()} - {new Date(selectedBooking.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Guests:</span>
                        <p className="text-gray-900">{selectedBooking.guests} people</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Total Amount:</span>
                        <p className="text-gray-900 font-semibold">₹{selectedBooking.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Provider Information</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Provider:</span>
                          <p className="text-gray-900">{selectedBooking.provider}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <p className="text-gray-900">{selectedBooking.contact.phone}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <p className="text-gray-900">{selectedBooking.contact.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Booking ID:</span>
                          <p className="text-gray-900">{selectedBooking.id}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Confirmation Code:</span>
                          <p className="text-gray-900 font-mono">{selectedBooking.confirmationCode}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Booking Date:</span>
                          <p className="text-gray-900">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <p className="text-gray-900 capitalize">{selectedBooking.type}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {selectedBooking.details && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        {Object.entries(selectedBooking.details).map(([key, value]) => (
                          <div key={key} className="mb-3 last:mb-0">
                            <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            {Array.isArray(value) ? (
                              <ul className="mt-1 list-disc list-inside text-gray-900 text-sm">
                                {value.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-900">{String(value)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  {selectedBooking.status === 'confirmed' && (
                    <button className="flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit className="h-4 w-4 mr-2" />
                      Modify Booking
                    </button>
                  )}
                  {selectedBooking.status === 'pending' && (
                    <button className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
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
