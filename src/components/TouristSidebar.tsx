import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MapPin, 
  Calendar, 
  Heart, 
  User, 
  Camera, 
  Mountain,
  TreePine,
  Star,
  Info
} from 'lucide-react';

const touristNavItems = [
  { name: 'Explore', href: '/tourist/dashboard', icon: Home },
  { name: 'Destinations', href: '/tourist/destinations', icon: MapPin },
  { name: 'Plan Your Trip', href: '/tourist/plan', icon: Calendar },
  { name: 'My Bookings', href: '/tourist/bookings', icon: Calendar },
  { name: 'Favorites', href: '/tourist/favorites', icon: Heart },
  { name: 'Photo Gallery', href: '/tourist/gallery', icon: Camera },
  { name: 'Adventure Activities', href: '/tourist/activities', icon: Mountain },
  { name: 'Eco Tourism', href: '/tourist/eco-tourism', icon: TreePine },
  { name: 'Reviews & Ratings', href: '/tourist/reviews', icon: Star },
  { name: 'Travel Guide', href: '/tourist/guide', icon: Info },
  { name: 'My Profile', href: '/tourist/profile', icon: User },
];

export default function TouristSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 glass-sidebar">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 px-6 gradient-bg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-500 to-secondary-600 opacity-90"></div>
          <div className="relative flex items-center space-x-3">
            <div className="floating-icon">
              <Mountain className="h-10 w-10 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-serif font-bold">Paradise Tourism</h1>
              <p className="text-sm opacity-90 font-medium">Jammu & Himachal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
          {touristNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center space-x-4 px-4 py-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'glass-card-active gradient-text font-semibold transform scale-105'
                    : 'nav-item text-gray-700 hover:text-primary-600'
                }`}
              >
                <item.icon className={`h-6 w-6 transition-all duration-300 ${
                  isActive 
                    ? 'text-primary-600 scale-110' 
                    : 'text-gray-500 group-hover:text-primary-600 group-hover:scale-110'
                }`} />
                <span className="font-serif">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-primary-400 to-accent-400"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Weather Widget */}
        <div className="p-4 m-4 glass-card">
          <div className="text-center">
            <h3 className="text-sm font-serif font-semibold gradient-text mb-3">Today's Weather</h3>
            <div className="flex items-center justify-center space-x-3">
              <div className="text-3xl floating-element">☀️</div>
              <div>
                <p className="text-xl font-bold gradient-text">24°C</p>
                <p className="text-xs text-gray-600 font-medium">Perfect for exploring!</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs text-primary-600 font-medium">Clear skies ahead</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <div className="text-center text-xs text-gray-600">
            <p className="font-serif font-medium gradient-text">© 2025 Paradise Tourism</p>
            <p className="text-primary-600 font-medium mt-1">Sustainable Adventure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
