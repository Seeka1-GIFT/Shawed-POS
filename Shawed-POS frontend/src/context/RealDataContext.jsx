/**
 * Real Data Context - PostgreSQL Integration
 * Fetches data directly from PostgreSQL database via backend API
 */

import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';

export const RealDataContext = createContext();

export function RealDataProvider({ children }) {
  // Debug: Check if API service is available
  console.log('RealDataProvider: apiService available?', !!apiService);
  
  const [data, setData] = useState({
    products: [],
    customers: [],
    sales: [],
    expenses: [],
    suppliers: [],
    users: [],
    businessSettings: {
      name: '',
      address: '',
      phone: '',
      email: '',
      taxRate: 8.5,
      logo: null,
    },
    loading: {
      products: false,
      customers: false,
      sales: false,
      expenses: false,
      suppliers: false,
      users: false,
    },
    error: {
      products: null,
      customers: null,
      sales: null,
      expenses: null,
      suppliers: null,
      users: null,
    }
  });

  // API Integration Functions
  const apiCall = async (action, key, apiFunction, data = null) => {
    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: true },
      error: { ...prev.error, [key]: null }
    }));

    try {
      const result = data ? await apiFunction(data) : await apiFunction();
      
      if (result.success) {
        setData(prev => ({
          ...prev,
          [key]: action === 'update' ? result.data : 
                 action === 'add' ? [...prev[key], result.data] : result.data,
          loading: { ...prev.loading, [key]: false }
        }));
        return result.data;
      } else {
        throw new Error(result.message || 'API request failed');
      }
    } catch (error) {
      console.error(`${key} API error:`, error);
      setData(prev => ({
        ...prev,
        error: { ...prev.error, [key]: error.message },
        loading: { ...prev.loading, [key]: false }
      }));
      throw error;
    }
  };

  // Data Fetching Functions
  const fetchProducts = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    return apiCall('fetch', 'products', apiService.getProducts);
  };
  const fetchCustomers = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    return apiCall('fetch', 'customers', apiService.getCustomers);
  };
  const fetchSales = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    return apiCall('fetch', 'sales', apiService.getSales);
  };

  const fetchExpenses = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    return apiCall('fetch', 'expenses', apiService.getExpenses);
  };

  const fetchSuppliers = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    return apiCall('fetch', 'suppliers', apiService.getSuppliers);
  };
  const fetchDashboardStats = () => apiCall('fetch', 'dashboard', () => Promise.resolve({ data: {} }));

  // CRUD Operations
  const addProduct = (productData) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(null);
    }
    return apiCall('add', 'products', apiService.createProduct, productData);
  };
  const updateProduct = (id, productData) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(null);
    }
    return apiCall('update', 'products', () => apiService.updateProduct(id, productData));
  };
  const deleteProduct = (id) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(false);
    }
    return apiCall('delete', 'products', apiService.deleteProduct, id);
  };

  const addCustomer = (customerData) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(null);
    }
    return apiCall('add', 'customers', apiService.createCustomer, customerData);
  };
  const updateCustomer = (id, customerData) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(null);
    }
    return apiCall('update', 'customers', () => apiService.updateCustomer(id, customerData));
  };
  const deleteCustomer = (id) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(false);
    }
    return apiCall('delete', 'customers', apiService.deleteCustomer, id);
  };

  const addSale = (saleData) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(null);
    }
    return apiCall('add', 'sales', () => apiService.createSale(saleData, data.token), saleData);
  };

  // Load initial data when component mounts (only public endpoints)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Only load public endpoints initially
        await Promise.all([
          fetchProducts(),
          fetchCustomers()
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load protected data when user is authenticated
  useEffect(() => {
    const loadProtectedData = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await Promise.all([
            fetchSales(),
            fetchExpenses(),
            fetchSuppliers()
          ]);
        } catch (error) {
          console.error('Failed to load protected data:', error);
        }
      }
    };

    loadProtectedData();
  }, []);

  // Get computed statistics
  const getStatistics = () => {
    const products = data.products || [];
    const sales = data.sales || [];
    
    // Calculate statistics from real data
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.saleDate || sale.createdAt).toDateString() === today
    );
    
    const lowStockProducts = products.filter(p => 
      (p.quantity || 0) <= (p.lowStockThreshold || 5)
    );

    return {
      salesToday: todaySales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0),
      profitToday: todaySales.reduce((sum, sale) => {
        const items = sale.saleItems || [];
        return sum + items.reduce((itemSum, item) => {
          const product = products.find(p => p.id === item.productId);
          return itemSum + ((parseFloat(item.price || 0) - parseFloat(product?.buyPrice || 0)) * parseInt(item.quantity || 0));
        }, 0);
      }, 0),
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    };
  };

  // Dashboard data with real database values
  const getDashboardData = () => {
    const stats = getStatistics();
    const recentSales = (data.sales || []).slice(0, 10).map(sale => ({
      id: sale.id,
      date: new Date(sale.saleDate || sale.createdAt).toLocaleDateString(),
      customer: sale.customer?.name || 'Walk-in Customer',
      total: parseFloat(sale.total || 0),
      items: sale.saleItems?.length || 0
    }));

    return {
      ...stats,
      recentSales,
      products: data.products || [],
      customers: data.customers || [],
    };
  };

  // Search and filter functions using real data
  const searchProducts = (query, filters = {}) => {
    let results = data.products || [];
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(p => 
        p.name?.toLowerCase().includes(searchTerm) ||
        p.barcode?.includes(searchTerm) ||
        p.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      results = results.filter(p => p.category === filters.category);
    }
    
    if (filters.supplier && filters.supplier !== 'all') {
      results = results.filter(p => p.supplierId === filters.supplier);
    }
    
    if (filters.stock === 'low') {
      results = results.filter(p => 
        p.quantity <= (p.lowStockThreshold || 5)
      );
    }
    
    return results;
  };

  const searchCustomers = (query) => {
    if (!query) return data.customers || [];
    
    const searchTerm = query.toLowerCase();
    return (data.customers || []).filter(c => 
      c.name?.toLowerCase().includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm) ||
      c.phone?.includes(searchTerm)
    );
  };

  const searchSales = (query, filters = {}) => {
    let results = data.sales || [];
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(sale => 
        sale.customer?.name?.toLowerCase().includes(searchTerm) ||
        sale.id?.toLowerCase().includes(searchTerm) ||
        sale.paymentMethod?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filters
    if (filters.startDate && filters.endDate) {
      results = results.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        return saleDate >= new Date(filters.startDate) && 
               saleDate <= new Date(filters.endDate);
      });
    }
    
    if (filters.paymentMethod) {
      results = results.filter(sale => sale.paymentMethod === filters.paymentMethod);
    }
    
    return results;
  };

  const updateBusinessSettings = (settings) => {
    setData(prev => ({
      ...prev,
      businessSettings: { ...prev.businessSettings, ...settings }
    }));
    
    // Persist to localStorage as backup
    localStorage.setItem('shawed-business-settings', JSON.stringify(settings));
  };

  // Retrieve business settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('shawed-business-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setData(prev => ({
          ...prev,
          businessSettings: { ...prev.businessSettings, ...settings }
        }));
      } catch (error) {
        console.error('Failed to parse business settings:', error);
      }
    }
  }, []);

  const contextValue = {
    // Data
    ...data,
    
    // API Functions
    fetchProducts,
    fetchCustomers,
    fetchSales,
    fetchExpenses,
    fetchSuppliers,
    fetchDashboardStats,
    
    // CRUD Operations
    addProduct,
    addCustomer,
    addSale,
    updateProduct,
    updateCustomer,
    deleteProduct,
    deleteCustomer,
    
    // Helper Functions
    getStatistics,
    getDashboardData,
    searchProducts,
    searchCustomers,
    searchSales,
    updateBusinessSettings,
    
    // Status Functions
    isLoading: (key) => data.loading[key] || false,
    hasError: (key) => !!data.error[key],
    getError: (key) => data.error[key]
  };

  return (
    <RealDataContext.Provider value={contextValue}>
      {children}
    </RealDataContext.Provider>
  );
}
