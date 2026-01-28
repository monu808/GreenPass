'use client';

import { useState, useEffect, useCallback } from 'react';
import { PaymentStatistics, Payment } from '@/types/payment';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCcw,
  Download,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Escape CSV field to handle special characters
 */
function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringValue = String(field);

  // If the field contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export default function PaymentDashboard() {
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchStatistics = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start_date: new Date(dateRange.start).toISOString(),
        end_date: new Date(dateRange.end).toISOString(),
      });

      const response = await fetch(`/api/payments/statistics?${params}`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchPayments = useCallback(async () => {
    try {
      // This would need to be implemented as a new API route
      const response = await fetch('/api/payments/list');
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
    fetchPayments();
  }, [fetchStatistics, fetchPayments]);

  const handleRefund = async (paymentId: string) => {
    const reason = window.prompt('Enter refund reason:');
    if (!reason) return;

    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Refund processed successfully');
        fetchPayments();
        fetchStatistics();
      } else {
        alert(`Refund failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Booking ID', 'Amount', 'Status', 'Method', 'Gateway ID'];
    const rows = payments.map(p => [
      escapeCSVField(format(new Date(p.created_at), 'yyyy-MM-dd HH:mm')),
      escapeCSVField(p.booking_id),
      escapeCSVField(`${p.currency} ${(p.amount / 100).toFixed(2)}`),
      escapeCSVField(p.status),
      escapeCSVField(p.payment_method || 'N/A'),
      escapeCSVField(p.gateway_payment_id || 'N/A'),
    ]);

    const csv = [headers.map(escapeCSVField), ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();

    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `₹${(amount / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>

        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(statistics?.total_revenue || 0)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">
              {statistics?.successful_payments || 0} successful
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold">{statistics?.total_transactions || 0}</p>
            </div>
            <CreditCard className="w-10 h-10 text-blue-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Avg: {formatCurrency(statistics?.average_transaction_value || 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">
                {statistics?.pending_payments || 0}
              </p>
            </div>
            <RefreshCcw className="w-10 h-10 text-yellow-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Failed: {statistics?.failed_payments || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Refunds</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(statistics?.refund_amount || 0)}
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Count: {statistics?.total_refunds || 0}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(statistics?.payment_method_breakdown || {}).map(([method, amount]) => (
            <div key={method} className="text-center">
              <p className="text-sm text-gray-600 capitalize">{method}</p>
              <p className="text-xl font-semibold">{formatCurrency(amount as number)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Payments</h3>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments
                .filter(p => selectedStatus === 'all' || p.status === selectedStatus)
                .map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {payment.booking_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {payment.payment_method || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${payment.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending' || payment.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : payment.status === 'refunded'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {payment.gateway_payment_id?.slice(0, 12) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payment.status === 'succeeded' && (
                        <button
                          onClick={() => handleRefund(payment.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}