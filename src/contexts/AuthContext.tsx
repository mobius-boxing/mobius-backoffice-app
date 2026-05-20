import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginCredentials, LoginResponse } from '../types';
import { authApi } from '../services/api';

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
        const token = localStorage.getItem('backoffice_token');
        const savedUser = localStorage.getItem('backoffice_user');

        if (token && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Backoffice is admin/superAdmin only — members must not reach this app
          if (parsedUser.role === 'admin' || parsedUser.role === 'superAdmin') {
            const currentUser = await authApi.getCurrentUser();
            if (currentUser.role === 'admin' || currentUser.role === 'superAdmin') {
              setUser(currentUser);
            } else {
              localStorage.removeItem('backoffice_token');
              localStorage.removeItem('backoffice_user');
            }
          } else {
            localStorage.removeItem('backoffice_token');
            localStorage.removeItem('backoffice_user');
          }
        }
      } catch (error) {
        localStorage.removeItem('backoffice_token');
        localStorage.removeItem('backoffice_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response: LoginResponse = await authApi.login(credentials);

      // Backoffice is admin/superAdmin only — members must not reach this app
      if (response.user.role !== 'admin' && response.user.role !== 'superAdmin') {
        throw new Error('This portal is for administrators only. Please use the main application.');
      }

      localStorage.setItem('backoffice_token', response.token);
      localStorage.setItem('backoffice_user', JSON.stringify(response.user));

      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      // Server-side logout may fail (network/expired token); local state must still be cleared
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('backoffice_token');
      localStorage.removeItem('backoffice_user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: AuthUser): void => {
    setUser(updatedUser);
    localStorage.setItem('backoffice_user', JSON.stringify(updatedUser));
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
