/**
 * Quick Development Server - PostgreSQL + Express
 * Simple standalone server for Frontend-Backend testing
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 5000;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres123@localhost:5432/Shawed-POS"
    }
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Test database connection
async function testDb() {
  try {
    await prisma.$connect();
    console.log('🗄️ Connected to PostgreSQL Shawed-POS database');
    
    const [users, products, customers] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.customer.count()
    ]);
    
    console.log(`   Users: ${users}`);
    console.log(`   Products: ${products}`);
    console.log(`   Customers: ${customers}`);
  } catch (error) {
    console.log('⚠️ Database not connected:', error.message);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Shawed-POS Backend Server',
    status: 'Running',
    database: 'PostgreSQL',
    endpoints: ['/api/products', '/api/customers', '/api/sales', '/api/auth/login']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, barcode, quantity, buyPrice, sellPrice, supplierId } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Product name and category are required'
      });
    }

    const product = await prisma.product.create({
      data: {
        id: `prod-${Date.now()}`,
        name,
        category,
        barcode: barcode || null,
        quantity: parseInt(quantity) || 0,
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        supplierId: supplierId || null,
        lowStockThreshold: 5
      }
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/customers', async (req, res) => {
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
        id: `cust-${Date.now()}`,
        name,
        phone: phone || null,
        address: address || null,
        email: email || null,
        balance: 0.0
      }
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
});

// Auth API - Simple login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
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
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Sales API
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
        saleItems: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    console.error('Sales error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Start server
async function start() {
  await testDb();
  
  app.listen(PORT, () => {
    console.log(`
🚀 SHAWED-POS BACKEND SERVER STARTED!
📍 URL: http://localhost:${PORT}
🗄️ Database: PostgreSQL (Shawed-POS)
🔗 Frontend: http://localhost:5173
💊 API Ready: /api/products, /api/customers, /api/sales, /api/auth/login
⚡ Status: WORKING - Frontend can connect!
    `);
  });
}

start().catch(console.error);

// Shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
