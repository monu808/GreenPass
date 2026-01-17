'use client';

import React, { useState, ChangeEvent } from 'react';
import { 
  Plus, Trash2, Leaf, Save, Tent, X, Zap, 
  Navigation, Calendar, MapPin, ShieldCheck, 
  Info, Sparkles, ChevronDown, ChevronUp 
} from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';

// Build Fix: Strict interface for the state structure to satisfy TS compiler
interface DayPlan {
  id: number;
  title: string;
  activities: string[];
  isExpanded: boolean;
}

export default function PlanYourTripPage() {
  // STATE MANAGEMENT: Controlled inputs for every field
  const [days, setDays] = useState<DayPlan[]>([
    { 
      id: 1, 
      title: "Arrival & Eco-Briefing", 
      activities: ["Check-in at Certified Eco-Stay", "Sustainability & Local Rules Briefing"],
      isExpanded: true 
    },
    { 
      id: 2, 
      title: "Mountain Expedition", 
      activities: ["Guided Sunrise Trek", "Photography at Summit"],
      isExpanded: true 
    }
  ]);

  const [destination, setDestination] = useState<string>('');
  const [budget, setBudget] = useState<string>('medium');

  // LOGIC: Explicitly typed functional handlers
  const updateTitle = (id: number, val: string): void => {
    setDays(days.map(d => d.id === id ? { ...d, title: val } : d));
  };

  const updateActivity = (dayId: number, idx: number, val: string): void => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        const updated = [...d.activities];
        updated[idx] = val;
        return { ...d, activities: updated };
      }
      return d;
    }));
  };

  const addDay = (): void => {
    const nextId = days.length > 0 ? Math.max(...days.map(d => d.id)) + 1 : 1;
    setDays([...days, { 
      id: nextId, 
      title: `Day ${nextId}: Custom Adventure`, 
      activities: ["New Activity"],
      isExpanded: true 
    }]);
  };

  const removeDay = (id: number): void => {
    if (days.length > 1) {
      setDays(days.filter(d => d.id !== id));
    }
  };

  const toggleDay = (id: number): void => {
    setDays(days.map(d => d.id === id ? { ...d, isExpanded: !d.isExpanded } : d));
  };

  const handleSavePlan = (): void => {
    if (!destination) {
      alert("Please specify a destination before saving your expedition.");
      return;
    }
    alert(`Expedition to ${destination} saved to your GreenPass profile!`);
  };

  // CALCULATED STATS
  const totalActivities = days.reduce((acc, curr) => acc + curr.activities.length, 0);

  return (
    <TouristLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">
        
        {/* HEADER SECTION */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-100 pb-10">
          <div className="space-y-2 text-center md:text-left">
             <div className="flex items-center gap-2 text-emerald-600 justify-center md:justify-start">
                <Sparkles className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Itinerary Architect</span>
             </div>
             <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">
                Design Your <span className="text-emerald-600">Trip</span>
             </h1>
          </div>
          <button 
            type="button" 
            onClick={addDay} 
            className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 flex items-center gap-3 active:scale-95 transition-all shadow-2xl"
          >
            <Plus className="h-4 w-4" /> Add Expedition Day
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: TRIP CONFIGURATION & ITINERARY */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* TRIP SETTINGS */}
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label htmlFor="dest-input" className="text-[10px] font-black uppercase text-gray-400 ml-2">Primary Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    <input 
                      id="dest-input"
                      type="text"
                      placeholder="e.g. Spiti Valley, Ladakh"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={destination}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
                    />
                  </div>
               </div>
               <div className="space-y-3">
                  <label htmlFor="budget-select" className="text-[10px] font-black uppercase text-gray-400 ml-2">Budget Preference</label>
                  <select 
                    id="budget-select"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={budget}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setBudget(e.target.value)}
                  >
                    <option value="low">Eco-Budget</option>
                    <option value="medium">Standard Managed</option>
                    <option value="high">Premium Expedition</option>
                  </select>
               </div>
            </div>

            {/* DAY CARDS */}
            <div className="space-y-6">
              {days.map((day, index) => (
                <div key={day.id} className="relative pl-14">
                  <div className="absolute left-0 top-0 w-12 h-12 bg-white border-4 border-emerald-500 rounded-2xl flex items-center justify-center font-black text-emerald-700 text-sm shadow-sm z-10">
                    {index + 1}
                  </div>
                  
                  <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-50 shadow-sm transition-all group">
                    <div className="p-8 flex items-center justify-between bg-white border-b border-gray-50">
                      <input 
                        aria-label={`Title for day ${index + 1}`}
                        className="text-2xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full" 
                        value={day.title} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateTitle(day.id, e.target.value)} 
                      />
                      <div className="flex items-center gap-2">
                        <button 
  type="button" 
  onClick={() => removeDay(day.id)} 
  className="p-2 text-gray-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100"
  aria-label={`Remove day ${index + 1}`}
>
  <Trash2 className="h-5 w-5"/>
</button>
                        <button 
                          type="button" 
                          onClick={() => toggleDay(day.id)} 
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
                        >
                          {day.isExpanded ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                        </button>
                      </div>
                    </div>

                    {day.isExpanded && (
                      <div className="p-8 space-y-4 bg-gray-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                        {day.activities.map((act, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all group/item shadow-sm">
                            <Tent className="h-5 w-5 text-emerald-600" />
                            <input 
                              aria-label={`Activity ${i + 1} on day ${index + 1}`}
                              className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm font-bold text-gray-700" 
                              value={act} 
                              onChange={(e: ChangeEvent<HTMLInputElement>) => updateActivity(day.id, i, e.target.value)} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setDays(days.map(d => d.id === day.id ? { ...d, activities: d.activities.filter((_, idx) => idx !== i) } : d))}
                              className="opacity-0 group-hover/item:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 p-2 text-gray-300 hover:text-rose-500 transition-all"
                              aria-label="Remove activity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => setDays(days.map(d => d.id === day.id ? { ...d, activities: [...d.activities, 'New Adventure Activity'] } : d))} 
                          className="w-full py-5 border border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all bg-white/50"
                        >
                          + Add New Expedition Activity
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SUMMARY & ECO-STATS */}
          <div className="lg:col-span-4 space-y-8">
             <div className="sticky top-10 space-y-8">
                {/* ECO-STATS CARD */}
                <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                   <Leaf className="absolute -top-10 -right-10 h-48 w-48 text-emerald-500/10 rotate-12" />
                   <h4 className="text-2xl font-black mb-8 flex justify-between items-center tracking-tighter">
                      Plan Summary <Zap className="h-6 w-6 text-emerald-400" />
                   </h4>
                   
                   <div className="space-y-6 mb-10">
                      <div className="flex justify-between items-center py-4 border-b border-white/5">
                         <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Duration</p>
                            <p className="text-xl font-black">{days.length} Days</p>
                         </div>
                         <Calendar className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-white/5">
                         <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Total Activities</p>
                            <p className="text-xl font-black">{totalActivities}</p>
                         </div>
                         <Navigation className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Eco-Impact</p>
                            <p className="text-xl font-black text-emerald-400">Low Carbon</p>
                         </div>
                         <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                   </div>

                   <button 
                     type="button" 
                     onClick={handleSavePlan} 
                     className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-900/20"
                   >
                     <Save className="h-5 w-5" /> Save Expedition Plan
                   </button>
                </div>

                {/* HELP CARD */}
                <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 flex items-start gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600"><Info className="h-5 w-5" /></div>
                   <div className="space-y-1">
                      <p className="text-xs font-black text-emerald-900 uppercase">Pro Tip</p>
                      <p className="text-xs font-medium text-emerald-700/80 leading-relaxed">
                        Add at least one "Eco-Briefing" activity per trip to maintain your GreenPass tier status.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </TouristLayout>
  );
}