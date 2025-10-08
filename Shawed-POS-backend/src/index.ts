import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { protect } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import saleRoutes from './routes/sales';
import expenseRoutes from './routes/expenses';
import supplierRoutes from './routes/suppliers';
import reportRoutes from './routes/reports';
import purchaseOrderRoutes from './routes/purchaseOrders';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://shawed-pos.vercel.app',
    'https://shawed-pos-git-main-shaweds-projects.vercel.app',
    'https://shawed-4k9swnoqs-shaweds-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Shawed-POS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'Configured for Vercel deployment - Updated'
  });
});

// API status endpoint for frontend
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is accessible',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Shawed-POS Backend Server',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/auth',
      '/api/products',
      '/api/customers',
      '/api/sales'
    ]
  });
});

// Test endpoint for debugging supplier creation
app.post('/api/test-supplier', (req, res) => {
  console.log('🧪 Test endpoint called with body:', req.body);
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    receivedData: req.body
  });
});

// Test endpoint for debugging expense creation
app.post('/api/test-expense', async (req, res) => {
  try {
    console.log('🧪 Test expense endpoint called with body:', req.body);
    
    const { description, category, amount, date } = req.body;
    
    if (!description || !category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Test Prisma connection - use the existing prisma instance
    
    const expense = await prisma.expense.create({
      data: {
        description,
        category,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date()
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Test expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('❌ Test expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Test expense failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Public for now - can be made protected later
app.use('/api/customers', customerRoutes); // Public for now - can be made protected later
app.use('/api/sales', saleRoutes); // Temporarily made public for testing
app.use('/api/expenses', expenseRoutes); // Temporarily made public for testing
app.use('/api/suppliers', supplierRoutes); // Temporarily made public for testing
app.use('/api/purchase-orders', purchaseOrderRoutes); // Temporarily made public for testing
app.use('/api/reports', reportRoutes); // Temporarily made public for testing

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Shawed-POS Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

