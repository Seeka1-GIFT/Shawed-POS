import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { isValidEmail, isValidPhone, isValidDecimal } from '../utils/validation';

export const getSuppliers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = '1',
    limit = '10',
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const orderBy: any = {};
  orderBy[sortBy as string] = sortOrder;

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        _count: {
          select: { products: true, purchaseOrders: true }
        }
      }
    }),
    prisma.supplier.count({ where })
  ]);

  res.status(200).json({
    success: true,
    count: suppliers.length,
    total,
    data: suppliers,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  });
});

export const getSupplier = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Supplier ID is required'
    });
    return;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          category: true,
          quantity: true,
          buyPrice: true,
          sellPrice: true
        }
      },
      purchaseOrders: {
        select: {
          id: true,
          orderDate: true,
          status: true,
          totalAmount: true
        },
        orderBy: { orderDate: 'desc' },
        take: 10
      },
      _count: {
        select: { products: true, purchaseOrders: true }
      }
    }
  });

  if (!supplier) {
    res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: supplier
  });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, phone, address, email } = req.body;

  if (!name) {
    res.status(400).json({
      success: false,
      message: 'Please provide supplier name'
    });
    return;
  }

  if (email && !isValidEmail(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }

  if (phone && !isValidPhone(phone)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number'
    });
    return;
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      phone: phone || null,
      address: address || null,
      email: email ? email.toLowerCase() : null
    }
  });

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: supplier
  });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { name, phone, address, email } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Supplier ID is required'
    });
    return;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id }
  });

  if (!supplier) {
    res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
    return;
  }

  if (email && !isValidEmail(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }

  if (phone && !isValidPhone(phone)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid phone number'
    });
    return;
  }

  const updatedSupplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(email !== undefined && { email: email ? email.toLowerCase() : null })
    }
  });

  res.status(200).json({
    success: true,
    message: 'Supplier updated successfully',
    data: updatedSupplier
  });
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Supplier ID is required'
    });
    return;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id }
  });

  if (!supplier) {
    res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
    return;
  }

  // Check if supplier has products or purchase orders
  const [productsCount, ordersCount] = await Promise.all([
    prisma.product.count({ where: { supplierId: id } }),
    prisma.purchaseOrder.count({ where: { supplierId: id } })
  ]);

  if (productsCount > 0 || ordersCount > 0) {
    res.status(400).json({
      success: false,
      message: 'Cannot delete supplier with existing products or purchase orders. Consider archiving instead.'
    });
    return;
  }

  await prisma.supplier.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Supplier deleted successfully'
  });
});

export const getSupplierProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Supplier ID is required'
    });
    return;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id }
  });

  if (!supplier) {
    res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
    return;
  }

  const products = await prisma.product.findMany({
    where: { supplierId: id },
    select: {
      id: true,
      name: true,
      category: true,
      barcode: true,
      quantity: true,
      buyPrice: true,
      sellPrice: true,
      lowStockThreshold: true
    },
    orderBy: { name: 'asc' }
  });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

export const getSupplierPurchaseOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const {
    page = '1',
    limit = '10',
    status,
    startDate,
    endDate
  } = req.query;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Supplier ID is required'
    });
    return;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { supplierId: id };
  
  if (status) {
    where.status = status;
  }
  
  if (startDate && endDate) {
    where.orderDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const [purchaseOrders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      skip,
      take: limitNum,
      include: {
        supplier: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.purchaseOrder.count({ where })
  ]);

  res.status(200).json({
    success: true,
    count: purchaseOrders.length,
    total,
    data: purchaseOrders,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  });
});

