import React, { useState, useEffect, useRef } from 'react';
import { Filter, Download, MoreVertical, Globe, MapPin, Building, ExternalLink, Plus, Search, X, Users, DollarSign, Loader2, AlertCircle, Phone, Mail, TrendingUp, Briefcase, Edit3, Trash2, PhoneCall } from 'lucide-react';
import { Account } from '../types';
import { accountsApi, dealsApi } from '../services/api';
import { useNavigation } from '../contexts/NavigationContext';
import { ViewToggle, ViewMode } from './ViewToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDetailView } from '../App';

const getHealthColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Mock account data for offline/development mode
const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Acme Corporation',
    industry: 'Technology',
    website: 'www.acmecorp.com',
    revenue: 5200000,
    employees: 250,
    location: 'San Francisco, CA',
    healthScore: 85,
    logo: '',
    type: 'Customer',
    status: 'Active',
    phone: '+1 (555) 123-4567',
    email: 'contact@acmecorp.com',
    description: 'Leading technology solutions provider',
    owner: 'Sarah Jenkins',
    accountOwner: 'Sarah Jenkins',
    createdBy: 'Sarah Jenkins',
    createdAt: '2024-06-15T10:00:00Z',
    gstinNo: '07AAAAA0000A1Z5',
    paymentTerms: 'Net 30',
  },
  {
    id: 'acc-2',
    name: 'TechStart Innovation',
    industry: 'Technology',
    website: 'www.techstart.io',
    revenue: 1800000,
    employees: 45,
    location: 'Austin, TX',
    healthScore: 72,
    logo: '',
    type: 'Prospect',
    status: 'Active',
    phone: '+1 (555) 234-5678',
    email: 'hello@techstart.io',
    description: 'Innovative startup focused on AI solutions',
    owner: 'Michael Chen',
    accountOwner: 'Michael Chen',
    createdBy: 'Michael Chen',
    createdAt: '2024-08-22T14:30:00Z',
    gstinNo: '',
    paymentTerms: 'Net 15',
  },
  {
    id: 'acc-3',
    name: 'Global Industries Ltd',
    industry: 'Manufacturing',
    website: 'www.globalindustries.com',
    revenue: 12500000,
    employees: 850,
    location: 'Mumbai, India',
    healthScore: 91,
    logo: '',
    type: 'Customer',
    status: 'Active',
    phone: '+91 22 2345 6789',
    email: 'info@globalindustries.com',
    description: 'Leading manufacturing company',
    owner: 'Sarah Jenkins',
    accountOwner: 'Sarah Jenkins',
    createdBy: 'Sarah Jenkins',
    createdAt: '2024-03-10T09:00:00Z',
    gstinNo: '27BBBBB0000B2Z6',
    paymentTerms: 'Net 45',
  },
  {
    id: 'acc-4',
    name: 'PrintMaster Solutions',
    industry: 'Printing',
    website: 'www.printmaster.in',
    revenue: 3200000,
    employees: 120,
    location: 'Delhi, India',
    healthScore: 68,
    logo: '',
    type: 'Customer',
    status: 'Active',
    phone: '+91 11 4567 8901',
    email: 'sales@printmaster.in',
    description: 'Commercial printing and packaging',
    owner: 'Emily Rodriguez',
    accountOwner: 'Emily Rodriguez',
    createdBy: 'Emily Rodriguez',
    createdAt: '2024-05-20T11:00:00Z',
    gstinNo: '07CCCCC0000C3Z7',
    paymentTerms: 'Net 30',
  },
  {
    id: 'acc-5',
    name: 'HealthFirst Medical',
    industry: 'Healthcare',
    website: 'www.healthfirstmed.com',
    revenue: 8700000,
    employees: 320,
    location: 'New York, NY',
    healthScore: 88,
    logo: '',
    type: 'Partner',
    status: 'Active',
    phone: '+1 (555) 345-6789',
    email: 'partnerships@healthfirstmed.com',
    description: 'Healthcare technology solutions',
    owner: 'Michael Chen',
    accountOwner: 'Michael Chen',
    createdBy: 'Michael Chen',
    createdAt: '2024-07-08T16:00:00Z',
    gstinNo: '',
    paymentTerms: 'Net 60',
  },
  {
    id: 'acc-6',
    name: 'RetailMax Stores',
    industry: 'Retail',
    website: 'www.retailmax.com',
    revenue: 25000000,
    employees: 1500,
    location: 'Chicago, IL',
    healthScore: 78,
    logo: '',
    type: 'Customer',
    status: 'Active',
    phone: '+1 (555) 456-7890',
    email: 'business@retailmax.com',
    description: 'Retail chain with nationwide presence',
    owner: 'Sarah Jenkins',
    accountOwner: 'Sarah Jenkins',
    createdBy: 'Sarah Jenkins',
    createdAt: '2024-04-05T08:00:00Z',
    gstinNo: '',
    paymentTerms: 'Net 30',
  },
];

