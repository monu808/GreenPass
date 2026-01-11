'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, Clock, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { dbService } from '@/lib/databaseService';
import { useAuth } from '@/contexts/AuthContext';
import { Destination } from '@/types';

function BookDestinationForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinationId = searchParams.get('destination');
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || user?.email || '',
    email: user?.email || '',
    phone: '',
    nationality: '',
    idProof: '',
    groupSize: 1,
    checkInDate: '',
    checkOutDate: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    specialRequests: ''
  });

  useEffect(() => {
    if (destinationId) {
      loadDestination();
    }
  }, [destinationId]);

  const loadDestination = async () => {
    try {
      const destinations = await dbService.getDestinations();
      const found = destinations.find(d => d.id === destinationId);
      
      if (found) {
        setDestination({
          id: found.id,
          name: found.name,
          location: found.location,
          maxCapacity: found.max_capacity,
          currentOccupancy: found.current_occupancy,
          description: found.description,
          guidelines: found.guidelines,
          isActive: found.is_active,
          ecologicalSensitivity: found.ecological_sensitivity,
          coordinates: {
            latitude: found.latitude,
            longitude: found.longitude
          }
        });
      }
    } catch (error) {
      console.error('Error loading destination:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const required = ['name', 'email', 'phone', 'nationality', 'idProof', 'checkInDate', 'checkOutDate'];
    const emergencyRequired = ['name', 'phone', 'relationship'];
    
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        return false;
      }
    }
    
    for (const field of emergencyRequired) {
      if (!formData.emergencyContact[field as keyof typeof formData.emergencyContact]) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !destination) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const bookingData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        id_proof: formData.idProof,
        nationality: formData.nationality,
        group_size: parseInt(formData.groupSize.toString()),
        destination_id: destination.id,
        check_in_date: formData.checkInDate,
        check_out_date: formData.checkOutDate,
        status: 'pending' as const,
        emergency_contact_name: formData.emergencyContact.name,
        emergency_contact_phone: formData.emergencyContact.phone,
        emergency_contact_relationship: formData.emergencyContact.relationship,
        user_id: null, // Set to null to avoid foreign key constraint
        registration_date: new Date().toISOString(),
        // Add missing required fields with defaults
        age: 0, // Default age, consider collecting this in the form
        gender: 'prefer-not-to-say' as const,
        address: '', // Default empty address, consider collecting this in the form
        pin_code: '', // Default empty pin code, consider collecting this in the form
        id_proof_type: 'aadhaar' as const // Default ID proof type, consider deriving from idProof or adding a selector
      };
      
      console.log('Submitting booking data:', bookingData);
      console.log('Destination:', destination);
      
      const result = await dbService.addTourist(bookingData);
      
      if (!result) {
        throw new Error('Failed to create booking - no result returned');
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/tourist/bookings');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityStatus = () => {
    if (!destination) return { text: '', color: '' };
    
    const available = destination.maxCapacity - destination.currentOccupancy;
    if (available > destination.maxCapacity * 0.3) {
      return { text: 'Great Availability', color: 'text-green-600' };
    } else if (available > 0) {
      return { text: 'Limited Spots', color: 'text-yellow-600' };
    } else {
      return { text: 'Fully Booked', color: 'text-red-600' };
    }
  };

  if (loading) {
    return (
      <TouristLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </TouristLayout>
    );
  }

  if (!destination) {
    return (
      <TouristLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Destination Not Found</h2>
          <button 
            onClick={() => router.push('/tourist/destinations')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Browse Destinations
          </button>
        </div>
      </TouristLayout>
    );
  }

  if (showSuccess) {
    return (
      <TouristLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Submitted Successfully!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your booking request for <strong>{destination.name}</strong> has been submitted and is pending approval.
          </p>
          <p className="text-gray-500">
            Redirecting to your bookings page...
          </p>
        </div>
      </TouristLayout>
    );
  }

  const availability = getAvailabilityStatus();

  return (
    <TouristLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Visit</h1>
              <h2 className="text-xl text-gray-600 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {destination.name}, {destination.location}
              </h2>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-2">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="font-medium">4.{Math.floor(Math.random() * 5) + 3}</span>
              </div>
              <span className={`text-sm font-medium ${availability.color}`}>
                {availability.text}
              </span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800">
                {destination.maxCapacity - destination.currentOccupancy} spots available out of {destination.maxCapacity}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality *
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Number *
                </label>
                <input
                  type="text"
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                  required
                  placeholder="Passport/Aadhar/Driving License"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Size *
                </label>
                <select
                  name="groupSize"
                  value={formData.groupSize}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <option key={size} value={size}>{size} {size === 1 ? 'Person' : 'People'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Travel Dates */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Travel Dates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  required
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <select
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="relative">Relative</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Special Requests (Optional)</h3>
            
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              rows={4}
              placeholder="Any special requirements, dietary restrictions, accessibility needs, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Guidelines */}
          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Important Guidelines</h3>
                <ul className="text-yellow-700 space-y-2 text-sm">
                  {destination.guidelines.map((guideline, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{guideline}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  By submitting this form, you agree to follow all destination guidelines and regulations.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-colors ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Booking Request'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </TouristLayout>
  );
}

export default function BookDestination() {
  return (
    <Suspense fallback={
      <TouristLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </TouristLayout>
    }>
      <BookDestinationForm />
    </Suspense>
  );
}
