'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { testDatabaseConnection } from '@/lib/dbTestUtils';

export default function DatabaseStatusBanner() {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    tablesExist: boolean;
    error?: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await testDatabaseConnection();
      setDbStatus(status);
      
      // Show banner if database is not properly set up
      if (!status.connected || !status.tablesExist) {
        setIsVisible(true);
      }
    };

    checkConnection();
  }, []);

  if (!isVisible || !dbStatus || (dbStatus.connected && dbStatus.tablesExist)) {
    return null;
  }

  const getBannerContent = () => {
    if (!dbStatus.connected) {
      return {
        title: 'Database Connection Failed',
        message: 'Unable to connect to Supabase. Please check your environment variables.',
        type: 'error' as const,
        action: 'Check .env.local file and Supabase configuration'
      };
    }

    if (!dbStatus.tablesExist) {
      return {
        title: 'Database Schema Missing',
        message: 'Connected to Supabase but database tables not found.',
        type: 'warning' as const,
        action: 'Run the SQL schema from supabase/schema.sql in your Supabase dashboard'
      };
    }

    return {
      title: 'Database Issue',
      message: dbStatus.error || 'Unknown database error',
      type: 'error' as const,
      action: 'Check console for details'
    };
  };

  const content = getBannerContent();
  const bgColor = content.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = content.type === 'error' ? 'text-red-800' : 'text-yellow-800';
  const iconColor = content.type === 'error' ? 'text-red-600' : 'text-yellow-600';

  return (
    <div role="status" aria-live="polite" className={`border-l-4 p-4 ${bgColor} border-l-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {content.type === 'error' ? (
            <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <Database className={`h-5 w-5 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {content.title}
          </h3>
          <div className={`mt-2 text-sm ${textColor}`}>
            <p>{content.message}</p>
            <p className="mt-1 font-medium">Action needed: {content.action}</p>
          </div>
          <div className="mt-3">
            <div className="flex space-x-3">
              <button
                onClick={() => window.open('/SETUP.md', '_blank')}
                className={`text-sm font-medium ${
                  content.type === 'error' ? 'text-red-600 hover:text-red-500' : 'text-yellow-600 hover:text-yellow-500'
                } flex items-center`}
              >
                View Setup Guide
                <ExternalLink className="ml-1 h-3 w-3" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className={`text-sm font-medium ${
                  content.type === 'error' ? 'text-red-600 hover:text-red-500' : 'text-yellow-600 hover:text-yellow-500'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
