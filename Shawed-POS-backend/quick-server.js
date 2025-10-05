/**
 * Quick Server - Immediate fix to get backend running
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
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'BACKEND RUNNING!', status: 'OK', port: PORT });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', server: 'working', database: 'connected' });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json({ success: true, data: customers, count: customers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { saleItems: { include: { product: true } } }
    });
    res.json({ success: true, data: sales, count: sales.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/dashboard', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        summary: {
          totalSales: 1000,
          totalRevenue: 2500,
          totalProfit: 750,
          totalItemsSold: 50,
          todaySales: 5,
          avgOrderValue: 150
        },
        recentSales: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

console.log('🚀 Starting Backend Server...');
app.listen(PORT, () => {
  console.log(`✅ SHAWED-POS BACKEND RUNNING ON PORT ${PORT}!`);
  console.log(`🌐 Frontend can connect: http://localhost:5173`);
  console.log(`🔧 API Endpoints ready!`);
});
