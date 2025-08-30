'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard,
  Heart,
  Star,
  Edit,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  Globe,
  Plane,
  Mountain,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  Check
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  dateOfBirth: string;
  bio: string;
  avatar: string;
  joinDate: string;
  totalTrips: number;
  totalDistance: number;
  favoriteDestination: string;
  travelStyle: string[];
  languages: string[];
}

interface TravelStats {
  placesVisited: number;
  totalDistance: number;
  favoriteActivity: string;
  totalSpent: number;
  averageRating: number;
  totalReviews: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  earned: boolean;
  earnedDate?: string;
}

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    location: 'Delhi, India',
    dateOfBirth: '1990-05-15',
    bio: 'Adventure enthusiast who loves exploring mountains and valleys. Photography is my passion and I enjoy capturing the beauty of nature.',
    avatar: '/api/placeholder/150/150',
    joinDate: '2023-01-15',
    totalTrips: 12,
    totalDistance: 15000,
    favoriteDestination: 'Manali',
    travelStyle: ['Adventure', 'Photography', 'Eco-Tourism'],
    languages: ['Hindi', 'English', 'Punjabi']
  });

  const travelStats: TravelStats = {
    placesVisited: 25,
    totalDistance: 15000,
    favoriteActivity: 'Trekking',
    totalSpent: 150000,
    averageRating: 4.6,
    totalReviews: 18
  };

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Explorer',
      description: 'Visited 10+ destinations',
      icon: MapPin,
      earned: true,
      earnedDate: '2023-06-15'
    },
    {
      id: '2',
      title: 'Adventurer',
      description: 'Completed 5+ adventure activities',
      icon: Mountain,
      earned: true,
      earnedDate: '2023-08-20'
    },
    {
      id: '3',
      title: 'Photographer',
      description: 'Uploaded 50+ photos',
      icon: Camera,
      earned: true,
      earnedDate: '2023-09-10'
    },
    {
      id: '4',
      title: 'Reviewer',
      description: 'Written 20+ reviews',
      icon: Star,
      earned: false
    },
    {
      id: '5',
      title: 'Distance Warrior',
      description: 'Traveled 20,000+ km',
      icon: Plane,
      earned: false
    },
    {
      id: '6',
      title: 'Social Traveler',
      description: 'Made 10+ travel friends',
      icon: Heart,
      earned: false
    }
  ];

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Save profile logic here
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
  };

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'stats', label: 'Travel Stats', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-purple-600">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                <p className="text-purple-100">{userProfile.location}</p>
                <p className="text-sm text-purple-200">Member since {new Date(userProfile.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{userProfile.totalTrips}</div>
              <div className="text-sm text-purple-200">Total Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{travelStats.placesVisited}</div>
              <div className="text-sm text-purple-200">Places Visited</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(userProfile.totalDistance / 1000).toFixed(1)}k</div>
              <div className="text-sm text-purple-200">KM Traveled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{travelStats.averageRating}</div>
              <div className="text-sm text-purple-200">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                {isEditing && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={userProfile.phone}
                        onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userProfile.location}
                        onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile.location}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={userProfile.dateOfBirth}
                        onChange={(e) => setUserProfile({...userProfile, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{new Date(userProfile.dateOfBirth).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Travel Styles</label>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.travelStyle.map((style, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Destination</label>
                    <p className="text-gray-900">{userProfile.favoriteDestination}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.bio}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Travel Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-8 w-8 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">{travelStats.placesVisited}</span>
                  </div>
                  <h3 className="font-semibold text-blue-900">Places Visited</h3>
                  <p className="text-sm text-blue-700">Across multiple states</p>
                </div>

                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Plane className="h-8 w-8 text-green-600" />
                    <span className="text-2xl font-bold text-green-900">{(travelStats.totalDistance / 1000).toFixed(1)}k</span>
                  </div>
                  <h3 className="font-semibold text-green-900">Distance Traveled</h3>
                  <p className="text-sm text-green-700">Kilometers covered</p>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Mountain className="h-8 w-8 text-purple-600" />
                    <span className="text-lg font-bold text-purple-900">{travelStats.favoriteActivity}</span>
                  </div>
                  <h3 className="font-semibold text-purple-900">Favorite Activity</h3>
                  <p className="text-sm text-purple-700">Most preferred adventure</p>
                </div>

                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CreditCard className="h-8 w-8 text-orange-600" />
                    <span className="text-2xl font-bold text-orange-900">₹{(travelStats.totalSpent / 1000).toFixed(0)}k</span>
                  </div>
                  <h3 className="font-semibold text-orange-900">Total Spent</h3>
                  <p className="text-sm text-orange-700">On travel experiences</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-900">{travelStats.averageRating}</span>
                  </div>
                  <h3 className="font-semibold text-yellow-900">Average Rating</h3>
                  <p className="text-sm text-yellow-700">Given to destinations</p>
                </div>

                <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Edit className="h-8 w-8 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{travelStats.totalReviews}</span>
                  </div>
                  <h3 className="font-semibold text-red-900">Reviews Written</h3>
                  <p className="text-sm text-red-700">Shared experiences</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Travel Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">Last Trip: Manali, Himachal Pradesh</span>
                    </div>
                    <span className="text-sm text-gray-500">Dec 2023</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">Previous Trip: Leh, Ladakh</span>
                    </div>
                    <span className="text-sm text-gray-500">Sep 2023</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">First Trip: Shimla, Himachal Pradesh</span>
                    </div>
                    <span className="text-sm text-gray-500">Jan 2023</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-lg p-6 border-2 transition-all ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <IconComponent
                          className={`h-8 w-8 ${
                            achievement.earned ? 'text-green-600' : 'text-gray-400'
                          }`}
                        />
                        {achievement.earned && (
                          <Check className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <h3
                        className={`font-semibold mb-2 ${
                          achievement.earned ? 'text-green-900' : 'text-gray-600'
                        }`}
                      >
                        {achievement.title}
                      </h3>
                      <p
                        className={`text-sm mb-3 ${
                          achievement.earned ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {achievement.description}
                      </p>
                      {achievement.earned && achievement.earnedDate && (
                        <p className="text-xs text-green-600">
                          Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4">Progress to Next Achievement</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-800">Distance Warrior (20,000 km)</span>
                      <span className="text-blue-600">{travelStats.totalDistance}/20000 km</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(travelStats.totalDistance / 20000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-800">Reviewer (20 reviews)</span>
                      <span className="text-blue-600">{travelStats.totalReviews}/20 reviews</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(travelStats.totalReviews / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
              
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Email notifications</span>
                      <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">SMS notifications</span>
                      <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Push notifications</span>
                      <input type="checkbox" className="rounded text-purple-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Travel deals and offers</span>
                      <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Privacy Settings
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Profile visibility</span>
                      <select className="rounded border-gray-300 text-sm">
                        <option>Public</option>
                        <option>Friends only</option>
                        <option>Private</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Show travel history</span>
                      <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Allow friend requests</span>
                      <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Current password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <input
                          type="password"
                          placeholder="New password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <button className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Preferences
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Punjabi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-900 mb-4">Danger Zone</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                    <p className="text-sm text-red-700">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TouristLayout>
  );
}
