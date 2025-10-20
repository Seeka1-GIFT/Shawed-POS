/**
 * Complete Backend Server with All API Endpoints
 * SQLite database integration with comprehensive functionality
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

// Products API
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Getting products...');
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${products.length} products`);
    
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

app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Creating product...');
    const productData = req.body;
    
    const product = await prisma.product.create({
      data: {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: productData.name,
        category: productData.category || 'General',
        barcode: productData.barcode || '',
        quantity: parseInt(productData.quantity || 0),
        buyPrice: parseFloat(productData.buyPrice || 0),
        sellPrice: parseFloat(productData.sellPrice || 0),
        expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : null,
        supplierId: productData.supplierId || null,
        lowStockThreshold: parseInt(productData.lowStockThreshold || 5)
      }
    });

    console.log('✅ Product created successfully:', product.id);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('❌ createProduct error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Suppliers API
app.get('/api/suppliers', async (req, res) => {
  try {
    console.log('🏪 Getting suppliers...');
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Found ${suppliers.length} suppliers`);
    
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

app.post('/api/suppliers', async (req, res) => {
  try {
    console.log('🏪 Creating supplier...');
    const supplierData = req.body;
    
    const supplier = await prisma.supplier.create({
      data: {
        id: `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: supplierData.name,
        phone: supplierData.phone || '',
        address: supplierData.address || '',
        email: supplierData.email || ''
      }
    });

    console.log('✅ Supplier created successfully:', supplier.id);
    
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('❌ createSupplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    });
  }
});

// Sales API
app.get('/api/sales', async (req, res) => {
  try {
    console.log('💰 Getting sales...');
    const sales = await prisma.sale.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        saleItems: {
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
      orderBy: { saleDate: 'desc' }
    });

    console.log(`✅ Found ${sales.length} sales`);
    
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

app.post('/api/sales', async (req, res) => {
  try {
    console.log('💰 Creating sale...');
    const saleData = req.body;
    
    const sale = await prisma.sale.create({
      data: {
        id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total: parseFloat(saleData.total || 0),
        discount: parseFloat(saleData.discount || 0),
        tax: parseFloat(saleData.tax || 0),
        paymentMethod: saleData.paymentMethod || 'Cash',
        customerId: saleData.customerId || null,
        saleItems: {
          create: (saleData.items || []).map(item => ({
            productId: item.productId,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            total: parseFloat(item.total)
          }))
        }
      },
      include: {
        saleItems: {
          include: {
            product: true
          }
        }
      }
    });

    console.log('✅ Sale created successfully:', sale.id);
    
    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    console.error('❌ createSale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sale',
      error: error.message
    });
  }
});

// Expenses API
app.get('/api/expenses', async (req, res) => {
  try {
    console.log('📊 Getting expenses...');
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });

    console.log(`✅ Found ${expenses.length} expenses`);
    
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

app.post('/api/expenses', async (req, res) => {
  try {
    console.log('📊 Creating expense...');
    const expenseData = req.body;
    
    const expense = await prisma.expense.create({
      data: {
        id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount || 0),
        category: expenseData.category || 'General',
        date: expenseData.date ? new Date(expenseData.date) : new Date()
      }
    });

    console.log('✅ Expense created successfully:', expense.id);
    
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('❌ createExpense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
});

// Customers API
app.get('/api/customers', async (req, res) => {
  try {
    console.log('👥 Getting customers...');
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${customers.length} customers`);
    
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

app.post('/api/customers', async (req, res) => {
  try {
    console.log('👥 Creating customer...');
    const customerData = req.body;
    
    const customer = await prisma.customer.create({
      data: {
        id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: customerData.name,
        phone: customerData.phone || '',
        address: customerData.address || '',
        email: customerData.email || '',
        balance: parseFloat(customerData.balance || 0)
      }
    });

    console.log('✅ Customer created successfully:', customer.id);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('❌ createCustomer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

// Purchase Orders API
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
        res.status(400).json({ success: false, message: 'Invalid items payload' });
        return;
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

// Reports API
app.get('/api/reports', async (req, res) => {
  try {
    console.log('📈 Getting reports data...');
    
    const [sales, expenses, products, customers, suppliers, purchaseOrders] = await Promise.all([
      prisma.sale.findMany(),
      prisma.expense.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.purchaseOrder.findMany()
    ]);

    // Calculate dashboard statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const salesToday = sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const totalSalesToday = salesToday.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalExpensesToday = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    }).reduce((sum, expense) => sum + Number(expense.amount), 0);

    const lowStockProducts = products.filter(product => product.quantity <= product.lowStockThreshold);

    res.json({
      success: true,
      data: {
        sales,
        expenses,
        products,
        customers,
        suppliers,
        purchaseOrders,
        dashboard: {
          salesToday: totalSalesToday,
          profitToday: totalSalesToday - totalExpensesToday,
          totalProducts: products.length,
          lowStockCount: lowStockProducts.length,
          totalSales: sales.reduce((sum, sale) => sum + Number(sale.total), 0),
          totalExpenses: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
        }
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
  console.log(`🚀 Shawed-POS Complete Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: http://localhost:5173`);
  console.log(`📦 Available endpoints:`);
  console.log(`   - GET  /api/products`);
  console.log(`   - POST /api/products`);
  console.log(`   - GET  /api/suppliers`);
  console.log(`   - POST /api/suppliers`);
  console.log(`   - GET  /api/sales`);
  console.log(`   - POST /api/sales`);
  console.log(`   - GET  /api/expenses`);
  console.log(`   - POST /api/expenses`);
  console.log(`   - GET  /api/customers`);
  console.log(`   - POST /api/customers`);
  console.log(`   - GET  /api/purchase-orders`);
  console.log(`   - POST /api/purchase-orders`);
  console.log(`   - GET  /api/reports`);
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
