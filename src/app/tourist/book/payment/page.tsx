'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import PaymentForm from '@/components/PaymentForm';
import ProtectedRoute from '@/components/ProtectedRoute';

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-4">No booking ID provided.</p>
          <button
            onClick={() => router.push('/tourist/book')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create New Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600">
            Secure your booking with a quick and easy payment
          </p>
        </div>

        {/* Payment Form */}
        <PaymentForm
          bookingId={bookingId}
          onSuccess={(paymentId) => {
            // Redirect to booking confirmation
            router.push(`/tourist/bookings?payment_success=true&payment_id=${paymentId}`);
          }}
          onError={(error) => {
            console.error('Payment error:', error);
            // Optionally redirect to error page or show retry
          }}
        />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your booking will be held for 30 minutes</li>
            <li>• All payment methods are secure and encrypted</li>
            <li>• You'll receive a receipt via email immediately</li>
            <li>• Contact support: support@greenpass.gov.in</li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/tourist/bookings')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute requireAdmin={false}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }>
        <PaymentPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}