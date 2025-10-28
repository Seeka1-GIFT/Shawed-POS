// API service for communicating with the backend
import { API_BASE_URL } from './config';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authorization header if token exists
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            // Keep the default error message
          }
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Products API
  getProducts = async () => {
    const res = await this.request(`/products?ts=${Date.now()}`);

    // Normalize backend payload → frontend shape and numeric types
    const rawProducts = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

    const toNumber = (val) => {
      if (val === null || val === undefined || val === '') return 0;
      // Prisma Decimal comes as string; ensure float
      const n = typeof val === 'string' ? parseFloat(val) : Number(val);
      return Number.isFinite(n) ? n : 0;
    };

    const normalized = rawProducts.map((p) => {
      const buyPrice = toNumber(p.buy_price ?? p.buyPrice);
      const sellPrice = toNumber(p.sell_price ?? p.sellPrice);
      // Compute margin if missing
      const marginPercent = (p.margin_percent ?? p.marginPercent);
      const computedMargin = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        category: p.category ?? '',
        barcode: p.barcode ?? '',
        supplierId: p.supplier_id ?? p.supplierId ?? null,
        supplierName: p.supplier ?? p.supplier_name ?? '',
        quantity: toNumber(p.qty ?? p.quantity),
        buyPrice,
        sellPrice,
        marginPercent: Number.isFinite(toNumber(marginPercent)) ? toNumber(marginPercent) : computedMargin,
        expiryDate: p.expiry ?? p.expiry_date ?? p.expiryDate ?? null,
        imageUrl: p.image_url ?? p.imageUrl ?? null,
        lowStockThreshold: toNumber(p.low_stock_threshold ?? p.lowStockThreshold ?? 5),
        createdAt: p.created_at ?? p.createdAt ?? null,
        updatedAt: p.updated_at ?? p.updatedAt ?? null,
      };
    });

    return { success: true, data: normalized };
  }

  getProduct = async (id) => {
    return this.request(`/products/${id}`);
  }

  createProduct = async (productData) => {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  updateProduct = async (id, productData) => {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  deleteProduct = async (id) => {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  getLowStockProducts = async (threshold = 5) => {
    return this.request(`/products/low-stock?threshold=${threshold}`);
  }

  // Customers API
  getCustomers = async () => {
    return this.request('/customers');
  }

  getCustomer = async (id) => {
    return this.request(`/customers/${id}`);
  }

  createCustomer = async (customerData) => {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  updateCustomer = async (id, customerData) => {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  deleteCustomer = async (id) => {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth API
  register = async (userData) => {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  login = async (credentials) => {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  getMe = async (token) => {
    return this.request('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Sales API (protected routes)
  getSales = async (token) => {
    return this.request('/sales', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  createSale = async (saleData, token) => {
    return this.request('/sales', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });
  }

  // Expenses API (protected routes)
  getExpenses = async (token) => {
    return this.request('/expenses', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  createExpense = async (expenseData) => {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  updateExpense = async (id, expenseData) => {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  deleteExpense = async (id) => {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales API - Missing methods
  updateSale = async (id, saleData, token) => {
    return this.request(`/sales/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });
  }

  deleteSale = async (id, token) => {
    return this.request(`/sales/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  getSale = async (id, token) => {
    return this.request(`/sales/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Suppliers API - Missing methods
  getSuppliers = async (token) => {
    return this.request('/suppliers', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  getSupplier = async (id, token) => {
    return this.request(`/suppliers/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  createSupplier = async (supplierData, token) => {
    return this.request('/suppliers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(supplierData),
    });
  }

  updateSupplier = async (id, supplierData, token) => {
    return this.request(`/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(supplierData),
    });
  }

  deleteSupplier = async (id, token) => {
    return this.request(`/suppliers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Reports API
  getDashboardStats = async (token) => {
    return this.request('/reports/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  getSalesReport = async (token) => {
    return this.request('/reports/sales', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  getExpenseReport = async (token) => {
    return this.request('/reports/expenses', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  getInventoryReport = async (token) => {
    return this.request('/reports/inventory', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  getProfitLossReport = async (token) => {
    return this.request('/reports/profit-loss', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Purchase Orders API
  getPurchaseOrders = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return this.request(`/purchase-orders${query ? `?${query}` : ''}`);
  }

  getPurchaseOrder = async (id) => {
    return this.request(`/purchase-orders/${id}`);
  }

  createPurchaseOrder = async (orderData) => {
    return this.request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  updatePurchaseOrder = async (id, orderData) => {
    return this.request(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  deletePurchaseOrder = async (id) => {
    return this.request(`/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
