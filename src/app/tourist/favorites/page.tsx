'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import TouristLayout from '@/components/TouristLayout';
import { 
  Heart, 
  MapPin, 
  Star, 
  Calendar,
  Trash2,
  BookOpen,
  Mountain,
  CheckCircle
} from 'lucide-react';

interface FavoriteDestination {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  visitedDate?: string;
  notes?: string;
  isBucketList: boolean;
}

interface FavoriteActivity {
  id: string;
  name: string;
  destination: string;
  type: string;
  duration: string;
  difficulty: string;
  notes?: string;
}

export default function Favorites() {
  const [activeTab, setActiveTab] = useState<'destinations' | 'activities'>('destinations');
  const [favoriteDestinations, setFavoriteDestinations] = useState<FavoriteDestination[]>([
    {
      id: '1',
      name: 'Rohtang Pass',
      location: 'Manali, Himachal Pradesh',
      image: '/api/placeholder/300/200',
      rating: 4.8,
      visitedDate: '2024-06-15',
      notes: 'Amazing snow views and adventure activities',
      isBucketList: false
    },
    {
      id: '2',
      name: 'Dal Lake',
      location: 'Srinagar, Jammu & Kashmir',
      image: '/api/placeholder/300/200',
      rating: 4.9,
      notes: 'Want to experience houseboat stay',
      isBucketList: true
    },
    {
      id: '3',
      name: 'Spiti Valley',
      location: 'Himachal Pradesh',
      image: '/api/placeholder/300/200',
      rating: 4.7,
      visitedDate: '2024-05-20',
      notes: 'Cold desert landscape was breathtaking',
      isBucketList: false
    }
  ]);

  const [favoriteActivities, setFavoriteActivities] = useState<FavoriteActivity[]>([
    {
      id: '1',
      name: 'River Rafting',
      destination: 'Rishikesh',
      type: 'Adventure',
      duration: '3-4 hours',
      difficulty: 'Moderate',
      notes: 'Best during monsoon season'
    },
    {
      id: '2',
      name: 'Photography Workshop',
      destination: 'Ladakh',
      type: 'Cultural',
      duration: '2 days',
      difficulty: 'Easy',
      notes: 'Learn landscape photography techniques'
    }
  ]);

  const removeFromFavorites = (id: string, type: 'destination' | 'activity') => {
    if (type === 'destination') {
      setFavoriteDestinations(prev => prev.filter(item => item.id !== id));
    } else {
      setFavoriteActivities(prev => prev.filter(item => item.id !== id));
    }
  };

  const visitedDestinations = favoriteDestinations.filter(dest => dest.visitedDate);
  const bucketListDestinations = favoriteDestinations.filter(dest => dest.isBucketList);

  return (
    <TouristLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="hero-section relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/90 via-pink-500/90 to-purple-600/90"></div>
          <div className="floating-element absolute top-10 right-10 opacity-20">
            <Heart size={120} />
          </div>
          <div className="floating-element absolute bottom-10 left-10 opacity-20">
            <BookOpen size={80} />
          </div>
          <div className="relative z-10 text-center text-white px-8 py-16">
            <h1 className="text-5xl font-serif font-bold mb-4 tracking-tight">
              Your <span className="gradient-text-light">Treasured Memories</span>
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              A collection of your favorite destinations and unforgettable experiences
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="floating-icon mx-auto mb-4">
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-2xl font-bold gradient-text">{favoriteDestinations.length}</div>
            <div className="text-sm text-gray-600 font-serif">Favorite Places</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="floating-icon mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold gradient-text">{visitedDestinations.length}</div>
            <div className="text-sm text-gray-600 font-serif">Places Visited</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="floating-icon mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-2xl font-bold gradient-text">{bucketListDestinations.length}</div>
            <div className="text-sm text-gray-600 font-serif">Bucket List</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="floating-icon mx-auto mb-4">
              <Mountain className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-2xl font-bold gradient-text">{favoriteActivities.length}</div>
            <div className="text-sm text-gray-600 font-serif">Favorite Activities</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card p-2 inline-flex rounded-xl">
          <button
            onClick={() => setActiveTab('destinations')}
            className={`px-6 py-3 rounded-lg font-serif font-medium transition-all duration-300 ${
              activeTab === 'destinations'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Destinations
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-6 py-3 rounded-lg font-serif font-medium transition-all duration-300 ${
              activeTab === 'activities'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Activities
          </button>
        </div>

        {/* Content */}
        {activeTab === 'destinations' && (
          <div className="space-y-8">
            {/* Visited Places */}
            {visitedDestinations.length > 0 && (
              <div className="glass-card p-8">
                <h2 className="text-2xl font-serif font-bold gradient-text mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  Places You've Conquered
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visitedDestinations.map((destination) => (
                    <div key={destination.id} className="destination-memory-card">
                      <div className="relative h-48 bg-slate-100 shimmer">
                        <Image
                          src={destination.image}
                          alt={destination.name}
                          className="w-full h-full object-cover rounded-lg"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority
                        />
                        <div className="absolute top-3 right-3 flex space-x-2">
                          <button className="glass-button p-2 text-red-500 hover:text-red-600">
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                          <button
                            onClick={() => removeFromFavorites(destination.id, 'destination')}
                            className="glass-button p-2 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <div className="glass-badge">
                            <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                            <span className="text-xs font-medium text-white">Visited</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif font-bold text-gray-900 mb-1">{destination.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {destination.location}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{destination.rating}</span>
                          </div>
                          {destination.visitedDate && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(destination.visitedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {destination.notes && (
                          <p className="text-sm text-gray-600 font-serif italic">{destination.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bucket List */}
            {bucketListDestinations.length > 0 && (
              <div className="glass-card p-8">
                <h2 className="text-2xl font-serif font-bold gradient-text mb-6 flex items-center">
                  <BookOpen className="h-6 w-6 text-blue-500 mr-3" />
                  Your Adventure Bucket List
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bucketListDestinations.map((destination) => (
                    <div key={destination.id} className="destination-memory-card">
                      <div className="relative h-48 bg-slate-100 shimmer">
                        <Image
                          src={destination.image}
                          alt={destination.name}
                          className="w-full h-full object-cover rounded-lg"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-3 right-3 flex space-x-2">
                          <button className="glass-button p-2 text-red-500 hover:text-red-600">
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                          <button
                            onClick={() => removeFromFavorites(destination.id, 'destination')}
                            className="glass-button p-2 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <div className="glass-badge bg-blue-500/80">
                            <BookOpen className="h-4 w-4 text-white mr-1" />
                            <span className="text-xs font-medium text-white">Bucket List</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif font-bold text-gray-900 mb-1">{destination.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {destination.location}
                        </div>
                        <div className="flex items-center space-x-1 mb-3">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{destination.rating}</span>
                        </div>
                        {destination.notes && (
                          <p className="text-sm text-gray-600 font-serif italic">{destination.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-serif font-bold gradient-text mb-6 flex items-center">
              <Mountain className="h-6 w-6 text-purple-500 mr-3" />
              Favorite Experiences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {favoriteActivities.map((activity) => (
                <div key={activity.id} className="glass-card p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-gray-900 mb-2">{activity.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {activity.destination}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <span className="glass-badge">{activity.type}</span>
                        <span className="glass-badge">{activity.duration}</span>
                        <span className="glass-badge">{activity.difficulty}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromFavorites(activity.id, 'activity')}
                      className="glass-button p-2 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {activity.notes && (
                    <p className="text-sm text-gray-600 font-serif italic">{activity.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'destinations' && favoriteDestinations.length === 0) ||
          (activeTab === 'activities' && favoriteActivities.length === 0)) && (
          <div className="glass-card p-16 text-center">
            <div className="floating-element mx-auto mb-6 opacity-50">
              <Heart size={80} />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-700 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 font-serif">
              Start exploring and add your favorite {activeTab} to see them here
            </p>
          </div>
        )}
      </div>
    </TouristLayout>
  );
}
