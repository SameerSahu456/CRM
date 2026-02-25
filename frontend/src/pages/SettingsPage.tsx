import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Save, Loader2, Lock, User as UserIcon, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, settingsApi } from '@/services/api';
import { Card, Input, Button, Badge, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

interface SettingItem {
  id: string;
  key: string;
  value: string;
  category?: string;
}

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

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

  const [settingError, setSettingError] = useState('');

  const handleSaveSetting = async (key: string, value: string) => {
    setSettingSaving(key);
    setSettingError('');
    try {
      await settingsApi.update(key, value);
    } catch (err: any) {
      setSettingError(err.message || `Failed to save setting "${key}"`);
      // Revert to server state on failure
      fetchSettings();
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
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-900/20">
            <UserIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Your account details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Name</p>
            <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">
              {user?.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Email</p>
            <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">
              {user?.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Role</p>
            <Badge variant="brand" size="md" className="mt-0.5">
              <Shield className="w-3 h-3" />
              {user?.role}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Department</p>
            <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">
              {user?.department || '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Change Password
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {passwordError && (
            <Alert variant="error" icon={<Lock className="w-4 h-4" />}>
              {passwordError}
            </Alert>
          )}
          {passwordSuccess && (
            <Alert variant="success" icon={<Lock className="w-4 h-4" />}>
              {passwordSuccess}
            </Alert>
          )}

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            loading={isChangingPassword}
            icon={<Lock className="w-4 h-4" />}
            shine
          >
            Change Password
          </Button>
        </form>
      </Card>

      {/* App Settings (admin only) */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Application Settings
              </h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                Manage system configuration
              </p>
            </div>
          </div>

          {settingError && <Alert variant="error" className="mb-4">{settingError}</Alert>}
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
            </div>
          ) : appSettings.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              No application settings configured yet.
            </p>
          ) : (
            <div className="space-y-4">
              {appSettings.map(setting => (
                <div key={setting.key} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label={setting.key}
                      value={setting.value || ''}
                      onChange={e => updateSettingValue(setting.key, e.target.value)}
                      hint={setting.category ? `(${setting.category})` : undefined}
                    />
                  </div>
                  <button
                    onClick={() => handleSaveSetting(setting.key, setting.value)}
                    disabled={settingSaving === setting.key}
                    className={cx(
                      'flex-shrink-0 p-2.5 rounded-xl transition-colors disabled:opacity-50',
                      'text-gray-400 hover:text-brand-600 hover:bg-brand-50',
                      'dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20'
                    )}
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
        </Card>
      )}
    </div>
  );
};
