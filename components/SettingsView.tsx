import React, { useState } from 'react';
import { User, Building2, Bell, Shield, Palette, Database, Users, CreditCard, Plug, Globe, Mail, Key, Smartphone, ChevronRight, Save, Upload, Check, Loader2, X, Plus, Trash2, Edit2 } from 'lucide-react';
import { mockUsers } from '../data/mockData';

type SettingsTab = 'profile' | 'company' | 'users' | 'notifications' | 'security' | 'integrations' | 'billing' | 'customization';

const settingsTabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'users', label: 'Users & Teams', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'customization', label: 'Customization', icon: Palette },
];

const initialIntegrations = [
  { id: '1', name: 'Gmail', description: 'Connect your Gmail account', icon: '📧', connected: true },
  { id: '2', name: 'Slack', description: 'Get notifications in Slack', icon: '💬', connected: true },
  { id: '3', name: 'Zoom', description: 'Schedule video meetings', icon: '📹', connected: false },
  { id: '4', name: 'Calendly', description: 'Sync your calendar', icon: '📅', connected: false },
  { id: '5', name: 'Stripe', description: 'Process payments', icon: '💳', connected: true },
  { id: '6', name: 'Mailchimp', description: 'Email marketing automation', icon: '🐵', connected: false },
];

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar: string;
  isActive: boolean;
}

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers as User[]);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Sales Rep',
  });

  // Profile State
  const [profile, setProfile] = useState({
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.jenkins@zenith.com',
    phone: '+1 555-0123',
    role: 'Sales Manager',
    timezone: 'America/New_York',
  });

  // Company State
  const [company, setCompany] = useState({
    name: 'Zenith Technologies',
    website: 'https://zenith.com',
    industry: 'Technology',
    size: '51-200 employees',
    address: '123 Tech Street, San Francisco, CA 94105',
    currency: 'USD ($)',
    dateFormat: 'MM/DD/YYYY',
    fiscalYearStart: 'January',
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    dealUpdates: true,
    taskReminders: true,
    newLeadAlerts: false,
    weeklyDigest: true,
    marketingUpdates: false,
  });

  // Integrations State
  const [integrations, setIntegrations] = useState(initialIntegrations);

  // Customization State
  const [dealStages, setDealStages] = useState([
    { name: 'Qualification', probability: 20 },
    { name: 'Discovery', probability: 40 },
    { name: 'Proposal', probability: 60 },
    { name: 'Negotiation', probability: 80 },
    { name: 'Closed Won', probability: 100 },
    { name: 'Closed Lost', probability: 0 },
  ]);

  const [leadSources, setLeadSources] = useState([
    'Website', 'Referral', 'LinkedIn', 'Cold Call', 'Trade Show', 'Advertisement', 'Other'
  ]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Toggle integration
  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(int =>
      int.id === id ? { ...int, connected: !int.connected } : int
    ));
  };

  // Toggle notification
  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  // Invite user handler
  const handleInviteUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email) return;

    setInviting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const invitedUser: User = {
      id: `user-${Date.now()}`,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      avatar: `https://ui-avatars.com/api/?name=${newUser.firstName}+${newUser.lastName}&background=random`,
      isActive: true,
    };

    setUsers([...users, invitedUser]);
    setInviting(false);
    setShowInviteModal(false);
    setNewUser({ firstName: '', lastName: '', email: '', role: 'Sales Rep' });
  };

  // Toggle user active status
  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };

  // Remove user
  const removeUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 font-display">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-600 font-medium border-l-4 border-brand-600'
                      : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Settings</h2>

                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                    <div className="relative">
                      <img
                        src="https://randomuser.me/api/portraits/women/1.jpg"
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700">
                        <Upload size={14} />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
                      <p className="text-slate-500">{profile.role}</p>
                      <button className="text-sm text-brand-600 hover:text-brand-700 mt-2">Change photo</button>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                      <select
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option>Sales Manager</option>
                        <option>Sales Rep</option>
                        <option>Marketing</option>
                        <option>Support</option>
                        <option>Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    {saveSuccess && (
                      <span className="flex items-center gap-2 text-green-600 text-sm">
                        <Check size={16} /> Changes saved successfully
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Company Settings */}
              {activeTab === 'company' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Company Settings</h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                        <input
                          type="text"
                          value={company.name}
                          onChange={(e) => setCompany({ ...company, name: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={company.website}
                          onChange={(e) => setCompany({ ...company, website: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                        <select
                          value={company.industry}
                          onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option>Technology</option>
                          <option>Finance</option>
                          <option>Healthcare</option>
                          <option>Manufacturing</option>
                          <option>Retail</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Size</label>
                        <select
                          value={company.size}
                          onChange={(e) => setCompany({ ...company, size: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option>1-10 employees</option>
                          <option>11-50 employees</option>
                          <option>51-200 employees</option>
                          <option>201-500 employees</option>
                          <option>500+ employees</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                      <textarea
                        value={company.address}
                        onChange={(e) => setCompany({ ...company, address: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Regional Settings</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                          <select
                            value={company.currency}
                            onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                            <option>GBP (£)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Date Format</label>
                          <select
                            value={company.dateFormat}
                            onChange={(e) => setCompany({ ...company, dateFormat: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Fiscal Year Start</label>
                          <select
                            value={company.fiscalYearStart}
                            onChange={(e) => setCompany({ ...company, fiscalYearStart: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option>January</option>
                            <option>April</option>
                            <option>July</option>
                            <option>October</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    {saveSuccess && (
                      <span className="flex items-center gap-2 text-green-600 text-sm">
                        <Check size={16} /> Changes saved successfully
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Users & Teams */}
              {activeTab === 'users' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Users & Teams</h2>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                    >
                      <Plus size={16} /> Invite User
                    </button>
                  </div>

                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-medium text-slate-900">{user.firstName} {user.lastName}</h4>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'Sales Manager' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {user.role}
                          </span>
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`px-2 py-1 text-xs rounded cursor-pointer hover:opacity-80 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => removeUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    {[
                      { key: 'emailNotifications' as const, label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                      { key: 'dealUpdates' as const, label: 'Deal Updates', description: 'Get notified when deals are updated' },
                      { key: 'taskReminders' as const, label: 'Task Reminders', description: 'Receive reminders for upcoming tasks' },
                      { key: 'newLeadAlerts' as const, label: 'New Lead Alerts', description: 'Get notified when new leads are assigned' },
                      { key: 'weeklyDigest' as const, label: 'Weekly Digest', description: 'Receive a weekly summary of your activity' },
                      { key: 'marketingUpdates' as const, label: 'Marketing Campaign Updates', description: 'Get notified about campaign performance' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                        <div>
                          <h4 className="font-medium text-slate-900">{item.label}</h4>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <button
                          onClick={() => toggleNotification(item.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications[item.key] ? 'bg-brand-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    {saveSuccess && (
                      <span className="flex items-center gap-2 text-green-600 text-sm">
                        <Check size={16} /> Changes saved successfully
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Security Settings</h2>

                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Key size={20} className="text-slate-600" />
                          <div>
                            <h4 className="font-medium text-slate-900">Change Password</h4>
                            <p className="text-sm text-slate-500">Update your account password</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white">
                          Update
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Smartphone size={20} className="text-slate-600" />
                          <div>
                            <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                            <p className="text-sm text-slate-500">Add an extra layer of security</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Enabled</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe size={20} className="text-slate-600" />
                          <div>
                            <h4 className="font-medium text-slate-900">Active Sessions</h4>
                            <p className="text-sm text-slate-500">Manage your active login sessions</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white">
                          View All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations */}
              {activeTab === 'integrations' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Integrations</h2>

                  <div className="grid grid-cols-2 gap-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="p-4 border border-slate-200 rounded-xl hover:border-brand-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{integration.icon}</span>
                            <div>
                              <h4 className="font-medium text-slate-900">{integration.name}</h4>
                              <p className="text-sm text-slate-500">{integration.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleIntegration(integration.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                              integration.connected
                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                            }`}
                          >
                            {integration.connected ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing */}
              {activeTab === 'billing' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Billing & Subscription</h2>

                  <div className="p-6 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl text-white mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-brand-200">Current Plan</p>
                        <h3 className="text-2xl font-bold">Professional</h3>
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm">$23/user/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-brand-200">5 users • Renews Jan 15, 2025</p>
                      <button className="px-4 py-2 bg-white text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50">
                        Upgrade Plan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
                    <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                          <CreditCard size={20} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-slate-500">Expires 12/2026</p>
                        </div>
                      </div>
                      <button className="text-sm text-brand-600 hover:text-brand-700">Update</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customization */}
              {activeTab === 'customization' && (
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Customization</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Deal Stages</h3>
                      <div className="space-y-2">
                        {dealStages.map((stage, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) => {
                                const updated = [...dealStages];
                                updated[index].name = e.target.value;
                                setDealStages(updated);
                              }}
                              className="text-sm text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0"
                            />
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={stage.probability}
                                  onChange={(e) => {
                                    const updated = [...dealStages];
                                    updated[index].probability = parseInt(e.target.value) || 0;
                                    setDealStages(updated);
                                  }}
                                  className="w-12 text-xs text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 text-center"
                                  min={0}
                                  max={100}
                                />
                                <span className="text-xs text-slate-500">%</span>
                              </div>
                              <button
                                onClick={() => setDealStages(dealStages.filter((_, i) => i !== index))}
                                className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setDealStages([...dealStages, { name: 'New Stage', probability: 50 }])}
                        className="mt-3 text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Stage
                      </button>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Sources</h3>
                      <div className="flex flex-wrap gap-2">
                        {leadSources.map((source, index) => (
                          <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-2 group">
                            {source}
                            <button
                              onClick={() => setLeadSources(leadSources.filter((_, i) => i !== index))}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            const newSource = prompt('Enter new lead source:');
                            if (newSource && !leadSources.includes(newSource)) {
                              setLeadSources([...leadSources, newSource]);
                            }
                          }}
                          className="px-3 py-1 border border-dashed border-slate-300 text-slate-500 rounded-full text-sm hover:border-brand-300 hover:text-brand-600 flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Source
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    {saveSuccess && (
                      <span className="flex items-center gap-2 text-green-600 text-sm">
                        <Check size={16} /> Changes saved successfully
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Invite User</h2>
                <p className="text-sm text-slate-500 mt-1">Add a new team member</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john.doe@company.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Sales Rep">Sales Rep</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Support">Support</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                disabled={inviting}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                disabled={inviting || !newUser.firstName || !newUser.lastName || !newUser.email}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {inviting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} /> Send Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
