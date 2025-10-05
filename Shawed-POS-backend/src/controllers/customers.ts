/**
 * Customers Controller - PostgreSQL Integration
 * Real database operations for customer management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import asyncHandler from 'express-async-handler';

// Get all customers
export const getCustomers = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { search, page = '1', limit = '10' } = req.query;
  
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } }
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { createdAt: 'desc' },
    include: {
      sales: {
        select: {
          id: true,
          total: true,
          createdAt: true
        }
      }
    }
  });

  const total = await prisma.customer.count({ where });

  res.json({
    success: true,
    count: customers.length,
    total,
    page: pageNum,
    limit: limitNum,
    data: customers
  });
});

// Get single customer
export const getCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
    return;
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sellPrice: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!customer) {
    res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
    return;
  }

  res.json({
    success: true,
    data: customer
  });
});

// Create new customer
export const createCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, phone, address } = req.body;

  // Validation
  if (!name || !name.trim()) {
    res.status(400).json({
      success: false,
      message: 'Customer name is required'
    });
    return;
  }

  // Check if customer already exists with same email
  if (email) {
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingCustomer) {
      res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
      return;
    }
  }

  // Generate unique ID
  const id = `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const customer = await prisma.customer.create({
    data: {
      id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      balance: 0.0
    }
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer
  });
});

// Update customer
export const updateCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
    return;
  }

  // Check if customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { id }
  });

  if (!existingCustomer) {
    res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
    return;
  }

  // Check for email conflicts
  if (email && email !== existingCustomer.email) {
    const emailConflict = await prisma.customer.findFirst({
      where: { 
        email: email.trim().toLowerCase(),
        NOT: { id }
      }
    });

    if (emailConflict) {
      res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
      return;
    }
  }

  const updateData: any = {};
  
  if (name) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email?.trim() || null;
  if (phone !== undefined) updateData.phone = phone?.trim() || null;
  if (address !== undefined) updateData.address = address?.trim() || null;

  const customer = await prisma.customer.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Customer updated successfully',
    data: customer
  });
});

// Delete customer
export const deleteCustomer = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
    return;
  }

  // Check if customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: true
    }
  });

  if (!existingCustomer) {
    res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
    return;
  }

  // Check if customer has sales
  if (existingCustomer.sales.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Cannot delete customer with existing sales records'
    });
    return;
  }

  await prisma.customer.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
});

// Get customer sales
export const getCustomerSales = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { page = '1', limit = '10' } = req.query;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
    return;
  }

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Check if customer exists
  const customer = await prisma.customer.findUnique({
    where: { id }
  });

  if (!customer) {
    res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
    return;
  }

  const sales = await prisma.sale.findMany({
    where: { customerId: id },
    include: {
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
    skip,
    take: limitNum,
    orderBy: { saleDate: 'desc' }
  });

  const total = await prisma.sale.count({ where: { customerId: id } });

  res.json({
    success: true,
    count: sales.length,
    total,
    page: pageNum,
    limit: limitNum,
    data: sales
  });
});

// Update customer balance
export const updateCustomerBalance = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { balance } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
    return;
  }

  if (balance === undefined || isNaN(parseFloat(balance))) {
    res.status(400).json({
      success: false,
      message: 'Valid balance is required'
    });
    return;
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: { balance: parseFloat(balance) }
  });

  res.json({
    success: true,
    message: 'Customer balance updated successfully',
    data: customer
  });
});