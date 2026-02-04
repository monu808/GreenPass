'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { User, CheckCircle } from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { FormErrorBoundary } from '@/components/errors';
import {
  sanitizeObject
} from '@/lib/utils';
import { 
  TouristRegistrationSchema,
  BookingDataSchema,
  type TouristRegistration,
  type BookingData
} from '@/lib/validation/schemas';
import type { Database } from '@/types/database';
import { z } from 'zod';

type Destination = Database['public']['Tables']['destinations']['Row'];

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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
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

  const sanitizeFormData = (data: typeof formData) => {
    return {
      ...sanitizeObject(data),
      // Ensure numeric values are preserved if they were already numbers
      groupSize: typeof data.groupSize === 'number' ? data.groupSize : parseInt(String(data.groupSize), 10) || 1,
    };
  };

  const validateForm = (step?: number): boolean => {
    const sanitizedData = sanitizeFormData(formData);
    const newErrors: Record<string, string> = {};
    const targetStep = step || currentStep;
    
    // Step 1: Personal Information
    if (targetStep === 1 || !step) {
      const registrationResult = validateInput(TouristRegistrationSchema, {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        age: parseInt(sanitizedData.age.toString(), 10),
        address: sanitizedData.address,
        pinCode: sanitizedData.pinCode,
        idProof: sanitizedData.idProof,
        idType: sanitizedData.idProofType,
      });

      if (!registrationResult.success) {
        Object.assign(newErrors, registrationResult.errors);
      }
      
      if (!sanitizedData.gender) {
        newErrors.gender = 'Gender is required';
      }
    }

    // Step 2: Travel Information
    if (targetStep === 2 || !step) {
      const bookingResult = validateInput(BookingDataSchema, {
        groupSize: sanitizedData.groupSize,
        checkInDate: sanitizedData.checkInDate,
        checkOutDate: sanitizedData.checkOutDate,
        emergencyContact: {
          name: 'Temp Name', // Temporary for partial validation
          phone: '9876543210',
          relationship: 'Friend',
        },
        transportType: 'other',
        originLocationId: sanitizedData.nationality === 'Indian' ? 'domestic' : 'international',
      });

      if (!bookingResult.success) {
        if (bookingResult.errors.groupSize) newErrors.groupSize = bookingResult.errors.groupSize;
        if (bookingResult.errors.checkInDate) newErrors.checkInDate = bookingResult.errors.checkInDate;
        if (bookingResult.errors.checkOutDate) newErrors.checkOutDate = bookingResult.errors.checkOutDate;
      }

      if (!sanitizedData.destination) {
        newErrors.destination = 'Please select a destination';
      }

      // Custom validation for destination capacity
      if (sanitizedData.destination && !newErrors.groupSize) {
        const destination = destinations.find(d => d.id === sanitizedData.destination);
        if (destination) {
          const availableCapacity = destination.max_capacity - destination.current_occupancy;
          if (sanitizedData.groupSize > availableCapacity) {
            newErrors.groupSize = `Only ${availableCapacity} slots available for this destination`;
          }
        }
      }
    }

    // Step 3: Emergency Contact
    if (targetStep === 3 || !step) {
      const bookingResult = validateInput(BookingDataSchema, {
        groupSize: 1, // Temporary
        checkInDate: '2025-01-01', // Temporary
        checkOutDate: '2025-01-02', // Temporary
        emergencyContact: {
          name: sanitizedData.emergencyContactName,
          phone: sanitizedData.emergencyContactPhone,
          relationship: sanitizedData.emergencyContactRelationship,
        },
        transportType: 'other',
        originLocationId: 'domestic',
      });

      if (!bookingResult.success) {
        if (bookingResult.errors['emergencyContact.name']) newErrors.emergencyContactName = bookingResult.errors['emergencyContact.name'];
        if (bookingResult.errors['emergencyContact.phone']) newErrors.emergencyContactPhone = bookingResult.errors['emergencyContact.phone'];
        if (bookingResult.errors['emergencyContact.relationship']) newErrors.emergencyContactRelationship = bookingResult.errors['emergencyContact.relationship'];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleNextStep = () => {
  if (validateForm(currentStep)) {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo(0, 0);
  }
};

const handlePrevStep = () => {
  setCurrentStep(prev => Math.max(prev - 1, 1));
  window.scrollTo(0, 0);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const selectedDestination = destinations.find(d => d.id === formData.destination);
  
  if (!validateForm() || !selectedDestination) {
    // Focus on first error field (from feature/datavalid)
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      element?.focus();
    }
    alert('Please fill in all required fields and correct any errors');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const sanitizedData = sanitizeFormData(formData);
    
    // Normalize phone numbers (from feature/datavalid)
    const normalizedPhone = normalizePhone(sanitizedData.phone);
    const normalizedEmergencyPhone = normalizePhone(sanitizedData.emergencyContactPhone);
    
    const bookingData = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: normalizedPhone, // Use nor
    
    const selectedDestination = destinations.find(d => d.id === formData.destination);
    
    if (!validateForm() || !selectedDestination) {
      // Find first error field and focus on it
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      alert('Please fill in all required fields and correct any errors');
      return;
    }
    
    setIsSubmitting(true);
    
  }catch (error) {
  let msg = 'booking failed';
  if (error instanceof Error) {
    if (error.message.includes('validation')) {
      msg = 'Validation failed: please check your input.';
    } else if (error.message.includes('email')) {
      msg = 'E-mail already registered. Use another email.';
    } else if (error.message.includes('password')) {
      msg = 'Password does not meet security requirements.';
    } else if (error.message.includes('network')) {
      msg = 'Connection failed: check your  internet.';
    } else if (error.message.includes('duplicate')) {
      msg = 'Duplicate entry: some information is already registered.';
    } else {
      msg = ` Registry failed: ${error.message}`;
    }
  }
  alert(msg);
}finally {
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
          
          {/* Step Indicator */}
          <div className="mt-6 flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === step 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : currentStep > step 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                  }`}
                >
                  {currentStep > step ? <CheckCircle className="h-6 w-6" /> : step}
                </div>
                <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                  currentStep === step ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step === 1 ? 'Personal' : step === 2 ? 'Travel' : 'Emergency'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <FormErrorBoundary formName="Tourist Registration" onReset={() => setFormData({
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
        })}>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate aria-label="Tourist registration form">
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-in slide-in-from-right duration-300">
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.name ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  aria-label="Full name"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : 'name-hint'}
                  autoComplete="name"
                />
                <p id="name-hint" className="text-gray-500 text-xs mt-1">2-100 characters, letters only</p>
                {errors.name && <p id="name-error" className="text-red-700 text-xs mt-1" role="alert">{errors.name}</p>}
              </div>

              {/* Email Field */}
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.email ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="your.email@example.com"
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                />
                <p id="email-hint" className="text-gray-500 text-xs mt-1">We&apos;ll send confirmation to this email</p>
                {errors.email && <p id="email-error" className="text-red-700 text-xs mt-1" role="alert">{errors.email}</p>}
              </div>

              {/* Phone Field - Enhanced with international support */}
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.phone ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210 or 9876543210"
                  aria-label="Phone number"
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
                />
                <p id="phone-hint" className="text-gray-500 text-xs mt-1">Enter with or without country code</p>
                {errors.phone && <p id="phone-error" className="text-red-700 text-xs mt-1" role="alert">{errors.phone}</p>}
              </div>

              {/* Age Field */}
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

              {/* Gender Field */}
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

              {/* Address Field */}
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
                />
                <p id="address-hint" className="text-gray-500 text-xs mt-1">Enter complete address (minimum 10 characters)</p>
                {errors.address && <p id="address-error" className="text-red-700 text-xs mt-1" role="alert">{errors.address}</p>}
              </div>

              {/* PIN Code Field */}
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.pinCode ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 110001"
                  aria-label="PIN code"
                  aria-required="true"
                  aria-invalid={!!errors.pinCode}
                  aria-describedby={errors.pinCode ? 'pinCode-error' : 'pinCode-hint'}
                  maxLength={6}
                  autoComplete="postal-code"
                />
                <p id="pinCode-hint" className="text-gray-500 text-xs mt-1">6-digit Indian PIN code</p>
                {errors.pinCode && <p id="pinCode-error" className="text-red-700 text-xs mt-1" role="alert">{errors.pinCode}</p>}
              </div>

              {/* ID Proof Type Field */}
              <div>
                <label htmlFor="idProofType" className="block text-sm font-medium text-gray-900 mb-1">
                  Government ID Type *
                </label>
                <select
                  id="idProofType"
                  name="idProofType"
                  value={formData.idProofType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.idProofType ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Government ID type"
                  aria-required="true"
                  aria-invalid={!!(errors.idType || errors.idProofType)}
                  aria-describedby={(errors.idType || errors.idProofType) ? 'idProofType-error' : undefined}
                >
                  <option value="">Select ID type</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving-license">Driving License</option>
                  <option value="voter-id">Voter ID</option>
                </select>
                {(errors.idType || errors.idProofType) && <p id="idProofType-error" className="text-red-700 text-xs mt-1" role="alert">{errors.idType || errors.idProofType}</p>}
              </div>

              {/* ID Proof Number Field - Enhanced with better validation hints */}
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.idProof ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder={
                    formData.idProofType === 'aadhaar' ? '1234 5678 9012' :
                    formData.idProofType === 'pan' ? 'ABCDE1234F' :
                    formData.idProofType === 'passport' ? 'A1234567' :
                    formData.idProofType === 'driving-license' ? 'HR0619850034761' :
                    formData.idProofType === 'voter-id' ? 'ABC1234567' :
                    'Select ID type first'
                  }
                  aria-label="Government ID number"
                  aria-required="true"
                  aria-invalid={!!errors.idProof}
                  aria-describedby={errors.idProof ? 'idProof-error' : 'idProof-hint'}
                  autoComplete="off"
                  disabled={!formData.idProofType}
                />
                <p id="idProof-hint" className="text-gray-500 text-xs mt-1">
                  {formData.idProofType === 'aadhaar' ? '12-digit Aadhaar with valid checksum' :
                   formData.idProofType === 'pan' ? 'Format: ABCDE1234F (5 letters + 4 digits + 1 letter)' :
                   formData.idProofType === 'passport' ? '1 letter + 7 digits (e.g., A1234567)' :
                   formData.idProofType === 'driving-license' ? 'Format: HR0619850034761' :
                   formData.idProofType === 'voter-id' ? '3 letters + 7 digits (e.g., ABC1234567)' :
                   'Select ID type to see format'}
                </p>
                {errors.idProof && <p id="idProof-error" className="text-red-700 text-xs mt-1" role="alert">{errors.idProof}</p>}
              </div>

              {/* Nationality Field */}
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

              {/* Group Name Field */}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                  errors.group_name ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Family Trip, Office Tour"
                  aria-label="Group name (optional)"
                  aria-describedby="group_name-hint"
                />
                <p id="group_name-hint" className="text-gray-500 text-xs mt-1">Optional: Give your group a name for easy identification</p>
                {errors.group_name && <p id="group_name-error" className="text-red-700 text-xs mt-1" role="alert">{errors.group_name}</p>}
              </div>

              {/* Group Size Field - Updated max to 50 */}
              <div>
                <label htmlFor="groupSize" className="block text-sm font-medium text-gray-900 mb-1">
                  Group Size *
                </label>
                <input
                  type="number"
                  id="groupSize"
                  name="groupSize"
                  min="1"
                  max="50"
                  step="1"
                  value={formData.groupSize}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.groupSize ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Group size (1 to 50 people)"
                  aria-required="true"
                  aria-invalid={!!errors.groupSize}
                  aria-describedby={errors.groupSize ? 'groupSize-error' : 'groupSize-hint'}
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <p id="groupSize-hint" className="text-gray-500 text-xs mt-1">Maximum 50 people per booking</p>
                {errors.groupSize && <p id="groupSize-error" className="text-red-700 text-xs mt-1" role="alert">{errors.groupSize}</p>}
              </div>
            </div>
          </div>
          )}

          {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-in slide-in-from-right duration-300">
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
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
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return today.toISOString().split('T')[0];
                  })()}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setMonth(maxDate.getMonth() + 12);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.checkInDate ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Check-in date"
                  aria-required="true"
                  aria-invalid={!!errors.checkInDate}
                  aria-describedby={errors.checkInDate ? 'checkInDate-error' : 'checkInDate-hint'}
                />
                <p id="checkInDate-hint" className="text-gray-500 text-xs mt-1">Cannot book more than 12 months in advance</p>
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.checkOutDate ? 'border-red-600' : 'border-gray-300'
                  }`}
                  aria-label="Check-out date"
                  aria-required="true"
                  aria-invalid={!!errors.checkOutDate}
                  aria-describedby={errors.checkOutDate ? 'checkOutDate-error' : 'checkOutDate-hint'}
                />
                <p id="checkOutDate-hint" className="text-gray-500 text-xs mt-1">Must be after check-in date</p>
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
          )}

          {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-in slide-in-from-right duration-300">
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.emergencyContactName ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="Emergency contact full name"
                  aria-label="Emergency contact name"
                  aria-required="true"
                  aria-invalid={!!errors.emergencyContactName}
                  aria-describedby={errors.emergencyContactName ? 'emergencyContactName-error' : undefined}
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
                    errors.emergencyContactPhone ? 'border-red-600' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210 or 9876543210"
                  aria-label="Emergency contact phone number"
                  aria-required="true"
                  aria-invalid={!!errors.emergencyContactPhone}
                  aria-describedby={errors.emergencyContactPhone ? 'emergencyContactPhone-error' : 'emergencyContactPhone-hint'}
                />
                <p id="emergencyContactPhone-hint" className="text-gray-500 text-xs mt-1">Enter with or without country code</p>
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
                  className={`w-full px-3 py-2 min-h-[52px] border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent text-gray-900 ${
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
          )}

          {/* Form Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isSubmitting || loading}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] flex items-center justify-center ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-[0.98]'
              }`}
            >
              Previous Step
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting || loading}
                className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm min-h-[44px] flex items-center justify-center"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full sm:w-auto px-10 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-md min-h-[44px] flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                    Processing...
                  </>
                ) : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
        </FormErrorBoundary>
      </div>
    </Layout>
  );
}