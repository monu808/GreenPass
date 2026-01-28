'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFocusTrap, useEscapeKey } from '@/lib/accessibility';
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Focus trap and escape key for mobile drawer
  useFocusTrap(sidebarRef, !!isOpen);
  useEscapeKey(() => setIsOpen?.(false), !!isOpen);

  // Prevent scrolling when sidebar is open on mobile
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX; // Initialize to zero delta for taps
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 70) {
      // Swiped left significantly
      setIsOpen?.(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/75 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside 
        ref={sidebarRef}
        aria-label="Sidebar navigation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
        "h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 w-64 fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div 
            className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
            aria-labelledby="sidebar-logo-title"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 id="sidebar-logo-title" className="font-bold text-lg text-gray-900 dark:text-gray-100">TMS</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400" aria-hidden="true">Tourist Management</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              className="lg:hidden p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setIsOpen?.(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Admin navigation" className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1" role="list">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen?.(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset min-h-[44px]',
                        isActive
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <footer className="p-4 border-t border-gray-200 dark:border-slate-700" role="contentinfo">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p className="font-medium text-gray-900 dark:text-gray-100">Tourist Management System</p>
              <p>Jammu & Himachal Pradesh</p>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
}
