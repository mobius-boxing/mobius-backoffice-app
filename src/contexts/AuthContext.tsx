import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginCredentials, LoginResponse } from '../types';
import { authApi } from '../services/api';
import { getToken, setToken, clearToken } from '../utils/session';
import { canAccessBackoffice } from '../utils/rbac';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** A valid session exists but belongs to someone the backoffice does not admit. */
  accessDenied: boolean;
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
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (getToken()) {
          const currentUser = await authApi.getCurrentUser();
          // Grant access only to superAdmin (see utils/rbac). Anyone else may hold a valid shared
          // session from the web app — deny the backoffice UI, but do NOT clear the token or we'd
          // log them out of the web app too.
          if (canAccessBackoffice(currentUser)) {
            setUser(currentUser);
          } else {
            setAccessDenied(true);
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
  // focus: adopt a session started elsewhere (backoffice-eligible only), or drop ours if it ended
  // elsewhere.
  useEffect(() => {
    const sync = () => {
      const hasToken = !!getToken();
      if (hasToken && !user && !accessDenied) {
        authApi
          .getCurrentUser()
          .then((u) => {
            if (canAccessBackoffice(u)) setUser(u);
            else setAccessDenied(true);
          })
          .catch(() => {});
      } else if (!hasToken && (user || accessDenied)) {
        setUser(null);
        setAccessDenied(false);
      }
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [user, accessDenied]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response: LoginResponse = await authApi.login(credentials);

    // The credentials are valid, so the shared session is created either way: a non-superAdmin
    // is sent on to the web app signed in. Only superAdmin gets a backoffice user.
    setToken(response.token);
    if (canAccessBackoffice(response.user)) {
      setUser(response.user);
    } else {
      setAccessDenied(true);
    }
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
      setAccessDenied(false);
    }
  };

  const updateUser = (updatedUser: AuthUser): void => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessDenied,
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
