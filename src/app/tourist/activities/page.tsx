'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Mountain, 
  Users, 
  Clock, 
  DollarSign, 
  Star, 
  MapPin, 
  Calendar,
  Heart,
  Filter,
  Search,
  ChevronDown,
  Activity,
  Waves,
  Wind,
  TreePine,
  Camera,
  Car,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface AdventureActivity {
  id: string;
  name: string;
  type: string;
  location: string;
  duration: string;
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  price: number;
  rating: number;
  reviews: number;
  groupSize: string;
  description: string;
  highlights: string[];
  equipment: string[];
  bestSeason: string[];
  image: string;
  isPopular: boolean;
  safetyRating: number;
}

export default function AdventureActivities() {
  const [activities] = useState<AdventureActivity[]>([
    {
      id: '1',
      name: 'Paragliding at Bir Billing',
      type: 'Air Sports',
      location: 'Bir Billing, Himachal Pradesh',
      duration: '30-45 minutes',
      difficulty: 'Easy',
      price: 3500,
      rating: 4.8,
      reviews: 245,
      groupSize: '1-2 people',
      description: 'Experience the thrill of flying like a bird over the beautiful Kangra valley. Bir Billing is one of the world\'s best paragliding sites.',
      highlights: ['Professional instructor', 'Safety equipment included', 'HD video recording', 'Certificate provided'],
      equipment: ['Paraglider', 'Harness', 'Helmet', 'Safety gear'],
      bestSeason: ['March', 'April', 'May', 'October', 'November'],
      image: '/api/placeholder/400/300',
      isPopular: true,
      safetyRating: 4.9
    },
    {
      id: '2',
      name: 'River Rafting in Rishikesh',
      type: 'Water Sports',
      location: 'Rishikesh, Uttarakhand',
      duration: '3-4 hours',
      difficulty: 'Moderate',
      price: 1800,
      rating: 4.6,
      reviews: 189,
      groupSize: '6-8 people',
      description: 'Navigate through the rapids of the holy Ganges river with experienced guides. Perfect adventure for thrill seekers.',
      highlights: ['Grade II-III rapids', 'Experienced guides', 'Safety briefing', 'Transport included'],
      equipment: ['Life jacket', 'Helmet', 'Paddle', 'Raft'],
      bestSeason: ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'],
      image: '/api/placeholder/400/300',
      isPopular: true,
      safetyRating: 4.7
    },
    {
      id: '3',
      name: 'Trekking to Triund',
      type: 'Trekking',
      location: 'McLeod Ganj, Himachal Pradesh',
      duration: '1 day',
      difficulty: 'Easy',
      price: 1200,
      rating: 4.5,
      reviews: 156,
      groupSize: '5-15 people',
      description: 'A scenic trek offering panoramic views of the Dhauladhar range. Perfect for beginners and families.',
      highlights: ['Stunning mountain views', 'Easy trail', 'Photography opportunities', 'Local guide'],
      equipment: ['Trekking shoes', 'Backpack', 'Water bottle', 'First aid kit'],
      bestSeason: ['March', 'April', 'May', 'September', 'October', 'November'],
      image: '/api/placeholder/400/300',
      isPopular: false,
      safetyRating: 4.8
    },
    {
      id: '4',
      name: 'Rock Climbing in Manali',
      type: 'Rock Sports',
      location: 'Manali, Himachal Pradesh',
      duration: '2-3 hours',
      difficulty: 'Difficult',
      price: 2500,
      rating: 4.7,
      reviews: 98,
      groupSize: '2-4 people',
      description: 'Challenge yourself with rock climbing on natural rock formations with professional instructors.',
      highlights: ['Natural rock walls', 'Professional equipment', 'Multiple difficulty levels', 'Safety certified'],
      equipment: ['Climbing harness', 'Helmet', 'Ropes', 'Climbing shoes'],
      bestSeason: ['April', 'May', 'June', 'September', 'October'],
      image: '/api/placeholder/400/300',
      isPopular: false,
      safetyRating: 4.6
    },
    {
      id: '5',
      name: 'Skiing in Gulmarg',
      type: 'Snow Sports',
      location: 'Gulmarg, Jammu & Kashmir',
      duration: 'Full day',
      difficulty: 'Moderate',
      price: 4500,
      rating: 4.9,
      reviews: 167,
      groupSize: '1-5 people',
      description: 'Experience world-class skiing on the pristine slopes of Gulmarg with the highest gondola in the world.',
      highlights: ['World-class slopes', 'Gondola ride', 'Equipment rental', 'Professional instruction'],
      equipment: ['Skis', 'Boots', 'Poles', 'Safety gear'],
      bestSeason: ['December', 'January', 'February', 'March'],
      image: '/api/placeholder/400/300',
      isPopular: true,
      safetyRating: 4.8
    },
    {
      id: '6',
      name: 'Mountain Biking in Spiti',
      type: 'Cycling',
      location: 'Spiti Valley, Himachal Pradesh',
      duration: '3-5 days',
      difficulty: 'Expert',
      price: 8500,
      rating: 4.8,
      reviews: 76,
      groupSize: '4-8 people',
      description: 'An extreme cycling adventure through the cold desert landscapes of Spiti Valley.',
      highlights: ['High altitude cycling', 'Scenic landscapes', 'Cultural experience', 'Support vehicle'],
      equipment: ['Mountain bike', 'Helmet', 'Protective gear', 'Repair kit'],
      bestSeason: ['May', 'June', 'July', 'August', 'September'],
      image: '/api/placeholder/400/300',
      isPopular: false,
      safetyRating: 4.5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const activityTypes = Array.from(new Set(activities.map(activity => activity.type)));
  const difficulties = ['Easy', 'Moderate', 'Difficult', 'Expert'];

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || activity.difficulty === selectedDifficulty;
    
    let matchesPrice = true;
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'low':
          matchesPrice = activity.price < 2000;
          break;
        case 'medium':
          matchesPrice = activity.price >= 2000 && activity.price < 5000;
          break;
        case 'high':
          matchesPrice = activity.price >= 5000;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDifficulty && matchesPrice;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Difficult': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Air Sports': return Wind;
      case 'Water Sports': return Waves;
      case 'Trekking': return Mountain;
      case 'Rock Sports': return Mountain;
      case 'Snow Sports': return Mountain;
      case 'Cycling': return Car;
      default: return Activity;
    }
  };

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Adventure Activities</h1>
          <p className="text-orange-100">Discover thrilling adventures in the mountains and valleys</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search activities or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Prices</option>
                  <option value="low">Under ₹2,000</option>
                  <option value="medium">₹2,000 - ₹5,000</option>
                  <option value="high">Above ₹5,000</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Popular Activities Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔥 Popular Adventures</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activities.filter(activity => activity.isPopular).slice(0, 3).map((activity) => {
              const TypeIcon = getTypeIcon(activity.type);
              return (
                <div key={activity.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <TypeIcon className="h-5 w-5 text-orange-600 mr-2" />
                    <h3 className="font-medium text-gray-900">{activity.name}</h3>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>₹{activity.price.toLocaleString()}</span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      <span>{activity.rating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredActivities.map((activity) => {
            const TypeIcon = getTypeIcon(activity.type);
            return (
              <div key={activity.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image and Badge */}
                <div className="relative h-48 bg-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {activity.isPopular && (
                      <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium">
                        Popular
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(activity.difficulty)}`}>
                      {activity.difficulty}
                    </span>
                  </div>
                  
                  {/* Favorite Button */}
                  <button className="absolute top-3 right-3 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                    <Heart className="h-4 w-4" />
                  </button>
                  
                  {/* Type and Price */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="flex items-center text-white">
                      <TypeIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">{activity.type}</span>
                    </div>
                    <div className="text-white text-right">
                      <div className="text-lg font-bold">₹{activity.price.toLocaleString()}</div>
                      <div className="text-xs opacity-80">per person</div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{activity.name}</h3>
                    <div className="flex items-center text-yellow-500 ml-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{activity.rating} ({activity.reviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{activity.location}</span>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{activity.description}</p>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{activity.duration}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{activity.groupSize}</span>
                    </div>
                  </div>

                  {/* Safety Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Safety Rating: {activity.safetyRating}/5</span>
                    </div>
                    <div className="flex items-center text-blue-600">
                      <Info className="h-4 w-4 mr-1" />
                      <span className="text-sm">Best: {activity.bestSeason.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {activity.highlights.slice(0, 3).map((highlight, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          {highlight}
                        </span>
                      ))}
                      {activity.highlights.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{activity.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                      Book Now
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Information */}
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Safety First</h3>
              <p className="text-yellow-700 text-sm mb-3">
                All adventure activities are conducted with certified instructors and proper safety equipment. 
                Please follow all safety guidelines and inform about any medical conditions.
              </p>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Age and fitness requirements apply</li>
                <li>• Weather conditions may affect availability</li>
                <li>• Insurance coverage recommended</li>
                <li>• Professional guidance mandatory</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}
