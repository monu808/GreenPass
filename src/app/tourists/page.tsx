'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react';
import { dbService } from '@/lib/databaseService';
import { Tourist } from '@/types';

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
      await dbService.updateTouristStatus(touristId, newStatus);
      await loadTourists(); // Reload data
    } catch (error) {
      console.error('Error updating tourist status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesSearch = tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tourist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tourist.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || tourist.status === statusFilter;
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

  const TouristDetailsModal = ({ tourist, onClose }: { tourist: Tourist; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tourist Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-lg font-semibold text-gray-900">{tourist.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{tourist.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{tourist.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                <p className="text-gray-900">{tourist.nationality}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Size</label>
                <p className="text-gray-900">{tourist.groupSize} person(s)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <p className="text-gray-900">{tourist.destination || 'Unknown'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                <p className="text-gray-900">{new Date(tourist.checkInDate).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                <p className="text-gray-900">{new Date(tourist.checkOutDate).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <StatusBadge status={tourist.status} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                <p className="text-gray-900">{formatDateTime(tourist.registrationDate)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{tourist.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{tourist.emergencyContact.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <p className="text-gray-900">{tourist.emergencyContact.relationship}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tourist.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusUpdate(tourist.id, 'approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(tourist.id, 'cancelled')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}
            {tourist.status === 'approved' && (
              <button
                onClick={() => handleStatusUpdate(tourist.id, 'checked-in')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Check In
              </button>
            )}
            {tourist.status === 'checked-in' && (
              <button
                onClick={() => handleStatusUpdate(tourist.id, 'checked-out')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Check Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tourist Management</h1>
            <p className="text-gray-600">Manage tourist registrations and approvals</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{filteredTourists.length} tourists</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tourist List */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
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
            <div className="overflow-x-auto">
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
                            className="text-green-600 hover:text-green-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {tourist.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(tourist.id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(tourist.id, 'cancelled')}
                                className="text-red-600 hover:text-red-700"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
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
