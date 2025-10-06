import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { isValidDecimal } from '../utils/validation';

export const getExpenses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 getExpenses called with query:', req.query);
    
    const {
      page = '1',
      limit = '10',
      category,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  
  if (category) {
    where.category = category;
  }
  
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const orderBy: any = {};
  orderBy[sortBy as string] = sortOrder;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy,
      skip,
      take: limitNum
    }),
    prisma.expense.count({ where })
  ]);

    console.log(`✅ getExpenses successful: ${expenses.length} expenses found`);
    
    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      data: expenses,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('❌ getExpenses error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export const getExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Expense ID is required'
    });
    return;
  }

  const expense = await prisma.expense.findUnique({
    where: { id }
  });

  if (!expense) {
    res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

export const createExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { description, category, amount, date } = req.body;

  if (!description || !category || !amount) {
    res.status(400).json({
      success: false,
      message: 'Please provide description, category, and amount'
    });
    return;
  }

  if (!isValidDecimal(amount)) {
    res.status(400).json({
      success: false,
      message: 'Amount must be a valid number'
    });
    return;
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      category,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date()
    }
  });

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: expense
  });
});

export const updateExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { description, category, amount, date } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Expense ID is required'
    });
    return;
  }

  const expense = await prisma.expense.findUnique({
    where: { id }
  });

  if (!expense) {
    res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
    return;
  }

  if (amount && !isValidDecimal(amount)) {
    res.status(400).json({
      success: false,
      message: 'Amount must be a valid number'
    });
    return;
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: {
      ...(description && { description }),
      ...(category && { category }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(date && { date: new Date(date) })
    }
  });

  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    data: updatedExpense
  });
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Expense ID is required'
    });
    return;
  }

  const expense = await prisma.expense.findUnique({
    where: { id }
  });

  if (!expense) {
    res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
    return;
  }

  await prisma.expense.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

export const getExpenseReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, groupBy = 'category' } = req.query;

  const where: any = {};
  
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' }
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

  const categories = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount.toString());
    return acc;
  }, {} as Record<string, number>);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalExpenses,
        transactionCount: expenses.length
      },
      categories,
      expenses
    }
  });
});
