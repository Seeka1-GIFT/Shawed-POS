/**
 * Products Controller - PostgreSQL Integration
 * Real database operations for products management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import asyncHandler from 'express-async-handler';
import * as crypto from 'crypto';

// Get all products
export const getProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { category, supplier, search, page = '1', limit = '10' } = req.query;
  
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;
  
  // Build where clause
  const where: any = {};
  
  if (category && category !== 'all') {
    where.category = category as string;
  }
  
  if (supplier && supplier !== 'all') {
    where.supplierId = supplier as string;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { barcode: { contains: search as string } },
      { category: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    },
    skip,
    take: limitNum,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.product.count({ where });

  res.json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    limit: limitNum,
    data: products
  });
});

// Get single product
export const getProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
    return;
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      supplier: true
    }
  });

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
    return;
  }

  res.json({
    success: true,
    data: product
  });
});

// Create new product
export const createProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    name,
    category,
    barcode,
    quantity,
    buyPrice,
    sellPrice,
    expiryDate,
    supplierId,
    lowStockThreshold
  } = req.body;

  // Validation
  if (!name || !category) {
    res.status(400).json({
      success: false,
      message: 'Product name and category are required'
    });
    return;
  }

  if (!buyPrice || !sellPrice || buyPrice < 0 || sellPrice < 0) {
    res.status(400).json({
      success: false,
      message: 'Valid buy and sell prices are required'
    });
    return;
  }

  // Generate unique ID
  const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const product = await prisma.product.create({
    data: {
      id,
      name: name.trim(),
      category: category.trim(),
      barcode: barcode?.trim() || null,
      quantity: parseInt(quantity) || 0,
      buyPrice: parseFloat(buyPrice),
      sellPrice: parseFloat(sellPrice),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      supplierId: supplierId || null,
      lowStockThreshold: parseInt(lowStockThreshold) || 5
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// Update product
export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const {
    name,
    category,
    barcode,
    quantity,
    buyPrice,
    sellPrice,
    expiryDate,
    supplierId,
    lowStockThreshold
  } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
    return;
  }

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id }
  });

  if (!existingProduct) {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
    return;
  }

  const updateData: any = {};
  
  if (name) updateData.name = name.trim();
  if (category) updateData.category = category.trim();
  if (barcode !== undefined) updateData.barcode = barcode?.trim() || null;
  if (quantity !== undefined) updateData.quantity = parseInt(quantity);
  if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
  if (sellPrice !== undefined) updateData.sellPrice = parseFloat(sellPrice);
  if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (supplierId !== undefined) updateData.supplierId = supplierId || null;
  if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
    return;
  }

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id }
  });

  if (!existingProduct) {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
    return;
  }

  await prisma.product.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Get low stock products
export const getLowStockProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { threshold = '5' } = req.query;
  const thresholdNum = parseInt(threshold as string) || 5;

  const products = await prisma.product.findMany({
    where: {
      quantity: {
        lte: thresholdNum
      }
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    },
    orderBy: { quantity: 'asc' }
  });

  res.json({
    success: true,
    count: products.length,
    threshold: thresholdNum,
    data: products
  });
});

// Update product stock
export const updateStock = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
    return;
  }

  if (quantity === undefined || isNaN(parseInt(quantity))) {
    res.status(400).json({
      success: false,
      message: 'Valid quantity is required'
    });
    return;
  }

  const product = await prisma.product.update({
    where: { id },
    data: { quantity: parseInt(quantity) },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Stock updated successfully',
    data: product
  });
});