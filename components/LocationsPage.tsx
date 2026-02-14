import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, ChevronDown, ChevronRight, Search, Plus, Edit2, Trash2, X,
  Loader2, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Globe,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { masterDataApi } from '../services/api';
import { MasterLocation } from '../types';

const REGIONS = ['North', 'South', 'East', 'West'];

interface LocationFormData {
  city: string;
  state: string;
  region: string;
}

const EMPTY_FORM: LocationFormData = { city: '', state: '', region: '' };

export const LocationsPage: React.FC = () => {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';

  const [locations, setLocations] = useState<MasterLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(REGIONS));

  // Modal state (admin only)
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterLocation | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MasterLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await masterDataApi.list('locations');
      setLocations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Filter by search
  const filtered = locations.filter(loc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      loc.city.toLowerCase().includes(term) ||
      loc.state.toLowerCase().includes(term) ||
      (loc.region || '').toLowerCase().includes(term)
    );
  });

  // Group by region
  const grouped: Record<string, MasterLocation[]> = {};
  for (const region of REGIONS) {
    grouped[region] = filtered.filter(
      loc => (loc.region || '').toLowerCase() === region.toLowerCase()
    );
  }
  // Collect items with no region or unrecognized region
  const otherLocations = filtered.filter(
    loc => !loc.region || !REGIONS.some(r => r.toLowerCase() === (loc.region || '').toLowerCase())
  );
  if (otherLocations.length > 0) {
    grouped['Other'] = otherLocations;
  }

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  // Admin CRUD handlers
  const openCreate = (region?: string) => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, region: region || '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: MasterLocation) => {
    setEditingItem(item);
    setFormData({ city: item.city, state: item.state, region: item.region || '' });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city.trim()) { setFormError('City is required'); return; }
    if (!formData.state.trim()) { setFormError('State is required'); return; }
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        city: formData.city.trim(),
        state: formData.state.trim(),
        region: formData.region.trim() || null,
      };
      if (editingItem) {
        await masterDataApi.update('locations', editingItem.id, payload);
      } else {
        await masterDataApi.create('locations', payload);
      }
      closeModal();
      fetchLocations();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await masterDataApi.delete('locations', deleteTarget.id);
      setDeleteTarget(null);
      fetchLocations();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (item: MasterLocation) => {
    try {
      await masterDataApi.update('locations', item.id, { is_active: !item.isActive });
      fetchLocations();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const regionColors: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    North: isDark
      ? { bg: 'bg-blue-900/20', text: 'text-blue-400', icon: 'text-blue-400', border: 'border-blue-800/40' }
      : { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-blue-200' },
    South: isDark
      ? { bg: 'bg-emerald-900/20', text: 'text-emerald-400', icon: 'text-emerald-400', border: 'border-emerald-800/40' }
      : { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-emerald-200' },
    East: isDark
      ? { bg: 'bg-amber-900/20', text: 'text-amber-400', icon: 'text-amber-400', border: 'border-amber-800/40' }
      : { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', border: 'border-amber-200' },
    West: isDark
      ? { bg: 'bg-purple-900/20', text: 'text-purple-400', icon: 'text-purple-400', border: 'border-purple-800/40' }
      : { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600', border: 'border-purple-200' },
    Other: isDark
      ? { bg: 'bg-zinc-800/50', text: 'text-zinc-400', icon: 'text-zinc-400', border: 'border-zinc-700' }
      : { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'text-slate-500', border: 'border-slate-200' },
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Locations
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Browse locations by region
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        )}
      </div>

      {/* Search */}
      <div className={`${cardClass} p-4`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search by city, state, or region..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
              isDark
                ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
            } focus:outline-none focus:ring-1 focus:ring-brand-500`}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${cardClass} p-4 border-l-4 border-red-500`}>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading locations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${cardClass} flex flex-col items-center justify-center py-20`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
            <Globe className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {searchTerm ? 'No locations match your search' : 'No locations yet'}
          </p>
        </div>
      ) : (
        /* Region Cards */
        <div className="space-y-4">
          {Object.entries(grouped).map(([region, locs]) => {
            if (locs.length === 0) return null;
            const colors = regionColors[region] || regionColors.Other;
            const isExpanded = expandedRegions.has(region);
            const activeCount = locs.filter(l => l.isActive).length;

            return (
              <div key={region} className={`${cardClass} overflow-hidden`}>
                {/* Region Header */}
                <button
                  onClick={() => toggleRegion(region)}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                    isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                      <MapPin className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="text-left">
                      <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {region}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {locs.length} {locs.length === 1 ? 'city' : 'cities'} &middot; {activeCount} active
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin() && (
                      <span
                        onClick={e => { e.stopPropagation(); openCreate(region); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark ? 'text-zinc-500 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                        }`}
                        title={`Add city to ${region}`}
                      >
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronDown className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      : <ChevronRight className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    }
                  </div>
                </button>

                {/* City List */}
                {isExpanded && (
                  <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px ${isDark ? 'bg-zinc-800/50' : 'bg-slate-100'}">
                      {locs.map(loc => (
                        <div
                          key={loc.id}
                          className={`flex items-center justify-between px-5 py-3 ${
                            isDark ? 'bg-dark-200' : 'bg-white'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${
                                loc.isActive
                                  ? isDark ? 'text-white' : 'text-slate-900'
                                  : isDark ? 'text-zinc-600' : 'text-slate-400'
                              }`}>
                                {loc.city}
                              </span>
                              {!loc.isActive && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              {loc.state}
                            </p>
                          </div>
                          {isAdmin() && (
                            <div className="flex items-center gap-0.5 ml-2">
                              <button
                                onClick={() => toggleActive(loc)}
                                title={loc.isActive ? 'Deactivate' : 'Activate'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'text-zinc-500 hover:text-amber-400 hover:bg-amber-900/20' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                              >
                                {loc.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => openEdit(loc)}
                                title="Edit"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'text-zinc-500 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(loc)}
                                title="Delete"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className={`relative w-full max-w-sm rounded-2xl border shadow-xl ${
            isDark ? 'bg-dark-200 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingItem ? 'Edit Location' : 'Add Location'}
              </h3>
              <button onClick={closeModal} className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                  isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div>
                <label className={labelClass}>City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  className={inputClass}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className={labelClass}>State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <select
                  value={formData.region}
                  onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select region</option>
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className={`relative w-full max-w-sm rounded-2xl border shadow-xl ${
            isDark ? 'bg-dark-200 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-red-900/20' : 'bg-red-50'
              }`}>
                <Trash2 className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Delete Location
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Are you sure you want to delete "{deleteTarget.city}, {deleteTarget.state}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
