const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Basic routes for testing
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Shawed-POS Backend Server',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Backend is healthy',
    status: 'OK',
    uptime: process.uptime()
  });
});

// API test endpoints with simulated data
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    endpoints: [
      '/api/products/test',
      '/api/customers/test', 
      '/api/sales/test',
      '/api/auth/test'
    ]
  });
});

// Products API with simulated data
let products = [
  {
    id: '1',
    name: 'Premium Soft Drink',
    category: 'Beverages',
    barcode: '037551000340',
    quantity: 50,
    purchasePrice: 2.50,
    sellingPrice: 4.99,
    expiryDate: '2025-12-31',
    supplierId: '',
    lowStockThreshold: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Healthy Energy Bars:',
    category: 'Snacks',
    barcode: '123456789012',
    quantity: 25,
    purchasePrice: 1.80,
    sellingPrice: 3.50,
    expiryDate: '2025-08-31',
    supplierId: '',
    lowStockThreshold: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Organic Apple Juice',
    category: 'Beverages',
    barcode: '987654321098',
    quantity: 30,
    purchasePrice: 3.20,
    sellingPrice: 6.99,
    expiryDate: '2025-11-30',
    supplierId: '',
    lowStockThreshold: 8,
    createdAt: new Date().toISOString()
  }
];

app.route('/api/products/test')
  .get((req, res) => {
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  })
  .post((req, res) => {
    const newProduct = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    res.status(201).json({
      success: true,
      data: newProduct
    });
  })
  .put((req, res) => {
    const { id, ...updateData } = req.body;
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    products[index] = { ...products[index], ...updateData };
    res.json({
      success: true,
      data: products[index]
    });
  })
  .delete((req, res) => {
    const { id } = req.body;
    products = products.filter(p => p.id !== id);
    res.json({
      success: true,
      message: 'Product deleted'
    });
  });

// Customers API with simulated data
let customers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City',
    balance: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+0987654321',
    address: '456 Oak Ave, Town',
    balance: 25.50,
    createdAt: new Date().toISOString()
  }
];

app.route('/api/customers/test')
  .get((req, res) => {
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  })
  .post((req, res) => {
    const newCustomer = {
      id: Date.now().toString(),
      balance: 0,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    res.status(201).json({
      success: true,
      data: newCustomer
    });
  })
  .put((req, res) => {
    const { id, ...updateData } = req.body;
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    customers[index] = { ...customers[index], ...updateData };
    res.json({
      success: true,
      data: customers[index]
    });
  })
  .delete((req, res) => {
    const { id } = req.body;
    customers = customers.filter(c => c.id !== id);
    res.json({
      success: true,
      message: 'Customer deleted'
    });
  });

// Sales API with simulated data
let sales = [
  {
    id: '1',
    customerId: '1',
    total: 15.98,
    discount: 2.00,
    tax: 2.16,
    paymentMethod: 'Cash',
    items: [
      { productId: '1', quantity: 2, price: 4.99, total: 9.98 },
      { productId: '2', quantity: 2, price: 3.50, total: 7.00 }
    ],
    date: new Date().toISOString()
  }
];

app.route('/api/sales/test')
  .get((req, res) => {
    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  })
  .post((req, res) => {
    const saleData = req.body;
    if (saleData.report) {
      // Handle sales report request
      return res.json({
        success: true,
        data: {
          totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
          totalItems: sales.reduce((sum, sale) => sum + sale.items.length, 0),
          averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
          salesByDay: sales.map(sale => ({
            date: sale.date.split('T')[sale.date.split('T').length - 1][0],
            total: sale.total
          }))
        }
      });
    }
    
    const newSale = {
      id: Date.now().toString(),
      ...saleData,
      date: new Date().toISOString()
    };
    sales.push(newSale);
    res.status(201).json({
      success: true,
      data: newSale
    });
  });

// Auth API with simulated data
app.route('/api/auth/test')
  .get((req, res) => {
    // Simulate getting current user
    res.json({
      success: true,
      data: {
        id: '1',
        name: 'Admin User',
        email: 'admin@shawedpos.com',
        role: 'admin'
      }
    });
  })
  .post((req, res) => {
    const { email, password, action } = req.body;
    
    if (action === 'login') {
      // Simple login simulation
      if (email === 'admin@shawedpos.com' && password === 'password123') {
        return res.json({
          success: true,
          data: {
            id: '1',
            name: 'Admin User',
            email: 'admin@shawedpos.com',
            role: 'admin',
            token: 'fake-jwt-token-' + Date.now()
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }
    
    if (action === 'register') {
      // Simple registration simulation
      return res.json({
        success: true,
        data: {
          id: Date.now().toString(),
          name: req.body.name,
          email: req.body.email,
          role: 'user',
          token: 'fake-jwt-token-' + Date.now()
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Auth endpoint reached'
    });
  });

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Shawed-POS Backend Server Started!
📍 URL: http://localhost:${PORT}
🔗 Health: http://localhost:${PORT}/health
🧪 API Test: http://localhost:${PORT}/api/test
⭐ Status: Running and ready for frontend connection
  `);
});

module.exports = app;