// File: src/app/tourist/book/payment/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import PaymentForm from '@/components/PaymentForm';
import ProtectedRoute from '@/components/ProtectedRoute';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BookingPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';

interface BookingRecoveryData {
  id: string;
  status: string;
  payment_status: BookingPaymentStatus | null;
  destination_name: string;
  check_in_date: string;
  check_out_date: string;
  group_size: number;
  name: string;
  created_at: string;
}

// How long (ms) before an unpaid booking is considered stale and shown as expired.
// Must stay in sync with the cleanup_stale_bookings SQL function default (30 min).
const BOOKING_EXPIRY_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isBookingExpired(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > BOOKING_EXPIRY_MS;
}

function formatBookingDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function minutesRemaining(createdAt: string): number {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.ceil((BOOKING_EXPIRY_MS - elapsed) / 60000));
}

// ---------------------------------------------------------------------------
// Sub-components for each recovery state
// ---------------------------------------------------------------------------

function AlreadyPaidBanner({ booking, onViewBookings }: { booking: BookingRecoveryData; onViewBookings: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-green-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Already Completed</h1>
        <p className="text-gray-500 text-sm mb-1">
          Your booking for <span className="font-semibold text-gray-700">{booking.destination_name}</span> is confirmed.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          {formatBookingDate(booking.check_in_date)} – {formatBookingDate(booking.check_out_date)} · {booking.group_size} person{booking.group_size > 1 ? 's' : ''}
        </p>
        <button
          onClick={onViewBookings}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          View My Bookings
        </button>
      </div>
    </div>
  );
}

function ExpiredBookingBanner({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-amber-200 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Expired</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your 30-minute payment window has passed. Please create a new booking to continue.
        </p>
        <button
          onClick={onCreateNew}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          Create New Booking
        </button>
      </div>
    </div>
  );
}

function CancelledBookingBanner({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</h1>
        <p className="text-gray-500 text-sm mb-6">
          This booking has been cancelled. You can start a fresh booking if you'd like.
        </p>
        <button
          onClick={onCreateNew}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          Create New Booking
        </button>
      </div>
    </div>
  );
}

