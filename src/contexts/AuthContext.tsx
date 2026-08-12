import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginCredentials, LoginResponse } from '../types';
import { authApi } from '../services/api';
import { getToken, setToken, clearToken } from '../utils/session';

const isBackofficeRole = (role?: string): boolean =>
  role === 'admin' || role === 'superAdmin';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (getToken()) {
          const currentUser = await authApi.getCurrentUser();
          // Grant access only to admins. A non-admin may hold a valid shared session from the
          // main app — deny the backoffice UI, but do NOT clear the token or we'd log them out
          // of the main app too.
          if (isBackofficeRole(currentUser.role)) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // The session lives in a cookie shared across subdomains, so login/logout can happen in
  // another tab or app (e.g. the main app). Re-sync local React state when this tab regains
  // focus: adopt a session started elsewhere (admins only), or drop ours if it ended elsewhere.
  useEffect(() => {
    const sync = () => {
      const hasToken = !!getToken();
      if (hasToken && !user) {
        authApi
          .getCurrentUser()
          .then((u) => {
            if (isBackofficeRole(u.role)) setUser(u);
          })
          .catch(() => {});
      } else if (!hasToken && user) {
        setUser(null);
      }
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response: LoginResponse = await authApi.login(credentials);

    // Backoffice is admin/superAdmin only. Reject members without creating a shared session.
    if (!isBackofficeRole(response.user.role)) {
      throw new Error('This portal is for administrators only. Please use the main application.');
    }

    setToken(response.token);
    setUser(response.user);
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      // Server-side logout may fail (network/expired token); local state must still be cleared
      console.error('Logout error:', error);
    } finally {
      clearToken();
      setUser(null);
    }
  };

  const updateUser = (updatedUser: AuthUser): void => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
