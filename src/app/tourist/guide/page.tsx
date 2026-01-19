'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  Plane, 
  Train,
  Mountain,
  Sun,
  Cloud,
  Snowflake,
  Thermometer,
  Shield,
  AlertTriangle,
  Phone,
  Search,
  Info,
  Star,
  Download,
  Bookmark,
  Share2,
  Navigation
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface Destination {
  id: string;
  name: string;
  region: string;
  bestTime: string[];
  difficulty: string;
  highlights: string[];
  image: string;
}

interface EmergencyContact {
  service: string;
  number: string;
  available: string;
}

export default function TravelGuide() {
  const [activeSection, setActiveSection] = useState<string>('destinations');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const destinations: Destination[] = [
    {
      id: '1',
      name: 'Rohtang Pass',
      region: 'Himachal Pradesh',
      bestTime: ['May', 'June', 'July', 'August', 'September'],
      difficulty: 'Moderate',
      highlights: ['Snow activities', 'Adventure sports', 'Scenic drive'],
      image: '/api/placeholder/300/200'
    },
    {
      id: '2',
      name: 'Dal Lake',
      region: 'Jammu & Kashmir',
      bestTime: ['April', 'May', 'June', 'September', 'October'],
      difficulty: 'Easy',
      highlights: ['Houseboat stay', 'Shikara rides', 'Floating gardens'],
      image: '/api/placeholder/300/200'
    },
    {
      id: '3',
      name: 'Spiti Valley',
      region: 'Himachal Pradesh',
      bestTime: ['May', 'June', 'July', 'August', 'September'],
      difficulty: 'Difficult',
      highlights: ['High altitude desert', 'Monasteries', 'Unique culture'],
      image: '/api/placeholder/300/200'
    }
  ];

  const emergencyContacts: EmergencyContact[] = [
    { service: 'Police Emergency', number: '100', available: '24/7' },
    { service: 'Medical Emergency', number: '108', available: '24/7' },
    { service: 'Fire Emergency', number: '101', available: '24/7' },
    { service: 'Tourist Helpline (HP)', number: '1363', available: '24/7' },
    { service: 'Tourist Helpline (J&K)', number: '181', available: '24/7' },
    { service: 'Disaster Management', number: '1077', available: '24/7' }
  ];

  const guideSections: GuideSection[] = [
    {
      id: 'destinations',
      title: 'Popular Destinations',
      icon: MapPin,
      content: (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Regions</option>
              <option value="Himachal Pradesh">Himachal Pradesh</option>
              <option value="Jammu & Kashmir">Jammu & Kashmir</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations
              .filter(dest => 
                (selectedRegion === 'all' || dest.region === selectedRegion) &&
                dest.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((destination) => (
              <div key={destination.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="h-32 bg-gray-200 rounded-lg mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{destination.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{destination.region}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Best: {destination.bestTime.slice(0, 2).join(', ')}</span>
                  <span className={`px-2 py-1 rounded ${
                    destination.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    destination.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {destination.difficulty}
                  </span>
                </div>
                <div className="space-y-1">
                  {destination.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'planning',
      title: 'Trip Planning',
      icon: Clock,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Best Time to Visit
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-blue-800">Summer (April - June)</h4>
                  <p className="text-sm text-blue-700">Perfect for hill stations, pleasant weather, all roads open</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800">Monsoon (July - September)</h4>
                  <p className="text-sm text-blue-700">Lush greenery, waterfalls, but landslide risks</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800">Winter (October - March)</h4>
                  <p className="text-sm text-blue-700">Snow activities, cold weather, some road closures</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Trip Duration Guide
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-green-800">2-3 Days</h4>
                  <p className="text-sm text-green-700">Single destination, nearby attractions</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">5-7 Days</h4>
                  <p className="text-sm text-green-700">Multiple cities, regional exploration</p>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">10+ Days</h4>
                  <p className="text-sm text-green-700">Complete regional tour, adventure activities</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Pre-Trip Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Documents</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Valid ID proof (Aadhaar/Passport)</li>
                  <li>• Travel insurance</li>
                  <li>• Hotel bookings confirmation</li>
                  <li>• Inner line permit (if required)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Essentials</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Weather-appropriate clothing</li>
                  <li>• Medications and first aid</li>
                  <li>• Power bank and chargers</li>
                  <li>• Emergency contact numbers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'transportation',
      title: 'Transportation',
      icon: Car,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Plane className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="font-semibold text-gray-900">By Air</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800">Major Airports</h4>
                  <ul className="space-y-1">
                    <li>• Chandigarh Airport (Himachal)</li>
                    <li>• Srinagar Airport (J&K)</li>
                    <li>• Jammu Airport (J&K)</li>
                    <li>• Kullu-Manali Airport</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">Best for: Long distance, time constraints</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Train className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="font-semibold text-gray-900">By Train</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800">Railway Stations</h4>
                  <ul className="space-y-1">
                    <li>• Chandigarh Railway Station</li>
                    <li>• Jammu Tawi Railway Station</li>
                    <li>• Pathankot Railway Station</li>
                    <li>• Kalka Railway Station</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">Best for: Budget travel, scenic routes</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Car className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="font-semibold text-gray-900">By Road</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800">Road Options</h4>
                  <ul className="space-y-1">
                    <li>• Private car/taxi</li>
                    <li>• Bus services (Volvo/Ordinary)</li>
                    <li>• Motorcycle</li>
                    <li>• Shared taxis</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">Best for: Flexibility, scenic drives</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Road Safety Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
              <ul className="space-y-1">
                <li>• Check weather conditions before travel</li>
                <li>• Carry tire chains in winter</li>
                <li>• Keep vehicle serviced and fueled</li>
                <li>• Drive slowly on mountain roads</li>
              </ul>
              <ul className="space-y-1">
                <li>• Avoid night driving in hills</li>
                <li>• Keep emergency contact numbers</li>
                <li>• Inform someone about your route</li>
                <li>• Carry sufficient water and snacks</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'weather',
      title: 'Weather Guide',
      icon: Sun,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center mb-3">
                <Sun className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="font-semibold text-orange-900">Summer</h3>
              </div>
              <div className="text-sm text-orange-800">
                <p className="mb-2">Apr - Jun • 15°C - 30°C</p>
                <ul className="space-y-1 text-xs">
                  <li>• Pleasant weather</li>
                  <li>• Perfect for trekking</li>
                  <li>• All roads accessible</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center mb-3">
                <Cloud className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Monsoon</h3>
              </div>
              <div className="text-sm text-green-800">
                <p className="mb-2">Jul - Sep • 10°C - 25°C</p>
                <ul className="space-y-1 text-xs">
                  <li>• Heavy rainfall</li>
                  <li>• Landslide risk</li>
                  <li>• Lush greenery</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3">
                <Snowflake className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Winter</h3>
              </div>
              <div className="text-sm text-blue-800">
                <p className="mb-2">Dec - Feb • -5°C - 15°C</p>
                <ul className="space-y-1 text-xs">
                  <li>• Heavy snowfall</li>
                  <li>• Road closures</li>
                  <li>• Winter sports</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-3">
                <Thermometer className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="font-semibold text-purple-900">Autumn</h3>
              </div>
              <div className="text-sm text-purple-800">
                <p className="mb-2">Oct - Nov • 5°C - 20°C</p>
                <ul className="space-y-1 text-xs">
                  <li>• Clear skies</li>
                  <li>• Ideal for photography</li>
                  <li>• Comfortable travel</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Altitude-wise Weather Guide</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-green-800">Low Altitude (500-1500m)</h4>
                  <p className="text-sm text-green-600">Jammu, Una, Bilaspur</p>
                </div>
                <span className="text-sm text-green-700">Warm, humid summers</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-yellow-800">Medium Altitude (1500-3000m)</h4>
                  <p className="text-sm text-yellow-600">Shimla, Manali, Srinagar</p>
                </div>
                <span className="text-sm text-yellow-700">Pleasant summers, cold winters</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-800">High Altitude (3000m+)</h4>
                  <p className="text-sm text-blue-600">Leh, Spiti, Rohtang</p>
                </div>
                <span className="text-sm text-blue-700">Cold year-round, snow</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'safety',
      title: 'Safety & Emergency',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <h3 className="font-semibold text-red-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Emergency Contacts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <h4 className="font-medium text-gray-900">{contact.service}</h4>
                    <p className="text-sm text-gray-600">{contact.available}</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">{contact.number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Mountain className="h-5 w-5 mr-2" />
                Mountain Safety
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Inform someone about your trekking plans</li>
                <li>• Carry adequate warm clothing</li>
                <li>• Stay hydrated and acclimatize properly</li>
                <li>• Don't trek alone in remote areas</li>
                <li>• Carry emergency whistle and flashlight</li>
                <li>• Be aware of altitude sickness symptoms</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                General Safety Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Keep copies of important documents</li>
                <li>• Avoid isolated areas after dark</li>
                <li>• Use registered travel agents</li>
                <li>• Keep emergency cash reserves</li>
                <li>• Stay updated with weather forecasts</li>
                <li>• Register with local police if required</li>
              </ul>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-4">Natural Disaster Precautions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Landslides</h4>
                <ul className="space-y-1 text-orange-700">
                  <li>• Avoid travel during heavy rains</li>
                  <li>• Stay away from steep slopes</li>
                  <li>• Listen to local advisories</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Earthquakes</h4>
                <ul className="space-y-1 text-orange-700">
                  <li>• Know evacuation routes</li>
                  <li>• Stay in earthquake-safe buildings</li>
                  <li>• Keep emergency kit ready</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Flash Floods</h4>
                <ul className="space-y-1 text-orange-700">
                  <li>• Avoid camping near rivers</li>
                  <li>• Move to higher ground if warned</li>
                  <li>• Don't cross flooded roads</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeGuideSection = guideSections.find(section => section.id === activeSection);

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Travel Guide</h1>
          <p className="text-indigo-100">Complete guide for traveling in Jammu & Himachal Pradesh</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="flex items-center px-3 py-1 bg-white/20 rounded-lg text-sm">
              <Download className="h-4 w-4 mr-1" />
              Download Guide
            </button>
            <button className="flex items-center px-3 py-1 bg-white/20 rounded-lg text-sm">
              <Bookmark className="h-4 w-4 mr-1" />
              Save Guide
            </button>
            <button className="flex items-center px-3 py-1 bg-white/20 rounded-lg text-sm">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex overflow-x-auto">
            {guideSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeSection === section.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            {activeGuideSection && (
              <>
                <activeGuideSection.icon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">{activeGuideSection.title}</h2>
              </>
            )}
          </div>
          
          {activeGuideSection?.content}
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border border-green-200">
          <h2 className="text-xl font-bold text-green-900 mb-4">Quick Travel Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Local Currency</h3>
                <p className="text-sm text-green-700">Indian Rupee (INR). Cards accepted in cities.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Navigation className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Language</h3>
                <p className="text-sm text-green-700">Hindi, English widely spoken. Local dialects vary.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Time Zone</h3>
                <p className="text-sm text-green-700">IST (UTC +5:30). No daylight saving.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Network</h3>
                <p className="text-sm text-green-700">Good connectivity in cities. Limited in remote areas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}
