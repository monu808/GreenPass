'use client';

import React, { useState, ChangeEvent } from 'react';
import TouristLayout from '@/components/TouristLayout';
import { 
  Camera, MapPin, Download, Heart, Share2, 
  Eye, Search, Upload, X, Sparkles 
} from 'lucide-react';

// Build Fix: Explicit Interface to prevent compilation errors
interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
}

export default function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // Full Dataset with 9 high-quality entries
  const [photos] = useState<Photo[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800', title: 'Rohtang Pass', location: 'Himachal Pradesh', date: '2024-06-15', tags: ['Mountain'], likes: 124, isLiked: true },
    { id: '2', url: 'https://images.unsplash.com/photo-1530866495547-0840404652c0?w=800', title: 'Dal Lake', location: 'Jammu & Kashmir', date: '2024-05-20', tags: ['Lake'], likes: 88, isLiked: false },
    { id: '3', url: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800', title: 'Bir Billing', location: 'Himachal Pradesh', date: '2024-04-10', tags: ['Adventure'], likes: 245, isLiked: false },
    { id: '4', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', title: 'Spiti Valley', location: 'Himachal Pradesh', date: '2024-05-18', tags: ['Mountain'], likes: 132, isLiked: true },
    { id: '5', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', title: 'Pangong Tso', location: 'Ladakh', date: '2024-07-02', tags: ['Lake'], likes: 412, isLiked: true },
    { id: '6', url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800', title: 'Solang Trek', location: 'Manali, HP', date: '2024-01-10', tags: ['Adventure'], likes: 95, isLiked: false },
    { id: '7', url: 'https://images.unsplash.com/photo-1581791538302-03537b9c97bf?w=800', title: 'Khajjiar Meadows', location: 'Chamba, HP', date: '2024-03-22', tags: ['Valley'], likes: 167, isLiked: false },
    { id: '8', url: 'https://images.unsplash.com/photo-1482867996988-29ec3aee816d?w=800', title: 'Gulmarg Slopes', location: 'Kashmir', date: '2024-12-15', tags: ['Mountain'], likes: 304, isLiked: true },
    { id: '9', url: 'https://images.unsplash.com/photo-1551632432-c735e8296f8f?w=800', title: 'Beas River', location: 'Kullu, HP', date: '2024-08-05', tags: ['Lake'], likes: 142, isLiked: false }
  ]);

  const handleAction = (type: string, id: string): void => {
    alert(`${type} initiated for photo ID: ${id}`);
  };

  const filteredPhotos = photos.filter(p => 
    (selectedTag === 'all' || p.tags.includes(selectedTag)) &&
    (p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <TouristLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">
        
        {/* HEADER */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
               <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Visual Archives</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">The <span className="text-emerald-600">Gallery</span></h1>
          </div>
          <button 
            type="button" 
            onClick={() => handleAction('Upload', 'new')} 
            className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
          >
            <Upload className="h-4 w-4" /> Contribute
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex-1 relative group">
            <label htmlFor="gallery-search" className="sr-only">Search landscape or valley</label>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500" />
            <input
              id="gallery-search"
              type="text"
              placeholder="Search landscape or valley..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          <div className="flex bg-gray-50 p-1.5 rounded-[1.8rem] border border-gray-100 overflow-x-auto">
            {['all', 'Mountain', 'Lake', 'Adventure', 'Valley'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedTag === tag ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* PHOTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="group relative bg-white rounded-[3rem] overflow-hidden border border-gray-50 shadow-sm hover:shadow-2xl transition-all duration-700">
              <div 
                className="h-60 relative overflow-hidden cursor-pointer" 
                onClick={() => setSelectedPhoto(photo)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedPhoto(photo)}
              >
                <img src={photo.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={photo.title} />
                <div className="absolute inset-0 bg-emerald-950/20 group-hover:bg-transparent transition-all" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="p-4 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 text-white shadow-2xl"><Eye className="h-6 w-6" /></div>
                </div>
              </div>
              <div className="p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">{photo.title}</h3>
                  <p className="text-gray-400 font-bold text-[10px] flex items-center gap-1 uppercase tracking-widest"><MapPin className="h-3 w-3 text-emerald-500" /> {photo.location}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleAction('Like', photo.id)} className={`p-3 rounded-2xl border transition-all ${photo.isLiked ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-emerald-600'}`}><Heart className="h-4 w-4" /></button>
                  <button type="button" onClick={() => handleAction('Share', photo.id)} className="p-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl hover:text-emerald-600 transition-all"><Share2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LIGHTBOX MODAL */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-emerald-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl bg-white rounded-[4rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
              <button 
                type="button"
                onClick={() => setSelectedPhoto(null)} 
                className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all z-20 active:scale-90"
              >
                <X className="h-7 w-7" />
              </button>
              
              <div className="lg:w-2/3 h-[400px] lg:h-[600px] bg-gray-100">
                <img src={selectedPhoto.url} className="w-full h-full object-cover" alt={selectedPhoto.title} />
              </div>

              <div className="lg:w-1/3 p-12 space-y-10 flex flex-col justify-center bg-white">
                <div className="space-y-4">
                   <div className="flex gap-2">
                     {selectedPhoto.tags.map(t => (
                       <span key={t} className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">{t}</span>
                     ))}
                   </div>
                   <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">{selectedPhoto.title}</h2>
                   <p className="text-gray-400 font-bold flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-emerald-500" /> {selectedPhoto.location}
                   </p>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
                   <button 
                     type="button"
                     onClick={() => handleAction('Download', selectedPhoto.id)} 
                     className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                   >
                      <Download className="h-4 w-4" /> Save High-Res
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TouristLayout>
  );
}