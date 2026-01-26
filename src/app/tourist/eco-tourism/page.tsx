'use client';

import { useRef, useState, useMemo } from 'react';
import { useModalAccessibility } from '@/lib/accessibility';
import TouristLayout from '@/components/TouristLayout';
import { 
  TreePine, 
  Leaf, 
  Users, 
  MapPin, 
  Eye,
  Heart,
  Search,
  Recycle,
  Globe,
  Bird,
  Sun,
  Droplets,
  CheckCircle,
  Award,
  Info,
  ArrowRight,
  X,
  Scale,
  Zap,
  Trash2,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { 
  calculateSustainabilityScore, 
  calculateCarbonOffset, 
  getCommunityBenefitMetrics, 
  getEcoImpactCategory,
  findLowImpactAlternatives
} from '@/lib/sustainabilityScoring';
import { destinations as allDestinations } from '@/data/mockData';
import { Destination, EcoImpactCategory } from '@/types';
import { sanitizeSearchTerm } from '@/lib/utils';
import { validateInput, SearchFilterSchema } from '@/lib/validation';

interface EcoInitiative {
  id: string;
  title: string;
  description: string;
  impact: string;
  participants: number;
  icon: React.ElementType;
}

export default function EcoTourism() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ecoImpactFilter, setEcoImpactFilter] = useState<EcoImpactCategory | 'all'>('all');
  const [comparisonList, setComparisonList] = useState<Destination[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const comparisonModalRef = useRef<HTMLDivElement>(null);

  useModalAccessibility({
    modalRef: comparisonModalRef,
    isOpen: isComparisonOpen,
    onClose: () => setIsComparisonOpen(false)
  });
  const [selectedRating, setSelectedRating] = useState<string>('all');

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

  const destinationTypes = Array.from(new Set(allDestinations.map(dest => dest.ecologicalSensitivity)));

  const filteredDestinations = useMemo(() => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };

    return allDestinations
      .filter(dest => {
        const matchesSearch = dest.name.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
                             dest.location.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "");
        
        const score = calculateSustainabilityScore(dest);
        const matchesRating = selectedRating === 'all' || (score.overallScore / 20) >= parseFloat(selectedRating);
        
        const impactCategory = getEcoImpactCategory(dest);
        const matchesEcoImpact = ecoImpactFilter === 'all' || impactCategory === ecoImpactFilter;
        
        return matchesSearch && matchesRating && matchesEcoImpact;
      })
      .sort((a, b) => {
        const scoreA = calculateSustainabilityScore(a).overallScore;
        const scoreB = calculateSustainabilityScore(b).overallScore;
        return scoreB - scoreA;
      });
  }, [searchTerm, selectedRating, ecoImpactFilter]);

  const handleCompareToggle = (destination: Destination) => {
    setComparisonList(prev => {
      const isAlreadyAdded = prev.find(d => d.id === destination.id);
      if (isAlreadyAdded) {
        return prev.filter(d => d.id !== destination.id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 destinations at a time.');
        return prev;
      }
      return [...prev, destination];
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 60) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl shadow-green-100/50">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between space-y-4 sm:space-y-0 text-center sm:text-left">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Eco Tourism</h1>
              <p className="text-green-100 font-medium text-sm sm:text-base">Explore responsibly, preserve naturally</p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 text-green-100/90">
              <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                <TreePine className="h-4 w-4 mr-2 text-green-300" />
                <span className="text-xs font-black uppercase tracking-widest">Carbon Neutral</span>
              </div>
              <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                <Globe className="h-4 w-4 mr-2 text-blue-300" />
                <span className="text-xs font-black uppercase tracking-widest">Sustainable</span>
              </div>
              <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                <Heart className="h-4 w-4 mr-2 text-red-300" />
                <span className="text-xs font-black uppercase tracking-widest">Community</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eco Impact Dashboard */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Our Eco Impact</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-green-50/50 rounded-2xl border border-green-100 hover:shadow-md transition-all active:scale-95 group">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <TreePine className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-green-800">2,500+</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-green-600/80 mt-1">Trees Planted</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-blue-50/50 rounded-2xl border border-blue-100 hover:shadow-md transition-all active:scale-95 group">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-800">50+</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-600/80 mt-1">Water Sources</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100 hover:shadow-md transition-all active:scale-95 group">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Bird className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-yellow-800">15</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-600/80 mt-1">Species Safe</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-purple-50/50 rounded-2xl border border-purple-100 hover:shadow-md transition-all active:scale-95 group">
              <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-800">1,200+</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-600/80 mt-1">Families Helped</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <label htmlFor="destination-search" className="sr-only">Search eco destinations</label>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                <input
                  id="destination-search"
                  type="text"
                  placeholder="Search eco destinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-2xl transition-all outline-none font-bold text-gray-900 min-h-[56px]"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <label htmlFor="rating-filter" className="sr-only">Filter by rating</label>
                  <select
                    id="rating-filter"
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="w-full sm:w-auto pl-4 pr-10 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-2xl transition-all outline-none font-bold text-gray-900 min-h-[56px] appearance-none"
                  >
                    <option value="all">All Ratings</option>
                    <option value="4.5">4.5+ Rating</option>
                    <option value="4.0">4.0+ Rating</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>

                {comparisonList.length > 0 && (
                  <button
                    onClick={() => setIsComparisonOpen(true)}
                    className="flex items-center justify-center px-6 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 font-black shadow-lg shadow-emerald-100 min-h-[56px]"
                    aria-label={`Compare ${comparisonList.length} destinations`}
                  >
                    <Scale className="h-5 w-5 mr-3" aria-hidden="true" />
                    COMPARE ({comparisonList.length})
                  </button>
                )}
              </div>
            </div>

            {/* Eco Impact Filter Buttons */}
            <div className="flex overflow-x-auto scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap gap-3 pt-4 border-t border-gray-50" role="group" aria-label="Filter by eco impact">
              <button
                onClick={() => setEcoImpactFilter('all')}
                className={`flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] ${
                  ecoImpactFilter === 'all' 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-100 scale-105 z-10' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                aria-pressed={ecoImpactFilter === 'all'}
              >
                All Impact
              </button>
              <button
                onClick={() => setEcoImpactFilter('low-carbon')}
                className={`flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] flex items-center ${
                  ecoImpactFilter === 'low-carbon' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105 z-10' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
                aria-pressed={ecoImpactFilter === 'low-carbon'}
              >
                <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
                Low Carbon
              </button>
              <button
                onClick={() => setEcoImpactFilter('community-friendly')}
                className={`flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] flex items-center ${
                  ecoImpactFilter === 'community-friendly' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-100 scale-105 z-10' 
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
                aria-pressed={ecoImpactFilter === 'community-friendly'}
              >
                <Users className="h-4 w-4 mr-2" aria-hidden="true" />
                Community
              </button>
              <button
                onClick={() => setEcoImpactFilter('wildlife-safe')}
                className={`flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] flex items-center ${
                  ecoImpactFilter === 'wildlife-safe' 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-100 scale-105 z-10' 
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                }`}
                aria-pressed={ecoImpactFilter === 'wildlife-safe'}
              >
                <Bird className="h-4 w-4 mr-2" aria-hidden="true" />
                Wildlife
              </button>
            </div>
          </div>
        </div>

        {/* Eco Initiatives */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Leaf className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Join Eco Initiatives</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {ecoInitiatives.map((initiative) => {
              const IconComponent = initiative.icon;
              return (
                <div key={initiative.id} className="group p-5 bg-gray-50/50 border-2 border-transparent hover:border-emerald-200 hover:bg-white rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-xl active:scale-95">
                  <div className="flex items-center mb-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:bg-emerald-50 transition-colors">
                      <IconComponent className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="ml-3 font-black text-gray-900 text-sm uppercase tracking-tight">{initiative.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-5">{initiative.description}</p>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5 mr-2" />
                      <span>{initiative.impact}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <Users className="h-3.5 w-3.5 mr-2" />
                      <span>{initiative.participants.toLocaleString()} joined</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eco Destinations */}
        <div className="space-y-6">
          {filteredDestinations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {filteredDestinations.map((destination) => {
                const score = calculateSustainabilityScore(destination);
                const offset = calculateCarbonOffset(destination, 1);
                const community = getCommunityBenefitMetrics(destination);
                const impactCategory = getEcoImpactCategory(destination);
                const isComparing = comparisonList.some(d => d.id === destination.id);

                return (
                  <div key={destination.id} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full shadow-sm">
                    {/* Image and Badges */}
                    <div className="relative h-56 sm:h-64 bg-slate-100 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg backdrop-blur-md flex items-center ${getScoreColor(score.overallScore)}`}>
                          <Award className="h-3.5 w-3.5 mr-1.5" />
                          SCORE: {score.overallScore}
                        </span>
                        <span className="px-3 py-1.5 bg-white/90 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 shadow-lg backdrop-blur-md flex items-center">
                          <Zap className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                          {impactCategory.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Comparison and Favorite Buttons */}
                      <div className="absolute top-4 right-4 flex flex-col space-y-3 z-20">
                        <button 
                          onClick={() => handleCompareToggle(destination)}
                          className={`w-11 h-11 rounded-2xl shadow-xl transition-all active:scale-90 flex items-center justify-center backdrop-blur-md ${
                            isComparing 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-white/90 text-gray-900 hover:bg-white'
                          }`}
                          aria-label={`${isComparing ? 'Remove' : 'Add'} ${destination.name} ${isComparing ? 'from' : 'to'} comparison`}
                          aria-pressed={isComparing}
                        >
                          <Scale className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button 
                          className="w-11 h-11 bg-white/90 text-gray-900 rounded-2xl shadow-xl hover:bg-white transition-all active:scale-90 flex items-center justify-center backdrop-blur-md"
                          aria-label={`Add ${destination.name} to favorites`}
                        >
                          <Heart className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                      
                      {/* Bottom Info */}
                      <div className="absolute bottom-4 left-4 right-4 z-20">
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center text-white/90">
                              <MapPin className="h-4 w-4 mr-2 text-emerald-400" />
                              <span className="text-xs font-black uppercase tracking-widest">{destination.location}</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">{destination.name}</h3>
                          </div>
                          <div className="bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-400/30">
                            <div className="flex items-center text-emerald-300">
                              <TrendingUp className="h-3.5 w-3.5 mr-1" />
                              <span className="text-sm font-black">4.8</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8 flex flex-col flex-1">
                      <p className="text-gray-500 text-sm font-medium mb-6 line-clamp-2 leading-relaxed">{destination.description}</p>

                      {/* Sustainability Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group-hover:bg-blue-50 transition-colors">
                          <div className="flex items-center text-blue-700 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Zap className="h-3.5 w-3.5 mr-2" />
                            CARBON
                          </div>
                          <div className="text-lg font-black text-blue-900">
                            {offset.estimatedCO2}kg
                          </div>
                          <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">
                            Offset: ₹{offset.offsetCost}
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 group-hover:bg-purple-50 transition-colors">
                          <div className="flex items-center text-purple-700 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Users className="h-3.5 w-3.5 mr-2" />
                            COMMUNITY
                          </div>
                          <div className="text-lg font-black text-purple-900">
                            {Math.round(community.localEmploymentRate * 100)}%
                          </div>
                          <div className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-1">
                            Local Jobs
                          </div>
                        </div>
                      </div>

                      {/* Certifications & Features */}
                      <div className="flex flex-wrap gap-2 mb-8">
                        {destination.sustainabilityFeatures?.wildlifeProtectionProgram && (
                          <span className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">
                            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                            Wildlife Protected
                          </span>
                        )}
                        {destination.sustainabilityFeatures?.hasRenewableEnergy && (
                          <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">
                            <Sun className="h-3.5 w-3.5 mr-1.5" />
                            Solar Powered
                          </span>
                        )}
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Verified Eco
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-2xl font-black text-emerald-600 leading-none">₹{(2000 + (score.overallScore * 20)).toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Per Person</div>
                        </div>
                        <button className="flex-[2] flex items-center justify-center px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all active:scale-95 shadow-lg min-h-[48px]">
                          Book Responsibly
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </button>
                        <button 
                          className="w-12 h-12 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95 flex items-center justify-center"
                          aria-label={`View more information about ${destination.name}`}
                        >
                          <Info className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No eco destinations found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">
                We couldn't find any destinations matching your current filters. Try adjusting your search or filters.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setEcoImpactFilter('all');
                  setSelectedRating('all');
                }}
                className="text-emerald-600 font-medium hover:text-emerald-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Eco-Friendly Alternatives */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Eco-Friendly Alternatives</h2>
              <p className="text-sm text-gray-500">Better scoring destinations for your preferred locations</p>
            </div>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {findLowImpactAlternatives(allDestinations, 80).slice(0, 3).map((alt) => {
              const score = calculateSustainabilityScore(alt);
              return (
                <div key={alt.id} className="flex flex-col border border-gray-100 rounded-xl overflow-hidden hover:border-green-200 transition-colors group">
                  <div className="h-32 bg-slate-100 shimmer relative">
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded text-[10px] font-bold text-green-700 shadow-sm border border-green-100">
                      Score: {score.overallScore}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{alt.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{alt.location}</p>
                    <div className="flex items-center text-[10px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded w-fit">
                      <Leaf className="h-3 w-3 mr-1" />
                      {score.overallScore > 90 ? 'Exceptional Sustainability' : 'Highly Recommended'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Comparison Modal */}
      {isComparisonOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="comparison-modal-title">
          <div 
            ref={comparisonModalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center">
                <Scale className="h-6 w-6 mr-3" aria-hidden="true" />
                <div>
                  <h2 id="comparison-modal-title" className="text-xl font-bold">Compare Eco Destinations</h2>
                  <p className="text-emerald-100 text-sm">Side-by-side sustainability analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setIsComparisonOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close comparison modal"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-8">
              {/* Desktop View Table */}
              <div className="hidden sm:block min-w-[800px]">
                <table className="w-full border-collapse">
                  <caption className="sr-only">Sustainability comparison of selected destinations</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="w-1/4 p-4 text-left text-gray-400 font-black uppercase tracking-widest text-[10px] border-b border-gray-100">Feature</th>
                      {comparisonList.map(dest => (
                        <th key={dest.id} scope="col" className="w-1/4 p-4 text-left border-b border-gray-100">
                          <div className="font-black text-gray-900 uppercase tracking-tight">{dest.name}</div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{dest.location}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row" className="p-4 text-left text-gray-500 font-bold border-b border-gray-50">Overall Score</th>
                      {comparisonList.map(dest => {
                        const score = calculateSustainabilityScore(dest).overallScore;
                        return (
                          <td key={dest.id} className="p-4 border-b border-gray-50">
                            <span className={`px-3 py-1 rounded-xl font-black text-xs ${getScoreColor(score)}`}>
                              {score}/100
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th scope="row" className="p-4 text-left text-gray-500 font-bold border-b border-gray-50">Carbon Footprint</th>
                      {comparisonList.map(dest => {
                        const offset = calculateCarbonOffset(dest, 1);
                        return (
                          <td key={dest.id} className="p-4 border-b border-gray-50">
                            <div className="text-sm font-black text-gray-900">{offset.estimatedCO2}kg CO2e</div>
                            <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Offset: ₹{offset.offsetCost}</div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th scope="row" className="p-4 text-left text-gray-500 font-bold border-b border-gray-50">Community Impact</th>
                      {comparisonList.map(dest => {
                        const community = getCommunityBenefitMetrics(dest);
                        return (
                          <td key={dest.id} className="p-4 border-b border-gray-50">
                            <div className="text-sm font-black text-gray-900">{Math.round(community.localEmploymentRate * 100)}% Local Jobs</div>
                            <div className="text-[10px] text-purple-600 font-black uppercase tracking-widest">High Impact</div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th scope="row" className="p-4 text-left text-gray-500 font-bold">Key Features</th>
                      {comparisonList.map(dest => (
                        <td key={dest.id} className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {dest.sustainabilityFeatures?.wildlifeProtectionProgram && (
                              <span title="Wildlife Protected">
                                <Bird className="h-4 w-4 text-orange-500" />
                              </span>
                            )}
                            {dest.sustainabilityFeatures?.hasRenewableEnergy && (
                              <span title="Solar Powered">
                                <Sun className="h-4 w-4 text-yellow-500" />
                              </span>
                            )}
                            <span title="Verified Eco">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="sm:hidden space-y-6">
                {comparisonList.map((dest) => {
                  const score = calculateSustainabilityScore(dest).overallScore;
                  const offset = calculateCarbonOffset(dest, 1);
                  const community = getCommunityBenefitMetrics(dest);
                  return (
                    <div key={dest.id} className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-gray-900 uppercase tracking-tight">{dest.name}</h3>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{dest.location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-xl font-black text-xs ${getScoreColor(score)}`}>
                          {score} PTS
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Carbon</div>
                          <div className="text-xs font-black text-gray-900">{offset.estimatedCO2}kg</div>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                          <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Community</div>
                          <div className="text-xs font-black text-gray-900">{Math.round(community.localEmploymentRate * 100)}% Jobs</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        {dest.sustainabilityFeatures?.wildlifeProtectionProgram && (
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                            <Bird className="h-4 w-4" />
                          </div>
                        )}
                        {dest.sustainabilityFeatures?.hasRenewableEnergy && (
                          <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                            <Sun className="h-4 w-4" />
                          </div>
                        )}
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 sm:p-8 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsComparisonOpen(false)}
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all active:scale-95 shadow-lg min-h-[48px]"
              >
                Close Comparison
              </button>
              <button 
                onClick={() => {
                  setComparisonList([]);
                  setIsComparisonOpen(false);
                }}
                className="w-full sm:w-auto px-8 py-4 bg-white text-red-600 border-2 border-red-50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 transition-all active:scale-95 min-h-[48px]"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </TouristLayout>
  );
}
