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
    payments: [],
    debts: [],
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

  // Add null safety check for data - but don't return JSX from context provider
  if (!data) {
    console.error('RealDataContext: data state is null/undefined');
    // Initialize with empty data instead of returning JSX
    const emptyData = {
      products: [],
      customers: [],
      sales: [],
      expenses: [],
      suppliers: [],
      users: [],
      payments: [],
      debts: [],
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
    };
    setData(emptyData);
  }

  // API Integration Functions
  const apiCall = async (action, key, apiFunction, data = null) => {
    console.log(`🔄 API Call: ${action} ${key}`);
    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: true },
      error: { ...prev.error, [key]: null }
    }));

    try {
      const result = data ? await apiFunction(data) : await apiFunction();
      console.log(`✅ API Response for ${key}:`, result);
      
      if (result.success) {
        setData(prev => ({
          ...prev,
          [key]: action === 'update' ? result.data : 
                 action === 'add' ? [...prev[key], result.data] : result.data,
          loading: { ...prev.loading, [key]: false }
        }));
        console.log(`📊 Data updated for ${key}:`, result.data);
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
    console.log('🔄 Fetching sales data from API...');
    // Sales route is public, no token needed
    return apiCall('fetch', 'sales', () => apiService.request('/sales'));
  };

  const fetchExpenses = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    // Expenses route is public, no token needed
    return apiCall('fetch', 'expenses', () => apiService.request('/expenses'));
  };

  const fetchSuppliers = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    // Suppliers route is public, no token needed
    return apiCall('fetch', 'suppliers', () => apiService.request('/suppliers'));
  };

  const fetchReportsData = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve({});
    }
    console.log('🔄 Fetching comprehensive reports data...');
    // Reports route is public, no token needed
    return apiCall('fetch', 'reports', () => apiService.request('/reports'));
  };

  const fetchPurchaseOrders = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve([]);
    }
    console.log('🔄 Fetching purchase orders data...');
    // Purchase orders route is public, no token needed
    return apiCall('fetch', 'purchaseOrders', () => apiService.request('/purchase-orders'));
  };
  const fetchDashboardStats = () => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve({ data: {} });
    }
    const token = localStorage.getItem('authToken');
    return apiCall('fetch', 'dashboard', () => apiService.getDashboardStats(token));
  };

  // CRUD Operations
  const addProduct = (productData) => {
    if (!apiService) {
      console.error('API service is not available');
      return Promise.resolve(null);
    }
    return apiCall('add', 'products', apiService.createProduct, productData);
  };
  const updateProduct = async (id, productData) => {
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    try {
      const result = await apiService.updateProduct(id, productData);
      if (result?.success) {
        setData(prev => ({
          ...prev,
          products: (prev.products || []).map(p => p.id === id ? { ...p, ...result.data } : p),
        }));
        window.dispatchEvent(new CustomEvent('productUpdated', { detail: { product: result.data }}));
      }
      return result;
    } catch (err) {
      console.error('updateProduct error:', err);
      return { success: false, message: err.message };
    }
  };
  const deleteProduct = async (id) => {
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    try {
      const result = await apiService.deleteProduct(id);
      if (result?.success) {
        setData(prev => ({
          ...prev,
          products: (prev.products || []).filter(p => p.id !== id),
        }));
      }
      return result;
    } catch (err) {
      console.error('deleteProduct error:', err);
      return { success: false, message: err.message };
    }
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

  const addSale = async (saleData) => {
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    
    try {
      // Sales route is public, no token needed
      const result = await apiService.request('/sales', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });
      
      if (result.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          sales: [...(prev.sales || []), result.data]
        }));
        
        // Emit event to trigger data refresh across components
        window.dispatchEvent(new CustomEvent('saleCreated', { 
          detail: { sale: result.data } 
        }));
        
        console.log('✅ Sale created and event emitted for auto-refresh');
      }
      
      return result;
    } catch (error) {
      console.error('addSale error:', error);
      return { success: false, message: error.message };
    }
  };

  const updateSale = async (id, saleData) => {
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const result = await apiService.updateSale(id, saleData, token);
      
      if (result.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          sales: (prev.sales || []).map(sale => 
            sale.id === id ? result.data : sale
          )
        }));
      }
      
      return result;
    } catch (error) {
      console.error('updateSale error:', error);
      return { success: false, message: error.message };
    }
  };

  const deleteSale = async (id) => {
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const result = await apiService.deleteSale(id, token);
      
      if (result.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          sales: (prev.sales || []).filter(sale => sale.id !== id)
        }));
      }
      
      return result;
    } catch (error) {
      console.error('deleteSale error:', error);
      return { success: false, message: error.message };
    }
  };

  // Load payments and debts from localStorage on mount
  useEffect(() => {
    try {
      const savedPayments = localStorage.getItem('shawed-payments');
      const savedDebts = localStorage.getItem('shawed-debts');
      
      if (savedPayments) {
        const payments = JSON.parse(savedPayments);
        setData(prev => ({ ...prev, payments }));
      }
      
      if (savedDebts) {
        const debts = JSON.parse(savedDebts);
        setData(prev => ({ ...prev, debts }));
      }
    } catch (error) {
      console.error('Failed to load payments/debts from localStorage:', error);
    }
  }, []);

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

  // Load data - public routes don't need authentication
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load public data (sales, expenses, suppliers, purchase orders, reports) regardless of auth status
        await Promise.all([
          fetchSales(),
          fetchExpenses(),
          fetchSuppliers(),
          fetchPurchaseOrders(),
          fetchReportsData()
        ]);
        
        // Load protected data only if authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
          await Promise.all([
            fetchProducts(),
            fetchCustomers()
          ]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing data...');
      loadData();
    }, 30000); // 30 seconds

    // Set up event listeners for real-time updates
    const handleDataUpdate = (event) => {
      console.log('📡 Data update event received:', event.detail);
      loadData();
    };

    window.addEventListener('saleCreated', handleDataUpdate);
    window.addEventListener('productUpdated', handleDataUpdate);
    window.addEventListener('expenseCreated', handleDataUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('saleCreated', handleDataUpdate);
      window.removeEventListener('productUpdated', handleDataUpdate);
      window.removeEventListener('expenseCreated', handleDataUpdate);
    };
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
    // If we have dashboard stats from API, use them
    if (data.dashboard && data.dashboard.sales) {
      return {
        salesToday: data.dashboard.sales.todayTotal || 0,
        profitToday: data.dashboard.sales.todayProfit || 0,
        totalProducts: data.dashboard.inventory.totalProducts || 0,
        lowStockCount: data.dashboard.inventory.lowStockProducts || 0,
        recentSales: (data.sales || []).slice(0, 10).map(sale => ({
          id: sale.id,
          date: new Date(sale.saleDate || sale.createdAt).toLocaleDateString(),
          customer: sale.customer?.name || 'Walk-in Customer',
          total: parseFloat(sale.total || 0),
          items: sale.saleItems?.length || 0
        })),
        products: data.products || [],
        customers: data.customers || [],
      };
    }
    
    // Fallback to calculated statistics
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
    ...(data || {}),
    
    // API Functions
    fetchProducts,
    fetchCustomers,
    fetchSales,
    fetchExpenses,
    fetchSuppliers,
    fetchPurchaseOrders,
    fetchReportsData,
    fetchDashboardStats,
    
    // CRUD Operations
    addProduct,
    addCustomer,
    addSale,
    updateSale,
    deleteSale,
    updateProduct,
    updateCustomer,
    deleteProduct,
    deleteCustomer,
    
  // Expense CRUD Operations (implemented with API calls)
  addExpense: async (expenseData) => {
    console.log('addExpense called with:', expenseData);
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    
    try {
      const result = await apiService.createExpense(expenseData);
      
      if (result.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          expenses: [...(prev.expenses || []), result.data]
        }));
      }
      
      return result;
    } catch (error) {
      console.error('addExpense error:', error);
      return { success: false, message: error.message };
    }
  },
  updateExpense: async (id, expenseData) => {
    console.log('updateExpense called with:', id, expenseData);
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    
    try {
      const result = await apiService.updateExpense(id, expenseData);
      
      if (result.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          expenses: (prev.expenses || []).map(exp => 
            exp.id === id ? result.data : exp
          )
        }));
      }
      
      return result;
    } catch (error) {
      console.error('updateExpense error:', error);
      return { success: false, message: error.message };
    }
  },
  deleteExpense: async (id) => {
    console.log('deleteExpense called with:', id);
    if (!apiService) {
      console.error('API service is not available');
      return { success: false, message: 'API service not available' };
    }
    
    try {
      const result = await apiService.deleteExpense(id);
      
      if (result.success) {
        // Update local state
        setData(prev => ({
          ...prev,
          expenses: (prev.expenses || []).filter(exp => exp.id !== id)
        }));
      }
      
      return result;
    } catch (error) {
      console.error('deleteExpense error:', error);
      return { success: false, message: error.message };
    }
  },
    addExpenseCategory: async (categoryData) => {
      console.log('addExpenseCategory called with:', categoryData);
      // TODO: Implement actual API call
      return { success: true, data: { ...categoryData, id: Date.now().toString() } };
    },
    addRecurringExpense: async (expenseData) => {
      console.log('addRecurringExpense called with:', expenseData);
      // TODO: Implement actual API call
      return { success: true, data: { ...expenseData, id: Date.now().toString() } };
    },
    processRecurringExpenses: async () => {
      console.log('processRecurringExpenses called');
      // TODO: Implement actual API call
      return { success: true };
    },
    setExpenseStatus: async (id, status) => {
      console.log('setExpenseStatus called with:', id, status);
      // TODO: Implement actual API call
      return { success: true };
    },
    
    // Supplier CRUD Operations (implemented with API calls)
    addSupplier: async (supplierData) => {
      console.log('addSupplier called with:', supplierData);
      if (!apiService) {
        console.error('API service is not available');
        return { success: false, message: 'API service not available' };
      }
      
      try {
        const token = localStorage.getItem('authToken');
        const result = await apiService.createSupplier(supplierData, token);
        
        if (result.success) {
          // Update local state
          setData(prev => ({
            ...prev,
            suppliers: [...(prev.suppliers || []), result.data]
          }));
        }
        
        return result;
      } catch (error) {
        console.error('addSupplier error:', error);
        return { success: false, message: error.message };
      }
    },
    updateSupplier: async (id, supplierData) => {
      console.log('updateSupplier called with:', id, supplierData);
      if (!apiService) {
        console.error('API service is not available');
        return { success: false, message: 'API service not available' };
      }
      
      try {
        const token = localStorage.getItem('authToken');
        const result = await apiService.updateSupplier(id, supplierData, token);
        
        if (result.success) {
          // Update local state
          setData(prev => ({
            ...prev,
            suppliers: (prev.suppliers || []).map(supp => 
              supp.id === id ? result.data : supp
            )
          }));
        }
        
        return result;
      } catch (error) {
        console.error('updateSupplier error:', error);
        return { success: false, message: error.message };
      }
    },
    deleteSupplier: async (id) => {
      console.log('deleteSupplier called with:', id);
      if (!apiService) {
        console.error('API service is not available');
        return { success: false, message: 'API service not available' };
      }
      
      try {
        const token = localStorage.getItem('authToken');
        const result = await apiService.deleteSupplier(id, token);
        
        if (result.success) {
          // Update local state
          setData(prev => ({
            ...prev,
            suppliers: (prev.suppliers || []).filter(supp => supp.id !== id)
          }));
        }
        
        return result;
      } catch (error) {
        console.error('deleteSupplier error:', error);
        return { success: false, message: error.message };
      }
    },
    
    // Purchase Order CRUD Operations (real API calls)
    addPurchaseOrder: async (orderData) => {
      if (!apiService) {
        console.error('API service is not available');
        return { success: false, message: 'API service not available' };
      }
      
      try {
        console.log('📦 Creating purchase order:', orderData);
        // Normalize payload for backend
        const payload = {
          supplierId: orderData.supplierId,
          orderDate: orderData.orderDate,
          expectedDate: orderData.expectedDate || null,
          status: orderData.status || 'pending',
          notes: orderData.notes || '',
          totalAmount: Number(orderData.totalAmount || 0),
          items: (orderData.items || []).map(it => ({
            productId: it.productId,
            quantity: Number(it.quantity || 0),
            unitPrice: Number(it.unitPrice || 0),
          })),
        };
        const result = await apiService.request('/purchase-orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        
        if (result.success) {
          // Update local state
          setData(prev => ({
            ...prev,
            purchaseOrders: [...(prev.purchaseOrders || []), result.data]
          }));
          
          // Emit event to trigger data refresh
          window.dispatchEvent(new CustomEvent('purchaseOrderCreated', { 
            detail: { order: result.data } 
          }));
        }
        
        return result;
      } catch (error) {
        console.error('addPurchaseOrder error:', error);
        return { success: false, message: error.message };
      }
    },
    updatePurchaseOrder: async (id, orderData) => {
      if (!apiService) {
        console.error('API service is not available');
        return { success: false, message: 'API service not available' };
      }
      
      try {
        // Remove fields that don't exist in DB schema before sending to backend
        const { amountPaid, paymentStatus, items, ...schemaFields } = orderData;
        const backendPayload = { ...schemaFields };
        
        const result = await apiService.request(`/purchase-orders/${id}`, {
          method: 'PUT',
          body: JSON.stringify(backendPayload),
        });
        
        if (result.success) {
          // Update local state with backend response
          // Note: amountPaid and paymentStatus are not in DB schema, preserve from orderData if present
          const paymentInfo = orderData.amountPaid !== undefined ? {
            amountPaid: orderData.amountPaid,
            paymentStatus: orderData.paymentStatus
          } : {};
          
          setData(prev => ({
            ...prev,
            purchaseOrders: prev.purchaseOrders.map(order => {
              if (order.id === id) {
                // Merge backend response with payment info (if provided)
                return {
                  ...result.data,
                  ...paymentInfo,
                  // If payment info wasn't in orderData, preserve existing
                  amountPaid: paymentInfo.amountPaid !== undefined ? paymentInfo.amountPaid : (order.amountPaid || 0),
                  paymentStatus: paymentInfo.paymentStatus !== undefined ? paymentInfo.paymentStatus : (order.paymentStatus || 'unpaid')
                };
              }
              return order;
            })
          }));
        }
        
        return result;
      } catch (error) {
        console.error('updatePurchaseOrder error:', error);
        return { success: false, message: error.message };
      }
    },
    deletePurchaseOrder: async (id) => {
      if (!apiService) {
        console.error('API service is not available');
        return { success: false, message: 'API service not available' };
      }
      
      try {
        const result = await apiService.request(`/purchase-orders/${id}`, {
          method: 'DELETE',
        });
        
        if (result.success) {
          // Update local state
          setData(prev => ({
            ...prev,
            purchaseOrders: prev.purchaseOrders.filter(order => order.id !== id)
          }));
        }
        
        return result;
      } catch (error) {
        console.error('deletePurchaseOrder error:', error);
        return { success: false, message: error.message };
      }
    },
    receivePurchaseOrder: async (id, receivedItems) => {
      console.log('receivePurchaseOrder called with:', id, receivedItems);
      
      // Optimistic update - update UI immediately
      const receivedDate = new Date().toISOString().split('T')[0];
      setData(prev => ({
        ...prev,
        purchaseOrders: prev.purchaseOrders.map(order => 
          order.id === id ? { ...order, status: 'received', receivedDate: receivedDate } : order
        )
      }));
      
      // Try to sync with backend (non-blocking)
      if (apiService) {
        try {
          // Only send status - receivedDate is not in database schema
          // The backend will automatically update updatedAt when status changes
          const orderData = {
            status: 'received'
          };
          
          const result = await apiService.request(`/purchase-orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(orderData),
          });
          
          if (result.success) {
            // Update with backend response if available
            setData(prev => ({
              ...prev,
              purchaseOrders: prev.purchaseOrders.map(order => 
                order.id === id ? { 
                  ...result.data, 
                  receivedDate: receivedDate // Keep local receivedDate for UI
                } : order
              )
            }));
            
            console.log('✅ Purchase order marked as received (synced with backend)');
          } else {
            console.warn('⚠️ Backend update failed, but local state updated:', result.message);
          }
          
          // Emit event to trigger data refresh
          window.dispatchEvent(new CustomEvent('purchaseOrderReceived', { 
            detail: { orderId: id } 
          }));
          
          return { success: true, data: { id, status: 'received', receivedDate } };
        } catch (error) {
          console.error('receivePurchaseOrder API error (local state already updated):', error);
          // Local state already updated, just return success
          return { success: true, data: { id, status: 'received', receivedDate }, warning: 'Backend sync failed, but order marked as received locally' };
        }
      } else {
        console.log('✅ Purchase order marked as received (local only)');
        return { success: true, data: { id, status: 'received', receivedDate } };
      }
    },
    createProductFromPurchase: async (productName, category, unitPrice, quantity) => {
      console.log('createProductFromPurchase called with:', productName, category, unitPrice, quantity);
      if (!apiService) {
        console.error('API service is not available');
        return null;
      }
      try {
        // Use unitPrice for both buy/sell initially; can be edited later
        const payload = {
          name: productName,
          category: category || 'General',
          barcode: '',
          quantity: Number(quantity || 0),
          buyPrice: Number(unitPrice || 1),
          sellPrice: Number(unitPrice || 1),
          supplierId: null,
          lowStockThreshold: 5,
        };
        const res = await apiService.createProduct(payload);
        if (res?.success) {
          // Add to local state so it appears immediately in UI
          setData(prev => ({
            ...prev,
            products: [...(prev.products || []), res.data],
          }));
          return res.data;
        }
        return null;
      } catch (e) {
        console.error('createProductFromPurchase error:', e);
        return null;
      }
    },
    addPurchasePayment: async (orderId, paymentData) => {
      console.log('addPurchasePayment called with:', orderId, paymentData);
      // TODO: Implement actual API call
      return { success: true };
    },
    
    // Payment and Debt Operations
    addPayment: async (paymentData) => {
      console.log('addPayment called with:', paymentData);
      try {
        // Store payment in local state
        const payment = {
          ...paymentData,
          id: paymentData.id || Date.now().toString(),
          createdAt: paymentData.createdAt || new Date().toISOString(),
        };
        
        setData(prev => ({
          ...prev,
          payments: [...(prev.payments || []), payment]
        }));
        
        // Persist to localStorage as backup
        const existingPayments = JSON.parse(localStorage.getItem('shawed-payments') || '[]');
        existingPayments.push(payment);
        localStorage.setItem('shawed-payments', JSON.stringify(existingPayments));
        
        console.log('✅ Payment added successfully');
        return { success: true, data: payment };
      } catch (error) {
        console.error('addPayment error:', error);
        return { success: false, message: error.message };
      }
    },
    addDebt: async (debtData) => {
      console.log('addDebt called with:', debtData);
      try {
        // Store debt in local state
        const debt = {
          ...debtData,
          id: debtData.id || Date.now().toString(),
          createdAt: debtData.createdAt || new Date().toISOString(),
        };
        
        setData(prev => ({
          ...prev,
          debts: [...(prev.debts || []), debt]
        }));
        
        // Persist to localStorage as backup
        const existingDebts = JSON.parse(localStorage.getItem('shawed-debts') || '[]');
        existingDebts.push(debt);
        localStorage.setItem('shawed-debts', JSON.stringify(existingDebts));
        
        console.log('✅ Debt added successfully');
        return { success: true, data: debt };
      } catch (error) {
        console.error('addDebt error:', error);
        return { success: false, message: error.message };
      }
    },
    
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
