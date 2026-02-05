import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js';
import {
  phoneSchema,
  aadhaarSchema,
  panSchema,
  passportSchema,
  drivingLicenseSchema,
  voterIdSchema,
} from './validation/schemas';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${randomStr}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

export function getCapacityStatus(current: number, max: number): {
  status: 'low' | 'medium' | 'high' | 'full';
  percentage: number;
  color: string;
} {
  const percentage = (current / max) * 100;

  if (percentage >= 100) {
    return { status: 'full', percentage, color: 'red' };
  } else if (percentage >= 80) {
    return { status: 'high', percentage, color: 'orange' };
  } else if (percentage >= 50) {
    return { status: 'medium', percentage, color: 'yellow' };
  } else {
    return { status: 'low', percentage, color: 'green' };
  }
}

// ============================================================================
// ENHANCED VALIDATION FUNCTIONS (using Zod schemas)
// ============================================================================

/**
 * Validates email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!email || email.length > 254) return false;
  return emailRegex.test(email.toLowerCase());
}

/**
 * Enhanced phone validation with international format support
 * Uses libphonenumber-js for proper validation
 */
export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

/**
 * Formats phone number to international format
 * @param phone - Phone number to format
 * @param countryCode - ISO country code (default: 'IN')
 * @returns Formatted phone number (e.g., +91 98765 43210)
 */
export function formatPhone(phone: string, countryCode: CountryCode = 'IN'): string {
  try {
    const phoneNumber = parsePhoneNumberWithError(phone, countryCode);
    return phoneNumber.formatInternational();
  } catch {
    return phone;
  }
}

/**
 * Normalizes phone to E.164 format for database storage
 * @param phone - Phone number to normalize
 * @param countryCode - ISO country code (default: 'IN')
 * @returns Normalized phone number (e.g., +919876543210)
 */
export function normalizePhone(phone: string, countryCode: CountryCode = 'IN'): string {
  try {
    const phoneNumber = parsePhoneNumberWithError(phone, countryCode);
    return phoneNumber.format('E.164');
  } catch {
    return phone;
  }
}

/**
 * @deprecated Use validateIdProofByType instead for type-specific validation
 */
export function validateIdProof(idProof: string): boolean {
  if (!idProof || idProof.length < 8 || idProof.length > 20) return false;

  const aadhaarRegex = /^\d{12}$/;
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/i;
  const passportRegex = /^[A-Z]{1,2}\d{7}$/i;
  const dlRegex = /^[A-Z]{2}-?\d{2,4}\d{4,11}$/i;
  const voterIdRegex = /^[A-Z]{3}\d{7}$/i;
  const genericRegex = /^[A-Za-z0-9]{8,20}$/;

  return aadhaarRegex.test(idProof) ||
    panRegex.test(idProof) ||
    passportRegex.test(idProof) ||
    dlRegex.test(idProof) ||
    voterIdRegex.test(idProof) ||
    genericRegex.test(idProof);
}

/**
 * Enhanced ID proof validation with Zod schemas
 * Includes Aadhaar Verhoeff checksum validation
 */
export function validateIdProofByType(
  idProof: string,
  idType: string
): { valid: boolean; error?: string } {
  if (!idProof || idProof.trim().length === 0) {
    return { valid: false, error: 'ID proof number is required' };
  }

  const cleanId = idProof.trim().toUpperCase();

  switch (idType) {
    case 'aadhaar': {
      const result = aadhaarSchema.safeParse(idProof);
      if (!result.success) {
        return {
          valid: false,
          error: 'Invalid Aadhaar number (must be 12 digits with valid checksum)'
        };
      }
      break;
    }
    case 'pan': {
      const result = panSchema.safeParse(cleanId);
      if (!result.success) {
        return {
          valid: false,
          error: 'PAN must be in format ABCDE1234F'
        };
      }
      break;
    }
    case 'passport': {
      const result = passportSchema.safeParse(cleanId);
      if (!result.success) {
        return {
          valid: false,
          error: 'Passport must be 1 letter followed by 7 digits (e.g., A1234567)'
        };
      }
      break;
    }
    case 'driving-license': {
      const result = drivingLicenseSchema.safeParse(cleanId);
      if (!result.success) {
        return {
          valid: false,
          error: 'Invalid Driving License format (e.g., HR0619850034761)'
        };
      }
      break;
    }
    case 'voter-id': {
      const result = voterIdSchema.safeParse(cleanId);
      if (!result.success) {
        return {
          valid: false,
          error: 'Voter ID must be 3 letters followed by 7 digits (e.g., ABC1234567)'
        };
      }
      break;
    }
    default:
      return { valid: false, error: 'Please select a valid ID type' };
  }

  return { valid: true };
}

/**
 * Formats Aadhaar for display (masks first 8 digits)
 * @param aadhaar - Aadhaar number
 * @returns Masked Aadhaar (e.g., XXXX XXXX 1234)
 */
export function formatAadhaarDisplay(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (cleaned.length !== 12) return aadhaar;

  return `XXXX XXXX ${cleaned.slice(-4)}`;
}

/**
 * Formats PAN for display
 * @param pan - PAN card number
 * @returns Formatted PAN (e.g., ABCDE1234F)
 */
export function formatPAN(pan: string): string {
  return pan.toUpperCase().trim();
}

export function validateAge(age: number | string): { valid: boolean; error?: string } {
  const numAge = typeof age === 'string' ? parseInt(age, 10) : age;

  if (isNaN(numAge)) {
    return { valid: false, error: 'Please enter a valid age' };
  }
  if (!Number.isInteger(numAge)) {
    return { valid: false, error: 'Age must be a whole number' };
  }
  if (numAge < 18) {
    return { valid: false, error: 'You must be at least 18 years old to register individually' };
  }
  if (numAge > 120) {
    return { valid: false, error: 'Please enter a valid age' };
  }
  return { valid: true };
}

