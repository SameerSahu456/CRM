import React, { useState, useEffect, useMemo } from 'react';
import { User, Building2, Bell, Shield, Palette, Database, Users, CreditCard, Plug, Globe, Mail, Key, Smartphone, ChevronRight, ChevronLeft, Save, Upload, Check, Loader2, X, Plus, Trash2, Edit2, Download, FileSpreadsheet, FileText, AlertTriangle, UserCog } from 'lucide-react';
import { profilesApi, rolesApi, Profile, Role as ApiRole } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type SettingsTab = 'profile' | 'company' | 'users' | 'roles' | 'notifications' | 'security' | 'integrations' | 'billing' | 'customization' | 'data';

const settingsTabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'roles', label: 'Roles', icon: UserCog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'customization', label: 'Customization', icon: Palette },
  { id: 'data', label: 'Data', icon: Database },
];

const initialIntegrations = [
  { id: '1', name: 'Gmail', description: 'Connect your Gmail account', icon: '📧', connected: true },
  { id: '2', name: 'Slack', description: 'Get notifications in Slack', icon: '💬', connected: true },
  { id: '3', name: 'Zoom', description: 'Schedule video meetings', icon: '📹', connected: false },
  { id: '4', name: 'Calendly', description: 'Sync your calendar', icon: '📅', connected: false },
  { id: '5', name: 'Stripe', description: 'Process payments', icon: '💳', connected: true },
  { id: '6', name: 'Mailchimp', description: 'Email marketing automation', icon: '🐵', connected: false },
];

// Use Profile from API as User type, with additional fields for compatibility
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar: string;
  status: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
}

const defaultPermissions = [
  'view_dashboard',
  'view_leads',
  'create_leads',
  'edit_leads',
  'delete_leads',
  'view_deals',
  'create_deals',
  'edit_deals',
  'delete_deals',
  'view_contacts',
  'create_contacts',
  'edit_contacts',
  'delete_contacts',
  'view_accounts',
  'create_accounts',
  'edit_accounts',
  'delete_accounts',
  'view_reports',
  'export_data',
  'manage_users',
  'manage_settings',
];

const permissionGroups = {
  'Dashboard': ['view_dashboard'],
  'Leads': ['view_leads', 'create_leads', 'edit_leads', 'delete_leads'],
  'Deals': ['view_deals', 'create_deals', 'edit_deals', 'delete_deals'],
  'Contacts': ['view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts'],
  'Accounts': ['view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts'],
  'Reports & Data': ['view_reports', 'export_data'],
  'Administration': ['manage_users', 'manage_settings'],
};

const defaultRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Admin',
    description: 'Full access to all features and settings',
    permissions: [...defaultPermissions],
    color: 'purple',
  },
  {
    id: 'role-2',
    name: 'Sales Manager',
    description: 'Manage sales team and view reports',
    permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts', 'view_reports', 'export_data', 'manage_users'],
    color: 'blue',
  },
  {
    id: 'role-3',
    name: 'Sales Rep',
    description: 'Standard sales team member access',
    permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'edit_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts', 'create_accounts', 'edit_accounts'],
    color: 'green',
  },
  {
    id: 'role-4',
    name: 'Marketing',
    description: 'Access to leads and reporting',
    permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_contacts', 'view_accounts', 'view_reports'],
    color: 'orange',
  },
  {
    id: 'role-5',
    name: 'Support',
    description: 'View-only access with contact management',
    permissions: ['view_dashboard', 'view_leads', 'view_deals', 'view_contacts', 'edit_contacts', 'view_accounts'],
    color: 'teal',
  },
];

