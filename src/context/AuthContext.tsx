import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import axios from 'axios';
import toast from 'react-hot-toast';
import { connectSocket, disconnectSocket } from '../services/socket';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const TOKEN_STORAGE_KEY = 'business_nexus_token';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check for stored user on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          // Connect Socket.IO only once on initial load
          connectSocket(token);
        } catch (error) {
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, ...userData } = response.data;

      if (userData.role !== role) {
        throw new Error(`User is not registered as an ${role}`);
      }

      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Connect Socket.IO after login (singleton pattern prevents duplicates)
      connectSocket(token);

      toast.success('Successfully logged in!');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      const { token, ...userData } = response.data;

      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Connect Socket.IO after registration (singleton pattern prevents duplicates)
      connectSocket(token);

      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      // For now, keep as mock or implement backend endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete axios.defaults.headers.common['Authorization'];

    // Disconnect Socket.IO on logout
    disconnectSocket();

    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, updates);
      const updatedUser = response.data;

      if (user?.id === userId || user?._id === userId) {
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }

      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};