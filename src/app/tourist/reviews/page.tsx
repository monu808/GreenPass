'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { sanitizeSearchTerm } from '@/lib/utils';
import { validateInput, SearchFilterSchema } from '@/lib/validation';
import { 
  Star, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Flag, 
  Search,
  Calendar,
  MapPin,
  User,
  Camera,
  Award,
  TrendingUp,
  BarChart3,
  Users,
  Heart,
  Edit3
} from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  destination: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  photos: string[];
  verified: boolean;
  tags: string[];
  tripType: string;
  likes: number;
  isLiked: boolean;
}

interface RatingBreakdown {
  rating: number;
  count: number;
  percentage: number;
}

export default function ReviewsRatings() {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Priya Sharma',
      userAvatar: '/api/placeholder/40/40',
      destination: 'Rohtang Pass',
      rating: 5,
      title: 'Absolutely breathtaking experience!',
      content: 'The views from Rohtang Pass were simply spectacular. Snow-capped mountains, clear blue skies, and adventure activities made it a perfect trip. The local guides were knowledgeable and friendly. Highly recommend visiting during early morning for the best views.',
      date: '2024-06-20',
      helpful: 24,
      photos: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
      verified: true,
      tags: ['scenic', 'adventure', 'snow'],
      tripType: 'Family',
      likes: 18,
      isLiked: false
    },
    {
      id: '2',
      userId: '2',
      userName: 'Rahul Kumar',
      userAvatar: '/api/placeholder/40/40',
      destination: 'Spiti Valley',
      rating: 4,
      title: 'Cold desert beauty at its finest',
      content: 'Spiti Valley offers a unique landscape that\'s completely different from typical hill stations. The monasteries, local culture, and barren mountains create an otherworldly experience. Road conditions can be challenging, so be prepared.',
      date: '2024-05-15',
      helpful: 31,
      photos: ['/api/placeholder/300/200'],
      verified: true,
      tags: ['culture', 'landscape', 'monastery'],
      tripType: 'Solo',
      likes: 22,
      isLiked: true
    },
    {
      id: '3',
      userId: '3',
      userName: 'Anjali Patel',
      userAvatar: '/api/placeholder/40/40',
      destination: 'Dal Lake',
      rating: 5,
      title: 'Magical houseboat experience',
      content: 'Staying in a houseboat on Dal Lake was like living in a dream. The serene waters, floating gardens, and warm hospitality made our anniversary trip unforgettable. Don\'t miss the shikara ride at sunset!',
      date: '2024-04-10',
      helpful: 45,
      photos: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200'],
      verified: true,
      tags: ['romantic', 'houseboat', 'peaceful'],
      tripType: 'Couple',
      likes: 35,
      isLiked: false
    },
    {
      id: '4',
      userId: '4',
      userName: 'Vikram Singh',
      userAvatar: '/api/placeholder/40/40',
      destination: 'Bir Billing',
      rating: 5,
      title: 'Paragliding paradise!',
      content: 'If you\'re looking for adventure, Bir Billing is the place to be. The paragliding experience was incredible with professional instructors. The landing site has great cafes and the whole area has a chill vibe.',
      date: '2024-03-25',
      helpful: 28,
      photos: ['/api/placeholder/300/200'],
      verified: true,
      tags: ['adventure', 'paragliding', 'thrilling'],
      tripType: 'Friends',
      likes: 31,
      isLiked: true
    },
    {
      id: '5',
      userId: '5',
      userName: 'Meera Gupta',
      userAvatar: '/api/placeholder/40/40',
      destination: 'Shimla',
      rating: 3,
      title: 'Good but crowded',
      content: 'Shimla has beautiful colonial architecture and pleasant weather. However, it gets very crowded during peak season. Mall Road is nice for shopping but expect heavy traffic. Better to visit during off-season.',
      date: '2024-02-14',
      helpful: 19,
      photos: [],
      verified: true,
      tags: ['crowded', 'colonial', 'shopping'],
      tripType: 'Family',
      likes: 12,
      isLiked: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showWriteReview, setShowWriteReview] = useState(false);

  const destinations = Array.from(new Set(reviews.map(review => review.destination)));
  
  const ratingBreakdown: RatingBreakdown[] = [
    { rating: 5, count: 156, percentage: 65 },
    { rating: 4, count: 48, percentage: 20 },
    { rating: 3, count: 24, percentage: 10 },
    { rating: 2, count: 8, percentage: 3 },
    { rating: 1, count: 4, percentage: 2 }
  ];

  const averageRating = 4.4;
  const totalReviews = ratingBreakdown.reduce((sum, item) => sum + item.count, 0);

  const filteredReviews = reviews.filter(review => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm);
    
    const filterValidation = validateInput(SearchFilterSchema, {
      searchTerm: sanitizedSearch,
    });

    const validFilters = filterValidation.success ? filterValidation.data : { searchTerm: "" };

    const matchesSearch = review.title.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
                         review.content.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "") ||
                         review.destination.toLowerCase().includes(validFilters.searchTerm?.toLowerCase() || "");
    const matchesDestination = selectedDestination === 'all' || review.destination === selectedDestination;
    const matchesRating = selectedRating === 'all' || review.rating >= parseInt(selectedRating);
    
    return matchesSearch && matchesDestination && matchesRating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const toggleLike = (reviewId: string) => {
    console.log('Toggle like for review:', reviewId);
  };

  const markHelpful = (reviewId: string) => {
    console.log('Mark helpful:', reviewId);
  };

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Reviews & Ratings</h1>
          <p className="text-yellow-100">Share your experiences and help fellow travelers</p>
        </div>

        {/* Overall Rating Statistics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="text-center lg:text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Overall Rating</h2>
              <div className="flex items-center justify-center lg:justify-start mb-2">
                <span className="text-4xl font-bold text-gray-900 mr-2">{averageRating}</span>
                {renderStars(averageRating, 'lg')}
              </div>
              <p className="text-gray-600">Based on {totalReviews.toLocaleString()} reviews</p>
            </div>

            {/* Rating Breakdown */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating Breakdown</h3>
              <div className="space-y-2">
                {ratingBreakdown.map((item) => (
                  <div key={item.rating} className="flex items-center">
                    <span className="text-sm text-gray-600 w-8">{item.rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">94%</div>
            <div className="text-sm text-gray-600">Positive Reviews</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-sm text-gray-600">Featured Reviews</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">1.2K</div>
            <div className="text-sm text-gray-600">Active Reviewers</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowWriteReview(true)}
              className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Write Review
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Destinations</option>
              {destinations.map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
            
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-yellow-300 transition-colors">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                      {review.verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{review.destination}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {review.tripType}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              </div>

              {/* Photos */}
              {review.photos.length > 0 && (
                <div className="mb-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.photos.map((photo, index) => (
                      <div key={index} className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {review.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {review.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => markHelpful(review.id)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">Helpful ({review.helpful})</span>
                  </button>
                  
                  <button
                    onClick={() => toggleLike(review.id)}
                    className={`flex items-center space-x-1 transition-colors ${
                      review.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${review.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{review.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Reply</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-600 hover:text-blue-600 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-600 hover:text-red-600 transition-colors">
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Write Review Modal */}
        {showWriteReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
                  <button
                    onClick={() => setShowWriteReview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                      <option value="">Select destination...</option>
                      {destinations.map(dest => (
                        <option key={dest} value={dest}>{dest}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" className="text-gray-300 hover:text-yellow-400">
                          <Star className="h-6 w-6" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                    <input
                      type="text"
                      placeholder="Summarize your experience..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                    <textarea
                      rows={4}
                      placeholder="Share your experience with other travelers..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowWriteReview(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </TouristLayout>
  );
}
