/**
 * Sales Controller - PostgreSQL Integration
 * Real database operations for sales and transactions
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import asyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../middleware/auth';

// Get all sales
export const getSales = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  res.json({
    success: true,
    count: sales.length,
    total,
    page: pageNum,
    limit: limitNum,
    data: sales
  });
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
export const createSale = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const {
    customerId,
    items,
    discount = 0,
    tax = 0,
    paymentMethod = 'Cash'
  } = req.body;

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Sale items are required'
    });
    return;
  }

  // Validate each item
  for (const item of items) {
    if (!item.productId || !item.quantity || !item.price) {
      res.status(400).json({
        success: false,
        message: 'All items must have productId, quantity, and price'
      });
      return;
    }

    // Check if product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    if (!product) {
      res.status(400).json({
        success: false,
        message: `Product ${item.productId} not found`
      });
      return;
    }

    if (product.quantity < parseInt(item.quantity)) {
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

  // Generate unique ID
  const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create sale and update inventory in transaction
  const sale = await prisma.$transaction(async (tx) => {
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

    // Create sale items and update inventory
    const saleItems = [];
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (product) {
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

        saleItems.push(saleItem);
      }
    }

    return {
      ...newSale,
      saleItems: saleItems.map(item => ({ ...item, product: items.find(i => i.productId === item.productId)?.product }))
    };
  });

  res.status(201).json({
    success: true,
    message: 'Sale created successfully',
    data: sale
  });
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