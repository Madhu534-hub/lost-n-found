import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Filter, Layers, Navigation, Info, Eye } from 'lucide-react';

// Custom SVG Leaflet marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const redIcon = createCustomIcon('#f43f5e'); // Lost
const greenIcon = createCustomIcon('#10b981'); // Found
const grayIcon = createCustomIcon('#64748b'); // Reunited / Resolved

export const CampusMap = ({ reports = [], onSelectReport, interactive = false, onSelectCoords }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Campus central coordinates (e.g. Stanford/University campus baseline)
  const defaultCenter = [37.4285, -122.1700];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tiles (CartoDB Dark Matter / OSM)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map clicks for manual pin-drop if in interactive mode
      if (interactive && onSelectCoords) {
        map.on('click', (e) => {
          onSelectCoords(e.latlng.lat, e.latlng.lng, 'Selected Campus Location');
        });
      }
    }

    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  // Update Markers whenever reports or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = reports.filter(r => {
      const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
      const matchStatus = statusFilter === 'All' ||
        (statusFilter === 'active' && r.status === 'active') ||
        (statusFilter === 'matched' && (r.status === 'matched' || r.status === 'verified')) ||
        (statusFilter === 'reunited' && r.status === 'reunited');
      return matchCat && matchStatus;
    });

    filtered.forEach(report => {
      const lat = parseFloat(report.lat) || 37.4275;
      const lng = parseFloat(report.lng) || -122.1697;

      const isReunited = report.status === 'reunited';
      const isLost = report.type === 'lost';
      const icon = isReunited ? grayIcon : isLost ? redIcon : greenIcon;

      const marker = L.marker([lat, lng], { icon });

      // Custom HTML Popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-900 font-sans';
      popupContent.innerHTML = `
        <div style="width: 220px; font-family: 'Outfit', sans-serif;">
          <img src="${report.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}" 
               style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${isLost ? '#e11d48' : '#059669'};">
            ${isLost ? '🔴 Lost Item' : '🟢 Found Item'} • ${report.category}
          </div>
          <h4 style="font-size: 13px; font-weight: bold; margin: 2px 0 4px 0; color: #0f172a; line-height: 1.2;">
            ${report.title}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">📍 ${report.location}</p>
          <button id="popup-btn-${report.id}" style="
            width: 100%;
            padding: 6px 12px;
            background: #0284c7;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
          ">View Details →</button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${report.id}`);
        if (btn && onSelectReport) {
          btn.onclick = () => onSelectReport(report);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [reports, categoryFilter, statusFilter, onSelectReport]);

  return (
    <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-campus-400" />
          <h3 className="text-base font-extrabold text-white">
            Interactive Campus Spatial Map
          </h3>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl glass-input text-xs text-white bg-slate-900 border border-slate-800"
          >
            <option value="All">All Categories</option>
            <option value="Bags & Backpacks">Bags & Backpacks</option>
            <option value="Electronics & Phones">Electronics & Phones</option>
            <option value="Bottles & Containers">Bottles & Containers</option>
            <option value="Keys & IDs">Keys & IDs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl glass-input text-xs text-white bg-slate-900 border border-slate-800"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="matched">Matched Only</option>
            <option value="reunited">Resolved / Reunited</option>
          </select>
        </div>
      </div>

      {/* Map Legend */}
      <div className="flex items-center space-x-4 text-xs font-semibold text-slate-300">
        <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span><span>Lost (Red)</span></span>
        <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Found (Green)</span></span>
        <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-slate-500"></span><span>Resolved (Gray)</span></span>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative z-10"
      />
    </div>
  );
};
