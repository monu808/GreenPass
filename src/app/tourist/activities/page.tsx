'use client';

import React, { useState, ChangeEvent } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Activity, 
  Heart, 
  Search, 
  Leaf, 
  ShieldCheck, 
  CheckCircle, 
  Wind, 
  AlertTriangle 
} from 'lucide-react';
import Image from 'next/image';
import { validateInput, SearchFilterSchema } from '@/lib/validation';

interface AdventureActivity {
  id: string;
  name: string;
  type: string;
  location: string;
  duration: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  price: number;
  rating: number;
  ecoRating: number;
  bestSeason: string[];
  image: string;
  isPopular: boolean;
  safetyRating: number;
}

export default function AdventureActivities() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  const [activities] = useState<AdventureActivity[]>([
    {
      id: '1',
      name: 'Paragliding Bir Billing',
      type: 'Air Sports',
      location: 'Bir Billing, HP',
      duration: '45 mins',
      difficulty: 'Moderate',
      price: 2500,
      rating: 4.9,
      ecoRating: 5,
      bestSeason: ['Mar-Jun', 'Sep-Nov'],
      image: 'https://images.unsplash.com/photo-1594495894542-a471467e49f1?q=80&w=2071&auto=format&fit=crop',
      isPopular: true,
      safetyRating: 4.8
    },
    {
      id: '2',
      name: 'Beas River Rafting',
      type: 'Water Sports',
      location: 'Kullu, HP',
      duration: '2 hours',
      difficulty: 'Moderate',
      price: 1800,
      rating: 4.7,
      ecoRating: 4,
      bestSeason: ['Apr-Jun', 'Sep-Oct'],
      image: 'https://images.unsplash.com/photo-1530866495547-08899bbbd00a?q=80&w=2070&auto=format&fit=crop',
      isPopular: true,
      safetyRating: 4.5
    },
    {
      id: '3',
      name: 'Hampta Pass Trek',
      type: 'Trekking',
      location: 'Manali, HP',
      duration: '4 Days',
      difficulty: 'Challenging',
      price: 8500,
      rating: 4.9,
      ecoRating: 5,
      bestSeason: ['Jun-Sep'],
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop',
      isPopular: false,
      safetyRating: 4.9
    },
    {
      id: '4',
      name: 'Solang Valley Skiing',
      type: 'Winter Sports',
      location: 'Solang, HP',
      duration: '3 hours',
      difficulty: 'Easy',
      price: 1500,
      rating: 4.6,
      ecoRating: 4,
      bestSeason: ['Dec-Feb'],
      image: 'https://images.unsplash.com/photo-1551698618-1fed5d978044?q=80&w=2070&auto=format&fit=crop',
      isPopular: true,
      safetyRating: 4.7
    }
  ]);

  const handleAction = (type: string, name: string) => {
    console.log(`${type} action for: ${name}`);
  };

  const filteredActivities = activities.filter(activity => {
    const sanitizedSearch = searchTerm.trim();
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };

    const matchesSearch = activity.name.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
                         activity.location.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "");
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || activity.difficulty === selectedDifficulty;
    
    let matchesPrice = true;
    if (priceRange === 'low') matchesPrice = activity.price < 2000;
    else if (priceRange === 'medium') matchesPrice = activity.price >= 2000 && activity.price < 5000;
    else if (priceRange === 'high') matchesPrice = activity.price >= 5000;
    
    return matchesSearch && matchesType && matchesDifficulty && matchesPrice;
  });

  return (
    <TouristLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">
        <div className="pt-10 border-b border-gray-100 pb-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
               <Activity className="h-5 w-5" />
               <span className="text-[10px] font-black tracking-widest uppercase">Expedition Hub</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
              Adventure <span className="text-emerald-600">Hub</span>
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <label htmlFor="activity-search" className="sr-only">Search activities</label>
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500" />
              <input
                id="activity-search"
                type="text"
                placeholder="Search paragliding, trekking..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold outline-none"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-6 py-5 bg-gray-50 rounded-[1.8rem] font-bold text-sm outline-none border-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="Air Sports">Air Sports</option>
                <option value="Water Sports">Water Sports</option>
                <option value="Trekking">Trekking</option>
                <option value="Winter Sports">Winter Sports</option>
              </select>

              <select 
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-6 py-5 bg-gray-50 rounded-[1.8rem] font-bold text-sm outline-none border-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="all">All Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
              </select>

              <select 
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-6 py-5 bg-gray-50 rounded-[1.8rem] font-bold text-sm outline-none border-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="all">Price Range</option>
                <option value="low">Under ₹2000</option>
                <option value="medium">₹2000 - ₹5000</option>
                <option value="high">Above ₹5000</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act, index) => (
              <div key={act.id} className="group bg-white rounded-[3.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="h-56 relative overflow-hidden bg-slate-100 shimmer">
                  <Image 
                    src={act.image} 
                    className="w-full h-full object-cover" 
                    alt={act.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={index < 2}
                  />
                  <button 
                     type="button"
                     aria-label="Add to favorites"
                     onClick={() => handleAction('Favorite', act.name)}
                    className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-rose-500 transition-colors"
                  >
                   <Heart className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{act.name}</h3>
                    <p className="text-3xl font-black text-emerald-600 tracking-tighter">₹{act.price.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => handleAction('Book', act.name)} className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Book Now</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="p-6 bg-gray-50 rounded-[2.5rem] inline-block">
                <Search className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">No activities found</h3>
              <p className="text-gray-500 font-bold">Try adjusting your filters to find more adventures.</p>
            </div>
          )}
        </div>

        {/* RE-INSERTED SAFETY SECTION WITH ALL WRAPPERS CORRECTED */}
        <div className="bg-emerald-950 rounded-[4rem] p-10 lg:p-20 text-white relative overflow-hidden shadow-2xl">
           <Leaf className="absolute -bottom-10 -right-10 h-80 w-80 text-emerald-900 rotate-12 opacity-30" />
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-900/50 rounded-full border border-emerald-800">
                   <ShieldCheck className="h-4 w-4 text-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">GreenPass Certified</span>
                </div>
                <h2 className="text-5xl font-black tracking-tighter leading-tight">Safety is our <span className="text-emerald-400">natural priority.</span></h2>
                <p className="text-emerald-100/60 font-bold text-lg leading-relaxed">
                  Every operator in our hub undergoes rigorous ecological and safety audits.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: <CheckCircle className="h-5 w-5" />, title: "Expert Guides" },
                   { icon: <Wind className="h-5 w-5" />, title: "Wind Safety" }, 
                   { icon: <AlertTriangle className="h-5 w-5" />, title: "Weather Alerts" }, 
                   { icon: <ShieldCheck className="h-5 w-5" />, title: "Insurance Cover" }
                 ].map((item, i) => (
                   <div key={i} className="p-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                      <div className="text-emerald-400">{item.icon}</div>
                      <p className="text-xs font-black uppercase tracking-widest">{item.title}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </TouristLayout>
  );
}