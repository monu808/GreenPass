import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function validateEmail(email: string): boolean {
 
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!email || email.length > 254) return false;
  return emailRegex.test(email.toLowerCase());
}

export function validatePhone(phone: string): boolean {
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  const indianMobileRegex = /^(?:\+?91)?[6-9]\d{9}$/;
  const internationalRegex = /^\+[1-9]\d{6,14}$/;
  const landlineRegex = /^(?:\+?91)?[0-9]{2,4}[0-9]{6,8}$/;
  
  return indianMobileRegex.test(cleanedPhone) || 
         internationalRegex.test(cleanedPhone) || 
         landlineRegex.test(cleanedPhone);
}

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

export function validateIdProofByType(idProof: string, idType: string): { valid: boolean; error?: string } {
  if (!idProof || idProof.trim().length === 0) {
    return { valid: false, error: 'ID proof number is required' };
  }

  const cleanId = idProof.trim().toUpperCase();

  switch (idType) {
    case 'aadhaar':
      if (!/^\d{12}$/.test(cleanId)) {
        return { valid: false, error: 'Aadhaar must be exactly 12 digits' };
      }
      break;
    case 'pan':
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanId)) {
        return { valid: false, error: 'PAN must be in format ABCDE1234F' };
      }
      break;
    case 'passport':
      if (!/^[A-Z]{1,2}\d{7}$/.test(cleanId)) {
        return { valid: false, error: 'Passport must be  followed by 7 digits' };
      }
      break;
    case 'driving-license':
      if (!/^[A-Z]{2}-?\d{2,4}\d{4,11}$/.test(cleanId)) {
        return { valid: false, error: 'Invalid Driving License format (e.g., DL-1420110012345)' };
      }
      break;
    case 'voter-id':
      if (!/^[A-Z]{3}\d{7}$/.test(cleanId)) {
        return { valid: false, error: 'Voter ID must be 3 letters followed by 7 digits' };
      }
      break;
    default:
      return { valid: false, error: 'Please select a valid ID type' };
  }

  return { valid: true };
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
  
  // Allow letters, numbers, spaces, hyphens, apostrophes, and periods
  const groupNameRegex = /^[a-zA-Z0-9\s.'-]+$/;
  if (!groupNameRegex.test(trimmedName)) {
    return { valid: false, error: 'Group name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods' };
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { valid: false, error: 'Group name must contain at least one letter' };
  }
  
  return { valid: true };
}



export function validateDateRange(
  checkInDate: string, 
  checkOutDate: string,
  options: { minAdvanceDays?: number; maxStayDays?: number } = {}
): { valid: boolean; error?: string } {
  const { minAdvanceDays = 0, maxStayDays = 30 } = options;
  
  if (!checkInDate || !checkOutDate) {
    return { valid: false, error: 'Both check-in and check-out dates are required' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  
  // Check if dates are valid
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const minBookingDate = new Date(today);
  minBookingDate.setDate(minBookingDate.getDate() + minAdvanceDays);
  if (checkIn < minBookingDate) {
    return { valid: false, error: `Check-in date must be at least ${minAdvanceDays} day(s) from today` };
  }

  if (checkOut <= checkIn) {
    return { valid: false, error: 'Check-out date must be after check-in date' };
  }

  const stayDays = calculateDaysBetween(checkIn, checkOut);
  if (stayDays > maxStayDays) {
    return { valid: false, error: `Maximum stay duration is ${maxStayDays} days` };
  }
  const maxFutureDate = new Date(today);
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
  if (checkIn > maxFutureDate) {
    return { valid: false, error: 'Bookings can only be made up to 1 year in advance' };
  }

  return { valid: true };
}

export function sanitizeInput(input: string): string {
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

export function validateGroupSize(size: number, maxAllowed: number = 10): { valid: boolean; error?: string } {
  if (isNaN(size) || !Number.isInteger(size)) {
    return { valid: false, error: 'Group size must be a whole number' };
  }
  if (size < 1) {
    return { valid: false, error: 'Group size must be at least 1' };
  }
  if (size > maxAllowed) {
    return { valid: false, error: `Group size cannot exceed ${maxAllowed}` };
  }
  return { valid: true };
}

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
