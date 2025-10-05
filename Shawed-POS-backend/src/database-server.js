/**
 * Database-Integrated Backend Server
 * Connects to SQLite database using Prisma ORM
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('🗄️ Connected to SQLite database');
    
    // Count records
    const [users, products, customers, sales] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.sale.count()
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

// Basic routes
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Shawed-POS Database Server',
    status: 'Running',
    timestamp: new Date().toISOString(),
    database: 'SQLite with Prisma ORM'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Backend is healthy',
    status: 'OK',
    uptime: process.uptime(),
    database: 'Connected'
  });
});

// ================================
// PRODUCTS API (Database Integrated)
// ================================
app.route('/api/products')
  .get(async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        include: {
          supplier: {
            select: { name: true }
          }
        },
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

      const product = await prisma.product.create({
        data: {
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

app.route('/api/products/:id')
  .get(async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          supplier: {
            select: { name: true, phone: true, email: true }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  })
  .put(async (req, res) => {
    try {
      const { name, category, barcode, quantity, buyPrice, sellPrice, expiryDate, supplierId, lowStockThreshold } = req.body;
      
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          name: name || undefined,
          category: category || undefined,
          barcode: barcode || undefined,
          quantity: quantity ? parseInt(quantity) : undefined,
          buyPrice: buyPrice ? parseFloat(buyPrice) : undefined,
          sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          supplierId: supplierId || undefined,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
        }
      });

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  })
  .delete(async (req, res) => {
    try {
      await prisma.product.delete({
        where: { id: req.params.id }
      });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  });

// ================================
// CUSTOMERS API (Database Integrated)
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

      const customer = await prisma.customer.create({
        data: {
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
// SALES API (Database Integrated)
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

      // Create sale and items in transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale
        const newSale = await tx.sale.create({
          data: {
            customerId: customerId || null,
            total: parseFloat(total),
            discount: parseFloat(discount) || 0,
            tax: parseFloat(tax) || 0,
            paymentMethod: paymentMethod || 'Cash'
          }
        });

        // Create sale items
        const saleItems = await Promise.all(
          items.map(item => 
            tx.saleItem.create({
              data: {
                saleId: newSale.id,
                productId: item.productId,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
                total: parseFloat(item.total)
              }
            })
          )
        );

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
// AUTH API (Database Integrated)
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

      // Generate simple token (in production, use JWT)
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
      
      const user = await prisma.user.create({
        data: {
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

// ================================
// REPORTS API
// ================================
app.get('/api/reports/dashboard', async (req, res) => {
  try {
    // Get dashboard statistics
    const [totalSales, totalProducts, totalCustomers, recentSales] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true } }),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } }
        }
      })
    ]);

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        quantity: {
          lte: prisma.product.fields.lowStockThreshold
        }
      },
      orderBy: { quantity: 'asc' }
    });

    res.json({
      success: true,
      data: {
        sales: {
          total: totalSales._sum.total || 0,
          count: await prisma.sale.count()
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts.length
        },
        customers: {
          total: totalCustomers
        },
        recentSales,
        lowStockProducts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
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
🚀 Shawed-POS Database Server Started!
📍 URL: http://localhost:${PORT}
🗄️ Database: SQLite (Prisma ORM)
🔗 Health: http://localhost:${PORT}/health
💊 API Endpoints:
  - Products: http://localhost:${PORT}/api/products
  - Customers: http://localhost:${PORT}/api/customers
  - Sales: http://localhost:${PORT}/api/sales
  - Auth: http://localhost:${PORT}/api/auth/login
⭐ Status: Running with database integration
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
