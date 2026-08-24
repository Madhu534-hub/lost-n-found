import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CampusMap } from '../components/CampusMap';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  Map,
  Grid,
  Tag,
  Eye,
  Camera,
  Star,
  Languages,
  Loader2,
  PackageOpen,
  PlusCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Skeleton card placeholder during loading
const SkeletonCard = () => (
  <div className="glass-card rounded-3xl overflow-hidden border border-slate-800 flex flex-col">
    <div className="aspect-video w-full skeleton" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="flex gap-1.5 pt-1">
        <div className="skeleton h-5 w-14 rounded" />
        <div className="skeleton h-5 w-14 rounded" />
        <div className="skeleton h-5 w-14 rounded" />
      </div>
      <div className="pt-2 border-t border-slate-800 flex justify-between">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
    <div className="p-4 bg-slate-900/60 border-t border-slate-800">
      <div className="skeleton h-10 w-full rounded-xl" />
    </div>
  </div>
);

export const BrowseReportsPage = ({ onOpenPhotoSearch, onSelectReport }) => {
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  
  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [category, setCategory] = useState('All');
  const [building, setBuilding] = useState('All');

  // Translations cache
  const [translations, setTranslations] = useState({});
  const [translatingId, setTranslatingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [type, category, building]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (type !== 'All') params.type = type;
      if (category !== 'All') params.category = category;
      if (building !== 'All') params.building = building;
      if (search) params.search = search;

      const data = await api.getReports(params);
      setReports(data);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleTranslate = async (reportId, text) => {
    if (translations[reportId]) {
      setTranslations(prev => ({ ...prev, [reportId]: null }));
      return;
    }

    try {
      setTranslatingId(reportId);
      const res = await api.translate(text, i18n.language || 'en');
      setTranslations(prev => ({ ...prev, [reportId]: res.translated }));
    } catch (err) {
      console.error(err);
    } finally {
      setTranslatingId(null);
    }
  };

  const isEmpty = !loading && reports.length === 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white">
            Campus Lost &amp; Found Catalog
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Browse active reports or search visually by uploading a photo.
          </p>
        </div>

        {/* View Mode & Search by Photo Button (>= 48px height) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenPhotoSearch}
            className="min-h-[48px] px-4 py-2.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 flex items-center space-x-2 transition-all"
          >
            <Camera className="w-5 h-5 text-cyan-200" />
            <span>Search by Photo</span>
          </button>

          <div className="glass-panel p-1 rounded-2xl border border-slate-800 flex space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'grid'
                  ? 'bg-campus-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'map'
                  ? 'bg-campus-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Campus Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, tags (e.g. backpack, hydro flask, AirPods)..."
              className="w-full min-h-[48px] pl-12 pr-4 py-3 rounded-xl glass-input text-base text-white placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-campus-700 to-campus-600 hover:from-campus-600 hover:to-campus-500 text-white border border-campus-600/40 shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="min-h-[48px] px-4 py-2.5 rounded-xl glass-input text-sm text-white bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <option value="All">All Types (Lost &amp; Found)</option>
            <option value="lost">🔴 Lost Items Only</option>
            <option value="found">🟢 Found Items Only</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-[48px] px-4 py-2.5 rounded-xl glass-input text-sm text-white bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Bags & Backpacks">Bags &amp; Backpacks</option>
            <option value="Electronics & Phones">Electronics &amp; Phones</option>
            <option value="Bottles & Containers">Bottles &amp; Containers</option>
            <option value="Keys & IDs">Keys &amp; IDs</option>
            <option value="Clothing & Accessories">Clothing &amp; Accessories</option>
          </select>

          <select
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="min-h-[48px] px-4 py-2.5 rounded-xl glass-input text-sm text-white bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <option value="All">All Campus Locations</option>
            <option value="Main Library">Main Library</option>
            <option value="Student Union / Dining Hall">Student Union / Dining Hall</option>
            <option value="Computer Science Building">Computer Science Building</option>
            <option value="Engineering Quad">Engineering Quad</option>
            <option value="Sports & Recreation Complex">Sports Complex</option>
          </select>
        </div>
      </div>

      {/* Main Content: Map View or Grid View */}
      {viewMode === 'map' ? (
        <CampusMap
          reports={reports}
          onSelectReport={(rep) => {
            if (onSelectReport) onSelectReport(rep);
          }}
        />
      ) : loading ? (
        /* Skeleton Loaders */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        /* Empty State */
        <div className="glass-panel py-20 px-8 rounded-3xl border border-slate-800 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <PackageOpen className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Reports Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              No lost or found items match your current filters. Try broadening your search or report a missing item.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { setSearch(''); setType('All'); setCategory('All'); setBuilding('All'); fetchReports(); }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
            >
              Clear Filters
            </button>
            <button
              onClick={onOpenPhotoSearch}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 flex items-center space-x-2 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Try Photo Search</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
          {reports.map((report, idx) => {
            const tags = typeof report.auto_tags === 'string' ? JSON.parse(report.auto_tags || '[]') : (report.auto_tags || []);
            const isLost = report.type === 'lost';
            const translatedDesc = translations[report.id];

            return (
              <div
                key={report.id}
                className="glass-card rounded-3xl overflow-hidden border border-slate-800 hover:border-campus-500/50 transition-all flex flex-col justify-between group"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div>
                  {/* Photo Banner */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={report.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                    />
                    {/* Dark gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase shadow-md ${
                        isLost ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isLost ? '🔴 Lost' : '🟢 Found'}
                      </span>
                      {report.is_high_value ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-slate-950" />
                          <span>Valuable</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-medium text-slate-300">{report.category}</span>
                      <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-campus-300 transition-colors leading-tight">
                      {report.title}
                    </h4>

                    <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                      {translatedDesc || report.description}
                    </p>

                    {/* Auto Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-950/50 text-purple-300 text-[11px] font-semibold border border-purple-500/20">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 gap-2">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslate(report.id, report.description)}
                        className="min-h-[32px] px-2 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-slate-900/80 flex items-center space-x-1 shrink-0 transition-colors"
                      >
                        {translatingId === report.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Languages className="w-3.5 h-3.5" />
                        )}
                        <span>{translatedDesc ? 'Original' : 'Translate'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Action (>= 48px height) */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-800">
                  <button
                    onClick={() => { if (onSelectReport) onSelectReport(report); }}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-campus-500/40 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>View Details &amp; Matches</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
