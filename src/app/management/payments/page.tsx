'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import PaymentDashboard from '@/components/PaymentDashboard';

export default function PaymentManagementPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Monitor transactions, process refunds, and view payment analytics
            </p>
          </div>

          {/* Dashboard Component */}
          <PaymentDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}