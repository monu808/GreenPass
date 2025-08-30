'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  TreePine, 
  Leaf, 
  Users, 
  MapPin, 
  Calendar,
  Star,
  Eye,
  Heart,
  Search,
  Filter,
  Recycle,
  Globe,
  Bird,
  Fish,
  Flower,
  Sun,
  Droplets,
  Wind,
  CheckCircle,
  Award,
  Info
} from 'lucide-react';

interface EcoDestination {
  id: string;
  name: string;
  location: string;
  type: string;
  description: string;
  ecoRating: number;
  sustainabilityFeatures: string[];
  wildlife: string[];
  activities: string[];
  bestTime: string[];
  carbonFootprint: 'Low' | 'Medium' | 'High';
  certifications: string[];
  image: string;
  price: number;
  duration: string;
  groupSize: string;
  isVerified: boolean;
}

interface EcoInitiative {
  id: string;
  title: string;
  description: string;
  impact: string;
  participants: number;
  icon: React.ElementType;
}

export default function EcoTourism() {
  const [ecoDestinations] = useState<EcoDestination[]>([
    {
      id: '1',
      name: 'Great Himalayan National Park',
      location: 'Himachal Pradesh',
      type: 'National Park',
      description: 'UNESCO World Heritage site with rich biodiversity and sustainable tourism practices.',
      ecoRating: 4.9,
      sustainabilityFeatures: ['Solar powered facilities', 'Waste management', 'Local community involvement', 'Carbon neutral'],
      wildlife: ['Snow Leopard', 'Himalayan Brown Bear', 'Blue Sheep', 'Monal Pheasant'],
      activities: ['Nature walks', 'Bird watching', 'Photography', 'Cultural tours'],
      bestTime: ['April', 'May', 'June', 'September', 'October'],
      carbonFootprint: 'Low',
      certifications: ['UNESCO World Heritage', 'Green Tourism'],
      image: '/api/placeholder/400/300',
      price: 2500,
      duration: '2-3 days',
      groupSize: '8-12 people',
      isVerified: true
    },
    {
      id: '2',
      name: 'Spiti Valley Eco Village',
      location: 'Himachal Pradesh',
      type: 'Eco Village',
      description: 'Experience sustainable living in the cold desert with local communities.',
      ecoRating: 4.7,
      sustainabilityFeatures: ['Traditional architecture', 'Organic farming', 'Renewable energy', 'Water conservation'],
      wildlife: ['Snow Leopard', 'Ibex', 'Tibetan Wolf', 'Golden Eagle'],
      activities: ['Organic farming', 'Traditional crafts', 'Meditation', 'Astronomy'],
      bestTime: ['May', 'June', 'July', 'August', 'September'],
      carbonFootprint: 'Low',
      certifications: ['Responsible Tourism', 'Community Based Tourism'],
      image: '/api/placeholder/400/300',
      price: 3500,
      duration: '4-5 days',
      groupSize: '6-10 people',
      isVerified: true
    },
    {
      id: '3',
      name: 'Khajjiar Meadows',
      location: 'Himachal Pradesh',
      type: 'Meadows',
      description: 'Mini Switzerland of India with pristine meadows and sustainable practices.',
      ecoRating: 4.5,
      sustainabilityFeatures: ['Protected ecosystem', 'Eco-friendly transport', 'Waste recycling', 'Trail maintenance'],
      wildlife: ['Himalayan Black Bear', 'Barking Deer', 'Flying Squirrel', 'Various Birds'],
      activities: ['Nature trails', 'Camping', 'Photography', 'Paragliding'],
      bestTime: ['March', 'April', 'May', 'June', 'September', 'October'],
      carbonFootprint: 'Medium',
      certifications: ['Eco Tourism Board'],
      image: '/api/placeholder/400/300',
      price: 1800,
      duration: '1-2 days',
      groupSize: '10-15 people',
      isVerified: true
    },
    {
      id: '4',
      name: 'Dachigam National Park',
      location: 'Jammu & Kashmir',
      type: 'National Park',
      description: 'Home to the endangered Hangul deer with strict conservation measures.',
      ecoRating: 4.8,
      sustainabilityFeatures: ['Wildlife conservation', 'Research facilities', 'Minimal human impact', 'Education programs'],
      wildlife: ['Hangul Deer', 'Himalayan Black Bear', 'Leopard', 'Musk Deer'],
      activities: ['Wildlife safari', 'Research tours', 'Education programs', 'Photography'],
      bestTime: ['April', 'May', 'June', 'September', 'October'],
      carbonFootprint: 'Low',
      certifications: ['Wildlife Conservation', 'Research Institute'],
      image: '/api/placeholder/400/300',
      price: 2200,
      duration: '1 day',
      groupSize: '5-8 people',
      isVerified: true
    }
  ]);

  const [ecoInitiatives] = useState<EcoInitiative[]>([
    {
      id: '1',
      title: 'Clean Mountain Initiative',
      description: 'Join local communities in cleaning trekking routes and maintaining trail hygiene.',
      impact: '500+ kg waste collected',
      participants: 1250,
      icon: Recycle
    },
    {
      id: '2',
      title: 'Wildlife Conservation Program',
      description: 'Support wildlife conservation efforts and research programs in the region.',
      impact: '15 species protected',
      participants: 890,
      icon: Bird
    },
    {
      id: '3',
      title: 'Carbon Offset Projects',
      description: 'Contribute to reforestation and renewable energy projects.',
      impact: '2000 trees planted',
      participants: 2100,
      icon: TreePine
    },
    {
      id: '4',
      title: 'Water Conservation',
      description: 'Support water harvesting and conservation projects in mountain villages.',
      impact: '50+ water sources restored',
      participants: 650,
      icon: Droplets
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');

  const destinationTypes = Array.from(new Set(ecoDestinations.map(dest => dest.type)));

  const filteredDestinations = ecoDestinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dest.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || dest.type === selectedType;
    const matchesRating = selectedRating === 'all' || dest.ecoRating >= parseFloat(selectedRating);
    
    return matchesSearch && matchesType && matchesRating;
  });

  const getCarbonFootprintColor = (footprint: string) => {
    switch (footprint) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (activity: string) => {
    if (activity.includes('bird') || activity.includes('wildlife')) return Bird;
    if (activity.includes('farm')) return Leaf;
    if (activity.includes('photo')) return Eye;
    return TreePine;
  };

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Eco Tourism</h1>
          <p className="text-green-100">Explore responsibly, preserve naturally</p>
          <div className="mt-4 flex items-center space-x-6 text-green-100 text-sm">
            <div className="flex items-center">
              <TreePine className="h-4 w-4 mr-1" />
              <span>Carbon Neutral</span>
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              <span>Sustainable</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              <span>Community Supported</span>
            </div>
          </div>
        </div>

        {/* Eco Impact Dashboard */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Eco Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <TreePine className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">2,500+</div>
              <div className="text-sm text-green-600">Trees Planted</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Droplets className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">50+</div>
              <div className="text-sm text-blue-600">Water Sources Restored</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Bird className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-800">15</div>
              <div className="text-sm text-yellow-600">Species Protected</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">1,200+</div>
              <div className="text-sm text-purple-600">Families Benefited</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search eco destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {destinationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="4.5">4.5+ Rating</option>
                <option value="4.0">4.0+ Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Eco Initiatives */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Our Eco Initiatives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ecoInitiatives.map((initiative) => {
              const IconComponent = initiative.icon;
              return (
                <div key={initiative.id} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer">
                  <div className="flex items-center mb-3">
                    <IconComponent className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="font-medium text-gray-900">{initiative.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{initiative.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>{initiative.impact}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{initiative.participants.toLocaleString()} participants</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eco Destinations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDestinations.map((destination) => (
            <div key={destination.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image and Badges */}
              <div className="relative h-48 bg-gray-200">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {destination.isVerified && (
                    <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getCarbonFootprintColor(destination.carbonFootprint)}`}>
                    {destination.carbonFootprint} Carbon
                  </span>
                </div>
                
                {/* Favorite Button */}
                <button className="absolute top-3 right-3 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
                
                {/* Bottom Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      <Leaf className="h-4 w-4 mr-1" />
                      <span className="text-sm">{destination.type}</span>
                    </div>
                    <div className="flex items-center text-white">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm">{destination.ecoRating}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{destination.name}</h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">₹{destination.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{destination.duration}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{destination.location}</span>
                </div>

                <p className="text-gray-700 text-sm mb-4">{destination.description}</p>

                {/* Certifications */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {destination.certifications.map((cert, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sustainability Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Sustainability Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {destination.sustainabilityFeatures.slice(0, 3).map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                    {destination.sustainabilityFeatures.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{destination.sustainabilityFeatures.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Wildlife */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Wildlife:</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Bird className="h-4 w-4 mr-1" />
                    <span>{destination.wildlife.slice(0, 2).join(', ')}</span>
                    {destination.wildlife.length > 2 && (
                      <span className="ml-1">+{destination.wildlife.length - 2} more</span>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{destination.groupSize}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Best: {destination.bestTime.slice(0, 2).join(', ')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                    Book Eco Tour
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Eco Pledge */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-3">Take the Eco Pledge</h2>
            <p className="text-green-700 mb-4 max-w-2xl mx-auto">
              Join thousands of responsible travelers in protecting our mountains and valleys. 
              Commit to sustainable tourism practices that benefit local communities and preserve nature.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-green-700 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Leave no trace</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Support local communities</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Respect wildlife</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Use resources responsibly</span>
              </div>
            </div>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              Take the Pledge
            </button>
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}
