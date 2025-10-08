/**
 * GigChain Admin Panel - Global State Store
 */

import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const useAdminStore = create((set, get) => ({
  // Auth state
  isAuthenticated: false,
  admin: null,
  token: null,
  loading: false,
  error: null,

  // Login
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, {
        username,
        password,
      });

      if (response.data.success) {
        const { admin, token } = response.data;
        
        // Save to localStorage
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(admin));

        // Update store
        set({
          isAuthenticated: true,
          admin,
          token,
          loading: false,
        });

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return true;
      }
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.detail || 'Login failed',
      });
      return false;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    delete axios.defaults.headers.common['Authorization'];
    
    set({
      isAuthenticated: false,
      admin: null,
      token: null,
    });
  },

  // Verify session
  verifySession: async () => {
    const token = localStorage.getItem('admin_token');
    const savedAdmin = localStorage.getItem('admin_user');

    if (!token || !savedAdmin) {
      return false;
    }

    try {
      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify with backend
      const response = await axios.get(`${API_URL}/api/admin/verify`);

      if (response.data.authenticated) {
        set({
          isAuthenticated: true,
          admin: JSON.parse(savedAdmin),
          token,
        });
        return true;
      } else {
        get().logout();
        return false;
      }
    } catch (error) {
      get().logout();
      return false;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
