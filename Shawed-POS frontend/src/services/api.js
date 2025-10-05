// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shawed-pos.onrender.com/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

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
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getLowStockProducts(threshold = 5) {
    return this.request(`/products/low-stock?threshold=${threshold}`);
  }

  // Customers API
  async getCustomers() {
    return this.request('/customers');
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth API
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe(token) {
    return this.request('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Sales API (protected routes)
  async getSales(token) {
    return this.request('/sales', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createSale(saleData, token) {
    return this.request('/sales', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });
  }

  // Expenses API (protected routes)
  async getExpenses(token) {
    return this.request('/expenses', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createExpense(expenseData, token) {
    return this.request('/expenses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    });
  }
}

export const apiService = new ApiService();
export default apiService;