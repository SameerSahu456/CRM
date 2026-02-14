import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Save, Loader2, AlertCircle, CheckCircle, Lock, User as UserIcon, Shield
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authApi, settingsApi } from '../services/api';

interface SettingItem {
  id: string;
  key: string;
  value: string;
  category?: string;
}

export const SettingsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const isDark = theme === 'dark';

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // App settings (admin only)
  const [appSettings, setAppSettings] = useState<SettingItem[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [settingSaving, setSettingSaving] = useState<string | null>(null);

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  const fetchSettings = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingSettings(true);
    try {
      const data = await settingsApi.list();
      setAppSettings(Array.isArray(data) ? data : []);
    } catch {
      // non-critical
    } finally {
      setIsLoadingSettings(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    setSettingSaving(key);
    try {
      await settingsApi.update(key, value);
    } catch {
      // ignore
    } finally {
      setSettingSaving(null);
    }
  };

  const updateSettingValue = (key: string, value: string) => {
    setAppSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up max-w-4xl">
      {/* Profile Info */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-brand-900/20' : 'bg-brand-50'
          }`}>
            <UserIcon className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          </div>
          <div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Profile Information
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Your account details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Name</p>
            <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user?.name}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Email</p>
            <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user?.email}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Role</p>
            <span className={`inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isDark ? 'bg-brand-900/20 text-brand-400' : 'bg-brand-50 text-brand-700'
            }`}>
              <Shield className="w-3 h-3" />
              {user?.role}
            </span>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Department</p>
            <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user?.department || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-amber-900/20' : 'bg-amber-50'
          }`}>
            <Lock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Change Password
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {passwordError && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-red-900/20 border border-red-800 text-red-400'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {passwordSuccess}
            </div>
          )}

          <div>
            <label className={labelClass}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* App Settings (admin only) */}
      {isAdmin && (
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-purple-900/20' : 'bg-purple-50'
            }`}>
              <Settings className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Application Settings
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Manage system configuration
              </p>
            </div>
          </div>

          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
            </div>
          ) : appSettings.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              No application settings configured yet.
            </p>
          ) : (
            <div className="space-y-4">
              {appSettings.map(setting => (
                <div key={setting.key} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className={labelClass}>
                      {setting.key}
                      {setting.category && (
                        <span className={`ml-2 text-xs ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>
                          ({setting.category})
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={setting.value || ''}
                      onChange={e => updateSettingValue(setting.key, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <button
                    onClick={() => handleSaveSetting(setting.key, setting.value)}
                    disabled={settingSaving === setting.key}
                    className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
                      isDark
                        ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                        : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                    } disabled:opacity-50`}
                    title="Save"
                  >
                    {settingSaving === setting.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