export function validatePinCode(pinCode: string): { valid: boolean; error?: string } {
  if (!pinCode || pinCode.trim().length === 0) {
    return { valid: false, error: 'PIN code is required' };
  }

  const cleanPin = pinCode.trim();
  const pinRegex = /^[1-9]\d{5}$/;

  if (!pinRegex.test(cleanPin)) {
    return { valid: false, error: 'PIN code must be 6 digits (e.g., 110001)' };
  }

  return { valid: true };
}

export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { valid: false, error: 'Address is required' };
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length < 10) {
    return { valid: false, error: 'Please enter a complete address (at least 10 characters)' };
  }
  if (trimmedAddress.length > 500) {
    return { valid: false, error: 'Address cannot exceed 500 characters' };
  }

  if (/<[^>]*>/.test(trimmedAddress)) {
    return { valid: false, error: 'Address contains invalid characters' };
  }

  return { valid: true };
}

export function validateGender(gender: string): { valid: boolean; error?: string } {
  const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
  if (!gender || !validGenders.includes(gender)) {
    return { valid: false, error: 'Please select a gender' };
  }
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name cannot exceed 100 characters' };
  }
  const nameRegex = /^[a-zA-Z\s.'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' };
  }
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { valid: false, error: 'Name must contain at least one letter' };
  }
  return { valid: true };
}

export function validateGroupName(groupName: string): { valid: boolean; error?: string } {
  // Group name is optional, so empty is valid
  if (!groupName || groupName.trim().length === 0) {
    return { valid: true };
  }

  const trimmedName = groupName.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Group name must be at least 2 characters' };
  }
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Group name cannot exceed 100 characters' };
  }

  const groupNameRegex = /^[a-zA-Z0-9\s.'-]+$/;
  if (!groupNameRegex.test(trimmedName)) {
    return { valid: false, error: 'Group name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods' };
  }

  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { valid: false, error: 'Group name must contain at least one letter' };
  }

  return { valid: true };
}

/**
 * Enhanced date range validation with better edge case handling
 */
export function validateDateRange(
  checkInDate: string,
  checkOutDate: string,
  options: { minAdvanceDays?: number; maxStayDays?: number; maxAdvanceMonths?: number } = {}
): { valid: boolean; error?: string } {
  const { minAdvanceDays = 0, maxStayDays = 30, maxAdvanceMonths = 12 } = options;

  if (!checkInDate || !checkOutDate) {
    return { valid: false, error: 'Both check-in and check-out dates are required' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(checkOutDate);
  checkOut.setHours(0, 0, 0, 0);

  // Check if dates are valid
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check minimum advance booking
  const minBookingDate = new Date(today);
  minBookingDate.setDate(minBookingDate.getDate() + minAdvanceDays);
  if (checkIn < minBookingDate) {
    const message = minAdvanceDays === 0
      ? 'Check-in date cannot be in the past'
      : `Check-in date must be at least ${minAdvanceDays} day(s) from today`;
    return { valid: false, error: message };
  }

  // Check if checkout is after checkin
  if (checkOut <= checkIn) {
    return { valid: false, error: 'Check-out date must be after check-in date' };
  }

  // Check maximum stay duration
  const stayDays = calculateDaysBetween(checkIn, checkOut);
  if (stayDays > maxStayDays) {
    return { valid: false, error: `Maximum stay duration is ${maxStayDays} days` };
  }

  // Check maximum advance booking
  const maxFutureDate = new Date(today);
  maxFutureDate.setMonth(maxFutureDate.getMonth() + maxAdvanceMonths);
  if (checkIn > maxFutureDate) {
    return { valid: false, error: `Bookings can only be made up to ${maxAdvanceMonths} month(s) in advance` };
  }

  return { valid: true };
}

/**
 * Enhanced group size validation
 */
export function validateGroupSize(
  size: number | string,
  maxAllowed: number = 50
): { valid: boolean; error?: string } {
  const numSize = typeof size === 'string' ? parseInt(size, 10) : size;

  if (isNaN(numSize) || !Number.isInteger(numSize)) {
    return { valid: false, error: 'Group size must be a whole number' };
  }
  if (numSize < 1) {
    return { valid: false, error: 'Group size must be at least 1' };
  }
  if (numSize > maxAllowed) {
    return { valid: false, error: `Group size cannot exceed ${maxAllowed}` };
  }
  return { valid: true };
}

/**
 * Validates file uploads
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  } = options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ');
    return {
      valid: false,
      error: `Only ${allowedExtensions} files are allowed`
    };
  }

  return { valid: true };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * @deprecated Use sanitizeForDatabase or sanitizeSearchTerm instead
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Sanitizes input for database storage
 */
export function sanitizeForDatabase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // Basic XSS protection
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Sanitizes search terms
 */
export function sanitizeSearchTerm(term: string | null | undefined): string {
  if (!term) return '';
  return term.replace(/[\\^$*+?.()|[\]{}]/g, '').trim();
}

/**
 * Recursively sanitizes all string properties in an object
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeForDatabase(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized = {} as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

export function getEcologicalSensitivityColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved': return 'text-green-600 bg-green-50';
    case 'checked-in': return 'text-blue-600 bg-blue-50';
    case 'checked-out': return 'text-gray-600 bg-gray-50';
    case 'pending': return 'text-yellow-600 bg-yellow-50';
    case 'cancelled': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvArray = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvArray.push(values.join(','));
  });

  return csvArray.join('\n');
}

/**
 * Safely parses a string or number into an integer.
 * Returns a fallback value (default 0) if parsing fails.
 */
export function safeParseInt(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Math.floor(value);
  }

  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? fallback : parsed;
}