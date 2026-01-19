'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  MapPin, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Home,
  UserPlus,
  CloudSun,
  ClipboardCheck,
  Sliders,
  Trash2,
  X
} from 'lucide-react';

const navigationItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/destinations', label: 'Destinations', icon: MapPin },
  { href: '/management', label: 'Tourist & Booking Management', icon: Users },
  { href: '/management/capacity-rules', label: 'Capacity Rules', icon: Sliders },
  { href: '/management/waste-tracking', label: 'Waste & Cleanup', icon: Trash2 },
  { href: '/management/compliance-reports', label: 'Compliance Reports', icon: ClipboardCheck },
  { href: '/register', label: 'Register Tourist', icon: UserPlus },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { href: '/weather', label: 'Weather Monitoring', icon: CloudSun },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <div className={cn(
        "h-full bg-white border-r border-gray-200 w-64 fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 shadow-xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">TMS</h1>
                <p className="text-xs text-gray-500">Tourist Management</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsOpen?.(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen?.(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Tourist Management System</p>
              <p>Jammu & Himachal Pradesh</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
