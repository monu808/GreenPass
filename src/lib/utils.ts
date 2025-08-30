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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
}

export function validateIdProof(idProof: string): boolean {
  // Basic validation for ID proof (can be enhanced based on requirements)
  return idProof.length >= 8 && idProof.length <= 20;
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
