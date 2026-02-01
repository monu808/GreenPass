'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  User, 
  MapPin, 
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
  Eye,
  EyeOff,
  Globe,
  Plane,
  Mountain,
  Award,
  TrendingUp,
  Clock,
  Check,
  Leaf,
  Wind,
  Info
} from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { useAuth } from '@/contexts/AuthContext';

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
  ecoPoints?: number;
  totalCarbonOffset?: number;
  ecoHistory?: {
    id: string;
    type: string;
    points: number;
    description: string;
    date: Date;
  }[];
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setIsLoading] = useState(true);

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
    languages: ['Hindi', 'English', 'Punjabi'],
    ecoPoints: 450,
    totalCarbonOffset: 120.5
  });

  React.useEffect(() => {
     const fetchEcoData = async () => {
       if (!user?.id) {
         setIsLoading(false);
         return;
       }

       try {
         const db = getDbService();
         const stats = await db.getUserEcoStats(user.id);
         const history = await db.getEcoPointsHistory(user.id);
         
         if (stats) {
          setUserProfile(prev => ({
            ...prev,
            ecoPoints: stats.ecoPoints,
            totalCarbonOffset: stats.totalCarbonOffset,
            totalTrips: stats.tripsCount,
            ecoHistory: history.map(h => ({
              id: h.id,
              type: h.transactionType,
              points: h.points,
              description: h.description,
              date: new Date(h.createdAt)
            }))
          }));
        }
      } catch (error) {
        console.error('Error fetching eco data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEcoData();
  }, [user]);

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
    { id: 'eco', label: 'Eco Dashboard', icon: Leaf },
    { id: 'stats', label: 'Travel Stats', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl shadow-purple-100/50">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between space-y-6 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 rounded-[2.5rem] flex items-center justify-center border-4 border-white/30 backdrop-blur-md overflow-hidden">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                </div>
                <button 
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-lg active:scale-90 transition-all hover:bg-purple-50 min-h-[44px] min-w-[44px]"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{userProfile.name}</h1>
                <p className="text-purple-100 flex items-center justify-center sm:justify-start font-medium">
                  <MapPin className="h-4 w-4 mr-1.5 text-purple-200" />
                  {userProfile.location}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                    Member since {new Date(userProfile.joinDate).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white text-purple-600 rounded-2xl text-sm font-black hover:bg-purple-50 transition-all active:scale-95 shadow-lg min-h-[48px]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          </div>
          
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-3xl font-black">{userProfile.totalTrips}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-200/80">Trips</div>
            </div>
            <div className="text-center p-4 bg-emerald-500/20 rounded-2xl backdrop-blur-sm border border-emerald-400/30">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 flex items-center justify-center gap-1">
                <Award className="h-5 w-5" />
                {userProfile.ecoPoints}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70">Points</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-3xl font-black">{travelStats.placesVisited}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-200/80">Places</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-3xl font-black">{(userProfile.totalDistance / 1000).toFixed(1)}k</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-200/80">KM</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 col-span-2 sm:col-span-1">
              <div className="text-2xl sm:text-3xl font-black">{travelStats.averageRating}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-200/80">Rating</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-2 z-10 mx-0 sm:mx-0">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center sm:space-x-3 px-6 sm:px-10 py-5 text-xs sm:text-sm font-black whitespace-nowrap border-b-4 transition-all min-h-[64px] ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50/50'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 sm:h-4 sm:w-4 mb-1 sm:mb-0 ${activeTab === tab.id ? 'animate-bounce' : ''}`} />
                  <span className="uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-200">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">Profile Information</h2>
                  <p className="text-purple-600 font-bold text-sm">Update your personal details and travel preferences</p>
                </div>
                {isEditing && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 min-h-[48px]"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95 min-h-[48px]"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                <div className="space-y-6">
                  <div className="group">
                    <label htmlFor="full-name" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-focus-within:text-purple-600 transition-colors">Full Name</label>
                    {isEditing ? (
                      <input
                        id="full-name"
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none font-bold text-gray-900 min-h-[56px]"
                      />
                    ) : (
                      <div className="p-4.5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all min-h-[56px] flex items-center">
                        <p className="text-gray-900 font-bold">{userProfile.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="email-address" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-focus-within:text-purple-600 transition-colors">Email Address</label>
                    {isEditing ? (
                      <input
                        id="email-address"
                        type="email"
                        autoComplete="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none font-bold text-gray-900 min-h-[56px]"
                      />
                    ) : (
                      <div className="p-4.5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all min-h-[56px] flex items-center">
                        <p className="text-gray-900 font-bold">{userProfile.email}</p>
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="phone-number" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-focus-within:text-purple-600 transition-colors">Phone Number</label>
                    {isEditing ? (
                      <input
                        id="phone-number"
                        type="tel"
                        autoComplete="tel"
                        value={userProfile.phone}
                        onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none font-bold text-gray-900 min-h-[56px]"
                      />
                    ) : (
                      <div className="p-4.5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all min-h-[56px] flex items-center">
                        <p className="text-gray-900 font-bold">{userProfile.phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="location" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-focus-within:text-purple-600 transition-colors">Location</label>
                    {isEditing ? (
                      <input
                        id="location"
                        type="text"
                        value={userProfile.location}
                        onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none font-bold text-gray-900 min-h-[56px]"
                      />
                    ) : (
                      <div className="p-4.5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all min-h-[56px] flex items-center">
                        <p className="text-gray-900 font-bold">{userProfile.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label htmlFor="dob" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-focus-within:text-purple-600 transition-colors">Date of Birth</label>
                    {isEditing ? (
                      <input
                        id="dob"
                        type="date"
                        value={userProfile.dateOfBirth}
                        onChange={(e) => setUserProfile({...userProfile, dateOfBirth: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none font-bold text-gray-900 min-h-[56px]"
                      />
                    ) : (
                      <div className="p-4.5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all min-h-[56px] flex items-center">
                        <p className="text-gray-900 font-bold">{new Date(userProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Travel Interests</label>
                    <div className="flex flex-wrap gap-2.5">
                      {userProfile.travelStyle.map((style, index) => (
                        <span
                          key={index}
                          className="px-5 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-black border border-purple-100 shadow-sm"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Languages Spoken</label>
                    <div className="flex flex-wrap gap-2.5">
                      {userProfile.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black border border-blue-100 shadow-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Favorite Destination</label>
                    <div className="p-4.5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all min-h-[56px] flex items-center">
                      <p className="text-gray-900 font-bold">{userProfile.favoriteDestination}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group pt-4">
                <label htmlFor="bio" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-focus-within:text-purple-600 transition-colors">About Me</label>
                {isEditing ? (
                  <textarea
                    id="bio"
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none resize-none font-bold text-gray-900 leading-relaxed"
                  />
                ) : (
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-transparent hover:border-gray-100 transition-all">
                    <p className="text-gray-700 leading-relaxed font-bold">{userProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'eco' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Environmental Impact</h2>
                  <p className="text-emerald-600 font-bold text-sm">Your contribution to sustainable tourism</p>
                </div>
                <div className="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-[2rem] border border-emerald-100 shadow-sm">
                  <div className="p-3 bg-emerald-500 rounded-2xl text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Balance</p>
                    <p className="text-2xl font-black text-gray-900">{userProfile.ecoPoints} <span className="text-xs text-gray-400">PTS</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 group hover:shadow-xl transition-all duration-500">
                  <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500">
                    <Wind className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Total Offset</h3>
                    <p className="text-3xl font-black text-blue-600">{userProfile.totalCarbonOffset?.toFixed(1)} <span className="text-sm text-gray-400">KG</span></p>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Amount of CO2 you have successfully offset through our verified environmental projects.</p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 group hover:shadow-xl transition-all duration-500">
                  <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                    <Leaf className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Eco-Trips</h3>
                    <p className="text-3xl font-black text-emerald-600">{userProfile.totalTrips} <span className="text-sm text-gray-400">TRIPS</span></p>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Number of journeys completed with our sustainability tracking and guidelines.</p>
                </div>

                <div className="bg-emerald-900 p-8 rounded-[3rem] shadow-xl space-y-4 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp className="h-32 w-32 text-white" />
                  </div>
                  <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Award className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Eco-Rank</h3>
                    <p className="text-3xl font-black text-emerald-400 uppercase">Guardian</p>
                  </div>
                  <p className="text-xs text-emerald-100/60 font-medium leading-relaxed relative z-10">You are in the top 15% of sustainable travelers this month!</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-white rounded-3xl shadow-sm">
                    <Info className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">How to earn Eco-Points?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <p className="text-xs font-bold text-gray-600">Choose low-carbon transport options for your trips.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <p className="text-xs font-bold text-gray-600">Stay at certified eco-friendly accommodations.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <p className="text-xs font-bold text-gray-600">Offset your carbon footprint during booking.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <p className="text-xs font-bold text-gray-600">Participate in local environmental cleanup drives.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {userProfile.ecoHistory && userProfile.ecoHistory.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Points History</h3>
                  
                  {/* Desktop Table View */}
                  <div className="hidden sm:block bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {userProfile.ecoHistory.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900">{item.description}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                item.type === 'award' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-black ${item.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {item.points > 0 ? '+' : ''}{item.points}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-xs text-gray-400 font-bold">{new Date(item.date).toLocaleDateString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View Fallback */}
                  <div className="sm:hidden space-y-4">
                    {userProfile.ecoHistory.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-black text-gray-900 leading-tight flex-1 pr-4">{item.description}</p>
                          <span className={`text-sm font-black whitespace-nowrap ${item.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.points > 0 ? '+' : ''}{item.points} PTS
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            item.type === 'award' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Travel Statistics</h2>
                <p className="text-purple-600 font-bold text-sm">A deep dive into your adventure history</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 sm:p-8 border border-blue-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-200">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-black text-blue-900">{travelStats.placesVisited}</span>
                  </div>
                  <h3 className="font-black text-blue-900 uppercase tracking-tight text-sm">Places Visited</h3>
                  <p className="text-xs text-blue-700 font-bold mt-1 uppercase tracking-wider opacity-70">Across multiple states</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 sm:p-8 border border-emerald-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
                      <Plane className="h-6 w-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-900">{(travelStats.totalDistance / 1000).toFixed(1)}k</span>
                  </div>
                  <h3 className="font-black text-emerald-900 uppercase tracking-tight text-sm">Distance Traveled</h3>
                  <p className="text-xs text-emerald-700 font-bold mt-1 uppercase tracking-wider opacity-70">Kilometers covered</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 sm:p-8 border border-purple-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-purple-500 rounded-2xl text-white shadow-lg shadow-purple-200">
                      <Mountain className="h-6 w-6" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-purple-900 text-right">{travelStats.favoriteActivity}</span>
                  </div>
                  <h3 className="font-black text-purple-900 uppercase tracking-tight text-sm">Favorite Activity</h3>
                  <p className="text-xs text-purple-700 font-bold mt-1 uppercase tracking-wider opacity-70">Most preferred adventure</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-8 border border-orange-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-200">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-black text-orange-900">₹{(travelStats.totalSpent / 1000).toFixed(0)}k</span>
                  </div>
                  <h3 className="font-black text-orange-900 uppercase tracking-tight text-sm">Total Spent</h3>
                  <p className="text-xs text-orange-700 font-bold mt-1 uppercase tracking-wider opacity-70">On travel experiences</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-6 sm:p-8 border border-yellow-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-yellow-500 rounded-2xl text-white shadow-lg shadow-yellow-200">
                      <Star className="h-6 w-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-black text-yellow-900">{travelStats.averageRating}</span>
                  </div>
                  <h3 className="font-black text-yellow-900 uppercase tracking-tight text-sm">Average Rating</h3>
                  <p className="text-xs text-yellow-700 font-bold mt-1 uppercase tracking-wider opacity-70">Given to destinations</p>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-3xl p-6 sm:p-8 border border-rose-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-200">
                      <Edit className="h-6 w-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-black text-rose-900">{travelStats.totalReviews}</span>
                  </div>
                  <h3 className="font-black text-rose-900 uppercase tracking-tight text-sm">Reviews Written</h3>
                  <p className="text-xs text-rose-700 font-bold mt-1 uppercase tracking-wider opacity-70">Shared experiences</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[2.5rem] p-6 sm:p-10 border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tight">Travel Timeline</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Last Trip', dest: 'Manali, Himachal Pradesh', date: 'Dec 2023', icon: Clock },
                    { label: 'Previous', dest: 'Leh, Ladakh', date: 'Sep 2023', icon: Clock },
                    { label: 'First Trip', dest: 'Shimla, Himachal Pradesh', date: 'Jan 2023', icon: Clock }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-black text-gray-900">{item.dest}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Achievements</h2>
                <p className="text-purple-600 font-bold text-sm">Collect badges as you explore responsibly</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-[2.5rem] p-6 sm:p-8 border-2 transition-all relative overflow-hidden group ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-white to-emerald-50 border-emerald-100 shadow-lg shadow-emerald-50'
                          : 'bg-white border-gray-100 opacity-60 grayscale'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className={`p-4 rounded-2xl ${
                          achievement.earned ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <IconComponent className="h-7 w-7" />
                        </div>
                        {achievement.earned && (
                          <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 relative z-10">
                        <h3 className={`text-lg font-black uppercase tracking-tight ${
                          achievement.earned ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-xs font-bold leading-relaxed ${
                          achievement.earned ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && achievement.earnedDate && (
                        <div className="mt-4 pt-4 border-t border-emerald-100/50 relative z-10">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            Unlocked {new Date(achievement.earnedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {/* Decorative Background Icon */}
                      <IconComponent className="absolute -right-4 -bottom-4 h-24 w-24 text-gray-100 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  );
                })}
              </div>

              <div className="bg-indigo-900 rounded-[3rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Award className="h-48 w-48" />
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Next Milestones</h3>
                    <p className="text-indigo-200 font-bold text-sm">You&apos;re getting close to these rewards!</p>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Distance Warrior</p>
                          <p className="text-sm font-black">Travel 20,000 km</p>
                        </div>
                        <span className="text-sm font-black text-indigo-200">{travelStats.totalDistance.toLocaleString()} / 20,000 KM</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/5">
                        <div
                          className="bg-gradient-to-r from-indigo-400 to-purple-400 h-full rounded-full transition-all duration-1000 shadow-lg shadow-indigo-500/50"
                          style={{ width: `${Math.min((travelStats.totalDistance / 20000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Master Reviewer</p>
                          <p className="text-sm font-black">Write 20 reviews</p>
                        </div>
                        <span className="text-sm font-black text-indigo-200">{travelStats.totalReviews} / 20 REVIEWS</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/5">
                        <div
                          className="bg-gradient-to-r from-indigo-400 to-purple-400 h-full rounded-full transition-all duration-1000 shadow-lg shadow-indigo-500/50"
                          style={{ width: `${Math.min((travelStats.totalReviews / 20) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <>
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Account Settings</h2>
                <p className="text-purple-600 font-bold text-sm">Manage your security and notification preferences</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 sm:p-10 space-y-8 shadow-sm">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl mr-3">
                      <Bell className="h-5 w-5" />
                    </div>
                    Notifications
                  </h3>
                  <div className="space-y-6">
                    {[
                      { id: 'email-notif', label: 'Email notifications', desc: 'Receive updates via email', checked: true },
                      { id: 'sms-notif', label: 'SMS notifications', desc: 'Alerts to your phone', checked: true },
                      { id: 'push-notif', label: 'Push notifications', desc: 'Browser notifications', checked: false },
                      { id: 'deals-notif', label: 'Travel deals', desc: 'Personalized offers', checked: true }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between group">
                        <div className="space-y-1">
                          <label htmlFor={item.id} className="text-sm font-black text-gray-900 uppercase tracking-tight cursor-pointer">{item.label}</label>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.desc}</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            id={item.id} 
                            type="checkbox" 
                            defaultChecked={item.checked} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 sm:p-10 space-y-8 shadow-sm">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mr-3">
                      <Shield className="h-5 w-5" />
                    </div>
                    Privacy & Security
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label htmlFor="profile-visibility" className="text-sm font-black text-gray-900 uppercase tracking-tight">Profile visibility</label>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Who can see your profile</p>
                        </div>
                        <select id="profile-visibility" className="bg-gray-50 border-2 border-gray-100 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-3 min-h-[44px]">
                          <option>Public</option>
                          <option>Friends only</option>
                          <option>Private</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <label htmlFor="show-history" className="text-sm font-black text-gray-900 uppercase tracking-tight cursor-pointer">Show travel history</label>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Visible on your profile</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input id="show-history" type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all active:scale-95 border-2 border-rose-100 min-h-[48px]">
                        Change Account Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 sm:p-10 space-y-8 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Change Password</h4>
                      <div className="space-y-3">
                        <div className="relative">
                          <label htmlFor="current-password" className="sr-only">Current Password</label>
                          <input
                            id="current-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Current password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        <label htmlFor="new-password" className="sr-only">New Password</label>
                        <input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="New password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
                        <input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
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
                      <label htmlFor="language-pref" className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select id="language-pref" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Punjabi</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="currency-pref" className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select id="currency-pref" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
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
            </>
          )}
        </div>
      </div>
    </TouristLayout>
  );
}
