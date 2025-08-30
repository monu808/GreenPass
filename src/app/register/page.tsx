'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { User } from 'lucide-react';
import { dbService } from '@/lib/databaseService';
import { generateId, validateEmail, validatePhone, validateIdProof } from '@/lib/utils';
import type { Database } from '@/types/database';

type Destination = Database['public']['Tables']['destinations']['Row'];
type TouristInsert = Database['public']['Tables']['tourists']['Insert'];

export default function RegisterTourist() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idProof: '',
    nationality: 'Indian',
    groupSize: 1,
    destination: '',
    checkInDate: '',
    checkOutDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await dbService.getDestinations();
        setDestinations(data);
      } catch (error) {
        console.error('Error loading destinations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(formData.phone)) newErrors.phone = 'Invalid phone number';
    
    if (!formData.idProof.trim()) newErrors.idProof = 'ID proof is required';
    else if (!validateIdProof(formData.idProof)) newErrors.idProof = 'ID proof must be 8-20 characters';
    
    if (!formData.destination) newErrors.destination = 'Destination is required';
    if (!formData.checkInDate) newErrors.checkInDate = 'Check-in date is required';
    if (!formData.checkOutDate) newErrors.checkOutDate = 'Check-out date is required';
    
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      if (checkOut <= checkIn) {
        newErrors.checkOutDate = 'Check-out date must be after check-in date';
      }
    }

    if (formData.groupSize < 1 || formData.groupSize > 10) {
      newErrors.groupSize = 'Group size must be between 1 and 10';
    }

    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    if (!formData.emergencyContactRelationship.trim()) newErrors.emergencyContactRelationship = 'Emergency contact relationship is required';

    // Check capacity
    if (formData.destination) {
      const destination = destinations.find(d => d.id === formData.destination);
      if (destination) {
        const availableCapacity = destination.max_capacity - destination.current_occupancy;
        if (formData.groupSize > availableCapacity) {
          newErrors.groupSize = `Only ${availableCapacity} slots available for this destination`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const tourist: TouristInsert = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        id_proof: formData.idProof,
        nationality: formData.nationality,
        group_size: formData.groupSize,
        destination_id: formData.destination,
        check_in_date: formData.checkInDate,
        check_out_date: formData.checkOutDate,
        status: 'pending',
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relationship: formData.emergencyContactRelationship,
        registration_date: new Date().toISOString().split('T')[0]
      };

      await dbService.addTourist(tourist);
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        idProof: '',
        nationality: 'Indian',
        groupSize: 1,
        destination: '',
        checkInDate: '',
        checkOutDate: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: ''
      });

    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDestination = destinations.find(d => d.id === formData.destination);
  const availableCapacity = formData.destination && selectedDestination ? 
    selectedDestination.max_capacity - selectedDestination.current_occupancy : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading destinations...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitSuccess) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-900 mb-2">Registration Successful!</h2>
            <p className="text-green-700 mb-4">
              Your tourist registration has been submitted successfully. You will receive a confirmation email shortly.
            </p>
            <p className="text-sm text-green-600 mb-4">
              Your application is now pending approval. You will be notified once it&apos;s reviewed.
            </p>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Register Another Tourist
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tourist Registration</h1>
          <p className="text-gray-600">Register for visiting ecologically sensitive areas in Jammu & Himachal Pradesh</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="idProof" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Proof Number *
                </label>
                <input
                  type="text"
                  id="idProof"
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.idProof ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Aadhaar/Passport/Driving License"
                />
                {errors.idProof && <p className="text-red-500 text-xs mt-1">{errors.idProof}</p>}
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality *
                </label>
                <select
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                >
                  <option value="Indian">Indian</option>
                  <option value="Foreign">Foreign National</option>
                </select>
              </div>

              <div>
                <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Size *
                </label>
                <input
                  type="number"
                  id="groupSize"
                  name="groupSize"
                  min="1"
                  max="10"
                  value={formData.groupSize}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.groupSize ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.groupSize && <p className="text-red-500 text-xs mt-1">{errors.groupSize}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Travel Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination *
                </label>
                <select
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.destination ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a destination</option>
                  {destinations.filter(d => d.is_active).map(dest => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}, {dest.location} (Available: {dest.max_capacity - dest.current_occupancy})
                    </option>
                  ))}
                </select>
                {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
              </div>

              <div>
                <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.checkInDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.checkInDate && <p className="text-red-500 text-xs mt-1">{errors.checkInDate}</p>}
              </div>

              <div>
                <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.checkOutDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.checkOutDate && <p className="text-red-500 text-xs mt-1">{errors.checkOutDate}</p>}
              </div>

              {selectedDestination && (
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedDestination.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedDestination.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Available Capacity:</span>
                    <span className="font-medium text-gray-900">{availableCapacity} / {selectedDestination.max_capacity}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Guidelines:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {selectedDestination.guidelines.map((guideline, index) => (
                        <li key={index}>• {guideline}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Emergency contact name"
                />
                {errors.emergencyContactName && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName}</p>}
              </div>

              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Emergency contact phone"
                />
                {errors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>}
              </div>

              <div>
                <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 ${
                    errors.emergencyContactRelationship ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
                {errors.emergencyContactRelationship && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelationship}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Registering...' : 'Register Tourist'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
