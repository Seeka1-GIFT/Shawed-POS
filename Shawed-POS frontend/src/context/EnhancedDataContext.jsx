/**
 * Enhanced DataContext that combines local storage with API integration
 * Provides seamless fallback between API and localStorage
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useApiContext } from '../services/apiContext';

export const EnhancedDataContext = createContext();

export function EnhancedDataProvider({ children }) {
  // Import the original DataContext logic
  const DEFAULT_STATE = {
    products: [],
    sales: [],
    expenses: [],
    expenseCategories: [
      { id: 'cat-purchases', name: 'Purchases' },
      { id: 'cat-rent', name: 'Rent' },
      { id: 'cat-utilities', name: 'Utilities' },
      { id: 'cat-salaries', name: 'Salaries' },
      { id: 'cat-other', name: 'Other' },
    ],
    recurringExpenses: [],
    paymentMethods: ['Cash', 'Bank Transfer', 'Mobile Money', 'Card'],
    customers: [],
    suppliers: [],
    purchaseOrders: [],
    purchases: [],
    purchasePayments: [],
    payments: [],
    debts: [],
    businessSettings: {
      name: '',
      address: '',
      phone: '',
      email: '',
      taxRate: 0,
      logo: null,
    },
    receiptSettings: {
      header: '',
      footer: '',
      showProductImages: false,
      printerName: '',
      paperSize: 'thermal',
    },
    displaySettings: {
      theme: 'light',
      compactMode: false,
      showProductImagesInLists: true,
      itemsPerPage: 20,
      defaultDashboardView: 'overview',
    },
  };

  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem('dukaan-data');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (err) {
      console.error('Failed to parse dukaan-data from localStorage', err);
    }
    return DEFAULT_STATE;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dukaan-data', JSON.stringify(state));
  }, [state]);

  // Sync data with backend API when it becomes available
  useEffect(() => {
    const syncWithAPI = async () => {
      // This will be implemented to sync local data with API
      // For now, we'll keep the local-first approach
    };
    
    // syncWithAPI();
  }, []);

  // Enhanced Product handlers with API fallback
  const addProduct = async (product) => {
    const enriched = {
      id: product.id || `prod-${Date.now()}`,
      name: product.name,
      category: product.category || 'General',
      barcode: product.barcode || '',
      supplierId: product.supplierId || '',
      quantity: Number(product.quantity || 0),
      purchasePrice: Number(product.purchasePrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      expiryDate: product.expiryDate || '',
      imageUrl: product.imageUrl || '',
      lowStockThreshold: Number(product.lowStockThreshold || 5),
      variants: Array.isArray(product.variants) ? product.variants : [],
      batches: Array.isArray(product.batches) ? product.batches : [],
      serialNumbers: Array.isArray(product.serialNumbers) ? product.serialNumbers : [],
      history: [{ type: 'created', at: new Date().toISOString(), by: 'system' }],
    };

    // Update local state immediately (for instant UI update)
    setState((prev) => ({
      ...prev,
      products: [...prev.products, enriched],
    }));

    // Try to sync with API in background
    try {
      // API sync would go here when API is available
      console.log('Product added locally:', enriched.name);
    } catch (error) {
      console.warn('Failed to sync product with API:', error);
      // Product remains in local storage even if API fails
    }

    return enriched;
  };

  const updateProduct = async (updated) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== updated.id) return p;
        const next = { ...p, ...updated };
        next.history = [...(p.history || []), { type: 'updated', at: new Date().toISOString(), by: 'system' }];
        return next;
      }),
    }));

    // Try to sync with API in background
    try {
      // API sync would go here
      console.log('Product updated locally:', updated.name);
    } catch (error) {
      console.warn('Failed to sync product update with API:', error);
    }
  };

  const deleteProduct = async (id) => {
    const product = state.products.find(p => p.id === id);
    
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));

    // Try to sync with API in background
    try {
      // API sync would go here
      console.log('Product deleted locally:', product?.name);
    } catch (error) {
      console.warn('Failed to sync product deletion with API:', error);
    }
  };

  // Enhanced Customer handlers with API fallback
  const addCustomer = async (customer) => {
    const enriched = {
      id: customer.id || `cust-${Date.now()}`,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      balance: Number(customer.balance || 0),
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, enriched],
    }));

    return enriched;
  };

  const updateCustomer = async (updated) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    }));
  };

  const deleteCustomer = async (id) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  // Enhanced Sale handlers with API fallback
  const recordSale = async (saleData) => {
    const enriched = {
      id: saleData.id || `sale-${Date.now()}`,
      customerId: saleData.customerId || '',
      items: saleData.items || [],
      subtotal: Number(saleData.subtotal || 0),
      discount: Number(saleData.discount || 0),
      tax: Number(saleData.tax || 0),
      total: Number(saleData.total || 0),
      paymentMethod: saleData.paymentMethod || 'Cash',
      notes: saleData.notes || '',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      sales: [enriched, ...prev.sales],
    }));

    // Update product quantities
    if (enriched.items && enriched.items.length > 0) {
      enriched.items.forEach((item) => {
        updateProduct({
          id: item.productId,
          quantity: state.products.find(p => p.id === item.productId)?.quantity - item.quantity
        });
      });
    }

    return enriched;
  };

  // Business settings handlers
  const updateBusinessSettings = (settings) => {
    setState((prev) => ({
      ...prev,
      businessSettings: { ...prev.businessSettings, ...settings },
    }));
  };

  // Context value
  const value = {
    // Data - Original data structure maintained
    ...state,

    // Enhanced handlers with API fallback
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordSale,
    updateBusinessSettings,

    // Additional helpers
    getProductsByCategory: (category) => state.products.filter(p => p.category === category),
    getLowStockProducts: () => state.products.filter(p => p.quantity <= p.lowStockThreshold),
    getCustomerBalance: (customerId) => state.customers.find(c => c.id === customerId)?.balance || 0,
    
    // Sync status
    isApiEnabled: false, // Will be true when API integration is complete
    lastSync: null,
  };

  return (
    <EnhancedDataContext.Provider value={value}>
      {children}
    </EnhancedDataContext.Provider>
  );
}