export const SettingsView: React.FC = () => {
  const { user: authUser, updateProfile: updateAuthProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Sales Rep',
  });

  // RBAC State
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Omit<Role, 'id'>>({
    name: '',
    description: '',
    permissions: [],
    color: 'blue',
  });
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Profile State - initialized from auth user
  const [profile, setProfile] = useState({
    firstName: authUser?.firstName || '',
    lastName: authUser?.lastName || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    role: authUser?.role || 'Sales Rep',
    timezone: 'America/New_York',
  });

  // Profile Avatar State
  const [profileAvatar, setProfileAvatar] = useState<string>(authUser?.avatar || '');

  // Load users and roles from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profiles
        setLoadingUsers(true);
        const profilesData = await profilesApi.getAll();
        const mappedUsers: User[] = profilesData.map(p => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          role: p.role,
          avatar: p.avatar,
          status: p.status,
          phone: p.phone,
          department: p.department,
        }));
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Failed to load profiles:', error);
      } finally {
        setLoadingUsers(false);
      }

      try {
        // Load roles
        setLoadingRoles(true);
        const rolesData = await rolesApi.getAll();
        if (rolesData && rolesData.length > 0) {
          setRoles(rolesData);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
        // Keep default roles if API fails
      } finally {
        setLoadingRoles(false);
      }
    };

    loadData();
  }, []);

  // Update profile state when auth user changes
  useEffect(() => {
    if (authUser) {
      setProfile({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        role: authUser.role || 'Sales Rep',
        timezone: 'America/New_York',
      });
      setProfileAvatar(authUser.avatar || '');
    }
  }, [authUser]);

  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;
    const query = userSearchQuery.toLowerCase();
    return users.filter(user =>
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [users, userSearchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearchQuery]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      // Create a preview URL and save to database
      const reader = new FileReader();
      reader.onloadend = async () => {
        const avatarData = reader.result as string;
        setProfileAvatar(avatarData);

        // Save avatar to database immediately
        try {
          await updateAuthProfile({ avatar: avatarData });
        } catch (error) {
          console.error('Failed to save avatar:', error);
          alert('Failed to save profile image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Company State
  const [company, setCompany] = useState({
    name: 'Comprint Technologies',
    website: 'https://comprint.com',
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
    try {
      // Save profile data to database
      await updateAuthProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatar: profileAvatar,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
    try {
      // Create user in Supabase
      const profileData = {
        id: `user-${Date.now()}`,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        avatar: `https://ui-avatars.com/api/?name=${newUser.firstName}+${newUser.lastName}&background=random`,
        status: 'Active',
        phone: '',
        department: '',
      };

      const created = await profilesApi.create(profileData);

      const invitedUser: User = {
        id: created.id || profileData.id,
        firstName: created.firstName || newUser.firstName,
        lastName: created.lastName || newUser.lastName,
        email: created.email || newUser.email,
        role: created.role || newUser.role,
        avatar: created.avatar || profileData.avatar,
        status: created.status || 'Active',
        isActive: true,
      };

      setUsers([...users, invitedUser]);
      setShowInviteModal(false);
      setNewUser({ firstName: '', lastName: '', email: '', role: 'Sales Rep' });
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.isActive ? 'Inactive' : 'Active';
    try {
      await profilesApi.update(userId, { status: newStatus });
      setUsers(users.map(u =>
        u.id === userId ? { ...u, isActive: !u.isActive, status: newStatus } : u
      ));
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  // Remove user
  const removeUser = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      try {
        await profilesApi.delete(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Failed to remove user:', error);
        alert('Failed to remove user. Please try again.');
      }
    }
  };

  // Role management handlers
  const handleCreateRole = async () => {
    if (!newRole.name) return;

    try {
      const roleData = {
        id: `role-${Date.now()}`,
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        color: newRole.color,
      };

      const created = await rolesApi.create(roleData);
      const role: Role = {
        id: created.id || roleData.id,
        name: created.name || newRole.name,
        description: created.description || newRole.description,
        permissions: created.permissions || newRole.permissions,
        color: created.color || newRole.color,
      };
      setRoles([...roles, role]);
      setShowRoleModal(false);
      setNewRole({ name: '', description: '', permissions: [], color: 'blue' });
    } catch (error) {
      console.error('Failed to create role:', error);
      alert('Failed to create role. Please try again.');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !newRole.name) return;

    try {
      await rolesApi.update(editingRole.id, newRole);
      setRoles(roles.map(r =>
        r.id === editingRole.id
          ? { ...r, ...newRole }
          : r
      ));
      setShowRoleModal(false);
      setEditingRole(null);
      setNewRole({ name: '', description: '', permissions: [], color: 'blue' });
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role. Please try again.');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Check if any users have this role
    const usersWithRole = users.filter(u => u.role === role.name);
    if (usersWithRole.length > 0) {
      alert(`Cannot delete this role. ${usersWithRole.length} user(s) are assigned to it.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      try {
        await rolesApi.delete(roleId);
        setRoles(roles.filter(r => r.id !== roleId));
      } catch (error) {
        console.error('Failed to delete role:', error);
        alert('Failed to delete role. Please try again.');
      }
    }
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      color: role.color,
    });
    setShowRoleModal(true);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setNewRole({ name: '', description: '', permissions: [], color: 'blue' });
    setShowRoleModal(true);
  };

  const togglePermission = (permission: string) => {
    if (newRole.permissions.includes(permission)) {
      setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== permission) });
    } else {
      setNewRole({ ...newRole, permissions: [...newRole.permissions, permission] });
    }
  };

  const toggleAllGroupPermissions = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every(p => newRole.permissions.includes(p));
    if (allSelected) {
      setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => !groupPermissions.includes(p)) });
    } else {
      const newPermissions = [...new Set([...newRole.permissions, ...groupPermissions])];
      setNewRole({ ...newRole, permissions: newPermissions });
    }
  };

  const openAssignRole = (userId: string) => {
    setSelectedUserId(userId);
    setShowAssignRoleModal(true);
  };

  const handleAssignRole = (roleName: string) => {
    if (!selectedUserId) return;
    setUsers(users.map(u =>
      u.id === selectedUserId ? { ...u, role: roleName } : u
    ));
    setShowAssignRoleModal(false);
    setSelectedUserId(null);
  };

  const getRoleColor = (roleName: string): string => {
    const role = roles.find(r => r.name === roleName);
    if (!role) return 'slate';
    return role.color;
  };

  const getRoleColorClasses = (color: string): string => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      teal: 'bg-teal-100 text-teal-700',
      red: 'bg-red-100 text-red-700',
      pink: 'bg-pink-100 text-pink-700',
      slate: 'bg-slate-100 text-slate-600',
    };
    return colorMap[color] || colorMap.slate;
  };

  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailModal(true);
  };

  const getUserPermissions = (roleName: string): string[] => {
    const role = roles.find(r => r.name === roleName);
    return role ? role.permissions : [];
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">Settings</h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden overflow-x-auto md:overflow-x-visible">
              <div className="flex md:flex-col min-w-max md:min-w-0">
              {settingsTabs
                .filter(tab => (tab.id !== 'users' && tab.id !== 'roles') || isAdmin())
                .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm transition-colors whitespace-nowrap md:w-full ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-600 font-medium md:border-l-4 md:border-brand-600 border-b-2 md:border-b-0 border-brand-600'
                      : 'text-slate-600 hover:bg-slate-50 md:border-l-4 md:border-transparent'
                  }`}
                >
                  <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
              </div>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Profile Settings</h2>

                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 mb-6 lg:mb-8 pb-6 lg:pb-8 border-b border-slate-100">
                    <div className="relative">
                      <img
                        src={profileAvatar}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700"
                      >
                        <Upload size={14} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
                      <p className="text-slate-500 text-sm">{profile.role}</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-brand-600 hover:text-brand-700 mt-2"
                      >
                        Change photo
                      </button>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF up to 5MB</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
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
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Company Settings</h2>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
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

                    <div className="pt-4 lg:pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Regional Settings</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
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

              {/* Users - Admin Only */}
              {activeTab === 'users' && isAdmin() && (
                <div className="p-4 lg:p-6">
                  {/* Header with Search and Invite */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-base lg:text-lg font-bold text-slate-900">Team Members</h2>
                      <p className="text-sm text-slate-500 mt-1">Manage your team and assign roles ({filteredUsers.length} users)</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                    >
                      <Plus size={16} /> Invite User
                    </button>
                  </div>

                  {/* Search and Per Page Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Search users by name, email, or role..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                      <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Show:</span>
                      <select
                        value={usersPerPage}
                        onChange={(e) => {
                          setUsersPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-sm text-slate-500">per page</span>
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="space-y-3 lg:space-y-4 mb-6">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-brand-600" />
                        <span className="ml-2 text-slate-500">Loading users...</span>
                      </div>
                    ) : paginatedUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">
                          {userSearchQuery ? 'No users match your search criteria' : 'No users found'}
                        </p>
                      </div>
                    ) : (
                      paginatedUsers.map((user) => (
                        <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-xl group gap-3 hover:bg-slate-100 transition-colors">
                          <button
                            onClick={() => openUserDetail(user)}
                            className="flex items-center gap-3 lg:gap-4 text-left"
                          >
                            <img
                              src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                            />
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm lg:text-base hover:text-brand-600">{user.firstName} {user.lastName}</h4>
                              <p className="text-xs lg:text-sm text-slate-500">{user.email}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-2 lg:gap-4 ml-11 sm:ml-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); openAssignRole(user.id); }}
                              className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${getRoleColorClasses(getRoleColor(user.role))}`}
                              title="Click to change role"
                            >
                              {user.role}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleUserStatus(user.id); }}
                              className={`px-2 py-1 text-xs rounded cursor-pointer hover:opacity-80 ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {user.status === 'Active' ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeUser(user.id); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="text-sm text-slate-500">
                        Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="First page"
                        >
                          <ChevronLeft size={16} />
                          <ChevronLeft size={16} className="-ml-3" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Previous page"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-brand-600 text-white'
                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Next page"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          <ChevronRight size={16} />
                          <ChevronRight size={16} className="-ml-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Roles - Admin Only */}
              {activeTab === 'roles' && isAdmin() && (
                <div className="p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-base lg:text-lg font-bold text-slate-900">Roles & Permissions</h2>
                      <p className="text-sm text-slate-500 mt-1">Manage access roles and their permissions ({roles.length} roles)</p>
                    </div>
                    <button
                      onClick={openCreateRole}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                    >
                      <Plus size={16} /> Add Role
                    </button>
                  </div>

                  {loadingRoles ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-brand-600" />
                      <span className="ml-2 text-slate-500">Loading roles...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roles.map((role) => (
                        <div key={role.id} className="p-4 border border-slate-200 rounded-xl hover:border-brand-300 transition-colors group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${getRoleColorClasses(role.color).replace('text-', 'bg-').split(' ')[0]}`}></span>
                              <h4 className="font-medium text-slate-900">{role.name}</h4>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditRole(role)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{role.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{role.permissions.length} permissions</span>
                            <span className="text-xs text-slate-400">{users.filter(u => u.role === role.name).length} users</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Notification Preferences</h2>

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
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Security Settings</h2>

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
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Integrations</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
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
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Billing & Subscription</h2>

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
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Customization</h2>

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

              {/* Data Management */}
              {activeTab === 'data' && (
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Data Management</h2>

                  {/* Import Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Import Data</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { name: 'Leads', description: 'Import leads from CSV', icon: Users },
                        { name: 'Contacts', description: 'Import contacts from CSV', icon: User },
                        { name: 'Accounts', description: 'Import accounts from CSV', icon: Building2 },
                        { name: 'Deals', description: 'Import deals from CSV', icon: FileSpreadsheet },
                      ].map((item) => (
                        <div key={item.name} className="p-4 border border-dashed border-slate-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-brand-100 flex items-center justify-center text-slate-600 group-hover:text-brand-600 transition-colors">
                              <item.icon size={20} />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{item.name}</h4>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center p-4 border border-slate-200 rounded-lg bg-slate-50 group-hover:bg-white">
                            <div className="text-center">
                              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                              <p className="text-xs text-slate-500">Drop CSV file or click to browse</p>
                            </div>
                          </div>
                          <a href="#" className="text-xs text-brand-600 hover:text-brand-700 mt-3 inline-flex items-center gap-1">
                            <Download size={12} /> Download template
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Section */}
                  <div className="mb-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Export Data</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { name: 'Leads', count: '156 records', icon: Users },
                        { name: 'Contacts', count: '423 records', icon: User },
                        { name: 'Accounts', count: '89 records', icon: Building2 },
                        { name: 'Deals', count: '67 records', icon: FileSpreadsheet },
                      ].map((item) => (
                        <button key={item.name} className="p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:bg-slate-50 transition-all text-left group">
                          <div className="flex items-center justify-between mb-2">
                            <item.icon size={20} className="text-slate-600" />
                            <Download size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
                          </div>
                          <h4 className="font-medium text-slate-900">{item.name}</h4>
                          <p className="text-xs text-slate-500">{item.count}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                        <Download size={16} /> Export All (CSV)
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                        <FileText size={16} /> Export All (JSON)
                      </button>
                    </div>
                  </div>

                  {/* Data Backup Section */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Data Backup</h3>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <Check size={24} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">Automatic Backups Enabled</h4>
                          <p className="text-sm text-slate-500 mt-1">Your data is automatically backed up daily. Last backup: Today at 3:00 AM</p>
                          <div className="flex items-center gap-4 mt-4">
                            <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">Create Manual Backup</button>
                            <button className="text-sm text-slate-600 hover:text-slate-700">View Backup History</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} /> Danger Zone
                    </h3>
                    <div className="p-4 border border-red-200 rounded-xl bg-red-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">Delete All Data</h4>
                          <p className="text-sm text-slate-500">Permanently delete all CRM data. This action cannot be undone.</p>
                        </div>
                        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                          Delete All Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
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

      {/* Role Modal - Create/Edit */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowRoleModal(false); setEditingRole(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                <p className="text-sm text-slate-500 mt-1">{editingRole ? 'Modify role settings and permissions' : 'Define a new role with custom permissions'}</p>
              </div>
              <button onClick={() => { setShowRoleModal(false); setEditingRole(null); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., Account Manager"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <select
                    value={newRole.color}
                    onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="teal">Teal</option>
                    <option value="red">Red</option>
                    <option value="pink">Pink</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Brief description of this role"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">Permissions</label>
                <div className="space-y-4">
                  {Object.entries(permissionGroups).map(([group, permissions]) => (
                    <div key={group} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-800">{group}</h4>
                        <button
                          type="button"
                          onClick={() => toggleAllGroupPermissions(permissions)}
                          className="text-xs text-brand-600 hover:text-brand-700"
                        >
                          {permissions.every(p => newRole.permissions.includes(p)) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {permissions.map((permission) => (
                          <label key={permission} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newRole.permissions.includes(permission)}
                              onChange={() => togglePermission(permission)}
                              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-slate-600 capitalize">
                              {permission.replace(/_/g, ' ').replace('view ', '').replace('create ', 'Create ').replace('edit ', 'Edit ').replace('delete ', 'Delete ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-between">
              <span className="text-sm text-slate-500">{newRole.permissions.length} permissions selected</span>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  disabled={!newRole.name}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  <Save size={16} /> {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignRoleModal && selectedUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowAssignRoleModal(false); setSelectedUserId(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assign Role</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select a role for {users.find(u => u.id === selectedUserId)?.firstName} {users.find(u => u.id === selectedUserId)?.lastName}
                </p>
              </div>
              <button onClick={() => { setShowAssignRoleModal(false); setSelectedUserId(null); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-2">
              {roles.map((role) => {
                const currentUserRole = users.find(u => u.id === selectedUserId)?.role;
                const isSelected = currentUserRole === role.name;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleAssignRole(role.name)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors text-left ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${getRoleColorClasses(role.color).replace('text-', 'bg-').split(' ')[0]}`}></span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900">{role.name}</h4>
                        {isSelected && <Check size={16} className="text-brand-600" />}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                      <p className="text-xs text-slate-400 mt-2">{role.permissions.length} permissions</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowUserDetailModal(false); setSelectedUser(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar}
                  alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => { setShowUserDetailModal(false); setSelectedUser(null); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Role</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleColorClasses(getRoleColor(selectedUser.role))}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">First Name</p>
                    <p className="text-sm font-medium text-slate-800">{selectedUser.firstName}</p>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Last Name</p>
                    <p className="text-sm font-medium text-slate-800">{selectedUser.lastName}</p>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Email Address</p>
                    <p className="text-sm font-medium text-slate-800">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Permissions ({getUserPermissions(selectedUser.role).length})</h3>
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {getUserPermissions(selectedUser.role).map((permission) => (
                      <div key={permission} className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        <span className="text-sm text-slate-600 capitalize">
                          {permission.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {getUserPermissions(selectedUser.role).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No permissions assigned</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-between">
              <button
                onClick={() => {
                  setShowUserDetailModal(false);
                  setSelectedUser(null);
                  openAssignRole(selectedUser.id);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Change Role
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    toggleUserStatus(selectedUser.id);
                    setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedUser.isActive
                      ? 'border border-red-200 text-red-600 hover:bg-red-50'
                      : 'border border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {selectedUser.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => { setShowUserDetailModal(false); setSelectedUser(null); }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