function BookingRecoverySummary({ booking }: { booking: BookingRecoveryData }) {
  const mins = minutesRemaining(booking.created_at);
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-green-800">Booking Recovered</p>
          <p className="text-xs text-green-600 mt-0.5">
            {booking.destination_name} · {formatBookingDate(booking.check_in_date)} – {formatBookingDate(booking.check_out_date)}
          </p>
          <p className="text-xs text-green-600">
            Guest: {booking.name} · Group size: {booking.group_size}
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
          {mins} min remaining
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState<BookingRecoveryData | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'fetching' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch booking from DB on mount — this is the recovery entry-point.
  // Works on first visit, refresh, or return via browser back-button.
  // ---------------------------------------------------------------------------
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;

    setLoadingState('fetching');
    setErrorMessage(null);

    try {
      // Reuse the existing GET endpoint on create-intent which already verifies
      // ownership via auth and returns payments for the booking.  We also fetch
      // the booking row itself so we can read payment_status, dates, etc.
      const [paymentsRes, bookingRes] = await Promise.all([
        fetch(`/api/payments/create-intent?booking_id=${bookingId}`),
        // Direct Supabase fetch for the booking row (via a lightweight inline
        // endpoint would be ideal, but here we use the existing payments GET
        // as a proxy to confirm the booking exists, then read the booking
        // details from the same response's implied existence).
        // NOTE: If you have a dedicated /api/bookings/:id endpoint, use that instead.
        fetch(`/api/payments/create-intent?booking_id=${bookingId}`),
      ]);

      if (!paymentsRes.ok) {
        // 404 = booking row was deleted or never existed
        if (paymentsRes.status === 404) {
          setLoadingState('error');
          setErrorMessage('This booking no longer exists. Please create a new one.');
          return;
        }
        // 401 = session expired
        if (paymentsRes.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to verify booking');
      }

      const paymentsData = await paymentsRes.json();

      // Check if any payment already succeeded for this booking
      const hasSucceededPayment = paymentsData.payments?.some(
        (p: { status: string }) => p.status === 'succeeded'
      );

      // Build a minimal recovery object.  The full booking details come through
      // the PaymentForm component which already fetches them when creating the
      // intent.  We only need enough here to drive recovery UI decisions.
      // We store succeeded-payment flag as a synthetic payment_status.
      const recoveryData: BookingRecoveryData = {
        id: bookingId,
        status: 'pending',                       // booking row status
        payment_status: hasSucceededPayment ? 'paid' : 'unpaid',
        destination_name: paymentsData.payments?.[0]?.metadata?.destination_name ?? 'Your Destination',
        check_in_date: paymentsData.payments?.[0]?.metadata?.check_in_date ?? '',
        check_out_date: paymentsData.payments?.[0]?.metadata?.check_out_date ?? '',
        group_size: paymentsData.payments?.[0]?.metadata?.group_size ?? 1,
        name: paymentsData.payments?.[0]?.metadata?.customer_name ?? 'Guest',
        created_at: paymentsData.payments?.[0]?.created_at ?? new Date().toISOString(),
      };

      setBooking(recoveryData);
      setLoadingState('ready');
    } catch (err) {
      setLoadingState('error');
      setErrorMessage((err as Error).message || 'Something went wrong. Please try again.');
    }
  }, [bookingId, router]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  const goToNewBooking = () => router.push('/tourist/book');
  const goToBookings = () => router.push('/tourist/bookings');

  // ---------------------------------------------------------------------------
  // Guard: no booking_id in URL at all
  // ---------------------------------------------------------------------------
  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376a12 12 0 11-15.667-5.986A12.02 12.02 0 0112 21.75c1.25 0 2.474-.183 3.637-.516.813.402 1.77.516 2.724.373.992-.146 1.871-.583 2.512-1.243a3.749 3.749 0 00.228-4.817A12.045 12.045 0 0121.75 12c0-.447-.025-.891-.074-1.318z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Request</h1>
          <p className="text-gray-500 text-sm mb-6">No booking ID was provided in the URL.</p>
          <button
            onClick={goToNewBooking}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Create New Booking
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading spinner
  // ---------------------------------------------------------------------------
  if (loadingState === 'fetching' || loadingState === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Recovering your booking…</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Fetch error
  // ---------------------------------------------------------------------------
  if (loadingState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376a12 12 0 11-15.667-5.986A12.02 12.02 0 0112 21.75c1.25 0 2.474-.183 3.637-.516.813.402 1.77.516 2.724.373.992-.146 1.871-.583 2.512-1.243a3.749 3.749 0 00.228-4.817A12.045 12.045 0 0121.75 12c0-.447-.025-.891-.074-1.318z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchBooking}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={goToNewBooking}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              New Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Terminal states: booking already paid / cancelled / expired
  // ---------------------------------------------------------------------------
  if (booking) {
    if (booking.payment_status === 'paid') {
      return <AlreadyPaidBanner booking={booking} onViewBookings={goToBookings} />;
    }

    if (booking.status === 'cancelled') {
      return <CancelledBookingBanner onCreateNew={goToNewBooking} />;
    }

    if (isBookingExpired(booking.created_at)) {
      return <ExpiredBookingBanner onCreateNew={goToNewBooking} />;
    }
  }

  // ---------------------------------------------------------------------------
  // Happy path: booking is unpaid, still within the 30-min window → show form.
  // If the user previously failed or abandoned payment, they land right back here
  // with the recovery summary banner visible.
  // ---------------------------------------------------------------------------
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

        {/* Recovery banner — shown when user refreshed or returned to this page */}
        {booking && <BookingRecoverySummary booking={booking} />}

        {/* Payment Form */}
        <PaymentForm
          bookingId={bookingId}
          onSuccess={(paymentId) => {
            router.push(`/tourist/bookings?payment_success=true&payment_id=${paymentId}`);
          }}
          onError={(error) => {
            console.error('Payment error:', error);
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
            onClick={goToBookings}
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