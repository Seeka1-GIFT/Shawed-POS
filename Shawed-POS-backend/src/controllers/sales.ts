/**
 * Sales Controller - PostgreSQL Integration
 * Real database operations for sales and transactions
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';

// Get all sales
export const getSales = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔍 getSales called with query:', req.query);
    
    const { 
      startDate, 
      endDate, 
      customerId, 
      paymentMethod, 
      page = '1', 
      limit = '10' 
    } = req.query;
  
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;
  
  const where: any = {};
  
  if (startDate && endDate) {
    where.saleDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }
  
  if (customerId) {
    where.customerId = customerId as string;
  }
  
  if (paymentMethod) {
    where.paymentMethod = paymentMethod as string;
  }

  const sales = await prisma.sale.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { saleDate: 'desc' },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      saleItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              sellPrice: true
            }
          }
        }
      }
    }
  });

  const total = await prisma.sale.count({ where });

    console.log(`✅ getSales successful: ${sales.length} sales found`);
    
    res.json({
      success: true,
      count: sales.length,
      total,
      page: pageNum,
      limit: limitNum,
      data: sales
    });
  } catch (error) {
    console.error('❌ getSales error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single sale
export const getSale = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Sale ID is required'
    });
    return;
  }

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      saleItems: {
        include: {
          product: true
        }
      }
    }
  });

  if (!sale) {
    res.status(404).json({
      success: false,
      message: 'Sale not found'
    });
    return;
  }

  res.json({
    success: true,
    data: sale
  });
});

// Create new sale
export const createSale = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🛒 CREATE SALE: Starting sale creation process');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    customerId,
    items,
    discount = 0,
    tax = 0,
    paymentMethod = 'Cash'
  } = req.body;

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log('❌ CREATE SALE: No items provided');
    res.status(400).json({
      success: false,
      message: 'Sale items are required'
    });
    return;
  }

  console.log(`📦 CREATE SALE: Processing ${items.length} items`);

  // Validate each item
  for (const item of items) {
    if (!item.productId || !item.quantity || !item.price) {
      console.log('❌ CREATE SALE: Invalid item data:', item);
      res.status(400).json({
        success: false,
        message: 'All items must have productId, quantity, and price'
      });
      return;
    }

    // Check if product exists and has stock
    console.log(`🔍 CREATE SALE: Checking product ${item.productId}`);
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    if (!product) {
      console.log(`❌ CREATE SALE: Product ${item.productId} not found`);
      res.status(400).json({
        success: false,
        message: `Product ${item.productId} not found`
      });
      return;
    }

    console.log(`✅ CREATE SALE: Product found - ${product.name}, Stock: ${product.quantity}, Required: ${item.quantity}`);

    if (product.quantity < parseInt(item.quantity)) {
      console.log(`❌ CREATE SALE: Insufficient stock for ${product.name}`);
      res.status(400).json({
        success: false,
        message: `Insufficient stock for product ${product.name}. Available: ${product.quantity}`
      });
      return;
    }
  }

  // Calculate totals
  const itemsTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
  const total = itemsTotal + parseFloat(tax) - parseFloat(discount);

  console.log(`💰 CREATE SALE: Calculated totals - Items: $${itemsTotal}, Tax: $${tax}, Discount: $${discount}, Total: $${total}`);

  // Generate unique ID
  const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🆔 CREATE SALE: Generated sale ID: ${saleId}`);

  // Create sale and update inventory in transaction
  console.log('🔄 CREATE SALE: Starting database transaction');
  const sale = await prisma.$transaction(async (tx) => {
    console.log('📝 CREATE SALE: Creating sale record');
    // Create sale
    const newSale = await tx.sale.create({
      data: {
        id: saleId,
        customerId: customerId || null,
        total,
        discount: parseFloat(discount),
        tax: parseFloat(tax),
        paymentMethod,
        saleDate: new Date()
      }
    });

    console.log('✅ CREATE SALE: Sale record created:', newSale.id);

    // Create sale items and update inventory
    const saleItems = [];
    for (const item of items) {
      console.log(`🔄 CREATE SALE: Processing item ${item.productId}`);
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (product) {
        console.log(`📦 CREATE SALE: Updating stock for ${product.name} from ${product.quantity} to ${product.quantity - parseInt(item.quantity)}`);
        // Update product quantity
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: product.quantity - parseInt(item.quantity)
          }
        });

        // Create sale item
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const saleItemtotal = parseFloat(item.price) * parseInt(item.quantity);
        
        console.log(`📝 CREATE SALE: Creating sale item ${itemId} for product ${product.name}`);
        const saleItem = await tx.saleItem.create({
          data: {
            id: itemId,
            saleId: newSale.id,
            productId: item.productId,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            total: saleItemtotal
          }
        });

        console.log('✅ CREATE SALE: Sale item created:', saleItem.id);
        saleItems.push(saleItem);
      }
    }

    console.log(`✅ CREATE SALE: Transaction completed - ${saleItems.length} items processed`);
    return {
      ...newSale,
      saleItems: saleItems.map(item => ({ ...item, product: items.find(i => i.productId === item.productId)?.product }))
    };
  });

  console.log('🎉 CREATE SALE: Sale creation successful:', sale.id);
  res.status(201).json({
    success: true,
    message: 'Sale created successfully',
    data: sale
  });
  } catch (error: any) {
    console.error('❌ CREATE SALE: Error occurred:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      meta: (error as any)?.meta,
      stack: error?.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create sale',
      error: error?.message,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
});

// Update sale
export const updateSale = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { discount, tax, paymentMethod, status } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Sale ID is required'
    });
    return;
  }

  // Check if sale exists
  const existingSale = await prisma.sale.findUnique({
    where: { id }
  });

  if (!existingSale) {
    res.status(404).json({
      success: false,
      message: 'Sale not found'
    });
    return;
  }

  const updateData: any = {};
  
  if (discount !== undefined) updateData.discount = parseFloat(discount);
  if (tax !== undefined) updateData.tax = parseFloat(tax);
  if (paymentMethod) updateData.paymentMethod = paymentMethod;

  const sale = await prisma.sale.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      saleItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              sellPrice: true
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Sale updated successfully',
    data: sale
  });
});

// Delete sale (restore inventory)
export const deleteSale = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Sale ID is required'
    });
    return;
  }

  // Check if sale exists
  const existingSale = await prisma.sale.findUnique({
    where: { id },
    include: {
      saleItems: true
    }
  });

  if (!existingSale) {
    res.status(404).json({
      success: false,
      message: 'Sale not found'
    });
    return;
  }

  // Restore inventory and delete sale in transaction
  await prisma.$transaction(async (tx) => {
    // Restore inventory for each item
    for (const saleItem of existingSale.saleItems) {
      await tx.product.update({
        where: { id: saleItem.productId },
        data: {
          quantity: {
            increment: saleItem.quantity
          }
        }
      });
    }

    // Delete sale (this will cascade delete sale items)
    await tx.sale.delete({
      where: { id }
    });
  });

  res.json({
    success: true,
    message: 'Sale deleted successfully and inventory restored'
  });
});

// Get sales report/dashboard data
export const getSalesReport = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter.saleDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  // Get summary data
  const [
    totalSales,
    totalRevenue,
    totalItemsSold,
    todaySales,
    salesLast7Days
  ] = await Promise.all([
    prisma.sale.count({ where: dateFilter }),
    prisma.sale.aggregate({
      where: dateFilter,
      _sum: { total: true }
    }),
    prisma.saleItem.aggregate({
      _sum: { quantity: true }
    }),
    prisma.sale.count({
      where: {
        saleDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.sale.groupBy({
      by: ['saleDate'],
      _sum: { total: true },
      _count: { id: true },
      where: {
        saleDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { saleDate: 'asc' }
    })
  ]);

  // Calculate profit (simplified: sellPrice - buyPrice for sold items)
  const profitQuery = await prisma.saleItem.findMany({
    where: {
      sale: dateFilter
    },
    include: {
      product: {
        select: {
          buyPrice: true,
          sellPrice: true
        }
      }
    }
  });

  const totalProfit = profitQuery.reduce((sum, item) => {
    const itemProfit = parseFloat(item.product.sellPrice.toString()) - parseFloat(item.product.buyPrice.toString());
    return sum + (itemProfit * item.quantity);
  }, 0);

  res.json({
    success: true,
    data: {
      summary: {
        totalSales,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProfit,
        totalItemsSold: totalItemsSold._sum.quantity || 0,
        todaySales,
        avgOrderValue: totalSales > 0 ? parseFloat((totalRevenue._sum.total || 0).toString()) / totalSales : 0
      },
      salesLast7Days: salesLast7Days.map(day => ({
        date: day.saleDate,
        revenue: day._sum.total || 0,
        sales: day._count.id
      }))
    }
  });
});