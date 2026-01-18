'use client';

import React, { useState, useMemo } from 'react';
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
  const [selectedType, setSelectedType] = useState<string>('all');
  const [ecoImpactFilter, setEcoImpactFilter] = useState<EcoImpactCategory | 'all'>('all');
  const [comparisonList, setComparisonList] = useState<Destination[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
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
    return allDestinations
      .filter(dest => {
        const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             dest.location.toLowerCase().includes(searchTerm.toLowerCase());
        
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
          <div className="flex flex-col space-y-4">
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
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Ratings</option>
                  <option value="4.5">4.5+ Rating</option>
                  <option value="4.0">4.0+ Rating</option>
                </select>

                {comparisonList.length > 0 && (
                  <button
                    onClick={() => setIsComparisonOpen(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Scale className="h-4 w-4 mr-2" />
                    Compare ({comparisonList.length})
                  </button>
                )}
              </div>
            </div>

            {/* Eco Impact Filter Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setEcoImpactFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  ecoImpactFilter === 'all' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Impact
              </button>
              <button
                onClick={() => setEcoImpactFilter('low-carbon')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
                  ecoImpactFilter === 'low-carbon' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Low Carbon Footprint
              </button>
              <button
                onClick={() => setEcoImpactFilter('community-friendly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
                  ecoImpactFilter === 'community-friendly' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Community-Friendly
              </button>
              <button
                onClick={() => setEcoImpactFilter('wildlife-safe')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
                  ecoImpactFilter === 'wildlife-safe' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                }`}
              >
                <Bird className="h-3.5 w-3.5 mr-1.5" />
                Wildlife-Safe
              </button>
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
        <div className="space-y-6">
          {filteredDestinations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDestinations.map((destination) => {
                const score = calculateSustainabilityScore(destination);
                const offset = calculateCarbonOffset(destination, 1);
                const community = getCommunityBenefitMetrics(destination);
                const impactCategory = getEcoImpactCategory(destination);
                const isComparing = comparisonList.some(d => d.id === destination.id);

                return (
                  <div key={destination.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image and Badges */}
                    <div className="relative h-48 bg-gray-200">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold border shadow-sm flex items-center ${getScoreColor(score.overallScore)}`}>
                          <Award className="h-3 w-3 mr-1" />
                          Score: {score.overallScore}
                        </span>
                        <span className="px-2 py-1 bg-white/90 text-gray-700 rounded text-xs font-medium border border-gray-200 shadow-sm flex items-center">
                          <Zap className="h-3 w-3 mr-1 text-blue-500" />
                          {impactCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                      
                      {/* Comparison Checkbox */}
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <button 
                          onClick={() => handleCompareToggle(destination)}
                          className={`p-2 rounded-full shadow-md transition-colors ${
                            isComparing 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-white/90 text-gray-600 hover:bg-white'
                          }`}
                          title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                        >
                          <Scale className="h-4 w-4" />
                        </button>
                        <button className="p-2 bg-white/90 text-gray-600 rounded-full shadow-md hover:bg-white transition-colors">
                          <Heart className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Bottom Info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-white">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">{destination.location}</span>
                          </div>
                          <div className="flex items-center text-white bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                            <span className="text-xs">Eco-Rating 4.8</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{destination.name}</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">₹{ (2000 + (score.overallScore * 20)).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">per person</div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{destination.description}</p>

                      {/* Sustainability Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center text-blue-700 text-xs font-bold mb-1">
                            <Zap className="h-3 w-3 mr-1" />
                            CARBON FOOTPRINT
                          </div>
                          <div className="text-sm font-medium text-blue-900">
                            {offset.estimatedCO2}kg CO2e
                          </div>
                          <div className="text-[10px] text-blue-600">
                            Offset: ₹{offset.offsetCost}
                          </div>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center text-purple-700 text-xs font-bold mb-1">
                            <Users className="h-3 w-3 mr-1" />
                            COMMUNITY BENEFIT
                          </div>
                          <div className="text-sm font-medium text-purple-900">
                            {Math.round(community.localEmploymentRate * 100)}% Local Jobs
                          </div>
                          <div className="text-[10px] text-purple-600">
                            {Math.round(community.communityFundContribution * 100)}% Fund Share
                          </div>
                        </div>
                      </div>

                      {/* Certifications & Features */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {destination.sustainabilityFeatures?.wildlifeProtectionProgram && (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[10px] font-bold uppercase flex items-center">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Wildlife Protected
                          </span>
                        )}
                        {destination.sustainabilityFeatures?.hasRenewableEnergy && (
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded text-[10px] font-bold uppercase flex items-center">
                            <Sun className="h-3 w-3 mr-1" />
                            Solar Powered
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold uppercase flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Eco
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm flex items-center justify-center">
                          Book Responsibly
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </button>
                        <button className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                          <Info className="h-5 w-5" />
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
                  <div className="h-32 bg-gray-100 relative">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center">
                <Scale className="h-6 w-6 mr-3" />
                <div>
                  <h2 className="text-xl font-bold">Compare Eco Destinations</h2>
                  <p className="text-emerald-100 text-sm">Side-by-side sustainability analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setIsComparisonOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto p-6">
              <div className="min-w-[800px]">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-1/4 p-4 text-left text-gray-500 font-medium border-b">Feature</th>
                      {comparisonList.map(dest => (
                        <th key={dest.id} className="w-1/4 p-4 text-left border-b">
                          <div className="font-bold text-gray-900">{dest.name}</div>
                          <div className="text-xs text-gray-500 font-normal">{dest.location}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-4 text-sm font-semibold text-gray-700 bg-gray-50">Sustainability Score</td>
                      {comparisonList.map(dest => {
                        const score = calculateSustainabilityScore(dest);
                        return (
                          <td key={dest.id} className="p-4">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(score.overallScore)}`}>
                              <Award className="h-3 w-3 mr-1" />
                              {score.overallScore}/100
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-4 text-sm font-semibold text-gray-700 bg-gray-50">Carbon Footprint</td>
                      {comparisonList.map(dest => {
                        const offset = calculateCarbonOffset(dest, 1);
                        return (
                          <td key={dest.id} className="p-4 text-sm">
                            <div className="font-medium text-gray-900">{offset.estimatedCO2}kg CO2e</div>
                            <div className="text-xs text-blue-600">Offset: ₹{offset.offsetCost}</div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-4 text-sm font-semibold text-gray-700 bg-gray-50">Community Impact</td>
                      {comparisonList.map(dest => {
                        const community = getCommunityBenefitMetrics(dest);
                        return (
                          <td key={dest.id} className="p-4 text-sm">
                            <div>{Math.round(community.localEmploymentRate * 100)}% Local Jobs</div>
                            <div className="text-xs text-purple-600">Fund: {Math.round(community.communityFundContribution * 100)}%</div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-4 text-sm font-semibold text-gray-700 bg-gray-50">Wildlife Features</td>
                      {comparisonList.map(dest => (
                        <td key={dest.id} className="p-4 text-sm text-gray-600">
                          {dest.sustainabilityFeatures?.wildlifeProtectionProgram ? (
                            <div className="flex items-center text-orange-600">
                              <Bird className="h-4 w-4 mr-1.5" />
                              Protected Habitat
                            </div>
                          ) : 'Standard Protection'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 text-sm font-semibold text-gray-700 bg-gray-50">Certifications</td>
                      {comparisonList.map(dest => (
                        <td key={dest.id} className="p-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold">VERIFIED ECO</span>
                            {dest.sustainabilityFeatures?.hasRenewableEnergy && (
                              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded text-[10px] font-bold">SOLAR</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 text-sm font-semibold text-gray-700 bg-gray-50">Pricing</td>
                      {comparisonList.map(dest => {
                        const score = calculateSustainabilityScore(dest);
                        return (
                          <td key={dest.id} className="p-4">
                            <div className="text-lg font-bold text-emerald-600">₹{(2000 + (score.overallScore * 20)).toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">Eco-weighted rate</div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button 
                onClick={() => setComparisonList([])}
                className="flex items-center text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Comparison
              </button>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsComparisonOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                  Book Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TouristLayout>
  );
}
