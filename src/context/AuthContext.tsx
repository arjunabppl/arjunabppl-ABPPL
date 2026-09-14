import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, CompanySettings } from '../types/index';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  settings: CompanySettings | null;
  loading: boolean;
  login: (loginIdOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('abppl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load company settings:', err);
    }
  };

  const verifySession = async () => {
    const token = localStorage.getItem('abppl_token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('abppl_user');
      setLoading(false);
      return;
    }

    try {
      const res = await api.getCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('abppl_user', JSON.stringify(res.user));
        await fetchSettings();
      } else {
        throw new Error('Invalid session');
      }
    } catch {
      // Session invalid, user deactivated or deleted
      setUser(null);
      localStorage.removeItem('abppl_token');
      localStorage.removeItem('abppl_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = async (loginIdOrEmail: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(loginIdOrEmail, password);
      localStorage.setItem('abppl_token', res.token);
      localStorage.setItem('abppl_user', JSON.stringify(res.user));
      setUser(res.user);
      await fetchSettings();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem('abppl_token');
      localStorage.removeItem('abppl_user');
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has full permission
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        loading,
        login,
        logout,
        refreshSettings: fetchSettings,
        hasRole
      }}
    >
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
