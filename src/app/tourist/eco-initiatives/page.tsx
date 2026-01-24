'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import TouristLayout from '@/components/TouristLayout';
import { useModalAccessibility } from "@/lib/accessibility";
import { 
  Leaf, 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { getDbService } from '@/lib/databaseService';
import { useAuth } from '@/contexts/AuthContext';
import { CleanupActivity, CleanupRegistration } from '@/types';
import { format } from 'date-fns';

export default function EcoInitiativesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<CleanupActivity[]>([]);
  const [registrations, setRegistrations] = useState<CleanupRegistration[]>([]);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [impactMetrics, setImpactMetrics] = useState({ totalWaste: 0, totalVolunteers: 0 });
  const [userRank, setUserRank] = useState<number | string>('...');
  const [userTier, setUserTier] = useState('Eco Novice');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<CleanupActivity | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<CleanupRegistration | null>(null);

  const registrationModalRef = useRef<HTMLDivElement>(null);
  const cancelModalRef = useRef<HTMLDivElement>(null);

  useModalAccessibility({ modalRef: registrationModalRef, isOpen: showConfirmModal, onClose: () => setShowConfirmModal(false) });
  useModalAccessibility({ modalRef: cancelModalRef, isOpen: showCancelModal, onClose: () => setShowCancelModal(false) });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const db = getDbService();
      const [upcomingActivities, userRegs, points, metrics, leaderboard, tier] = await Promise.all([
        db.getUpcomingCleanupActivities(),
        db.getUserCleanupRegistrations(user.id),
        db.getEcoPointsBalance(user.id),
        db.getCollectiveImpactMetrics(),
        db.getEcoPointsLeaderboard(100), // Fetch top 100 for rank calculation
        db.getUserImpactTier(user.id)
      ]);
      setActivities(upcomingActivities);
      setRegistrations(userRegs);
      setEcoPoints(points);
      setImpactMetrics(metrics);
      
      // Calculate rank
      const userRankIndex = leaderboard.findIndex(entry => entry.userId === user.id);
      setUserRank(userRankIndex !== -1 ? userRankIndex + 1 : '>100');
      setUserTier(tier);
    } catch (error) {
      console.error('Error fetching eco initiatives data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = (activity: CleanupActivity) => {
    setSelectedActivity(activity);
    setShowConfirmModal(true);
  };

  const confirmRegistration = async () => {
    if (!user?.id || !selectedActivity) return;
    setIsRegistering(true);
    try {
      const db = getDbService();
      await db.registerForCleanup(selectedActivity.id, user.id);
      
      // Optimistic update
      const newRegistration: CleanupRegistration = {
        id: Math.random().toString(36).substr(2, 9),
        activityId: selectedActivity.id,
        userId: user.id,
        status: 'registered',
        registeredAt: new Date(),
        attended: false
      };
      setRegistrations(prev => [newRegistration, ...prev]);
      setShowConfirmModal(false);
      
      // Re-fetch to be sure
      fetchData();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register for activity. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelClick = (registration: CleanupRegistration) => {
    setSelectedRegistration(registration);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedRegistration) return;
    try {
      const db = getDbService();
      await db.cancelCleanupRegistration(selectedRegistration.id);
      
      // Optimistic update
      setRegistrations(prev => prev.filter(r => r.id !== selectedRegistration.id));
      setShowCancelModal(false);
      
      fetchData();
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert('Failed to cancel registration. Please try again.');
    }
  };

  const isUserRegistered = (activityId: string) => {
    return registrations.some(r => r.activityId === activityId && r.status !== 'cancelled');
  };

  const getActivityForRegistration = (activityId: string) => {
    return activities.find(a => a.id === activityId);
  };

  return (
    <TouristLayout>
      <div className="space-y-12 pb-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-emerald-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800/50 border border-emerald-700/50 rounded-full text-emerald-300 text-sm font-bold tracking-wider uppercase">
                <Zap className="h-4 w-4" />
                Make a Difference
              </div>
              <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                Leave Only <span className="text-emerald-400">Footprints</span>.
              </h1>
              <p className="text-emerald-100/80 text-lg lg:text-xl max-w-xl font-medium leading-relaxed">
                Join our cleanup initiatives, earn Eco-Points, and help preserve the pristine beauty of our destinations for future generations.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-950/20">
                  Join an Event
                  <ArrowRight className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300/60 font-black uppercase tracking-widest">Community Impact</p>
                    <p className="text-xl font-bold">{impactMetrics.totalVolunteers.toLocaleString()} Volunteers</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30">
                    <Award className="h-8 w-8 text-emerald-950" />
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-300/60 text-sm font-black uppercase tracking-widest">Current Balance</p>
                    <p className="text-5xl font-black text-white">{ecoPoints}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      <span className="font-bold text-emerald-50">Global Rank</span>
                    </div>
                    <span className="font-black text-white">#{userRank}</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span className="font-bold text-emerald-50">Impact Level</span>
                    </div>
                    <span className="font-black text-white">{userTier}</span>
                  </div>
                </div>
                <button className="w-full mt-6 py-4 bg-white text-emerald-900 font-black rounded-2xl hover:bg-emerald-50 transition-all active:scale-95">
                  Redeem Rewards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Available Activities */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Discover Opportunities</h2>
              <p className="text-slate-500 font-medium">Join upcoming cleanup events and start earning points.</p>
            </div>
            <button className="text-emerald-600 font-black flex items-center gap-1 hover:gap-2 transition-all">
              View Map
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-slate-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map(activity => (
                <div key={activity.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="relative h-48 bg-slate-100 shimmer">
                    <Image 
                      src={`https://source.unsplash.com/featured/?nature,cleanup&sig=${activity.id}`} 
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                        <Award className="h-4 w-4" />
                        +{activity.ecoPointsReward} pts
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      {activity.location}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Date</p>
                          <p className="text-sm font-bold text-slate-700">{format(new Date(activity.startTime), 'MMM d')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <Users className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Spots</p>
                          <p className="text-sm font-bold text-slate-700">{activity.currentParticipants}/{activity.maxParticipants}</p>
                        </div>
                      </div>
                    </div>
                    {isUserRegistered(activity.id) ? (
                      <button className="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl cursor-not-allowed flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Registered
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRegisterClick(activity)}
                        className="w-full py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                      >
                        Join Activity
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Environmental Impact Summary */}
        <section className="bg-slate-50 rounded-[3rem] p-8 lg:p-12 border border-slate-200">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Our Collective Impact</h2>
              <p className="text-slate-500 text-lg font-medium">Every action counts. See how our community is making a tangible difference in the environment.</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="p-3 bg-emerald-100 rounded-2xl w-fit mb-4">
                    <Trash2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{impactMetrics.totalWaste.toLocaleString()}kg</p>
                  <p className="text-sm text-slate-400 font-black uppercase tracking-widest mt-1">Waste Collected</p>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="p-3 bg-blue-100 rounded-2xl w-fit mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{impactMetrics.totalVolunteers.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 font-black uppercase tracking-widest mt-1">Active Volunteers</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video bg-slate-100 shimmer rounded-3xl overflow-hidden shadow-2xl group relative">
                <Image 
                  src="https://source.unsplash.com/featured/?conservation,cleanup" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  alt="Environmental impact"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center max-w-xs">
                    <p className="text-white text-xl font-black mb-2">"Small acts, when multiplied by millions, can transform the world."</p>
                    <p className="text-emerald-300 text-sm font-bold uppercase tracking-widest">— Howard Zinn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* My Registrations */}
        {registrations.length > 0 && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Registered Activities</h2>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Activity</th>
                      <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                      <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrations.map(reg => {
                      const activity = getActivityForRegistration(reg.activityId);
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 shimmer overflow-hidden flex-shrink-0 relative">
                                <Image 
                                  src={`https://source.unsplash.com/featured/?nature,cleanup&sig=${reg.id}`} 
                                  className="w-full h-full object-cover" 
                                  alt={activity?.title || 'Cleanup activity'}
                                  fill
                                  sizes="48px"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{activity?.title || 'Unknown Activity'}</p>
                                <p className="text-sm text-slate-400">{activity?.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">
                                {activity ? format(new Date(activity.startTime), 'MMM d, h:mm a') : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                              reg.status === 'registered' ? 'bg-blue-50 text-blue-600' :
                              reg.status === 'attended' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            {reg.status === 'registered' && (
                              <button 
                                onClick={() => handleCancelClick(reg)}
                                className="text-slate-400 hover:text-red-600 font-bold transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Registration Modal */}
      {showConfirmModal && selectedActivity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-modal-title"
        >
          <div 
            ref={registrationModalRef}
            className="bg-white rounded-[2.5rem] p-8 lg:p-12 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mb-8">
                <Leaf className="h-10 w-10 text-emerald-600" aria-hidden="true" />
              </div>
              <h3 id="registration-modal-title" className="text-3xl font-black text-slate-900 mb-4">Join this initiative?</h3>
              <p className="text-slate-500 font-medium mb-8">
                You're about to join <span className="text-emerald-600 font-bold">{selectedActivity.title}</span> in {selectedActivity.location}. 
                Earn <span className="text-emerald-600 font-bold">{selectedActivity.ecoPointsReward} Eco-Points</span> upon successful participation.
              </p>
              
              <div className="w-full space-y-4">
                <button 
                  onClick={confirmRegistration}
                  disabled={isRegistering}
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                >
                  {isRegistering ? 'Processing...' : (
                    <>
                      Confirm Registration
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-5 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200 transition-all focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedRegistration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div 
            ref={cancelModalRef}
            className="bg-white rounded-[2.5rem] p-8 lg:p-12 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8">
                <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
              </div>
              <h3 id="cancel-modal-title" className="text-3xl font-black text-slate-900 mb-4">Cancel Registration?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Are you sure you want to cancel your registration for this event? This action will free up your spot for other volunteers.
              </p>
              
              <div className="w-full space-y-4">
                <button 
                  onClick={confirmCancellation}
                  className="w-full py-5 bg-red-500 text-white font-black rounded-3xl hover:bg-red-600 transition-all shadow-xl shadow-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/20"
                >
                  Yes, Cancel Registration
                </button>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-5 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200 transition-all focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                >
                  Keep Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TouristLayout>
  );
}
