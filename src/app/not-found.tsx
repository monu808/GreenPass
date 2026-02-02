'use client';

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="mt-2 text-2xl font-semibold text-gray-700">Page Not Found</p>
          <p className="mt-4 text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/tourist/home"
            className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Tourist Home
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block text-blue-600 hover:text-blue-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
