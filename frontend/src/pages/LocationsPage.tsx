import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, ChevronDown, ChevronRight, Search, Plus, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { masterDataApi } from '@/services/api';
import { MasterLocation } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

const REGIONS = ['North', 'South', 'East', 'West'];

interface LocationFormData {
  city: string;
  state: string;
  region: string;
}

const EMPTY_FORM: LocationFormData = { city: '', state: '', region: '' };

export const LocationsPage: React.FC = () => {
  const { isAdmin } = useAuth();

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
    North: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/40' },
    South: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40' },
    East: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40' },
    West: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/40' },
    Other: { bg: 'bg-slate-50 dark:bg-zinc-800/50', text: 'text-slate-600 dark:text-zinc-400', icon: 'text-slate-500 dark:text-zinc-400', border: 'border-slate-200 dark:border-zinc-700' },
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Locations
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-zinc-400">
            Browse locations by region
          </p>
        </div>
        {isAdmin() && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => openCreate()}
            shine
          >
            Add Location
          </Button>
        )}
      </div>

      {/* Search */}
      <Card glass padding="sm">
        <Input
          placeholder="Search by city, state, or region..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" icon={<AlertCircle className="w-5 h-5" />}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">Loading locations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card glass>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-slate-100 dark:bg-zinc-800">
              <Globe className="w-7 h-7 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              {searchTerm ? 'No locations match your search' : 'No locations yet'}
            </p>
          </div>
        </Card>
      ) : (
        /* Region Cards */
        <div className="space-y-4">
          {Object.entries(grouped).map(([region, locs]) => {
            if (locs.length === 0) return null;
            const colors = regionColors[region] || regionColors.Other;
            const isExpanded = expandedRegions.has(region);
            const activeCount = locs.filter(l => l.isActive).length;

            return (
              <Card key={region} glass padding="none" className="overflow-hidden">
                {/* Region Header */}
                <button
                  onClick={() => toggleRegion(region)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                      <MapPin className={cx('w-5 h-5', colors.icon)} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {region}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        {locs.length} {locs.length === 1 ? 'city' : 'cities'} &middot; {activeCount} active
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin() && (
                      <span
                        onClick={e => { e.stopPropagation(); openCreate(region); }}
                        className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-500 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                        title={`Add city to ${region}`}
                      >
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronDown className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                      : <ChevronRight className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                    }
                  </div>
                </button>

                {/* City List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 dark:bg-zinc-800/50">
                      {locs.map(loc => (
                        <div
                          key={loc.id}
                          className="flex items-center justify-between px-5 py-3 bg-white dark:bg-dark-200"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cx(
                                'font-medium text-sm',
                                loc.isActive
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400 dark:text-zinc-600'
                              )}>
                                {loc.city}
                              </span>
                              {!loc.isActive && (
                                <Badge variant="gray" size="sm">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-zinc-500">
                              {loc.state}
                            </p>
                          </div>
                          {isAdmin() && (
                            <div className="flex items-center gap-0.5 ml-2">
                              <button
                                onClick={() => toggleActive(loc)}
                                title={loc.isActive ? 'Deactivate' : 'Activate'}
                                className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-500 dark:hover:text-amber-400 dark:hover:bg-amber-900/20"
                              >
                                {loc.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => openEdit(loc)}
                                title="Edit"
                                className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-500 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(loc)}
                                title="Delete"
                                className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Location' : 'Add Location'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit()}
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}
          <Input
            label="City *"
            value={formData.city}
            onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter city"
            autoFocus
            required
          />
          <Input
            label="State *"
            value={formData.state}
            onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
            placeholder="Enter state"
            required
          />
          <Select
            label="Region"
            value={formData.region}
            onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
          >
            <option value="">Select region</option>
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              Delete
            </Button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50 dark:bg-red-900/20">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
            Delete Location
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Are you sure you want to delete "{deleteTarget?.city}, {deleteTarget?.state}"? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};
