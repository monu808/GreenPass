'use client';

import React, { useState } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Camera, 
  MapPin, 
  Calendar, 
  Download, 
  Heart, 
  Share2, 
  Eye, 
  Grid3X3, 
  List,
  Search,
  Filter,
  Upload,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  description?: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
}

interface PhotoAlbum {
  id: string;
  name: string;
  coverPhoto: string;
  photoCount: number;
  date: string;
  location: string;
}

export default function PhotoGallery() {
  const [viewMode, setViewMode] = useState<'grid' | 'albums'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  const [photos] = useState<Photo[]>([
    {
      id: '1',
      url: '/api/placeholder/400/300',
      title: 'Sunset at Rohtang Pass',
      location: 'Rohtang Pass, Himachal Pradesh',
      date: '2024-06-15',
      description: 'Beautiful sunset view from the pass with snow-capped mountains',
      tags: ['sunset', 'mountains', 'snow'],
      likes: 24,
      isLiked: true
    },
    {
      id: '2',
      url: '/api/placeholder/400/300',
      title: 'Dal Lake Houseboat',
      location: 'Srinagar, Jammu & Kashmir',
      date: '2024-05-20',
      description: 'Traditional houseboat on the serene Dal Lake',
      tags: ['lake', 'houseboat', 'traditional'],
      likes: 18,
      isLiked: false
    },
    {
      id: '3',
      url: '/api/placeholder/400/300',
      title: 'Spiti Valley Landscape',
      location: 'Spiti Valley, Himachal Pradesh',
      date: '2024-05-18',
      description: 'The cold desert beauty of Spiti Valley',
      tags: ['desert', 'landscape', 'barren'],
      likes: 32,
      isLiked: true
    },
    {
      id: '4',
      url: '/api/placeholder/400/300',
      title: 'Paragliding at Bir Billing',
      location: 'Bir Billing, Himachal Pradesh',
      date: '2024-04-10',
      description: 'Adventure sport experience at world-famous paragliding site',
      tags: ['adventure', 'paragliding', 'aerial'],
      likes: 45,
      isLiked: false
    },
    {
      id: '5',
      url: '/api/placeholder/400/300',
      title: 'Shimla Heritage Walk',
      location: 'Shimla, Himachal Pradesh',
      date: '2024-03-25',
      description: 'Colonial architecture and heritage buildings',
      tags: ['heritage', 'architecture', 'colonial'],
      likes: 15,
      isLiked: true
    },
    {
      id: '6',
      url: '/api/placeholder/400/300',
      title: 'Trekking in Manali',
      location: 'Manali, Himachal Pradesh',
      date: '2024-06-12',
      description: 'Adventure trekking through pine forests',
      tags: ['trekking', 'forest', 'adventure'],
      likes: 28,
      isLiked: false
    }
  ]);

  const [albums] = useState<PhotoAlbum[]>([
    {
      id: '1',
      name: 'Himachal Adventure Trip',
      coverPhoto: '/api/placeholder/300/200',
      photoCount: 24,
      date: '2024-06-15',
      location: 'Himachal Pradesh'
    },
    {
      id: '2',
      name: 'Kashmir Valley Tour',
      coverPhoto: '/api/placeholder/300/200',
      photoCount: 18,
      date: '2024-05-20',
      location: 'Jammu & Kashmir'
    },
    {
      id: '3',
      name: 'Heritage Sites Collection',
      coverPhoto: '/api/placeholder/300/200',
      photoCount: 12,
      date: '2024-03-25',
      location: 'Various Locations'
    }
  ]);

  const allTags = Array.from(new Set(photos.flatMap(photo => photo.tags)));

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || photo.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const toggleLike = (photoId: string) => {
    // This would normally update the backend
    console.log('Toggle like for photo:', photoId);
  };

  const downloadPhoto = (photo: Photo) => {
    // This would normally trigger a download
    console.log('Download photo:', photo.title);
  };

  const sharePhoto = (photo: Photo) => {
    // This would normally open share options
    console.log('Share photo:', photo.title);
  };

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPhotos.length - 1;
    } else {
      newIndex = currentIndex < filteredPhotos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  return (
    <TouristLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Photo Gallery</h1>
          <p className="text-purple-100">Capture and share your travel memories</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search photos by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Right side - View Mode and Upload */}
            <div className="flex items-center gap-3">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('albums')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'albums' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          /* Photo Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all">
                <div className="aspect-w-4 aspect-h-3 relative overflow-hidden">
                  <div className="w-full h-48 bg-gray-200 cursor-pointer" onClick={() => openLightbox(photo)}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(photo);
                        }}
                        className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <Eye className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>

                    {/* Top Actions */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(photo.id);
                        }}
                        className={`p-1.5 rounded-full transition-colors ${
                          photo.isLiked 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/90 text-gray-700 hover:bg-white'
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sharePhoto(photo);
                        }}
                        className="p-1.5 bg-white/90 text-gray-700 rounded-full hover:bg-white transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-white font-medium text-sm mb-1">{photo.title}</h3>
                      <div className="flex items-center text-white/80 text-xs mb-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{photo.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-white/80 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(photo.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-white/80 text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          <span>{photo.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Albums View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div key={album.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-semibold">{album.name}</h3>
                    <p className="text-sm text-white/80">{album.photoCount} photos</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{album.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(album.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={() => navigatePhoto('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigatePhoto('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Photo */}
              <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                <div className="max-h-96 bg-gray-200" />
                
                {/* Photo Info */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedPhoto.title}</h2>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="mr-4">{selectedPhoto.location}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(selectedPhoto.date).toLocaleDateString()}</span>
                  </div>
                  
                  {selectedPhoto.description && (
                    <p className="text-gray-700 mb-4">{selectedPhoto.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleLike(selectedPhoto.id)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                          selectedPhoto.isLiked 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                        <span>{selectedPhoto.likes}</span>
                      </button>
                      <button
                        onClick={() => downloadPhoto(selectedPhoto)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => sharePhoto(selectedPhoto)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TouristLayout>
  );
}
