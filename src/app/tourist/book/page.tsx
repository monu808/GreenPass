'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, Clock, Star, AlertTriangle, CheckCircle, Leaf, ShieldAlert, XCircle, RefreshCw } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { dbService } from '@/lib/databaseService';
import { policyEngine } from '@/lib/ecologicalPolicyEngine';
import { useAuth } from '@/contexts/AuthContext';
import { Destination, Alert } from '@/types';

function BookDestinationForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinationId = searchParams.get('destination');
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [eligibility, setEligibility] = useState<{ allowed: boolean; reason: string | null }>({ allowed: true, reason: null });
  const [ecoAlert, setEcoAlert] = useState<Partial<Alert> | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || user?.email || '',
    email: user?.email || '',
    phone: '',
    nationality: '',
    idProof: '',
    ecoPermitNumber: '',
    groupSize: 1,
    checkInDate: '',
    checkOutDate: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    specialRequests: '',
    acknowledged: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (destinationId) {
      loadDestination();
    }
  }, [destinationId]);

  useEffect(() => {
    if (destination) {
      checkEligibility(formData.groupSize);
    }
  }, [formData.groupSize, destination]);

  const loadDestination = async () => {
    try {
      const destinations = await dbService.getDestinations();
      const found = destinations.find(d => d.id === destinationId);
      
      if (found) {
        const destObj: Destination = {
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
        };
        setDestination(destObj);
        
        // Generate ecological alert if applicable
        const alert = policyEngine.generateEcologicalAlerts(destObj);
        setEcoAlert(alert);
      }
    } catch (error) {
      console.error('Error loading destination:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (size: number) => {
    if (!destination) return;
    const result = await dbService.checkBookingEligibility(destination.id, size);
    setEligibility(result);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
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
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const required = ['name', 'email', 'phone', 'nationality', 'idProof', 'checkInDate', 'checkOutDate'];
    
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    }
    
    if (!formData.emergencyContact.name) newErrors['emergencyContact.name'] = 'Name is required';
    if (!formData.emergencyContact.phone) newErrors['emergencyContact.phone'] = 'Phone is required';
    if (!formData.emergencyContact.relationship) newErrors['emergencyContact.relationship'] = 'Relationship is required';

    // Sensitivity-specific validation
    const policy = destination ? policyEngine.getPolicy(destination.ecologicalSensitivity) : null;
    if (destination && (destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical')) {
      if (policy?.requiresPermit && !formData.ecoPermitNumber) {
        newErrors['ecoPermitNumber'] = `An ecological permit is required for ${destination.ecologicalSensitivity} sensitivity areas.`;
      }
      if (policy?.requiresEcoBriefing && !formData.acknowledged) {
        newErrors['acknowledged'] = 'You must acknowledge the ecological briefing.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !destination) {
      alert('Please fill in all required fields');
      return;
    }

    if (!eligibility.allowed) {
      alert(eligibility.reason || 'Booking is not allowed due to ecological policies.');
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
    
    const available = policyEngine.getAvailableSpots(destination);
    const maxPossibleAvailable = destination.maxCapacity;
    
    if (available > maxPossibleAvailable * 0.3) {
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
  const adjustedCapacity = destination ? policyEngine.getAdjustedCapacity(destination) : 0;
  const policy = destination ? policyEngine.getPolicy(destination.ecologicalSensitivity) : null;

  return (
    <TouristLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Eligibility Warning */}
        {!eligibility.allowed && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-900 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top duration-300">
            <XCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Booking Restricted</h4>
              <p className="text-sm">{eligibility.reason}</p>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Book Your Visit</h1>
              
              <div className="space-y-1">
                <div className="flex items-center text-gray-500 font-medium">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  {destination.name}, {destination.location}
                </div>
              </div>

              <div className="flex items-center space-x-6 mt-6">
                <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                  <Users className="h-5 w-5 mr-2" />
                  <span className="font-semibold">
                    {policyEngine.getAvailableSpots(destination)} / {destination.maxCapacity} spots free (ecological limit)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-bold text-gray-300">4.3</span>
                </div>
                <span className={`text-sm font-bold mt-1 ${
                  availability.text === 'Fully Booked' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {availability.text}
                </span>
              </div>

              <div className={`flex items-center px-4 py-2 rounded-full border shadow-sm ${
                destination.ecologicalSensitivity === 'critical' ? 'bg-red-50 border-red-100 text-red-600' :
                destination.ecologicalSensitivity === 'high' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                destination.ecologicalSensitivity === 'medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                'bg-green-50 border-green-100 text-green-600'
              }`}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold capitalize">{destination.ecologicalSensitivity} Sensitivity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Section */}
        {destination && (destination.ecologicalSensitivity !== 'low' || policy?.bookingRestrictionMessage) && (
          <div className={`${
            destination.ecologicalSensitivity === 'critical' ? 'bg-red-50 border-red-400' :
            destination.ecologicalSensitivity === 'high' ? 'bg-orange-50 border-orange-400' :
            'bg-yellow-50 border-yellow-400'
          } border-2 rounded-2xl p-8 relative overflow-hidden`}>
            <div className="flex items-start space-x-4">
              <div className={`${
                destination.ecologicalSensitivity === 'critical' ? 'bg-red-100' :
                destination.ecologicalSensitivity === 'high' ? 'bg-orange-100' :
                'bg-yellow-100'
              } p-3 rounded-xl border`}>
                <ShieldAlert className={`${
                  destination.ecologicalSensitivity === 'critical' ? 'text-red-700' :
                  destination.ecologicalSensitivity === 'high' ? 'text-orange-700' :
                  'text-yellow-700'
                } h-8 w-8`} />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className={`${
                    destination.ecologicalSensitivity === 'critical' ? 'text-red-900' :
                    destination.ecologicalSensitivity === 'high' ? 'text-orange-900' :
                    'text-yellow-900'
                  } text-xl font-black uppercase tracking-tight`}>
                    {destination.ecologicalSensitivity} Sensitivity Policy
                  </h3>
                  <p className={`${
                    destination.ecologicalSensitivity === 'critical' ? 'text-red-800' :
                    destination.ecologicalSensitivity === 'high' ? 'text-orange-800' :
                    'text-yellow-800'
                  } font-bold mt-1`}>
                    {policy?.bookingRestrictionMessage || `This is a ${destination.ecologicalSensitivity}-sensitivity area. Please follow the guidelines.`}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {policy?.requiresPermit && (
                    <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase shadow-sm ${
                      destination.ecologicalSensitivity === 'critical' ? 'bg-red-100 text-red-900 border-red-200' :
                      destination.ecologicalSensitivity === 'high' ? 'bg-orange-100 text-orange-900 border-orange-200' :
                      'bg-yellow-100 text-yellow-900 border-yellow-200'
                    }`}>
                      Permit Required
                    </div>
                  )}
                  {policy?.requiresEcoBriefing && (
                    <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase shadow-sm ${
                      destination.ecologicalSensitivity === 'critical' ? 'bg-red-100 text-red-900 border-red-200' :
                      destination.ecologicalSensitivity === 'high' ? 'bg-orange-100 text-orange-900 border-orange-200' :
                      'bg-yellow-100 text-yellow-900 border-yellow-200'
                    }`}>
                      Eco-Briefing Mandatory
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                />
                {errors.name && <p className="text-xs text-red-500 font-bold mt-1">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                />
                {errors.email && <p className="text-xs text-red-500 font-bold mt-1">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                />
                {errors.phone && <p className="text-xs text-red-500 font-bold mt-1">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Nationality *</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.nationality ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                />
                {errors.nationality && <p className="text-xs text-red-500 font-bold mt-1">{errors.nationality}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">ID Proof Number *</label>
                <input
                  type="text"
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                  required
                  placeholder="Passport/Aadhar/Driving License"
                  className={`w-full px-4 py-4 bg-white border ${errors.idProof ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none placeholder:text-gray-300 text-gray-900`}
                />
                {errors.idProof && <p className="text-xs text-red-500 font-bold mt-1">{errors.idProof}</p>}
              </div>

              {(destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical') && policy?.requiresPermit && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Ecological Permit Number *</label>
                  <input
                    type="text"
                    name="ecoPermitNumber"
                    value={formData.ecoPermitNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your pre-obtained permit number"
                    className={`w-full px-4 py-4 bg-orange-50/30 border ${errors.ecoPermitNumber ? 'border-red-500' : 'border-orange-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none placeholder:text-gray-300 text-gray-900`}
                  />
                  {errors.ecoPermitNumber ? (
                    <p className="text-xs text-red-500 font-bold mt-1">{errors.ecoPermitNumber}</p>
                  ) : (
                    <p className="text-[10px] font-bold text-orange-600 ml-1 uppercase tracking-wider">Required for {destination.ecologicalSensitivity} sensitivity areas.</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Group Size *</label>
                <select
                  name="groupSize"
                  value={formData.groupSize}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none text-gray-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <option key={size} value={size}>{size} {size === 1 ? 'Person' : 'People'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Travel Dates */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Travel Dates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Check-in Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none pr-12 text-gray-900"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Check-out Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleInputChange}
                    required
                    min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none pr-12 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Contact Name *</label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors['emergencyContact.name'] ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                />
                {errors['emergencyContact.name'] && <p className="text-xs text-red-500 font-bold mt-1">{errors['emergencyContact.name']}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Contact Phone *</label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors['emergencyContact.phone'] ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                />
                {errors['emergencyContact.phone'] && <p className="text-xs text-red-500 font-bold mt-1">{errors['emergencyContact.phone']}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Relationship *</label>
                <select
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors['emergencyContact.relationship'] ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none text-gray-900`}
                >
                  <option value="">Select Relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
                {errors['emergencyContact.relationship'] && <p className="text-xs text-red-500 font-bold mt-1">{errors['emergencyContact.relationship']}</p>}
              </div>
            </div>
          </div>

          {/* Additional Information & Acknowledgement */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Additional Information</h3>
            
            {destination && (destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical') && policy?.requiresEcoBriefing && (
              <div className="bg-green-50/50 border border-green-200 rounded-xl p-6 mb-6">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      name="acknowledged"
                      checked={formData.acknowledged}
                      onChange={handleInputChange}
                      required
                      className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 transition-all cursor-pointer text-gray-900"
                    />
                  </div>
                  <span className="text-sm font-bold text-green-800 leading-relaxed">
                    I acknowledge that this is a {destination.ecologicalSensitivity} sensitivity area and I agree to undergo the mandatory ecological briefing before entry. *
                  </span>
                </label>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">Special Requests (Optional)</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none text-gray-900"
                placeholder="Any dietary requirements or accessibility needs?"
              ></textarea>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 text-gray-600 font-bold hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !eligibility.allowed}
              className={`px-12 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                submitting || !eligibility.allowed
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 shadow-green-200'
              }`}
            >
              {submitting ? 'Processing...' : 'Confirm Booking'}
            </button>
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
