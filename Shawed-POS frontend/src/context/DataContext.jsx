import React, { createContext, useState, useEffect } from 'react';

/**
 * DataContext holds all domain data for the application such as
 * products, sales, expenses and customers. It also exposes helper
 * functions to modify the data. The context persists to localStorage
 * so that data isn't lost on refresh.
 */
export const DataContext = createContext();

export function DataProvider({ children }) {
  const DEFAULT_STATE = {
    products: [],
    sales: [],
    // Expenses & Finance
    expenses: [],
    expenseCategories: [
      { id: 'cat-purchases', name: 'Purchases' },
      { id: 'cat-rent', name: 'Rent' },
      { id: 'cat-utilities', name: 'Utilities' },
      { id: 'cat-salaries', name: 'Salaries' },
      { id: 'cat-other', name: 'Other' },
    ],
    recurringExpenses: [], // templates that auto-generate expenses
    paymentMethods: ['Cash', 'Bank Transfer', 'Mobile Money', 'Card'],
    customers: [],
    suppliers: [],
    purchaseOrders: [],
    purchases: [], // Track completed purchases for reporting
    purchasePayments: [], // Payments made towards purchase orders
    payments: [], // Track customer payments
    debts: [], // Track manual customer debts
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
        // Merge with defaults to ensure newly added collections always exist
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

  // Product handlers
  const addProduct = (product) => {
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
      variants: Array.isArray(product.variants) ? product.variants : [], // [{unit, size, color, barcode, qtyPerUnit}]
      batches: Array.isArray(product.batches) ? product.batches : [], // [{batchNo, qty, expiryDate}]
      serialNumbers: Array.isArray(product.serialNumbers) ? product.serialNumbers : [],
      history: [{ type: 'created', at: new Date().toISOString(), by: 'system' }],
    };
    setState((prev) => ({
      ...prev,
      products: [...prev.products, enriched],
    }));
    return enriched;
  };

  const updateProduct = (updated) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== updated.id) return p;
        const next = { ...p, ...updated };
        next.history = [...(p.history || []), { type: 'updated', at: new Date().toISOString(), by: 'system' }];
        return next;
      }),
    }));
  };

  const deleteProduct = (id) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  // Sales handler
  const addSale = (sale) => {
    setState((prev) => ({
      ...prev,
      sales: [...prev.sales, sale],
    }));
  };

  // Expenses handler
  const addExpense = (expense) => {
    const normalized = {
      id: expense.id || `exp-${Date.now()}`,
      description: expense.description || '',
      amount: Number(expense.amount || 0),
      category: expense.category || 'Other',
      date: expense.date || new Date().toISOString().split('T')[0],
      method: expense.method || 'Cash',
      status: expense.status || 'Pending', // Pending | Approved | Rejected
      attachments: Array.isArray(expense.attachments) ? expense.attachments : [],
      notes: expense.notes || '',
      createdAt: expense.createdAt || new Date().toISOString(),
      createdBy: expense.createdBy || (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('shawed-users')||'{}')?.currentUser?.username || 'system') : 'system')
    };

    setState((prev) => ({
      ...prev,
      expenses: [...prev.expenses, normalized],
    }));
    return normalized;
  };

  const updateExpense = (updated) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
    }));
  };

  const deleteExpense = (id) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const setExpenseStatus = (id, status) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, status } : e)),
    }));
  };

  // Expense categories management
  const addExpenseCategory = (name) => {
    const exists = (state.expenseCategories || []).some((c) => c.name.toLowerCase() === String(name).toLowerCase());
    if (exists) return null;
    const cat = { id: `cat-${Date.now()}`, name };
    setState((prev) => ({ ...prev, expenseCategories: [...(prev.expenseCategories || []), cat] }));
    return cat;
  };

  const deleteExpenseCategoryById = (categoryId) => {
    setState((prev) => ({
      ...prev,
      expenseCategories: (prev.expenseCategories || []).filter((c) => c.id !== categoryId),
      expenses: prev.expenses.map((e) => (e.category === categoryId ? { ...e, category: 'Other' } : e)),
    }));
  };

  // Recurring expenses
  // template: { id, description, amount, category, method, frequency: 'weekly'|'monthly', nextDate, attachments }
  const addRecurringExpense = (template) => {
    const normalized = {
      id: template.id || `rexp-${Date.now()}`,
      description: template.description || '',
      amount: Number(template.amount || 0),
      category: template.category || 'Other',
      method: template.method || 'Cash',
      frequency: template.frequency || 'monthly',
      nextDate: template.nextDate || new Date().toISOString().split('T')[0],
      attachments: Array.isArray(template.attachments) ? template.attachments : [],
      active: template.active !== false,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, recurringExpenses: [...(prev.recurringExpenses || []), normalized] }));
    return normalized;
  };

  const updateRecurringExpense = (updated) => {
    setState((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    }));
  };

  const deleteRecurringExpense = (id) => {
    setState((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).filter((r) => r.id !== id),
    }));
  };

  const advanceDate = (dateStr, frequency) => {
    const d = new Date(dateStr);
    if (frequency === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else {
      // monthly default
      d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  const processRecurringExpenses = () => {
    setState((prev) => {
      const today = new Date(); today.setHours(0,0,0,0);
      let changed = false;
      const newExpenses = [...prev.expenses];
      const updatedTemplates = (prev.recurringExpenses || []).map((tpl) => {
        if (!tpl.active) return tpl;
        let next = new Date(tpl.nextDate);
        next.setHours(0,0,0,0);
        let curTpl = { ...tpl };
        while (next <= today) {
          const created = {
            id: `exp-${curTpl.id}-${next.getTime()}`,
            description: curTpl.description,
            amount: curTpl.amount,
            category: curTpl.category,
            date: next.toISOString().split('T')[0],
            method: curTpl.method,
            status: 'Pending',
            attachments: curTpl.attachments || [],
            notes: 'Auto‑generated from recurring template',
            createdAt: new Date().toISOString(),
          };
          // Avoid duplicate creation if exists
          if (!newExpenses.some((e) => e.id === created.id)) {
            newExpenses.push(created);
            changed = true;
          }
          curTpl.nextDate = advanceDate(curTpl.nextDate, curTpl.frequency);
          next = new Date(curTpl.nextDate); next.setHours(0,0,0,0);
        }
        return curTpl;
      });

      if (!changed) return { ...prev, recurringExpenses: updatedTemplates };
      return { ...prev, expenses: newExpenses, recurringExpenses: updatedTemplates };
    });
  };

  // Customers handler
  const addCustomer = (customer) => {
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, customer],
    }));
  };

  // Suppliers handlers
  const addSupplier = (supplier) => {
    setState((prev) => ({
      ...prev,
      suppliers: [...prev.suppliers, { attachments: [], bank: {}, tax: {}, ...supplier }],
    }));
  };

  const updateSupplier = (updated) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
    }));
  };

  const deleteSupplier = (id) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== id),
    }));
  };

  // Purchase Orders handlers with automatic synchronization
  const addPurchaseOrder = (order) => {
    setState((prev) => {
      // Only create order; stock updates on receive
      const updatedPurchaseOrders = [...prev.purchaseOrders, { 
        ...order,
        status: order.status || 'pending',
        amountPaid: order.amountPaid || 0,
        paymentStatus: order.paymentStatus || 'unpaid'
      }];

      // Update supplier aggregates
      const updatedSuppliers = prev.suppliers.map(supplier => {
        if (supplier.id === order.supplierId) {
          return {
            ...supplier,
            lastOrderDate: order.orderDate,
            totalOrders: (supplier.totalOrders || 0) + 1,
            totalSpent: (supplier.totalSpent || 0) + order.totalAmount
          };
        }
        return supplier;
      });
      
      // Add to purchases for reporting as pending
      const purchaseRecord = {
        id: order.id,
        type: 'purchase',
        date: order.orderDate,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        totalAmount: order.totalAmount,
        items: order.items,
        status: order.status || 'pending',
        createdAt: order.createdAt
      };
      
      const updatedPurchases = [...prev.purchases, purchaseRecord];
      
      return {
        ...prev,
        purchaseOrders: updatedPurchaseOrders,
        suppliers: updatedSuppliers,
        purchases: updatedPurchases,
      };
    });
  };

  const updatePurchaseOrder = (updated) => {
    setState((prev) => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map((o) => (o.id === updated.id ? updated : o)),
    }));
  };

  const deletePurchaseOrder = (id) => {
    setState((prev) => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.filter((o) => o.id !== id),
    }));
  };

  const receivePurchaseOrder = (orderId) => {
    setState((prev) => {
      const order = prev.purchaseOrders.find(o => o.id === orderId);
      if (!order) return prev;

      // Update order status
      const updatedOrder = { ...order, status: 'received', receivedDate: new Date().toISOString().split('T')[0] };
      
      // Update product quantities (if not already updated during creation)
      const updatedProducts = prev.products.map(product => {
        const orderItem = order.items.find(item => item.productId === product.id);
        if (orderItem) {
          return { 
            ...product, 
            quantity: product.quantity + orderItem.quantity,
            lastReceivedDate: updatedOrder.receivedDate
          };
        }
        return product;
      });

      // Update purchases record
      const updatedPurchases = prev.purchases.map(purchase => {
        if (purchase.id === orderId) {
          return { ...purchase, status: 'received', receivedDate: updatedOrder.receivedDate };
        }
        return purchase;
      });

      return {
        ...prev,
        purchaseOrders: prev.purchaseOrders.map(o => o.id === orderId ? updatedOrder : o),
        products: updatedProducts,
        purchases: updatedPurchases,
      };
    });
  };

  // Record payment against purchase order
  const addPurchasePayment = (orderId, payment) => {
    setState((prev) => {
      const order = prev.purchaseOrders.find(o => o.id === orderId);
      if (!order) return prev;

      const amountPaid = (order.amountPaid || 0) + payment.amount;
      const balance = Math.max(0, (order.totalAmount || 0) - amountPaid);
      const paymentStatus = balance <= 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid');

      const updatedOrders = prev.purchaseOrders.map(o => o.id === orderId ? { ...o, amountPaid, paymentStatus } : o);

      // Save payment record
      const paymentRecord = { id: `pp-${Date.now()}`, orderId, supplierId: order.supplierId, supplierName: order.supplierName, date: new Date().toISOString(), ...payment };

      // Optionally log as expense for cash flow
      const expense = { id: `exp-${Date.now()}`, date: payment.date || new Date().toISOString().split('T')[0], amount: payment.amount, category: 'Purchases', description: `Payment for PO ${orderId}`, method: payment.method || 'Bank Transfer', status: 'Approved' };

      return {
        ...prev,
        purchaseOrders: updatedOrders,
        purchasePayments: [...prev.purchasePayments, paymentRecord],
        expenses: [...prev.expenses, expense]
      };
    });
  };

  // Business Settings handlers
  const updateBusinessSettings = (settings) => {
    setState((prev) => ({
      ...prev,
      businessSettings: { ...prev.businessSettings, ...settings },
    }));
  };

  // Receipt Settings handlers
  const updateReceiptSettings = (settings) => {
    setState((prev) => ({
      ...prev,
      receiptSettings: { ...prev.receiptSettings, ...settings },
    }));
  };

  // Display Settings handlers
  const updateDisplaySettings = (settings) => {
    setState((prev) => ({
      ...prev,
      displaySettings: { ...prev.displaySettings, ...settings },
    }));
  };

  // Payment handlers
  const addPayment = (payment) => {
    setState((prev) => ({
      ...prev,
      payments: [...prev.payments, payment],
    }));
  };

  const updatePayment = (updated) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const deletePayment = (id) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  };

  // Debt handlers
  const addDebt = (debt) => {
    setState((prev) => ({
      ...prev,
      debts: [...prev.debts, debt],
    }));
  };

  const updateDebt = (updated) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === updated.id ? updated : d)),
    }));
  };

  const deleteDebt = (id) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  // Helper function to create new product from purchase order
  const createProductFromPurchase = (productName, orderId) => {
    const newProduct = {
      id: `new-${Date.now()}`,
      name: productName,
      category: 'General',
      quantity: 0, // Will be updated when order is processed
      sellingPrice: 0,
      purchasePrice: 0,
      description: `Product created from purchase order ${orderId}`,
      sku: `SKU-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdFromPurchase: true,
      originalOrderId: orderId
    };
    
    setState((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
    
    return newProduct;
  };

  return (
    <DataContext.Provider
      value={{
        data: state,
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
