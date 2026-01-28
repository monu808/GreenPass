'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useModalAccessibility } from '@/lib/accessibility';
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  Mail,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { Tourist } from '@/types';
import { sanitizeSearchTerm } from '@/lib/utils';
import { validateInput, SearchFilterSchema } from '@/lib/validation';

export default function TouristManagement() {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadTourists();
  }, []);

  const loadTourists = async () => {
    try {
      setLoading(true);
      const dbService = getDbService();
      const data = await dbService.getTourists();
      setTourists(data);
    } catch (error) {
      console.error('Error loading tourists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (touristId: string, newStatus: Tourist['status']) => {
    try {
      const dbService = getDbService();
      await dbService.updateTouristStatus(touristId, newStatus);
      await loadTourists(); // Reload data
    } catch (error) {
  let msg = 'tourist management failed.';
  if (error instanceof Error) {
    if (error.message.includes('validation')) {
      msg = 'invalid data: please check the inputs.';
    } else if (error.message.includes('network')) {
      msg = 'network issue: please check your connection.';
    } else if (error.message.includes('database')) {
      msg = 'server error: tourists could not be loaded.';
    } else if (error.message.includes('permission')) {
      msg = 'permission denied: you do not have access to this resource.';
    } else if (error.message.includes('timeout')) {
      msg = 'Request timeout: please try again.';
    } else {
      msg = `Error: ${error.message}`;
    }
  }
  alert(msg);
}
  };

  const filteredTourists = tourists.filter(tourist => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
      status: statusFilter === 'all' ? undefined : statusFilter,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: '', status: undefined };

    const matchesSearch = 
      tourist.name.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || '') ||
      tourist.email.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || '') ||
      tourist.phone.includes(validFilters.searchTerm || '');
                         
    const matchesStatus = statusFilter === 'all' || tourist.status === validFilters.status;
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'checked-in': return 'text-green-600 bg-green-50';
      case 'checked-out': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'checked-in': return <UserCheck className="h-4 w-4" />;
      case 'checked-out': return <UserX className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1 capitalize">{status}</span>
    </span>
  );

  const TouristDetailsModal = ({ tourist, onClose }: { tourist: Tourist; onClose: () => void }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useModalAccessibility({ modalRef, isOpen: true, onClose });

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourist-details-title"
      >
        <div 
          ref={modalRef}
          className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
        >
          {/* Sticky Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <div>
              <h2 id="tourist-details-title" className="text-xl sm:text-2xl font-bold text-gray-900">Tourist Details</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {tourist.id.slice(0, 8)}...</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <XCircle className="h-7 w-7" />
            </button>
          </div>

          <div className="p-4 sm:p-8 overflow-y-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <p className="text-lg font-bold text-gray-900">{tourist.name}</p>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center text-gray-700">
                    <div className="p-2 bg-gray-50 rounded-lg mr-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Email</label>
                      <p className="text-sm font-medium">{tourist.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="p-2 bg-gray-50 rounded-lg mr-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Phone</label>
                      <p className="text-sm font-medium">{tourist.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nationality</label>
                    <p className="text-sm font-semibold text-gray-900">{tourist.nationality}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Group Size</label>
                    <div className="flex items-center text-sm font-semibold text-gray-900">
                      <Users className="h-4 w-4 mr-1.5 text-gray-400" />
                      {tourist.groupSize} {tourist.groupSize === 1 ? 'Person' : 'People'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</label>
                  <p className="text-base font-bold text-green-700">{tourist.destination || 'Unknown'}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-in</label>
                    <p className="text-sm font-semibold text-gray-900">{new Date(tourist.checkInDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-out</label>
                    <p className="text-sm font-semibold text-gray-900">{new Date(tourist.checkOutDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current Status</label>
                    <StatusBadge status={tourist.status} />
                  </div>
                  <div className="text-right">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Registered On</label>
                    <p className="text-[11px] font-medium text-gray-500">{formatDateTime(tourist.registrationDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                <span className="w-8 h-[1px] bg-gray-200 mr-3"></span>
                Emergency Contact
                <span className="w-8 h-[1px] bg-gray-200 ml-3"></span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-rose-50/30 p-4 rounded-xl border border-rose-100/50">
                <div>
                  <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Name</label>
                  <p className="text-sm font-bold text-gray-900">{tourist.emergencyContact.name}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Phone</label>
                  <p className="text-sm font-bold text-gray-900">{tourist.emergencyContact.phone}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Relationship</label>
                  <p className="text-sm font-bold text-gray-900">{tourist.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 mt-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              {tourist.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(tourist.id, 'approved')}
                    className="flex-1 min-h-[48px] bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-md shadow-green-100 flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve Registration
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(tourist.id, 'cancelled')}
                    className="flex-1 min-h-[48px] bg-white text-rose-600 border border-rose-200 rounded-xl font-bold text-sm hover:bg-rose-50 active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </button>
                </>
              )}
              {tourist.status === 'approved' && (
                <button
                  onClick={() => handleStatusUpdate(tourist.id, 'checked-in')}
                  className="flex-1 min-h-[48px] bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-100 flex items-center justify-center"
                >
                  <UserCheck className="h-5 w-5 mr-2" />
                  Mark as Checked In
                </button>
              )}
              {tourist.status === 'checked-in' && (
                <button
                  onClick={() => handleStatusUpdate(tourist.id, 'checked-out')}
                  className="flex-1 min-h-[48px] bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 active:scale-[0.98] transition-all shadow-md flex items-center justify-center"
                >
                  <UserX className="h-5 w-5 mr-2" />
                  Check Out Guest
                </button>
              )}
              <button
                onClick={onClose}
                className="sm:hidden min-h-[48px] text-gray-500 font-bold text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Tourist Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage tourist registrations and approvals</p>
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <Users className="h-4 w-4" />
            <span>{filteredTourists.length} tourists total</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <label htmlFor="tourist-search" className="sr-only">Search tourists by name, email, or phone</label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                <input
                  id="tourist-search"
                  type="text"
                  placeholder="Search name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="sm:w-56">
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base bg-white shadow-sm transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="checked-in">Currently Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tourist List */}
        <div className="bg-white shadow-md border border-gray-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading tourists...</p>
            </div>
          ) : filteredTourists.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tourists found</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tourist</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTourists.map((tourist) => (
                      <tr key={tourist.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tourist.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {tourist.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {tourist.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{tourist.destination || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(tourist.checkInDate).toLocaleDateString()} - {new Date(tourist.checkOutDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{tourist.groupSize}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={tourist.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTourist(tourist);
                                setShowDetails(true);
                              }}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label={`View details for ${tourist.name}`}
                            >
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            </button>
                            {tourist.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(tourist.id, 'approved')}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                  aria-label={`Approve ${tourist.name}`}
                                  title="Approve"
                                >
                                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(tourist.id, 'cancelled')}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                  aria-label={`Reject ${tourist.name}`}
                                  title="Reject"
                                >
                                  <XCircle className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View (Card Layout) */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredTourists.map((tourist) => (
                  <div key={tourist.id} className="p-4 sm:p-6 space-y-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{tourist.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1.5 space-y-1">
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <span className="truncate">{tourist.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <span>{tourist.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={tourist.status} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 block uppercase text-[10px] font-bold tracking-wider mb-0.5">Destination</span>
                        <span className="text-gray-900 font-semibold truncate block">{tourist.destination || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block uppercase text-[10px] font-bold tracking-wider mb-0.5">Group Size</span>
                        <div className="flex items-center text-gray-900 font-semibold">
                          <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {tourist.groupSize}
                        </div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-gray-100 mt-1">
                        <span className="text-gray-400 block uppercase text-[10px] font-bold tracking-wider mb-0.5">Travel Dates</span>
                        <span className="text-gray-900 font-semibold">
                          {new Date(tourist.checkInDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} - {new Date(tourist.checkOutDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedTourist(tourist);
                          setShowDetails(true);
                        }}
                        className="flex-1 min-h-[44px] flex items-center justify-center bg-green-50 text-green-700 font-bold text-sm rounded-xl border border-green-100 active:bg-green-100 transition-all"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      {tourist.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(tourist.id, 'approved')}
                          className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:bg-blue-100 transition-all"
                          aria-label="Quick Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tourist Details Modal */}
        {showDetails && selectedTourist && (
          <TouristDetailsModal
            tourist={selectedTourist}
            onClose={() => {
              setShowDetails(false);
              setSelectedTourist(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
