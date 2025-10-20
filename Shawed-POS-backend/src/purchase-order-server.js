/**
 * Working Backend Server with Purchase Orders Support
 * SQLite database integration with all endpoints
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 5000;

// Initialize Prisma with SQLite
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Shawed-POS Backend Server',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

// Purchase Orders Routes
app.get('/api/purchase-orders', async (req, res) => {
  try {
    console.log('📦 Getting purchase orders...');
    
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    console.log(`✅ Found ${purchaseOrders.length} purchase orders`);
    
    res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('❌ getPurchaseOrders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    console.log('📦 Creating purchase order...');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    let {
      supplierId,
      items,
      totalAmount,
      orderDate,
      expectedDate,
      status = 'pending',
      notes
    } = req.body;

    // Handle cases where body was sent as x-www-form-urlencoded
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('❌ Failed to parse items JSON string:', items);
        return res.status(400).json({ success: false, message: 'Invalid items payload' });
      }
    }
    if (typeof totalAmount === 'string') {
      totalAmount = parseFloat(totalAmount);
    }

    // Validate required fields
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Supplier ID and items are required'
      });
      return;
    }

    // Generate unique ID
    const orderId = `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create purchase order with items in transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Create purchase order
      const newOrder = await tx.purchaseOrder.create({
        data: {
          id: orderId,
          supplierId,
          totalAmount: parseFloat(totalAmount),
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          status,
          notes
        }
      });

      // Create purchase order items
      const orderItems = await Promise.all(
        items.map((item) => 
          tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: orderId,
              productId: item.productId,
              quantity: parseInt(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.unitPrice) * parseInt(item.quantity)
            }
          })
        )
      );

      return { ...newOrder, items: orderItems };
    });

    console.log('✅ Purchase order created successfully:', purchaseOrder.id);
    
    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('❌ createPurchaseOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
});

// Suppliers endpoint
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('❌ getSuppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
});

// Products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ getProducts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Sales endpoint
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        saleItems: {
          include: {
            product: true
          }
        }
      }
    });
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('❌ getSales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
      error: error.message
    });
  }
});

// Expenses endpoint
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany();
    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('❌ getExpenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
});

// Customers endpoint
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('❌ getCustomers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// Reports endpoint
app.get('/api/reports', async (req, res) => {
  try {
    const [sales, expenses, products] = await Promise.all([
      prisma.sale.findMany(),
      prisma.expense.findMany(),
      prisma.product.findMany()
    ]);

    res.json({
      success: true,
      data: {
        sales,
        expenses,
        products
      }
    });
  } catch (error) {
    console.error('❌ getReports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Shawed-POS Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: http://localhost:5173`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
