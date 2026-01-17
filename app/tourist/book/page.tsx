'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, Clock, Star, AlertTriangle, CheckCircle, Leaf, ShieldAlert, XCircle, RefreshCw, Globe, TreePine, Zap, Flame, Info } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import { getCarbonCalculator } from '@/lib/carbonFootprintCalculator';
import { ORIGIN_LOCATIONS, getOriginLocationById } from '@/data/originLocations';
import { useAuth } from '@/contexts/AuthContext';
import { Destination, Alert, DynamicCapacityResult, CarbonFootprintResult, CarbonOffsetOption } from '@/types';

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
  const [availableSpots, setAvailableSpots] = useState<number>(0);
  const [adjustedCapacity, setAdjustedCapacity] = useState<number>(0);
  const [capacityResult, setCapacityResult] = useState<DynamicCapacityResult | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || user?.email || '',
    email: user?.email || '',
    phone: '',
    nationality: '',
    idProof: '',
    originLocation: '',
    transportType: 'CAR_PER_KM' as 'FLIGHT_PER_KM' | 'TRAIN_PER_KM' | 'BUS_PER_KM' | 'CAR_PER_KM',
    ecoPermitNumber: '',
    groupSize: 1,
    checkInDate: "",
    checkOutDate: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    specialRequests: '',
    acknowledged: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintResult | null>(null);

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

  useEffect(() => {
    if (destination && formData.originLocation) {
      calculateCarbonFootprint();
    }
  }, [destination, formData.originLocation, formData.groupSize, formData.transportType, formData.checkInDate, formData.checkOutDate]);

  const computeBookingFootprint = (): CarbonFootprintResult | null => {
    if (!destination || !formData.originLocation) return null;
    
    // Calculate actual stay nights from dates
    let stayNights = 2; // Default fallback
    if (formData.checkInDate && formData.checkOutDate) {
      const start = new Date(formData.checkInDate);
      const end = new Date(formData.checkOutDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Ensure at least 0 nights if dates are in reverse or same day
        stayNights = Math.max(0, diffDays);
      }
    }
    
    const calculator = getCarbonCalculator();
    return calculator.calculateBookingFootprint(
      formData.originLocation,
      destination.id,
      formData.groupSize,
      formData.transportType,
      stayNights,
      destination.coordinates.latitude,
      destination.coordinates.longitude
    );
  };

  const calculateCarbonFootprint = () => {
    const result = computeBookingFootprint();
    setCarbonFootprint(result);
  };

  const loadDestination = async () => {
    try {
      const dbService = getDbService();
      const policyEngine = getPolicyEngine();
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
        
        // Load capacity info
        const [available, adjusted, dynResult] = await Promise.all([
          policyEngine.getAvailableSpots(destObj),
          policyEngine.getAdjustedCapacity(destObj),
          policyEngine.getDynamicCapacity(destObj)
        ]);
        setAvailableSpots(available);
        setAdjustedCapacity(adjusted);
        setCapacityResult(dynResult);
        
        // Generate ecological alert if applicable
        const alert = policyEngine.generateEcologicalAlerts(destObj);
        setEcoAlert(alert);
      }
    } catch (error) {
      console.error("Error loading destination:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (size: number) => {
    if (!destination) return;
    const dbService = getDbService();
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
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
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
    const required = ['name', 'email', 'phone', 'nationality', 'idProof', 'originLocation', 'checkInDate', 'checkOutDate'];
    
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    }
    
    if (!formData.emergencyContact.name) newErrors['emergencyContact.name'] = 'Name is required';
    if (!formData.emergencyContact.phone) newErrors['emergencyContact.phone'] = 'Phone is required';
    if (!formData.emergencyContact.relationship) newErrors['emergencyContact.relationship'] = 'Relationship is required';

    // Sensitivity-specific validation
    const policyEngine = getPolicyEngine();
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
      const dbService = getDbService();
      
      // Calculate up-to-date footprint for persistence
      const currentFootprint = computeBookingFootprint();
      
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
        status: "pending" as const,
        emergency_contact_name: formData.emergencyContact.name,
        emergency_contact_phone: formData.emergencyContact.phone,
        emergency_contact_relationship: formData.emergencyContact.relationship,
        user_id: user?.id || null,
        registration_date: new Date().toISOString(),
        // Environmental fields
        origin_location_id: formData.originLocation,
        transport_type: formData.transportType,
        carbon_footprint: currentFootprint?.totalEmissions || 0,
        // Add missing required fields with defaults
        age: 0,
        gender: "prefer-not-to-say" as const,
        address: "",
        pin_code: "",
        id_proof_type: "aadhaar" as const,
      };
      
      console.log('Submitting booking data:', bookingData);
      
      const result = await dbService.addTourist(bookingData);
      
      if (!result) {
        throw new Error("Failed to create booking - no result returned");
      }

      // Update user eco-points if they are logged in
      if (user?.id && currentFootprint) {
        const pointsToAdd = currentFootprint.ecoPointsReward;
        await dbService.updateUserEcoPoints(user.id, pointsToAdd, 0);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/tourist/bookings");
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityStatus = () => {
    if (!destination) return { text: '', color: '' };
    
    const available = availableSpots;
    const maxPossibleAvailable = destination.maxCapacity;
    
    if (available > maxPossibleAvailable * 0.3) {
      return { text: 'Great Availability', color: 'text-green-600' };
    } else if (available > 0) {
      return { text: "Limited Spots", color: "text-yellow-600" };
    } else {
      return { text: "Fully Booked", color: "text-red-600" };
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
          <div className="mb-8 relative inline-block">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto" />
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-lg shadow-sm border border-yellow-500 animate-bounce">
              +{carbonFootprint ? carbonFootprint.ecoPointsReward : 0} PTS
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Booking Submitted Successfully!
          </h2>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8 text-left space-y-4">
            <p className="text-gray-600">
              Your booking request for <strong className="text-gray-900">{destination.name}</strong> has
              been submitted and is pending approval.
            </p>
            
            {carbonFootprint && (
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Carbon Footprint</div>
                  <div className="text-lg font-black text-gray-900">{carbonFootprint.totalEmissions.toFixed(2)} kg CO2e</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eco-Points Earned</div>
                  <div className="text-lg font-black text-green-600">
                    +{carbonFootprint.ecoPointsReward}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-gray-500">Redirecting to your bookings page...</p>
        </div>
      </TouristLayout>
    );
  }

  const availability = getAvailabilityStatus();
  const policyEngine = getPolicyEngine();
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

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                  <Users className="h-5 w-5 mr-2" />
                  <span className="font-semibold">
                    {availableSpots} / {adjustedCapacity} spots free (adjusted)
                  </span>
                </div>
                
                {capacityResult?.activeFactorFlags.weather && (
                  <div className="flex items-center px-3 py-1 bg-sky-50 text-sky-700 rounded-lg border border-sky-100 text-xs font-bold">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Weather Adjustment
                  </div>
                )}
                {capacityResult?.activeFactorFlags.season && (
                  <div className="flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold">
                    <Calendar className="h-3 w-3 mr-1" />
                    Seasonal Factor
                  </div>
                )}
                {capacityResult?.activeFactorFlags.utilization && (
                  <div className="flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 text-xs font-bold">
                    <Users className="h-3 w-3 mr-1" />
                    High Utilization
                  </div>
                )}
                {capacityResult?.activeFactorFlags.infrastructure && (
                  <div className="flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-xs font-bold">
                    <Leaf className="h-3 w-3 mr-1" />
                    Eco Strain
                  </div>
                )}
                {capacityResult?.activeFactorFlags.override && (
                  <div className="flex items-center px-3 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 text-xs font-bold">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Admin Override
                  </div>
                )}
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
                  {capacityResult?.displayMessage || availability.text}
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Origin Location *</label>
                <select
                  name="originLocation"
                  value={formData.originLocation}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.originLocation ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                >
                  <option value="">Select your origin state/region</option>
                  {ORIGIN_LOCATIONS.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.originLocation && <p className="text-xs text-red-500 font-bold mt-1">{errors.originLocation}</p>}
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Used to calculate your travel carbon footprint
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Transport Type *</label>
                <select
                  name="transportType"
                  value={formData.transportType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none text-gray-900"
                >
                  <option value="TRAIN_PER_KM">Train (Eco-Friendly)</option>
                  <option value="BUS_PER_KM">Public Bus (Eco-Friendly)</option>
                  <option value="CAR_PER_KM">Car / Private Vehicle</option>
                  <option value="FLIGHT_PER_KM">Flight</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Leaf className="h-3 w-3 mr-1 text-green-600" />
                  Public transport significantly reduces your footprint!
                </p>
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
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? "Person" : "People"}
                    </option>
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

          {/* Environmental Impact & Sustainability */}
          {carbonFootprint && (
            <div className="space-y-6">
              {/* Carbon Footprint Display */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Environmental Impact</h3>
                  <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    carbonFootprint.impactLevel === 'low' ? 'bg-green-100 text-green-700' :
                    carbonFootprint.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {carbonFootprint.impactLevel} Impact
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{carbonFootprint.totalEmissions.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">kg CO2e Total</div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{carbonFootprint.emissionsPerPerson.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">kg CO2e / Person</div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <TreePine className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{carbonFootprint.ecoPointsReward}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Eco-Points Potential</div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800 leading-relaxed">
                    This trip's emissions are equivalent to <strong>{carbonFootprint.comparison.trees_equivalent}</strong> trees absorbing CO2 for a year, or <strong>{carbonFootprint.comparison.car_miles_equivalent}</strong> miles driven in an average car.
                  </p>
                </div>
              </div>

              {/* Sustainability Tips */}
              <div className="bg-emerald-900 rounded-2xl p-8 text-white shadow-xl shadow-emerald-100/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-emerald-800 p-2 rounded-lg">
                    <Leaf className="h-6 w-6 text-emerald-300" />
                  </div>
                  <h3 className="text-xl font-bold">Sustainability Tips for {destination.name}</h3>
                </div>
                
                <div className="space-y-4">
                  {getCarbonCalculator().getSustainabilityTips(destination.ecologicalSensitivity).map((tip, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <p className="text-emerald-50 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
    <Suspense
      fallback={
        <TouristLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </TouristLayout>
      }
    >
      <BookDestinationForm />
    </Suspense>
  );
}
