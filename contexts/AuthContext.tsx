import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, profilesApi } from '../services/api';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  // Permission helpers
  isAdmin: () => boolean;
  isManager: () => boolean;
  canViewAllData: () => boolean;
  getUserFullName: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For demo purposes, we use a simple email/password check
// In production, this would use Supabase Auth
const DEMO_USERS: Record<string, { password: string; profileId: string }> = {
  'sarah.jenkins@comprint.com': { password: 'admin123', profileId: 'user-1' },
  'michael.chen@comprint.com': { password: 'manager123', profileId: 'user-2' },
  'emily.rodriguez@comprint.com': { password: 'sales123', profileId: 'user-3' },
  'david.kim@comprint.com': { password: 'support123', profileId: 'user-4' },
};

// Mock profiles for offline/development mode
const MOCK_PROFILES: Profile[] = [
  {
    id: 'user-1',
    email: 'sarah.jenkins@comprint.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    avatar: '',
    role: 'Admin',
    status: 'Active',
    phone: '+1 (555) 123-4567',
    department: 'Management',
  },
  {
    id: 'user-2',
    email: 'michael.chen@comprint.com',
    firstName: 'Michael',
    lastName: 'Chen',
    avatar: '',
    role: 'Sales Manager',
    status: 'Active',
    phone: '+1 (555) 234-5678',
    department: 'Sales',
  },
  {
    id: 'user-3',
    email: 'emily.rodriguez@comprint.com',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    avatar: '',
    role: 'Sales Rep',
    status: 'Active',
    phone: '+1 (555) 345-6789',
    department: 'Sales',
  },
  {
    id: 'user-4',
    email: 'david.kim@comprint.com',
    firstName: 'David',
    lastName: 'Kim',
    avatar: '',
    role: 'Support',
    status: 'Active',
    phone: '+1 (555) 456-7890',
    department: 'Support',
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('comprint-user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as Profile;
          // Verify user still exists and refresh data
          try {
            const profiles = await profilesApi.getAll();
            const currentUser = profiles.find(p => p.id === parsedUser.id);
            if (currentUser) {
              setUser(currentUser);
              localStorage.setItem('comprint-user', JSON.stringify(currentUser));
            } else {
              // User no longer exists, clear session
              localStorage.removeItem('comprint-user');
            }
          } catch {
            // API error, use cached user
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('comprint-user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Demo authentication check
      const demoUser = DEMO_USERS[email.toLowerCase()];
      if (!demoUser) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (demoUser.password !== password) {
        return { success: false, error: 'Invalid email or password' };
      }

      let profile: Profile | undefined;

      // Try to fetch user profile from API, fallback to mock data
      try {
        const profiles = await profilesApi.getAll();
        profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      } catch {
        // API unavailable, use mock profiles
        console.log('API unavailable, using mock profile data');
        profile = MOCK_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
      }

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      if (profile.status !== 'Active') {
        return { success: false, error: 'Your account has been deactivated. Please contact an administrator.' };
      }

      // Set user and persist
      setUser(profile);
      localStorage.setItem('comprint-user', JSON.stringify(profile));

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('comprint-user');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const updatedProfile = await profilesApi.update(user.id, updates);
      setUser(updatedProfile);
      localStorage.setItem('comprint-user', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Permission helpers
  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  const isManager = () => {
    return user?.role === 'Admin' || user?.role === 'Sales Manager';
  };

  const canViewAllData = () => {
    // Admins and Sales Managers can view all data
    return user?.role === 'Admin' || user?.role === 'Sales Manager';
  };

  const getUserFullName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signOut,
      updateProfile,
      isAdmin,
      isManager,
      canViewAllData,
      getUserFullName,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
