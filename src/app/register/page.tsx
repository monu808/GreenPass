'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { User } from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { 
  validateEmail, 
  validatePhone, 
  validateIdProof,
  validateIdProofByType,
  validateName,
  validateGroupName,
  validateDateRange,
  validateGroupSize,
  validateAge,
  validateGender,
  validateAddress,
  validatePinCode,
  sanitizeInput 
} from '@/lib/utils';
import type { Database } from '@/types/database';

type Destination = Database['public']['Tables']['destinations']['Row'];
type TouristInsert = Database['public']['Tables']['tourists']['Insert'];

type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
type IdProofType = 'aadhaar' | 'pan' | 'passport' | 'driving-license' | 'voter-id';

export default function RegisterTourist() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    pinCode: '',
    idProofType: '',
    group_name: '',
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
  
  const formRef = useRef<HTMLFormElement>(null);
  const successButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const dbService = getDbService();
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

  // Focus on success button when registration succeeds
  useEffect(() => {
    if (submitSuccess && successButtonRef.current) {
      successButtonRef.current.focus();
    }
  }, [submitSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For numeric inputs, store as number if possible
    let finalValue: string | number = value;
    if (type === 'number' && value !== '') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        finalValue = parsed;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error || 'Invalid name';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (10 digits for Indian mobile, or include country code for international)';
    }

    const ageValidation = validateAge(formData.age);
    if (!ageValidation.valid) {
      newErrors.age = ageValidation.error || 'Invalid age';
    }

    const genderValidation = validateGender(formData.gender);
    if (!genderValidation.valid) {
      newErrors.gender = genderValidation.error || 'Please select a gender';
    }

    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.valid) {
      newErrors.address = addressValidation.error || 'Invalid address';
    }

    const pinCodeValidation = validatePinCode(formData.pinCode);
    if (!pinCodeValidation.valid) {
      newErrors.pinCode = pinCodeValidation.error || 'Invalid PIN code';
    }

    if (!formData.idProofType) {
      newErrors.idProofType = 'Please select an ID proof type';
    }

    if (!formData.idProof.trim()) {
      newErrors.idProof = 'ID proof number is required';
    } else if (formData.idProofType) {
      const idProofValidation = validateIdProofByType(formData.idProof, formData.idProofType);
      if (!idProofValidation.valid) {
        newErrors.idProof = idProofValidation.error || 'Invalid ID proof';
      }
    }
    if (formData.group_name.trim()) {
  const groupNameValidation = validateGroupName(formData.group_name);
      if (!groupNameValidation.valid) {
        newErrors.group_name = groupNameValidation.error || 'Invalid group name';
      }
    }
    if (!formData.destination) {
      newErrors.destination = 'Please select a destination';
    }

    if (!formData.checkInDate) {
      newErrors.checkInDate = 'Check-in date is required';
    }
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = 'Check-out date is required';
    }
    
    if (formData.checkInDate && formData.checkOutDate) {
      const dateValidation = validateDateRange(formData.checkInDate, formData.checkOutDate, {
        minAdvanceDays: 1, 
        maxStayDays: 30    
      });
      if (!dateValidation.valid) {
        newErrors.checkOutDate = dateValidation.error || 'Invalid date range';
      }
    } else if (formData.checkInDate) {
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkIn = new Date(formData.checkInDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (checkIn < tomorrow) {
        newErrors.checkInDate = 'Check-in date must be at least 1 day from today';
      }
    }

    const groupSizeValidation = validateGroupSize(formData.groupSize, 10);
    if (!groupSizeValidation.valid) {
      newErrors.groupSize = groupSizeValidation.error || 'Invalid group size';
    }

    const emergencyNameValidation = validateName(formData.emergencyContactName);
    if (!emergencyNameValidation.valid) {
      newErrors.emergencyContactName = emergencyNameValidation.error || 'Invalid emergency contact name';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!validatePhone(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Please enter a valid emergency contact phone number';
    }

    if (!formData.emergencyContactRelationship.trim()) {
      newErrors.emergencyContactRelationship = 'Please select a relationship';
    }

    if (formData.phone && formData.emergencyContactPhone) {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      const cleanEmergencyPhone = formData.emergencyContactPhone.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone === cleanEmergencyPhone) {
        newErrors.emergencyContactPhone = 'Emergency contact phone must be different from your phone number';
      }
    }

    if (formData.destination && !newErrors.groupSize) {
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
  
  const selectedDestination = destinations.find(d => d.id === formData.destination);
  
  if (!validateForm() || !selectedDestination) {
    alert('Please fill in all required fields');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const bookingData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      id_proof: formData.idProof,
      nationality: formData.nationality,
      group_size: parseInt(formData.groupSize.toString(), 10),
      destination_id: selectedDestination.id,
      check_in_date: formData.checkInDate,
      check_out_date: formData.checkOutDate,
      status: 'pending' as const,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
      emergency_contact_relationship: formData.emergencyContactRelationship,
      user_id: null, // Set to null to avoid foreign key constraint
      registration_date: new Date().toISOString(),
      // Use values from formData
      age: parseInt(formData.age, 10),
      gender: formData.gender as Gender,
      address: formData.address,
      pin_code: formData.pinCode,
      id_proof_type: formData.idProofType as IdProofType
    };
    
    console.log('Submitting booking data:', bookingData);
    console.log('Destination:', selectedDestination);
    
    const dbService = getDbService();
    const result = await dbService.addTourist(bookingData);
    
    if (!result) {
      throw new Error('Failed to create booking - no result returned');
    }
    
    setSubmitSuccess(true);
    setTimeout(() => {
      router.push('/tourist/bookings');
    }, 3000);
    
  } catch (error) {
    console.error('Error submitting booking:', error);
    alert('Failed to submit booking. Please try again.');
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
        <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" aria-hidden="true"></div>
            <p className="mt-4 text-gray-700">Loading destinations...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitSuccess) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center" role="alert" aria-live="polite">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-900 mb-2">Registration Successful!</h2>
            <p className="text-green-800 mb-4">
              Your tourist registration has been submitted successfully. You will receive a confirmation email shortly.
            </p>
            <p className="text-sm text-green-700 mb-4">
              Your application is now pending approval. You will be notified once it&apos;s reviewed.
            </p>
            <button
              ref={successButtonRef}
              onClick={() => setSubmitSuccess(false)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              aria-label="Register another tourist"
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
          <p className="text-gray-700">Register for visiting ecologically sensitive areas in Jammu & Himachal Pradesh</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate aria-label="Tourist registration form">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.name ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  aria-label="Full name"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : 'name-hint'}
                  minLength={2}
                  maxLength={100}
                  pattern="[a-zA-Z\s.'-]+"
                  title="Name can only contain letters, spaces, hyphens, apostrophes, and periods"
                  autoComplete="name"
                />
                <p id="name-hint" className="text-gray-500 text-xs mt-1">2-100 characters, letters only</p>
                {errors.name && <p id="name-error" className="text-red-700 text-xs mt-1" role="alert">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.email ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email (e.g., user@example.com)"
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                  maxLength={254}
                  autoComplete="email"
                />
                <p id="email-hint" className="text-gray-500 text-xs mt-1">We&apos;ll send confirmation to this email</p>
                {errors.email && <p id="email-error" className="text-red-700 text-xs mt-1" role="alert">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.phone ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 9876543210 or +91-98765-43210"
                  aria-label="Phone number"
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
                  minLength={10}
                  maxLength={15}
                  autoComplete="tel"
                />
                <p id="phone-hint" className="text-gray-500 text-xs mt-1">Indian mobile: 10 digits starting with 6-9</p>
                {errors.phone && <p id="phone-error" className="text-red-700 text-xs mt-1" role="alert">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-900 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.age ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Enter your age"
                  aria-label="Age"
                  aria-required="true"
                  aria-invalid={!!errors.age}
                  aria-describedby={errors.age ? 'age-error' : 'age-hint'}
                  min={18}
                  max={120}
                  step={1}
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <p id="age-hint" className="text-gray-500 text-xs mt-1">Must be 18 years or older</p>
                {errors.age && <p id="age-error" className="text-red-700 text-xs mt-1" role="alert">{errors.age}</p>}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-900 mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.gender ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Gender"
                  aria-required="true"
                  aria-invalid={!!errors.gender}
                  aria-describedby={errors.gender ? 'gender-error' : undefined}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                {errors.gender && <p id="gender-error" className="text-red-700 text-xs mt-1" role="alert">{errors.gender}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, address: e.target.value }));
                    if (errors.address) {
                      setErrors(prev => ({ ...prev, address: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.address ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete address (House No., Street, Locality, City, State)"
                  aria-label="Address"
                  aria-required="true"
                  aria-invalid={!!errors.address}
                  aria-describedby={errors.address ? 'address-error' : 'address-hint'}
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  autoComplete="street-address"
                />
                <p id="address-hint" className="text-gray-500 text-xs mt-1">Enter complete address including house number, street, city, and state</p>
                {errors.address && <p id="address-error" className="text-red-700 text-xs mt-1" role="alert">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-gray-900 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  id="pinCode"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.pinCode ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 110001"
                  aria-label="PIN code"
                  aria-required="true"
                  aria-invalid={!!errors.pinCode}
                  aria-describedby={errors.pinCode ? 'pinCode-error' : 'pinCode-hint'}
                  maxLength={6}
                  pattern="[1-9][0-9]{5}"
                  autoComplete="postal-code"
                />
                <p id="pinCode-hint" className="text-gray-500 text-xs mt-1">6-digit Indian PIN code</p>
                {errors.pinCode && <p id="pinCode-error" className="text-red-700 text-xs mt-1" role="alert">{errors.pinCode}</p>}
              </div>

              <div>
                <label htmlFor="idProofType" className="block text-sm font-medium text-gray-900 mb-1">
                  Government ID Type *
                </label>
                <select
                  id="idProofType"
                  name="idProofType"
                  value={formData.idProofType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.idProofType ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Government ID type"
                  aria-required="true"
                  aria-invalid={!!errors.idProofType}
                  aria-describedby={errors.idProofType ? 'idProofType-error' : undefined}
                >
                  <option value="">Select ID type</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving-license">Driving License</option>
                  <option value="voter-id">Voter ID</option>
                </select>
                {errors.idProofType && <p id="idProofType-error" className="text-red-700 text-xs mt-1" role="alert">{errors.idProofType}</p>}
              </div>

              <div>
                <label htmlFor="idProof" className="block text-sm font-medium text-gray-900 mb-1">
                  Government ID Number *
                </label>
                <input
                  type="text"
                  id="idProof"
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.idProof ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder={
                    formData.idProofType === 'aadhaar' ? '123456789012' :
                    formData.idProofType === 'pan' ? 'ABCDE1234F' :
                    formData.idProofType === 'passport' ? 'A1234567' :
                    formData.idProofType === 'driving-license' ? 'DL-1420110012345' :
                    formData.idProofType === 'voter-id' ? 'ABC1234567' :
                    'Select ID type first'
                  }
                  aria-label="Government ID number"
                  aria-required="true"
                  aria-invalid={!!errors.idProof}
                  aria-describedby={errors.idProof ? 'idProof-error' : 'idProof-hint'}
                  minLength={8}
                  maxLength={20}
                  autoComplete="off"
                  disabled={!formData.idProofType}
                />
                <p id="idProof-hint" className="text-gray-500 text-xs mt-1">
                  {formData.idProofType === 'aadhaar' ? 'Enter 12-digit Aadhaar number' :
                   formData.idProofType === 'pan' ? 'Enter PAN in format ABCDE1234F' :
                   formData.idProofType === 'passport' ? 'Enter passport number (e.g., A1234567)' :
                   formData.idProofType === 'driving-license' ? 'Enter DL number with state code' :
                   formData.idProofType === 'voter-id' ? 'Enter Voter ID (3 letters + 7 digits)' :
                   'Select ID type to see format'}
                </p>
                {errors.idProof && <p id="idProof-error" className="text-red-700 text-xs mt-1" role="alert">{errors.idProof}</p>}
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-900 mb-1">
                  Nationality *
                </label>
                <select
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900"
                  aria-label="Nationality"
                  aria-required="true"
                >
                  <option value="Indian">Indian</option>
                  <option value="Foreign">Foreign National</option>
                </select>
              </div>

              <div>
                <label htmlFor="group_name" className="block text-sm font-medium text-gray-900 mb-1">
                  Group Name (Optional)
                </label>
                <input
                  type="text"
                  id="group_name"
                  name="group_name"
                  value={formData.group_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                  errors.group_name ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Family Trip, Office Tour"
                />

                <p id="group_name-hint" className="text-gray-500 text-xs mt-1">Optional: Give your group a name for easy identification</p>
                {errors.group_name && <p id="group_name-error" className="text-red-700 text-xs mt-1" role="alert">{errors.group_name}</p>}
              </div>

              <div>
                <label htmlFor="groupSize" className="block text-sm font-medium text-gray-900 mb-1">
                  Group Size *
                </label>
                <input
                  type="number"
                  id="groupSize"
                  name="groupSize"
                  min="1"
                  max="10"
                  step="1"
                  value={formData.groupSize}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.groupSize ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Group size (1 to 10 people)"
                  aria-required="true"
                  aria-invalid={!!errors.groupSize}
                  aria-describedby={errors.groupSize ? 'groupSize-error' : 'groupSize-hint'}
                  onKeyDown={(e) => {
                    // Prevent decimal points and non-numeric input
                    if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <p id="groupSize-hint" className="text-gray-500 text-xs mt-1">Maximum 10 people per booking</p>
                {errors.groupSize && <p id="groupSize-error" className="text-red-700 text-xs mt-1" role="alert">{errors.groupSize}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Travel Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="destination" className="block text-sm font-medium text-gray-900 mb-1">
                  Destination *
                </label>
                <select
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.destination ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Select destination"
                  aria-required="true"
                  aria-invalid={!!errors.destination}
                  aria-describedby={errors.destination ? 'destination-error' : undefined}
                >
                  <option value="">Select a destination</option>
                  {destinations.filter(d => d.is_active).map(dest => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}, {dest.location} (Available: {dest.max_capacity - dest.current_occupancy})
                    </option>
                  ))}
                </select>
                {errors.destination && <p id="destination-error" className="text-red-700 text-xs mt-1" role="alert">{errors.destination}</p>}
              </div>

              <div>
                <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-900 mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleInputChange}
                  min={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toISOString().split('T')[0];
                  })()}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setFullYear(maxDate.getFullYear() + 1);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.checkInDate ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Check-in date"
                  aria-required="true"
                  aria-invalid={!!errors.checkInDate}
                  aria-describedby={errors.checkInDate ? 'checkInDate-error' : 'checkInDate-hint'}
                />
                <p id="checkInDate-hint" className="text-gray-500 text-xs mt-1">Must be at least 1 day from today</p>
                {errors.checkInDate && <p id="checkInDate-error" className="text-red-700 text-xs mt-1" role="alert">{errors.checkInDate}</p>}
              </div>

              <div>
                <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-900 mb-1">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  min={formData.checkInDate || (() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toISOString().split('T')[0];
                  })()}
                  max={formData.checkInDate ? (() => {
                    const maxDate = new Date(formData.checkInDate);
                    maxDate.setDate(maxDate.getDate() + 30);
                    return maxDate.toISOString().split('T')[0];
                  })() : undefined}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.checkOutDate ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Check-out date"
                  aria-required="true"
                  aria-invalid={!!errors.checkOutDate}
                  aria-describedby={errors.checkOutDate ? 'checkOutDate-error' : 'checkOutDate-hint'}
                />
                <p id="checkOutDate-hint" className="text-gray-500 text-xs mt-1">Maximum stay: 30 days</p>
                {errors.checkOutDate && <p id="checkOutDate-error" className="text-red-700 text-xs mt-1" role="alert">{errors.checkOutDate}</p>}
              </div>

              {selectedDestination && (
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg" role="region" aria-label="Selected destination details">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedDestination.name}</h3>
                  <p className="text-sm text-gray-700 mb-3">{selectedDestination.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-700">Available Capacity:</span>
                    <span className="font-medium text-gray-900">{availableCapacity} / {selectedDestination.max_capacity}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">Guidelines:</p>
                    <ul className="text-xs text-gray-700 space-y-1" role="list">
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
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-900 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.emergencyContactName ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Emergency contact full name"
                  aria-label="Emergency contact name"
                  aria-required="true"
                  aria-invalid={!!errors.emergencyContactName}
                  aria-describedby={errors.emergencyContactName ? 'emergencyContactName-error' : undefined}
                  minLength={2}
                  maxLength={100}
                  pattern="[a-zA-Z\s.'-]+"
                  autoComplete="off"
                />
                {errors.emergencyContactName && <p id="emergencyContactName-error" className="text-red-700 text-xs mt-1" role="alert">{errors.emergencyContactName}</p>}
              </div>

              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-900 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.emergencyContactPhone ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 9876543210"
                  aria-label="Emergency contact phone number"
                  aria-required="true"
                  aria-invalid={!!errors.emergencyContactPhone}
                  aria-describedby={errors.emergencyContactPhone ? 'emergencyContactPhone-error' : 'emergencyContactPhone-hint'}
                  minLength={10}
                  maxLength={15}
                  autoComplete="off"
                />
                <p id="emergencyContactPhone-hint" className="text-gray-500 text-xs mt-1">Must be different from your phone number</p>
                {errors.emergencyContactPhone && <p id="emergencyContactPhone-error" className="text-red-700 text-xs mt-1" role="alert">{errors.emergencyContactPhone}</p>}
              </div>

              <div>
                <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-900 mb-1">
                  Relationship *
                </label>
                <select
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.emergencyContactRelationship ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Emergency contact relationship"
                  aria-required="true"
                  aria-invalid={!!errors.emergencyContactRelationship}
                  aria-describedby={errors.emergencyContactRelationship ? 'emergencyContactRelationship-error' : undefined}
                >
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
                {errors.emergencyContactRelationship && <p id="emergencyContactRelationship-error" className="text-red-700 text-xs mt-1" role="alert">{errors.emergencyContactRelationship}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Cancel registration"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={isSubmitting ? 'Registering tourist, please wait' : 'Submit tourist registration'}
            >
              {isSubmitting ? 'Registering...' : 'Register Tourist'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