export const AccountsTable: React.FC = () => {
  const { canViewAllData, getUserFullName, user } = useAuth();
  const { theme } = useTheme();
  const { setSelectedAccountId } = useDetailView();
  const isDark = theme === 'dark';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    industry: '',
    paymentTerms: '',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [newAccount, setNewAccount] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    location: '',
    revenue: '',
    employees: '',
    gstinNo: '',
    paymentTerms: 'Net 30' as Account['paymentTerms'],
    type: 'Prospect' as Account['type'],
  });

  // Close action menu and filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuId(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.industry) return;

    setSaving(true);
    try {
      const createdAccount = await accountsApi.create({
        ...newAccount,
        revenue: parseFloat(newAccount.revenue) || 0,
        employees: parseInt(newAccount.employees) || 0,
        healthScore: 75,
        status: 'Active',
        owner: getUserFullName() || 'Unassigned',
        accountOwner: getUserFullName() || 'Unassigned',
        createdBy: getUserFullName() || 'Unknown',
        createdAt: new Date().toISOString(),
      });
      setAccounts([...accounts, createdAccount as Account]);
      setNewAccount({
        name: '',
        industry: '',
        website: '',
        phone: '',
        email: '',
        location: '',
        revenue: '',
        employees: '',
        gstinNo: '',
        paymentTerms: 'Net 30',
        type: 'Prospect',
      });
      setShowAddAccountModal(false);
    } catch (err) {
      console.error('Failed to create account:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        let fetchedData: Account[];

        try {
          const data = await accountsApi.getAll();
          fetchedData = data as Account[];
        } catch {
          // API unavailable, use mock data
          console.log('API unavailable, using mock account data');
          fetchedData = MOCK_ACCOUNTS;
        }

        let filteredData = fetchedData;

        // Filter by owner if user cannot view all data
        if (!canViewAllData()) {
          const currentUserName = getUserFullName();
          filteredData = filteredData.filter(account => account.owner === currentUserName);
        }

        setAccounts(filteredData);
        setError(null); // Clear any previous errors
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [canViewAllData, getUserFullName]);

  const filteredAccounts = accounts.filter(account => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = filters.type === '' || account.type === filters.type;

    // Industry filter
    const matchesIndustry = filters.industry === '' || account.industry === filters.industry;

    // Payment Terms filter
    const matchesPaymentTerms = filters.paymentTerms === '' || account.paymentTerms === filters.paymentTerms;

    return matchesSearch && matchesType && matchesIndustry && matchesPaymentTerms;
  });

  // Get unique values for filter dropdowns
  const uniqueIndustries = [...new Set(accounts.map(a => a.industry).filter(Boolean))];
  const uniquePaymentTerms = [...new Set(accounts.map(a => a.paymentTerms).filter(Boolean))];

  const activeFilterCount = [filters.type, filters.industry, filters.paymentTerms].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ type: '', industry: '', paymentTerms: '' });
  };

  const handleViewAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await accountsApi.delete(accountId);
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 flex items-center justify-center min-h-[400px] ${isDark ? 'bg-zinc-950' : ''}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${isDark ? 'bg-zinc-950' : ''}`}>
        <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-300' : 'text-red-800'}`}>Failed to load accounts</h3>
          <p className={`mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 ${isDark ? 'bg-zinc-950' : ''}`}>
      <div className={`rounded-2xl shadow-soft border animate-fade-in-up ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        {/* Table Header Controls */}
        <div className={`p-4 lg:p-6 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3 lg:gap-4 animate-slide-in-left" style={{ animationDelay: '0.1s', opacity: 0 }}>
              <div>
                <h3 className={`text-lg lg:text-xl font-display font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Active Accounts</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Manage your enterprise relationships</p>
              </div>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
            <div className="flex gap-2 lg:gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 border rounded-lg text-sm transition-colors ${
                    activeFilterCount > 0
                      ? 'border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400'
                      : isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Filter size={16} />
                  <span className="hidden lg:inline">Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-brand-600 text-white rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown */}
                {showFilters && (
                  <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border z-50 animate-scale-in ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`p-4 border-b ${isDark ? 'border-zinc-700' : 'border-slate-100'}`}>
                      <div className="flex justify-between items-center">
                        <h4 className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Filters</h4>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Type Filter */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                          Account Type
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="">All Types</option>
                          <option value="Customer">Customer</option>
                          <option value="Prospect">Prospect</option>
                          <option value="Partner">Partner</option>
                        </select>
                      </div>

                      {/* Industry Filter */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                          Industry
                        </label>
                        <select
                          value={filters.industry}
                          onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="">All Industries</option>
                          {uniqueIndustries.map((industry) => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                      </div>

                      {/* Payment Terms Filter */}
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                          Payment Terms
                        </label>
                        <select
                          value={filters.paymentTerms}
                          onChange={(e) => setFilters({ ...filters, paymentTerms: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="">All Payment Terms</option>
                          {uniquePaymentTerms.map((term) => (
                            <option key={term} value={term}>{term}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={`p-4 border-t ${isDark ? 'border-zinc-700' : 'border-slate-100'}`}>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button className={`hidden sm:flex items-center justify-center gap-2 px-3 lg:px-4 py-2 border rounded-lg text-sm transition-colors ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-900 text-white border-transparent hover:bg-slate-800'
              }`}>
                <Download size={16} /> <span className="hidden lg:inline">Export</span>
              </button>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-all duration-300 shadow-glow flex-1 sm:flex-none hover:scale-105 hover:shadow-lg ripple animate-slide-in-right"
                style={{ animationDelay: '0.2s', opacity: 0 }}
              >
                <Plus size={16} className="transition-transform group-hover:rotate-90" /> Add Account
              </button>
            </div>
          </div>
        </div>

        {/* Table or Kanban View */}
        {viewMode === 'list' ? (
        <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'bg-zinc-800/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
              <tr>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Account Name</th>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Phone</th>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Email</th>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>GSTIN</th>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Account Owner</th>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Payment Terms</th>
                <th className={`px-4 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Created By</th>
                <th className={`px-4 py-4 text-right text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building className={`w-12 h-12 mb-4 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
                      <h4 className={`text-lg font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        No accounts found
                      </h4>
                      <p className={`text-sm mb-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {activeFilterCount > 0 || searchQuery
                          ? 'Try adjusting your search or filters'
                          : 'Create your first account to get started'}
                      </p>
                      {(activeFilterCount > 0 || searchQuery) && (
                        <button
                          onClick={() => { clearFilters(); setSearchQuery(''); }}
                          className="px-4 py-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className={`transition-colors group cursor-pointer ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-brand-50/30'}`}
                  onClick={() => handleViewAccount(account.id)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border overflow-hidden ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-200'}`}>
                        {account.logo ? (
                          <img src={account.logo} alt={account.name} className="w-full h-full object-cover opacity-90" />
                        ) : (
                          <Building className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-bold font-display flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {account.name}
                          {account.website && (
                            <a href={`https://${account.website}`} target="_blank" rel="noreferrer" className={`${isDark ? 'text-zinc-600 hover:text-brand-400' : 'text-slate-300 hover:text-brand-600'} transition-colors`} onClick={(e) => e.stopPropagation()}>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            account.type === 'Customer' ? 'bg-green-500/20 text-green-400' :
                            account.type === 'Prospect' ? 'bg-blue-500/20 text-blue-400' :
                            isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {account.type}
                          </span>
                          <span className="mx-1">•</span>
                          {account.industry}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.phone || <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.email || account.contactEmail || <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm font-mono ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.gstinNo || <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.accountOwner || account.owner}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {account.paymentTerms || 'Net 30'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {account.createdBy || <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative" ref={actionMenuId === account.id ? menuRef : null} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActionMenuId(actionMenuId === account.id ? null : account.id)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-brand-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {actionMenuId === account.id && (
                        <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl border py-1 z-50 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200'}`}>
                          <button
                            onClick={() => { handleViewAccount(account.id); setActionMenuId(null); }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <Building size={14} /> View Details
                          </button>
                          <button
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                            <Mail size={14} /> Send Email
                          </button>
                          <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                            <PhoneCall size={14} /> Log Call
                          </button>
                          <div className={`my-1 border-t ${isDark ? 'border-zinc-700' : 'border-slate-100'}`} />
                          <button
                            onClick={() => { handleDeleteAccount(account.id); setActionMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800 bg-zinc-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
          <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            Showing <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>1-{filteredAccounts.length}</span> of <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>{filteredAccounts.length}</span> accounts
          </span>
          <div className="flex gap-2">
            <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-brand-500 hover:text-brand-400' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'}`}>Previous</button>
            <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-brand-500 hover:text-brand-400' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'}`}>Next</button>
          </div>
        </div>
        </>
        ) : (
          /* Kanban View - Grouped by Type */
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="flex gap-3 md:gap-4 lg:gap-6 pb-4 min-w-max">
              {['Customer', 'Prospect', 'Partner', 'Other'].map((type) => {
                const typeAccounts = filteredAccounts.filter(a => type === 'Other' ? !['Customer', 'Prospect', 'Partner'].includes(a.type || '') : a.type === type);
                return (
                  <div key={type} className="w-[260px] md:w-[280px] lg:w-[300px] flex-shrink-0">
                    <div className={`p-4 rounded-t-xl border-t-4 ${
                      type === 'Customer' ? 'border-green-500' :
                      type === 'Prospect' ? 'border-blue-500' :
                      type === 'Partner' ? 'border-purple-500' :
                      'border-slate-500'
                    } ${isDark ? 'bg-zinc-800 border-x border-b border-zinc-700' : 'bg-white border-x border-b border-slate-200'} shadow-sm mb-3`}>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`font-brand font-bold uppercase tracking-wide text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{type}s</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>{typeAccounts.length}</span>
                      </div>
                      <div className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        ${(typeAccounts.reduce((sum, a) => sum + a.revenue, 0) / 1000000).toFixed(1)}M total revenue
                      </div>
                    </div>
                    <div className="space-y-3">
                      {typeAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`p-4 rounded-xl border shadow-soft transition-all cursor-pointer ${
                            isDark ? 'bg-zinc-800 border-zinc-700 hover:border-brand-500 hover:shadow-md' : 'bg-white border-slate-200 hover:shadow-md hover:border-brand-300'
                          }`}
                          onClick={() => handleViewAccount(account.id)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border overflow-hidden ${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-slate-100 border-slate-200'}`}>
                              {account.logo ? (
                                <img src={account.logo} alt={account.name} className="w-full h-full object-cover" />
                              ) : (
                                <Building className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                              )}
                            </div>
                            <div>
                              <h5 className={`font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{account.name}</h5>
                              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{account.industry}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                <MapPin size={10} /> {account.location}
                              </span>
                              <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>${(account.revenue / 1000000).toFixed(1)}M</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}>
                                <div
                                  className={`h-full rounded-full ${getHealthColor(account.healthScore)}`}
                                  style={{ width: `${account.healthScore}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{account.healthScore}%</span>
                            </div>
                            {account.gstinNo && (
                              <div className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                GSTIN: {account.gstinNo}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowAddAccountModal(true)}
                        className={`w-full py-2 border-2 border-dashed rounded-xl font-medium text-sm transition-all ${
                          isDark ? 'border-zinc-700 text-zinc-500 hover:border-brand-500 hover:text-brand-400 hover:bg-brand-500/10' : 'border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50'
                        }`}
                      >
                        + Add Account
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-backdrop" onClick={() => setShowAddAccountModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>New Account</h2>
              <button onClick={() => setShowAddAccountModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Account Name *</label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Industry *</label>
                  <select
                    value={newAccount.industry}
                    onChange={(e) => setNewAccount({ ...newAccount, industry: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Printing">Printing</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Type</label>
                  <select
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as Account['type'] })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Customer">Customer</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Phone</label>
                  <input
                    type="tel"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Email</label>
                  <input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Website</label>
                  <input
                    type="text"
                    value={newAccount.website}
                    onChange={(e) => setNewAccount({ ...newAccount, website: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="www.example.com"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>GSTIN No</label>
                  <input
                    type="text"
                    value={newAccount.gstinNo}
                    onChange={(e) => setNewAccount({ ...newAccount, gstinNo: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Payment Terms</label>
                  <select
                    value={newAccount.paymentTerms}
                    onChange={(e) => setNewAccount({ ...newAccount, paymentTerms: e.target.value as Account['paymentTerms'] })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Advance Payment">Advance Payment</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Location</label>
                  <input
                    type="text"
                    value={newAccount.location}
                    onChange={(e) => setNewAccount({ ...newAccount, location: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="Mumbai, India"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Annual Revenue</label>
                  <input
                    type="number"
                    value={newAccount.revenue}
                    onChange={(e) => setNewAccount({ ...newAccount, revenue: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Employees</label>
                  <input
                    type="number"
                    value={newAccount.employees}
                    onChange={(e) => setNewAccount({ ...newAccount, employees: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                    }`}
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={saving || !newAccount.name || !newAccount.industry}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
