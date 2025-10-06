// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shawed-pos.onrender.com/api';

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
    return this.request('/products');
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

  createExpense = async (expenseData, token) => {
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