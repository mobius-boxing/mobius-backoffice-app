import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser, LoginCredentials } from '../types';
import { authApi, refreshSession } from '../services/api';
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

  // Grant access only to superAdmin (see utils/rbac). Anyone else may hold a valid shared
  // session from the web app: deny the backoffice UI, but do NOT end the session or we'd
  // log them out of the web app too.
  const adoptSession = useCallback((session: { user: AuthUser }) => {
    if (canAccessBackoffice(session.user)) {
      setUser(session.user);
    } else {
      setAccessDenied(true);
    }
  }, []);

  // Bootstrap: the access token is memory-only, so every page load starts by trading the
  // HttpOnly refresh cookie for one. refreshSession retries throttling/network failures itself;
  // whatever still fails here leaves the user on the login page without touching the cookie.
  useEffect(() => {
    refreshSession()
      .then(adoptSession)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [adoptSession]);

  // The refresh cookie is shared across subdomains, so a login can happen in another tab or app
  // (e.g. the web app). A signed-out tab regaining focus tries to adopt it. The reverse (a
  // logout elsewhere) surfaces on this tab's next request, whose refresh 401s.
  useEffect(() => {
    const sync = () => {
      if (!user && !accessDenied) refreshSession().then(adoptSession).catch(() => {});
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [user, accessDenied, adoptSession]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response = await authApi.login(credentials);
    // The credentials are valid, so the shared session is created either way: a non-superAdmin
    // is sent on to the web app signed in. Only superAdmin gets a backoffice user.
    adoptSession(response);
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      // Server-side logout may fail (network/expired token); local state must still be cleared
      console.error('Logout error:', error);
    } finally {
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
