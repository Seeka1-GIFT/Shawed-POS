import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';

/**
 * DataContext holds all domain data for the application such as
 * products, sales, expenses and customers. It now uses the backend API
 * instead of localStorage for data persistence.
 */
export const DataContext = createContext();

export function DataProvider({ children }) {
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
    },
    loading: false,
    error: null,
  };

  const [state, setState] = useState(DEFAULT_STATE);

  // Load data from API on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [productsResponse, customersResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getCustomers()
      ]);

      setState(prev => ({
        ...prev,
        products: productsResponse.data || [],
        customers: customersResponse.data || [],
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load data:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  // Product handlers
  const addProduct = async (product) => {
    try {
      const response = await apiService.createProduct(product);
      setState(prev => ({
        ...prev,
        products: [...prev.products, response.data]
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (updated) => {
    try {
      const response = await apiService.updateProduct(updated.id, updated);
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === updated.id ? response.data : p)
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await apiService.deleteProduct(id);
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  // Customer handlers
  const addCustomer = async (customer) => {
    try {
      const response = await apiService.createCustomer(customer);
      setState(prev => ({
        ...prev,
        customers: [...prev.customers, response.data]
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (updated) => {
    try {
      const response = await apiService.updateCustomer(updated.id, updated);
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === updated.id ? response.data : c)
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await apiService.deleteCustomer(id);
      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete customer:', error);
      // Re-throw the error with the message from the API
      throw error;
    }
  };

  // Sales handler (placeholder - will need authentication)
  const addSale = (sale) => {
    setState(prev => ({
      ...prev,
      sales: [...prev.sales, sale],
    }));
  };

  // Expenses handler (placeholder - will need authentication)
  const addExpense = (expense) => {
    const normalized = {
      id: expense.id || `exp-${Date.now()}`,
      description: expense.description || '',
      amount: Number(expense.amount || 0),
      category: expense.category || 'Other',
      date: expense.date || new Date().toISOString().split('T')[0],
      method: expense.method || 'Cash',
      status: expense.status || 'Pending',
      attachments: Array.isArray(expense.attachments) ? expense.attachments : [],
      notes: expense.notes || '',
      createdAt: expense.createdAt || new Date().toISOString(),
      createdBy: expense.createdBy || 'system'
    };

    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, normalized],
    }));
    return normalized;
  };

  const updateExpense = (updated) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === updated.id ? { ...e, ...updated } : e),
    }));
  };

  const deleteExpense = (id) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  };

  const setExpenseStatus = (id, status) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, status } : e),
    }));
  };

  // Expense categories management
  const addExpenseCategory = (name) => {
    const exists = (state.expenseCategories || []).some(c => c.name.toLowerCase() === String(name).toLowerCase());
    if (exists) return null;
    const cat = { id: `cat-${Date.now()}`, name };
    setState(prev => ({ ...prev, expenseCategories: [...(prev.expenseCategories || []), cat] }));
    return cat;
  };

  const deleteExpenseCategoryById = (id) => {
    setState(prev => ({
      ...prev,
      expenseCategories: (prev.expenseCategories || []).filter(c => c.id !== id),
    }));
  };

  // Recurring expenses
  const addRecurringExpense = (template) => {
    const normalized = {
      id: template.id || `rec-${Date.now()}`,
      description: template.description || '',
      amount: Number(template.amount || 0),
      category: template.category || 'Other',
      frequency: template.frequency || 'monthly',
      nextDue: template.nextDue || new Date().toISOString(),
      isActive: template.isActive !== false,
      createdAt: template.createdAt || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, recurringExpenses: [...(prev.recurringExpenses || []), normalized] }));
    return normalized;
  };

  const updateRecurringExpense = (updated) => {
    setState(prev => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).map(e => e.id === updated.id ? { ...e, ...updated } : e),
    }));
  };

  const deleteRecurringExpense = (id) => {
    setState(prev => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).filter(e => e.id !== id),
    }));
  };

  const processRecurringExpenses = () => {
    const now = new Date();
    const processed = [];
    
    (state.recurringExpenses || []).forEach(template => {
      if (!template.isActive) return;
      
      const nextDue = new Date(template.nextDue);
      if (nextDue <= now) {
        const expense = {
          description: template.description,
          amount: template.amount,
          category: template.category,
          date: now.toISOString().split('T')[0],
          method: 'Bank Transfer',
          status: 'Pending',
          notes: `Auto-generated from recurring expense: ${template.description}`,
          createdAt: now.toISOString(),
          createdBy: 'system'
        };
        
        addExpense(expense);
        processed.push(template.id);
        
        // Update next due date
        const nextDate = new Date(nextDue);
        if (template.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (template.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (template.frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        
        updateRecurringExpense({
          id: template.id,
          nextDue: nextDate.toISOString()
        });
      }
    });
    
    return processed;
  };

  // Supplier handlers (placeholder)
  const addSupplier = (supplier) => {
    const normalized = {
      id: supplier.id || `sup-${Date.now()}`,
      name: supplier.name || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      email: supplier.email || '',
      balance: Number(supplier.balance || 0),
      createdAt: supplier.createdAt || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, suppliers: [...(prev.suppliers || []), normalized] }));
    return normalized;
  };

  const updateSupplier = (updated) => {
    setState(prev => ({
      ...prev,
      suppliers: (prev.suppliers || []).map(s => s.id === updated.id ? { ...s, ...updated } : s),
    }));
  };

  const deleteSupplier = (id) => {
    setState(prev => ({
      ...prev,
      suppliers: (prev.suppliers || []).filter(s => s.id !== id),
    }));
  };

  // Purchase order handlers (placeholder)
  const addPurchaseOrder = (order) => {
    const normalized = {
      id: order.id || `po-${Date.now()}`,
      supplierId: order.supplierId || '',
      orderDate: order.orderDate || new Date().toISOString(),
      totalAmount: Number(order.totalAmount || 0),
      status: order.status || 'PENDING',
      items: Array.isArray(order.items) ? order.items : [],
      createdAt: order.createdAt || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, purchaseOrders: [...(prev.purchaseOrders || []), normalized] }));
    return normalized;
  };

  const updatePurchaseOrder = (updated) => {
    setState(prev => ({
      ...prev,
      purchaseOrders: (prev.purchaseOrders || []).map(o => o.id === updated.id ? { ...o, ...updated } : o),
    }));
  };

  const deletePurchaseOrder = (id) => {
    setState(prev => ({
      ...prev,
      purchaseOrders: (prev.purchaseOrders || []).filter(o => o.id !== id),
    }));
  };

  const receivePurchaseOrder = (id) => {
    updatePurchaseOrder({ id, status: 'RECEIVED' });
  };

  const addPurchasePayment = (payment) => {
    const normalized = {
      id: payment.id || `pp-${Date.now()}`,
      purchaseOrderId: payment.purchaseOrderId || '',
      amount: Number(payment.amount || 0),
      paymentDate: payment.paymentDate || new Date().toISOString(),
      method: payment.method || 'Bank Transfer',
      notes: payment.notes || '',
      createdAt: payment.createdAt || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, purchasePayments: [...(prev.purchasePayments || []), normalized] }));
    return normalized;
  };

  // Business settings
  const updateBusinessSettings = (settings) => {
    setState(prev => ({
      ...prev,
      businessSettings: { ...prev.businessSettings, ...settings },
    }));
  };

  const updateReceiptSettings = (settings) => {
    setState(prev => ({
      ...prev,
      receiptSettings: { ...prev.receiptSettings, ...settings },
    }));
  };

  const updateDisplaySettings = (settings) => {
    setState(prev => ({
      ...prev,
      displaySettings: { ...prev.displaySettings, ...settings },
    }));
  };

  // Product creation from purchase
  const createProductFromPurchase = (purchaseData) => {
    const product = {
      id: `prod-${Date.now()}`,
      name: purchaseData.name || '',
      category: purchaseData.category || 'General',
      barcode: purchaseData.barcode || '',
      supplierId: purchaseData.supplierId || '',
      quantity: Number(purchaseData.quantity || 0),
      buyPrice: Number(purchaseData.buyPrice || 0),
      sellPrice: Number(purchaseData.sellPrice || 0),
      expiryDate: purchaseData.expiryDate || '',
      imageUrl: purchaseData.imageUrl || '',
      lowStockThreshold: Number(purchaseData.lowStockThreshold || 5),
      variants: Array.isArray(purchaseData.variants) ? purchaseData.variants : [],
      batches: Array.isArray(purchaseData.batches) ? purchaseData.batches : [],
      serialNumbers: Array.isArray(purchaseData.serialNumbers) ? purchaseData.serialNumbers : [],
      history: [{ type: 'created', at: new Date().toISOString(), by: 'system' }],
    };
    
    addProduct(product);
    return product;
  };

  // Payment handlers (placeholder)
  const addPayment = (payment) => {
    const normalized = {
      id: payment.id || `pay-${Date.now()}`,
      customerId: payment.customerId || '',
      amount: Number(payment.amount || 0),
      paymentDate: payment.paymentDate || new Date().toISOString(),
      method: payment.method || 'Cash',
      notes: payment.notes || '',
      createdAt: payment.createdAt || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, payments: [...(prev.payments || []), normalized] }));
    return normalized;
  };

  const updatePayment = (updated) => {
    setState(prev => ({
      ...prev,
      payments: (prev.payments || []).map(p => p.id === updated.id ? { ...p, ...updated } : p),
    }));
  };

  const deletePayment = (id) => {
    setState(prev => ({
      ...prev,
      payments: (prev.payments || []).filter(p => p.id !== id),
    }));
  };

  // Debt handlers (placeholder)
  const addDebt = (debt) => {
    const normalized = {
      id: debt.id || `debt-${Date.now()}`,
      customerId: debt.customerId || '',
      amount: Number(debt.amount || 0),
      description: debt.description || '',
      dueDate: debt.dueDate || new Date().toISOString(),
      status: debt.status || 'PENDING',
      createdAt: debt.createdAt || new Date().toISOString(),
    };
    setState(prev => ({ ...prev, debts: [...(prev.debts || []), normalized] }));
    return normalized;
  };

  const updateDebt = (updated) => {
    setState(prev => ({
      ...prev,
      debts: (prev.debts || []).map(d => d.id === updated.id ? { ...d, ...updated } : d),
    }));
  };

  const deleteDebt = (id) => {
    setState(prev => ({
      ...prev,
      debts: (prev.debts || []).filter(d => d.id !== id),
    }));
  };

  return (
    <DataContext.Provider
      value={{
        data: state,
        loading: state.loading,
        error: state.error,
        loadData,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        // Expenses
        addExpense,
        updateExpense,
        deleteExpense,
        setExpenseStatus,
        addExpenseCategory,
        deleteExpenseCategoryById,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        processRecurringExpenses,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        receivePurchaseOrder,
        addPurchasePayment,
        updateBusinessSettings,
        updateReceiptSettings,
        updateDisplaySettings,
        createProductFromPurchase,
        addPayment,
        updatePayment,
        deletePayment,
        addDebt,
        updateDebt,
        deleteDebt,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
