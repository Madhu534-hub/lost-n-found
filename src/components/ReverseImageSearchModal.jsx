import React, { useState } from 'react';
import { api } from '../services/api';
import { Camera, Search, Sparkles, X, Eye, ArrowRight, Loader2, Tag, MapPin, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ReverseImageSearchModal = ({ isOpen, onClose, onSelectReport }) => {
  const { t } = useTranslation();
  const [photoUrl, setPhotoUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [visionData, setVisionData] = useState(null);

  const samplePhotos = [
    { label: 'JanSport Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', cat: 'Bags & Backpacks' },
    { label: 'Pacific Blue iPhone', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80', cat: 'Electronics & Phones' },
    { label: 'White Hydro Flask', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', cat: 'Bottles & Containers' },
    { label: 'Subaru Car Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80', cat: 'Keys & IDs' }
  ];

  if (!isOpen) return null;

  const handleSearch = async (targetUrl = photoUrl) => {
    if (!targetUrl.trim()) return;

    try {
      setSearching(true);
      const res = await api.reverseSearch({ photoUrl: targetUrl.trim() });
      setResults(res.results || []);
      setVisionData(res.queryVision || null);
    } catch (err) {
      console.error('Reverse search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSample = (sample) => {
    setPhotoUrl(sample.url);
    handleSearch(sample.url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-3xl p-6 sm:p-8 border border-campus-500/40 shadow-2xl overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-campus-600 to-ai-purple flex items-center justify-center text-white shadow-glow-primary">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white">Search Catalog by Photo</h3>
              <span className="px-2.5 py-0.5 text-xs bg-ai-purple/20 text-ai-fuchsia border border-ai-fuchsia/40 rounded-full font-bold">
                Visual Embedding AI
              </span>
            </div>
            <p className="text-sm text-slate-400">Upload any photo — no text needed. AI will find the top 5 visual matches.</p>
          </div>
        </div>

        {/* Upload & Presets */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1-Click Sample Photos (Instant Test):
            </label>
            <div className="flex flex-wrap gap-2">
              {samplePhotos.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    photoUrl === s.url
                      ? 'bg-campus-600 text-white border-campus-400 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  📸 {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Paste photo image URL or select a sample photo above..."
              className="flex-1 w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500"
            />
            <button
              onClick={() => handleSearch()}
              disabled={searching || !photoUrl.trim()}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning Visual Embeddings...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Find Visual Matches</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vision Tags Detected */}
        {visionData && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Detected: <strong className="text-white">{visionData.dominantColor} {visionData.brandGuess} ({visionData.category})</strong></span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(visionData.tags || []).slice(0, 4).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        {results !== null && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Top Visual Matches Found ({results.length}):</span>
              </h4>
              <span className="text-xs text-slate-400">Ranked by Visual Embedding Cosine Similarity</span>
            </div>

            {results.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No visually similar reports found. Try another photo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((rep, idx) => (
                  <div
                    key={rep.id}
                    onClick={() => {
                      onClose();
                      if (onSelectReport) onSelectReport(rep);
                    }}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-campus-400 cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={rep.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
                        alt={rep.title}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.type === 'lost' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {rep.type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-campus-500/20 text-campus-300 border border-campus-500/30">
                            {rep.visual_similarity_score || 95}% Match
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-white mt-1 truncate group-hover:text-campus-300">
                          {rep.title}
                        </h5>
                        <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{rep.location}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
