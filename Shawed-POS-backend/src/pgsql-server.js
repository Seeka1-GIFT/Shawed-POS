/**
 * PostgreSQL-Integrated Backend Server
 * Connects to PostgreSQL database using Prisma ORM
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('🗄️ Connected to PostgreSQL Shawed-POS database');
    
    // Count records
    const [users, products, customers, sales] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.sale.count(),
    ]);
    
    console.log(`📊 Database Stats:`);
    console.log(`   Users: ${users}`);
    console.log(`   Products: ${products}`);
    console.log(`   Customers: ${customers}`);
    console.log(`   Sales: ${sales}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Shawed-POS PostgreSQL Server',
    status: 'Running',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL with Prisma ORM'
  });
});

// ================================
// PRODUCTS API
// ================================
app.route('/api/products')
  .get(async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        include: { supplier: true },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  })
  .post(async (req, res) => {
    try {
      const { name, category, barcode, quantity, buyPrice, sellPrice, expiryDate, supplierId, lowStockThreshold } = req.body;
      
      if (!name || !category) {
        return res.status(400).json({
          success: false,
          message: 'Product name and category are required'
        });
      }

      // Generate simple ID
      const productId = `prod-${Date.now()}`;
      
      const product = await prisma.product.create({
        data: {
          id: productId,
          name,
          category,
          barcode: barcode || null,
          quantity: parseInt(quantity) || 0,
          buyPrice: parseFloat(buyPrice) || 0,
          sellPrice: parseFloat(sellPrice) || 0,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          supplierId: supplierId || null,
          lowStockThreshold: parseInt(lowStockThreshold) || 5,
        }
      });

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  });

// ================================
// CUSTOMERS API
// ================================
app.route('/api/customers')
  .get(async (req, res) => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      res.json({
        success: true,
        count: customers.length,
        data: customers
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  })
  .post(async (req, res) => {
    try {
      const { name, phone, address, email } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Customer name is required'
        });
      }

      const customerId = `cust-${Date.now()}`;

      const customer = await prisma.customer.create({
        data: {
          id: customerId,
          name,
          phone: phone || null,
          address: address || null,
          email: email || null,
          balance: 0.0
        }
      });

      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
      });
    }
  });

// ================================
// SALES API
// ================================
app.route('/api/sales')
  .get(async (req, res) => {
    try {
      const sales = await prisma.sale.findMany({
        include: {
          customer: {
            select: { name: true, phone: true }
          },
          saleItems: {
            include: {
              product: {
                select: { name: true, sellPrice: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json({
        success: true,
        count: sales.length,
        data: sales
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales',
        error: error.message
      });
    }
  })
  .post(async (req, res) => {
    try {
      const { customerId, items, total, discount, tax, paymentMethod } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Sale items are required'
        });
      }

      const saleId = `sale-${Date.now()}`;

      // Create sale and items in transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale
        const newSale = await tx.sale.create({
          data: {
            id: saleId,
            customerId: customerId || null,
            total: parseFloat(total),
            discount: parseFloat(discount) || 0,
            tax: parseFloat(tax) || 0,
            paymentMethod: paymentMethod || 'Cash'
          }
        });

        // Create sale items
        const saleItems = [];
        for (const item of items) {
          const itemId = `item-${Date.now()}-${Math.random()}`;
          const saleItem = await tx.saleItem.create({
            data: {
              id: itemId,
              saleId: newSale.id,
              productId: item.productId,
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              total: parseFloat(item.total)
            }
          });
          saleItems.push(saleItem);
        }

        return { ...newSale, saleItems };
      });

      res.status(201).json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sale',
        error: error.message
      });
    }
  });

// ================================
// AUTH API
// ================================
app.route('/api/auth/login')
  .post(async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = `token_${user.id}_${Date.now()}`;

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  });

app.route('/api/auth/register')
  .post(async (req, res) => {
    try {
      const { name, email, password, role = 'USER' } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `user-${Date.now()}`;
      
      const user = await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          password: hashedPassword,
          role
        }
      });

      const token = `token_${user.id}_${Date.now()}`;

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token
        }
      });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.log('⚠️ Starting server without database connection...');
  }

  app.listen(PORT, () => {
    console.log(`
🚀 Shawed-POS PostgreSQL Server Started!
📍 URL: http://localhost:${PORT}
🗄️ Database: PostgreSQL (Prisma ORM)
🔗 Health: http://localhost:${PORT}/health
💊 API Endpoints:
  - Products: http://localhost:${PORT}/api/products
  - Customers: http://localhost:${PORT}/api/customers
  - Sales: http://localhost:${PORT}/api/sales
  - Auth: http://localhost:${PORT}/api/auth/login
⭐ Status: Running with PostgreSQL backend
    `);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
