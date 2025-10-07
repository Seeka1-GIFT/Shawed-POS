import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { isValidDecimal } from '../utils/validation';

export const getExpenses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 getExpenses called with query:', req.query);
    
    // Check if Prisma client is available
    if (!prisma) {
      console.error('❌ Prisma client is not initialized');
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
        data: []
      });
    }

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

    // Try to fetch expenses with better error handling
    let expenses = [];
    let total = 0;

    try {
      const [expensesResult, totalResult] = await Promise.all([
        prisma.expense.findMany({
          where,
          orderBy,
          skip,
          take: limitNum
        }),
        prisma.expense.count({ where })
      ]);
      
      expenses = expensesResult;
      total = totalResult;
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      
      // If it's a table doesn't exist error, return empty array
      if (dbError.code === 'P2021' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
        console.log('📝 Expenses table does not exist, returning empty array');
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          data: [],
          page: pageNum,
          pages: 0,
          message: 'Expenses table not initialized yet'
        });
      }
      
      throw dbError;
    }

    console.log(`✅ getExpenses successful: ${expenses.length} expenses found`);
    
    // Convert Decimal fields to numbers for proper JSON serialization
    const processedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount)
    }));
    
    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      data: processedExpenses,
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
    
    // Return empty array instead of error for better UX
    res.status(200).json({
      success: true,
      count: 0,
      total: 0,
      data: [],
      page: 1,
      pages: 0,
      message: 'No expenses data available'
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
  try {
    const { description, category, amount, date } = req.body;

    if (!description || !category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide description, category, and amount'
      });
    }

    if (!isValidDecimal(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid number'
      });
    }

    // Check if Prisma client is available
    if (!prisma) {
      console.error('❌ Prisma client is not initialized');
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
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
  } catch (error) {
    console.error('❌ createExpense error:', error);
    
    // Handle database errors gracefully
    if (error.code === 'P2021' || error.message.includes('relation') || error.message.includes('does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'Expenses table not initialized. Please contact administrator.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
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
