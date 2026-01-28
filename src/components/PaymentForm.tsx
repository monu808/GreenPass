'use client';

import { useState, useEffect } from 'react';
import { BookingPricing, PaymentIntent } from '@/types/payment';
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

interface PaymentFormProps {
  bookingId: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentForm({ bookingId, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<BookingPricing | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializePayment();
  }, [bookingId]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setPricing(data.pricing);
      setPaymentIntent(data.payment_intent);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to initialize payment';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent) return;

    try {
      setLoading(true);
      setError(null);

      // Load Razorpay or Stripe based on gateway
      if ('order_id' in paymentIntent.gateway_data) {
        // Razorpay payment
        await handleRazorpayPayment(paymentIntent.gateway_data);
      } else {
        // Stripe payment
        await handleStripePayment(paymentIntent.gateway_data);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Payment failed';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (orderData: any) => {
    return new Promise((resolve, reject) => {
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: orderData.name,
          description: orderData.description,
          order_id: orderData.order_id,
          prefill: orderData.prefill,
          theme: {
            color: '#16a34a', // Green theme
          },
          handler: function (response: any) {
            console.log('Payment successful:', response);
            setLoading(false);
            onSuccess?.(response.razorpay_payment_id);
            resolve(response);
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              reject(new Error('Payment cancelled by user'));
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setLoading(false);
          reject(new Error(response.error.description || 'Payment failed'));
        });
        rzp.open();
      };
      script.onerror = () => {
        setLoading(false);
        reject(new Error('Failed to load payment gateway'));
      };
      document.body.appendChild(script);
    });
  };

  const handleStripePayment = async (intentData: any) => {
    // Load Stripe.js
    const stripe = await (window as any).Stripe(intentData.publishable_key);
    
    const { error: stripeError } = await stripe.confirmCardPayment(intentData.client_secret);

    if (stripeError) {
      throw new Error(stripeError.message);
    }

    setLoading(false);
    onSuccess?.(paymentIntent!.id);
  };

  if (loading && !pricing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !pricing) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={initializePayment}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Pricing Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
        
        <div className="space-y-2">
          {pricing?.breakdown.map((item, index) => {
            const isTotal = item.startsWith('Total:');
            return (
              <div
                key={index}
                className={`flex justify-between ${isTotal ? 'border-t pt-2 font-bold text-lg' : 'text-gray-600'}`}
              >
                <span>{item.split(':')[0]}</span>
                <span>{item.split(':')[1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedMethod('card')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              selectedMethod === 'card'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-8 h-8" />
            <span className="font-medium">Card</span>
          </button>

          <button
            onClick={() => setSelectedMethod('upi')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              selectedMethod === 'upi'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Smartphone className="w-8 h-8" />
            <span className="font-medium">UPI</span>
          </button>

          <button
            onClick={() => setSelectedMethod('netbanking')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              selectedMethod === 'netbanking'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-8 h-8" />
            <span className="font-medium">Net Banking</span>
          </button>

          <button
            onClick={() => setSelectedMethod('wallet')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
              selectedMethod === 'wallet'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Wallet className="w-8 h-8" />
            <span className="font-medium">Wallet</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || !paymentIntent}
        className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </span>
        ) : (
          `Pay ${pricing?.currency} ${((pricing?.total_amount || 0) / 100).toFixed(2)}`
        )}
      </button>

      {/* Security Note */}
      <div className="text-center text-sm text-gray-500">
        <p>🔒 Secure payment powered by industry-standard encryption</p>
      </div>
    </div>
  );
}