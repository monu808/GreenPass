'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">Oops!</h1>
          <p className="mt-2 text-lg text-gray-600">Something went wrong</p>
          <p className="mt-4 text-sm text-gray-500">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block text-blue-600 hover:text-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
