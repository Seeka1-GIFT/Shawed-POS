/**
 * Enhanced DataContext that integrates with Backend API
 * Combines local state management with API calls
 */

import React, { createContext, useState, useEffect } from 'react';
import api from './api';
import { API_BASE_URL } from './config';

export const ApiContext = createContext();

export function ApiProvider({ children }) {
  // API Integration state
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check API connection
  const checkApiConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/status`);
      if (response.ok) {
        setApiConnected(true);
        setApiError(null);
        return true;
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.warn('Backend API not available:', error.message);
      setApiConnected(false);
      setApiError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Products with API integration
  const productsAPI = {
    getProducts: async () => {
      if (apiConnected) {
        try {
          const response = await api.getProducts();
          return response.data || [];
        } catch (error) {
          console.error('Failed to fetch products from API:', error);
          return [];
        }
      }
      return [];
    },

    createProduct: async (productData) => {
      if (apiConnected) {
        try {
          const response = await api.createProduct(productData);
          return response.data;
        } catch (error) {
          console.error('Failed to create product:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    updateProduct: async (id, productData) => {
      if (apiConnected) {
        try {
          const response = await api.updateProduct(id, productData);
          return response.data;
        } catch (error) {
          console.error('Failed to update product:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    deleteProduct: async (id) => {
      if (apiConnected) {
        try {
          const response = await api.deleteProduct(id);
          return response.success;
        } catch (error) {
          console.error('Failed to delete product:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    }
  };

  // Customers with API integration
  const customersAPI = {
    getCustomers: async () => {
      if (apiConnected) {
        try {
          const response = await api.getCustomers();
          return response.data || [];
        } catch (error) {
          console.error('Failed to fetch customers from API:', error);
          return [];
        }
      }
      return [];
    },

    createCustomer: async (customerData) => {
      if (apiConnected) {
        try {
          const response = await api.createCustomer(customerData);
          return response.data;
        } catch (error) {
          console.error('Failed to create customer:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    updateCustomer: async (id, customerData) => {
      if (apiConnected) {
        try {
          const response = await api.updateCustomer(id, customerData);
          return response.data;
        } catch (error) {
          console.error('Failed to update customer:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    deleteCustomer: async (id) => {
      if (apiConnected) {
        try {
          const response = await api.deleteCustomer(id);
          return response.success;
        } catch (error) {
          console.error('Failed to delete customer:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    }
  };

  // Sales with API integration
  const salesAPI = {
    getSales: async () => {
      if (apiConnected) {
        try {
          const response = await api.getSales();
          return response.data || [];
        } catch (error) {
          console.error('Failed to fetch sales from API:', error);
          return [];
        }
      }
      return [];
    },

    createSale: async (saleData) => {
      if (apiConnected) {
        try {
          const response = await api.createSale(saleData);
          return response.data;
        } catch (error) {
          console.error('Failed to create sale:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    getSalesReport: async (dateRange) => {
      if (apiConnected) {
        try {
          const response = await api.getSalesReport(dateRange);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch sales report:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    }
  };

  // Authentication with API integration
  const authAPI = {
    login: async (email, password) => {
      if (apiConnected) {
        try {
          const response = await api.login(email, password);
          if (response.success && response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
          }
          throw new Error('Login failed');
        } catch (error) {
          console.error('Failed to login:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    register: async (userData) => {
      if (apiConnected) {
        try {
          const response = await api.register(userData);
          if (response.success && response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
          }
          throw new Error('Registration failed');
        } catch (error) {
          console.error('Failed to register:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    getCurrentUser: async () => {
      if (apiConnected) {
        try {
          const response = await api.getCurrentUser();
          return response.data;
        } catch (error) {
          console.error('Failed to get current user:', error);
          throw error;
        }
      }
      throw new Error('API not connected');
    },

    logout: () => {
      if (apiConnected) {
        api.logout();
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  // Initialize API connection on mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  const contextValue = {
    // API Status
    apiConnected,
    apiError,
    loading,
    // export available functions
    checkApiConnection,

    // API Services
    productsAPI,
    customersAPI,
    salesAPI,
    authAPI,

    // Helper functions
    isAPIReady: () => apiConnected && !loading,
    getConnectionStatus: () => ({
      connected: apiConnected,
      error: apiError,
      loading
    })
  };

  return (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  );
}
