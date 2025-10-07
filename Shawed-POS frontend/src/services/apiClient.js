// Unified API Client for centralized request handling
class ApiClient {
  constructor(baseURL = 'https://shawed-pos.onrender.com/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Build request headers
  buildHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: this.buildHeaders(options.headers),
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-OK responses
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

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth endpoints
  async login(credentials) {
    return this.post('/auth/login', credentials);
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async getMe() {
    return this.get('/auth/me');
  }

  // Products endpoints
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.post('/products', productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  async getLowStockProducts(threshold = 5) {
    return this.get(`/products/low-stock?threshold=${threshold}`);
  }

  // Customers endpoints
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomer(id) {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(customerData) {
    return this.post('/customers', customerData);
  }

  async updateCustomer(id, customerData) {
    return this.put(`/customers/${id}`, customerData);
  }

  async deleteCustomer(id) {
    return this.delete(`/customers/${id}`);
  }

  // Sales endpoints
  async getSales(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getSale(id) {
    return this.get(`/sales/${id}`);
  }

  async createSale(saleData) {
    return this.post('/sales', saleData);
  }

  async updateSale(id, saleData) {
    return this.put(`/sales/${id}`, saleData);
  }

  async deleteSale(id) {
    return this.delete(`/sales/${id}`);
  }

  // Expenses endpoints
  async getExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/expenses${queryString ? `?${queryString}` : ''}`);
  }

  async getExpense(id) {
    return this.get(`/expenses/${id}`);
  }

  async createExpense(expenseData) {
    return this.post('/expenses', expenseData);
  }

  async updateExpense(id, expenseData) {
    return this.put(`/expenses/${id}`, expenseData);
  }

  async deleteExpense(id) {
    return this.delete(`/expenses/${id}`);
  }

  // Suppliers endpoints
  async getSuppliers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/suppliers${queryString ? `?${queryString}` : ''}`);
  }

  async getSupplier(id) {
    return this.get(`/suppliers/${id}`);
  }

  async createSupplier(supplierData) {
    return this.post('/suppliers', supplierData);
  }

  async updateSupplier(id, supplierData) {
    return this.put(`/suppliers/${id}`, supplierData);
  }

  async deleteSupplier(id) {
    return this.delete(`/suppliers/${id}`);
  }

  // Reports endpoints
  async getDashboardStats() {
    return this.get('/reports/dashboard');
  }

  async getSalesReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/reports/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getExpenseReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/reports/expenses${queryString ? `?${queryString}` : ''}`);
  }

  async getInventoryReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/reports/inventory${queryString ? `?${queryString}` : ''}`);
  }

  async getProfitLossReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/reports/profit-loss${queryString ? `?${queryString}` : ''}`);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
