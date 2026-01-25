'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, Star, AlertTriangle, CheckCircle, Leaf, ShieldAlert, XCircle, RefreshCw, Globe, TreePine, Zap, Info } from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { getDbService } from '@/lib/databaseService';
import { getPolicyEngine, WeatherConditions } from '@/lib/ecologicalPolicyEngine';
import { getCarbonCalculator } from '@/lib/carbonFootprintCalculator';
import {
  sanitizeForDatabase,
  sanitizeObject,
  sanitizeSearchTerm
} from '@/lib/utils';
import {
  validateInput,
  BookingDataSchema,
  TransportTypeEnum
} from '@/lib/validation';
import {
  isValidEcologicalSensitivity,
  isValidWasteManagementLevel
} from '@/lib/typeGuards';
import {
  calculateSustainabilityScore,
  findLowImpactAlternatives
} from '@/lib/sustainabilityScoring';
import { ORIGIN_LOCATIONS } from '@/data/originLocations';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingMutation } from '@/hooks/mutations/useBookingMutation';
import { useToast } from '@/components/providers/ToastProvider';
import {
  Destination,
  Alert,
  DynamicCapacityResult,
  CarbonFootprintResult,
  SustainabilityFeatures
} from '@/types';

function BookDestinationForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinationId = searchParams.get('destination');
  const toast = useToast();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [allDestinationsState, setAllDestinationsState] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [eligibility, setEligibility] = useState<{ allowed: boolean; reason: string | null }>({ allowed: true, reason: null });
  const [ecoAlert, setEcoAlert] = useState<Partial<Alert> | null>(null);
  const [availableSpots, setAvailableSpots] = useState<number>(0);
  const [adjustedCapacity, setAdjustedCapacity] = useState<number>(0);
  const [capacityResult, setCapacityResult] = useState<DynamicCapacityResult | null>(null);

  const policyEngine = getPolicyEngine();
  const policy = destination ? policyEngine.getPolicy(destination.ecologicalSensitivity) : null;

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

  const loadDestination = useCallback(async () => {
    try {
      const dbService = getDbService();
      const fetchedDestinations = await dbService.getDestinations();

      const mappedDestinations: Destination[] = fetchedDestinations.map(d => {
        // Validate ecological sensitivity
        const ecologicalSensitivity = isValidEcologicalSensitivity(d.ecological_sensitivity)
          ? d.ecological_sensitivity
          : 'medium';

        // Normalize sustainability features or use typed object from database
        let sustainabilityFeatures: SustainabilityFeatures | undefined = undefined;

        if (d.sustainability_features) {
          // Use type guard for inner enum validation if needed, otherwise trust typed DB row
          const sf = d.sustainability_features;
          sustainabilityFeatures = {
            ...sf,
            wasteManagementLevel: isValidWasteManagementLevel(sf.wasteManagementLevel)
              ? sf.wasteManagementLevel
              : 'basic'
          };
        }

        return {
          id: d.id,
          name: d.name,
          location: d.location,
          maxCapacity: d.max_capacity,
          currentOccupancy: d.current_occupancy,
          description: d.description,
          guidelines: Array.isArray(d.guidelines) ? d.guidelines : [],
          isActive: d.is_active,
          ecologicalSensitivity,
          coordinates: {
            latitude: d.latitude,
            longitude: d.longitude
          },
          sustainabilityFeatures
        };
      });

      setAllDestinationsState(mappedDestinations);
      const found = mappedDestinations.find(d => d.id === destinationId);

      if (found) {
        setDestination(found);

        // 1. Fetch weather and indicators once
        const [weather, indicators] = await Promise.all([
          dbService.getLatestWeatherData(found.id),
          dbService.getLatestEcologicalIndicators(found.id)
        ]);

        const weatherConditions: WeatherConditions | undefined = weather ? {
          alert_level: weather.alert_level || 'none',
          temperature: weather.temperature,
          humidity: weather.humidity
        } : undefined;

        // 2. Use single dynamic capacity call with pre-fetched data
        const dynResult = await policyEngine.getDynamicCapacity(found, weatherConditions, indicators);

        setAvailableSpots(dynResult.availableSpots);
        setAdjustedCapacity(dynResult.adjustedCapacity);
        setCapacityResult(dynResult);

        // Generate ecological alert if applicable
        const alert = policyEngine.generateEcologicalAlerts(found);
        setEcoAlert(alert);
      }
    } catch (error) {
      console.error("Error loading destination:", error);
    } finally {
      setLoading(false);
    }
  }, [destinationId]);

  const checkEligibility = useCallback(async (size: number) => {
    if (!destination) return;
    const dbService = getDbService();
    const result = await dbService.checkBookingEligibility(destination.id, size);
    setEligibility(result);
  }, [destination]);

  const computeBookingFootprint = useCallback((): CarbonFootprintResult | null => {
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
  }, [destination, formData.originLocation, formData.groupSize, formData.transportType, formData.checkInDate, formData.checkOutDate]);

  const calculateCarbonFootprint = useCallback(() => {
    const result = computeBookingFootprint();
    setCarbonFootprint(result);
  }, [computeBookingFootprint]);

  useEffect(() => {
    if (destinationId) {
      loadDestination();
    }
  }, [destinationId, loadDestination]);

  useEffect(() => {
    if (destination) {
      checkEligibility(formData.groupSize);
    }
  }, [formData.groupSize, destination, checkEligibility]);

  useEffect(() => {
    if (destination && formData.originLocation) {
      calculateCarbonFootprint();
    }
  }, [destination, formData.originLocation, formData.groupSize, formData.transportType, formData.checkInDate, formData.checkOutDate, calculateCarbonFootprint]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'groupSize') {
      const numValue = parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 1 : numValue
      }));
    } else if (name.startsWith('emergencyContact.')) {
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

  const sanitizeFormData = (data: typeof formData) => {
    return {
      ...sanitizeObject(data),
      specialRequests: sanitizeForDatabase(data.specialRequests),
      ecoPermitNumber: sanitizeSearchTerm(data.ecoPermitNumber), // Removes regex special chars
      groupSize: typeof data.groupSize === 'number' ? data.groupSize : parseInt(String(data.groupSize), 10) || 1,
    };
  };

  const validateForm = (): boolean => {
    const sanitizedData = sanitizeFormData(formData);

    const bookingResult = validateInput(BookingDataSchema, {
      groupSize: sanitizedData.groupSize,
      checkInDate: sanitizedData.checkInDate,
      checkOutDate: sanitizedData.checkOutDate,
      emergencyContact: sanitizedData.emergencyContact,
      transportType: sanitizedData.transportType.split('_')[0].toLowerCase() as any, // Map back to schema enum
      originLocationId: sanitizedData.originLocation,
    });

    const newErrors: Record<string, string> = {};

    if (!bookingResult.success) {
      // Map nested emergency contact errors
      if (bookingResult.errors['emergencyContact.name']) newErrors['emergencyContact.name'] = bookingResult.errors['emergencyContact.name'];
      if (bookingResult.errors['emergencyContact.phone']) newErrors['emergencyContact.phone'] = bookingResult.errors['emergencyContact.phone'];
      if (bookingResult.errors['emergencyContact.relationship']) newErrors['emergencyContact.relationship'] = bookingResult.errors['emergencyContact.relationship'];

      // Map other booking errors
      if (bookingResult.errors.groupSize) newErrors.groupSize = bookingResult.errors.groupSize;
      if (bookingResult.errors.checkInDate) newErrors.checkInDate = bookingResult.errors.checkInDate;
      if (bookingResult.errors.checkOutDate) newErrors.checkOutDate = bookingResult.errors.checkOutDate;
    }

    if (!sanitizedData.name.trim()) newErrors.name = 'Name is required';
    if (!sanitizedData.email.trim()) newErrors.email = 'Email is required';
    if (!sanitizedData.phone.trim()) newErrors.phone = 'Phone number is required';

    // Ecological Permit Validation
    if (destination && (destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical')) {
      if (policy?.requiresPermit) {
        if (!sanitizedData.ecoPermitNumber) {
          newErrors['ecoPermitNumber'] = `An ecological permit is required for ${destination.ecologicalSensitivity} sensitivity areas.`;
        } else if (!/^ECO-\d{4}-\d{6}$/.test(sanitizedData.ecoPermitNumber)) {
          // Example pattern validation for permit number
          newErrors['ecoPermitNumber'] = 'Invalid permit format. Expected ECO-YYYY-XXXXXX';
        }
      }
      if (policy?.requiresEcoBriefing && !sanitizedData.acknowledged) {
        newErrors['acknowledged'] = 'You must acknowledge the ecological briefing.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Booking mutation hook with optimistic updates
  const bookingMutation = useBookingMutation({
    onSuccess: async () => {
      // Update user eco-points if they are logged in
      if (user?.id && carbonFootprint) {
        try {
          const dbService = getDbService();
          const pointsToAdd = carbonFootprint.ecoPointsReward;
          await dbService.updateUserEcoPoints(user.id, pointsToAdd, 0);
        } catch (error) {
          console.error('Failed to update eco-points:', error);
          // Non-critical: booking succeeded, just log the error
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/tourist/bookings");
      }, 3000);
    },
    onError: (error) => {
      // Toast already shown by mutation hook, just log for debugging
      console.error("Booking error:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !destination) {
      toast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!eligibility.allowed) {
      toast.error('Booking Not Allowed', eligibility.reason || 'Booking is not allowed due to ecological policies.');
      return;
    }

    const sanitizedData = sanitizeFormData(formData);

    // Calculate up-to-date footprint for persistence
    const currentFootprint = computeBookingFootprint();

    // Validate and convert group size
    const groupSize = parseInt(String(sanitizedData.groupSize), 10);
    if (isNaN(groupSize) || groupSize <= 0) {
      toast.error('Invalid Group Size', 'Please enter a valid group size.');
      return;
    }

    const bookingData = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      id_proof: sanitizedData.idProof,
      nationality: sanitizedData.nationality,
      group_size: groupSize,
      destination_id: destination.id,
      check_in_date: sanitizedData.checkInDate,
      check_out_date: sanitizedData.checkOutDate,
      status: "pending" as const,
      emergency_contact_name: sanitizedData.emergencyContact.name,
      emergency_contact_phone: sanitizedData.emergencyContact.phone,
      emergency_contact_relationship: sanitizedData.emergencyContact.relationship,
      user_id: user?.id || null,
      registration_date: new Date().toISOString(),
      // Environmental fields
      origin_location_id: sanitizedData.originLocation,
      transport_type: sanitizedData.transportType,
      carbon_footprint: currentFootprint?.totalEmissions || 0,
      // Add missing required fields with defaults
      age: 0,
      gender: "prefer-not-to-say" as const,
      address: "",
      pin_code: "",
      id_proof_type: "aadhaar" as const,
    };

    // Use the mutation - optimistic updates and toasts are handled by the hook
    bookingMutation.mutate(bookingData);
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

  return (
    <TouristLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Eligibility Warning */}
        {!eligibility.allowed && (
          <div
            className="p-4 bg-red-100 border border-red-300 text-red-900 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top duration-300"
            role="alert"
          >
            <XCircle className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
            <div>
              <h4 className="font-bold">Booking Restricted</h4>
              <p className="text-sm">{eligibility.reason}</p>
            </div>
          </div>
        )}

        {/* Ecological Alert (Fix for #81) */}
        {ecoAlert && (
          <div
            className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top duration-300"
            role="alert"
          >
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-yellow-600" aria-hidden="true" />
            <div>
              <h4 className="font-bold">Ecological Notice</h4>
              <p className="text-sm">{ecoAlert.message}</p>
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
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" aria-hidden="true" />
                  {destination.name}, {destination.location}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                  <Users className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span className="font-semibold">
                    {availableSpots} / {adjustedCapacity} spots free (adjusted)
                  </span>
                </div>

                {capacityResult?.activeFactorFlags.weather && (
                  <div className="flex items-center px-3 py-1 bg-sky-50 text-sky-700 rounded-lg border border-sky-100 text-xs font-bold">
                    <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
                    Weather Adjustment
                  </div>
                )}
                {capacityResult?.activeFactorFlags.season && (
                  <div className="flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold">
                    <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                    Seasonal Factor
                  </div>
                )}
                {capacityResult?.activeFactorFlags.utilization && (
                  <div className="flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 text-xs font-bold">
                    <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                    High Utilization
                  </div>
                )}
                {capacityResult?.activeFactorFlags.infrastructure && (
                  <div className="flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-xs font-bold">
                    <Leaf className="h-3 w-3 mr-1" aria-hidden="true" />
                    Eco Strain
                  </div>
                )}
                {capacityResult?.activeFactorFlags.override && (
                  <div className="flex items-center px-3 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 text-xs font-bold">
                    <ShieldAlert className="h-3 w-3 mr-1" aria-hidden="true" />
                    Admin Override
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" aria-hidden="true" />
                  <span className="text-lg font-bold text-gray-300">4.3</span>
                </div>
                <span className={`text-sm font-bold mt-1 ${availability.text === 'Fully Booked' ? 'text-red-500' : 'text-green-500'
                  }`}>
                  {capacityResult?.displayMessage || availability.text}
                </span>
              </div>

              <div className={`flex items-center px-4 py-2 rounded-full border shadow-sm ${destination.ecologicalSensitivity === 'critical' ? 'bg-red-50 border-red-100 text-red-600' :
                destination.ecologicalSensitivity === 'high' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                  destination.ecologicalSensitivity === 'medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                    'bg-green-50 border-green-100 text-green-600'
                }`}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="text-sm font-bold capitalize">{destination.ecologicalSensitivity} Sensitivity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Section */}
        {destination && (destination.ecologicalSensitivity !== 'low' || policy?.bookingRestrictionMessage) && (
          <div className={`${destination.ecologicalSensitivity === 'critical' ? 'bg-red-50 border-red-400' :
            destination.ecologicalSensitivity === 'high' ? 'bg-orange-50 border-orange-400' :
              'bg-yellow-50 border-yellow-400'
            } border-2 rounded-2xl p-8 relative overflow-hidden`}>
            <div className="flex items-start space-x-4">
              <div className={`${destination.ecologicalSensitivity === 'critical' ? 'bg-red-100' :
                destination.ecologicalSensitivity === 'high' ? 'bg-orange-100' :
                  'bg-yellow-100'
                } p-3 rounded-xl border`}>
                <ShieldAlert className={`${destination.ecologicalSensitivity === 'critical' ? 'text-red-700' :
                  destination.ecologicalSensitivity === 'high' ? 'text-orange-700' :
                    'text-yellow-700'
                  } h-8 w-8`} aria-hidden="true" />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className={`${destination.ecologicalSensitivity === 'critical' ? 'text-red-900' :
                    destination.ecologicalSensitivity === 'high' ? 'text-orange-900' :
                      'text-yellow-900'
                    } text-xl font-black uppercase tracking-tight`}>
                    {destination.ecologicalSensitivity} Sensitivity Policy
                  </h3>
                  <p className={`${destination.ecologicalSensitivity === 'critical' ? 'text-red-800' :
                    destination.ecologicalSensitivity === 'high' ? 'text-orange-800' :
                      'text-yellow-800'
                    } font-bold mt-1`}>
                    {policy?.bookingRestrictionMessage || `This is a ${destination.ecologicalSensitivity}-sensitivity area. Please follow the guidelines.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {policy?.requiresPermit && (
                    <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase shadow-sm ${destination.ecologicalSensitivity === 'critical' ? 'bg-red-100 text-red-900 border-red-200' :
                      destination.ecologicalSensitivity === 'high' ? 'bg-orange-100 text-orange-900 border-orange-200' :
                        'bg-yellow-100 text-yellow-900 border-yellow-200'
                      }`}>
                      Permit Required
                    </div>
                  )}
                  {policy?.requiresEcoBriefing && (
                    <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase shadow-sm ${destination.ecologicalSensitivity === 'critical' ? 'bg-red-100 text-red-900 border-red-200' :
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
                <label htmlFor="book-name" className="text-sm font-bold text-gray-600">Full Name *</label>
                <input
                  id="book-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && <p id="name-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="book-email" className="text-sm font-bold text-gray-600">Email Address *</label>
                <input
                  id="book-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && <p id="email-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="book-phone" className="text-sm font-bold text-gray-600">Phone Number *</label>
                <input
                  id="book-phone"
                  type="tel"
                  autoComplete="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
                {errors.phone && <p id="phone-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="book-nationality" className="text-sm font-bold text-gray-600">Nationality *</label>
                <input
                  id="book-nationality"
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.nationality ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors.nationality}
                  aria-describedby={errors.nationality ? "nationality-error" : undefined}
                />
                {errors.nationality && <p id="nationality-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.nationality}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="book-idProof" className="text-sm font-bold text-gray-600">ID Proof Number *</label>
                <input
                  id="book-idProof"
                  type="text"
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                  required
                  placeholder="Passport/Aadhar/Driving License"
                  className={`w-full px-4 py-4 bg-white border ${errors.idProof ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none placeholder:text-gray-300 text-gray-900`}
                  aria-invalid={!!errors.idProof}
                  aria-describedby={errors.idProof ? "idProof-error" : undefined}
                />
                {errors.idProof && <p id="idProof-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.idProof}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="book-originLocation" className="text-sm font-bold text-gray-600">Origin Location *</label>
                <select
                  id="book-originLocation"
                  name="originLocation"
                  value={formData.originLocation}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors.originLocation ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors.originLocation}
                  aria-describedby={errors.originLocation ? "originLocation-error" : "originLocation-info"}
                >
                  <option value="">Select your origin state/region</option>
                  {ORIGIN_LOCATIONS.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.originLocation && <p id="originLocation-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.originLocation}</p>}
                <p id="originLocation-info" className="text-xs text-gray-500 mt-1 flex items-center">
                  <Info className="h-3 w-3 mr-1" aria-hidden="true" />
                  Used to calculate your travel carbon footprint
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="book-transportType" className="text-sm font-bold text-gray-600">Transport Type *</label>
                <select
                  id="book-transportType"
                  name="transportType"
                  value={formData.transportType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none text-gray-900"
                  aria-describedby="transportType-info"
                >
                  <option value="TRAIN_PER_KM">Train (Eco-Friendly)</option>
                  <option value="BUS_PER_KM">Public Bus (Eco-Friendly)</option>
                  <option value="CAR_PER_KM">Car / Private Vehicle</option>
                  <option value="FLIGHT_PER_KM">Flight</option>
                </select>
                <p id="transportType-info" className="text-xs text-gray-500 mt-1 flex items-center">
                  <Leaf className="h-3 w-3 mr-1 text-green-600" aria-hidden="true" />
                  Public transport significantly reduces your footprint!
                </p>
              </div>

              {(destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical') && policy?.requiresPermit && (
                <div className="space-y-2">
                  <label htmlFor="book-ecoPermitNumber" className="text-sm font-bold text-gray-600">Ecological Permit Number *</label>
                  <input
                    id="book-ecoPermitNumber"
                    type="text"
                    name="ecoPermitNumber"
                    value={formData.ecoPermitNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your pre-obtained permit number"
                    className={`w-full px-4 py-4 bg-orange-50/30 border ${errors.ecoPermitNumber ? 'border-red-500' : 'border-orange-200'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none placeholder:text-gray-300 text-gray-900`}
                    aria-invalid={!!errors.ecoPermitNumber}
                    aria-describedby={errors.ecoPermitNumber ? "ecoPermitNumber-error" : "ecoPermitNumber-info"}
                  />
                  {errors.ecoPermitNumber ? (
                    <p id="ecoPermitNumber-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.ecoPermitNumber}</p>
                  ) : (
                    <p id="ecoPermitNumber-info" className="text-[10px] font-bold text-orange-600 ml-1 uppercase tracking-wider">Required for {destination.ecologicalSensitivity} sensitivity areas.</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="book-groupSize" className="text-sm font-bold text-gray-600">Group Size *</label>
                <select
                  id="book-groupSize"
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
                <label htmlFor="book-checkInDate" className="text-sm font-bold text-gray-600">Check-in Date *</label>
                <div className="relative">
                  <input
                    id="book-checkInDate"
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-4 bg-white border ${errors.checkInDate ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none pr-12 text-gray-900`}
                    aria-invalid={!!errors.checkInDate}
                    aria-describedby={errors.checkInDate ? "checkInDate-error" : undefined}
                  />
                  {errors.checkInDate && <p id="checkInDate-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.checkInDate}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="book-checkOutDate" className="text-sm font-bold text-gray-600">Check-out Date *</label>
                <div className="relative">
                  <input
                    id="book-checkOutDate"
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleInputChange}
                    required
                    min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-4 bg-white border ${errors.checkOutDate ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none pr-12 text-gray-900`}
                    aria-invalid={!!errors.checkOutDate}
                    aria-describedby={errors.checkOutDate ? "checkOutDate-error" : undefined}
                  />
                  {errors.checkOutDate && <p id="checkOutDate-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors.checkOutDate}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Emergency Contact</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
              <div className="space-y-2">
                <label htmlFor="emergency-contact-name" className="text-sm font-bold text-gray-600">Contact Name *</label>
                <input
                  id="emergency-contact-name"
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors['emergencyContact.name'] ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors['emergencyContact.name']}
                  aria-describedby={errors['emergencyContact.name'] ? "emergency-contact-name-error" : undefined}
                />
                {errors['emergencyContact.name'] && <p id="emergency-contact-name-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors['emergencyContact.name']}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="emergency-contact-phone" className="text-sm font-bold text-gray-600">Contact Phone *</label>
                <input
                  id="emergency-contact-phone"
                  type="tel"
                  autoComplete="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors['emergencyContact.phone'] ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900`}
                  aria-invalid={!!errors['emergencyContact.phone']}
                  aria-describedby={errors['emergencyContact.phone'] ? "emergency-contact-phone-error" : undefined}
                />
                {errors['emergencyContact.phone'] && <p id="emergency-contact-phone-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors['emergencyContact.phone']}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="emergency-contact-relationship" className="text-sm font-bold text-gray-600">Relationship *</label>
                <select
                  id="emergency-contact-relationship"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-4 bg-white border ${errors['emergencyContact.relationship'] ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none text-gray-900`}
                  aria-invalid={!!errors['emergencyContact.relationship']}
                  aria-describedby={errors['emergencyContact.relationship'] ? "emergency-contact-relationship-error" : undefined}
                >
                  <option value="">Select Relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
                {errors['emergencyContact.relationship'] && <p id="emergency-contact-relationship-error" className="text-xs text-red-500 font-bold mt-1" role="alert">{errors['emergencyContact.relationship']}</p>}
              </div>
            </div>
          </div>

          {/* Environmental Impact & Sustainability */}
          {carbonFootprint && (
            <div className="space-y-6" role="region" aria-label="Environmental Impact Analysis">
              {/* Carbon Footprint Display */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100" aria-live="polite">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Environmental Impact</h3>
                  <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${carbonFootprint.impactLevel === 'low' ? 'bg-green-100 text-green-700' :
                    carbonFootprint.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                    {carbonFootprint.impactLevel} Impact
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Globe className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{carbonFootprint.totalEmissions.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">kg CO2e Total</div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Zap className="h-6 w-6 text-amber-600" aria-hidden="true" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{carbonFootprint.emissionsPerPerson.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">kg CO2e / Person</div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                    <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <TreePine className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{carbonFootprint.ecoPointsReward}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Eco-Points Potential</div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-blue-800 leading-relaxed">
                    This trip&apos;s emissions are equivalent to <strong>{carbonFootprint.comparison.trees_equivalent}</strong> trees absorbing CO2 for a year, or <strong>{carbonFootprint.comparison.car_miles_equivalent}</strong> miles driven in an average car.
                  </p>
                </div>
              </div>

              {/* Sustainability Tips */}
              <div className="bg-emerald-900 rounded-2xl p-8 text-white shadow-xl shadow-emerald-100/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-emerald-800 p-2 rounded-lg">
                    <Leaf className="h-6 w-6 text-emerald-300" aria-hidden="true" />
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

          {/* Low Impact Alternatives Section */}
          {destination && (destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical' || availableSpots < 5) && (
            <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Leaf className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900 tracking-tight leading-none">High Ecological Impact Detected</h3>
                  <p className="text-emerald-700 text-xs font-bold mt-1 uppercase tracking-widest">Consider these low-impact alternatives</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findLowImpactAlternatives(allDestinationsState, destination).map((alt) => {
                  const score = calculateSustainabilityScore(alt);
                  return (
                    <div key={alt.id} className="bg-white p-4 rounded-xl border border-emerald-100 flex gap-4 items-center group hover:shadow-md transition-all">
                      <div className="h-16 w-16 rounded-lg bg-slate-100 shimmer overflow-hidden flex-shrink-0 relative">
                        <Image
                          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          alt={alt.name}
                          fill
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 truncate text-sm">{alt.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {score.overallScore}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{alt.description}</p>
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/tourist/book?destination=${alt.id}`);
                            window.location.reload(); // Force reload to update destination state
                          }}
                          className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 hover:underline"
                        >
                          Switch to this destination
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Information & Acknowledgement */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Additional Information</h3>

            {destination && (destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical') && policy?.requiresEcoBriefing && (
              <div className="bg-green-50/50 border border-green-200 rounded-xl p-6 mb-6">
                <label htmlFor="acknowledged" className="flex items-start space-x-4 cursor-pointer">
                  <div className="mt-1">
                    <input
                      id="acknowledged"
                      type="checkbox"
                      name="acknowledged"
                      checked={formData.acknowledged}
                      onChange={handleInputChange}
                      required
                      className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-bold text-green-800 leading-relaxed">
                    I acknowledge that this is a {destination.ecologicalSensitivity} sensitivity area and I agree to undergo the mandatory ecological briefing before entry. *
                  </span>
                </label>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="special-requests" className="text-sm font-bold text-gray-600">Special Requests (Optional)</label>
              <textarea
                id="special-requests"
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
              disabled={bookingMutation.isPending || !eligibility.allowed}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl
    ${bookingMutation.isPending || !eligibility.allowed
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
            >
              {bookingMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Confirm Booking'
              )}
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
