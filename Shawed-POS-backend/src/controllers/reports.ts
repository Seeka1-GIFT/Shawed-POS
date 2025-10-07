import { Request, Response } from 'express';
import { prisma } from '../index';
import asyncHandler from 'express-async-handler';

// Comprehensive reports endpoint for the Reports page
export const getReportsData = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('📊 Generating comprehensive reports data...');
    
    // Get date range from query params (default to last 7 days)
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Date range: ${start.toISOString()} to ${end.toISOString()}`);
    
    // Get sales with items and products
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                buyPrice: true,
                sellPrice: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { saleDate: 'desc' }
    });
    
    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'desc' }
    });
    
    // Get products for inventory calculation
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Calculate metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    
    // Calculate actual COGS and profit
    let totalCOGS = 0;
    sales.forEach(sale => {
      sale.saleItems.forEach(item => {
        const cost = Number(item.product.buyPrice) * item.quantity;
        totalCOGS += cost;
      });
    });
    
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const netProfit = grossProfit - totalExpenses;
    
    // Calculate inventory value
    const inventoryValue = products.reduce((sum, product) => {
      return sum + (Number(product.buyPrice) * product.quantity);
    }, 0);
    
    // Calculate margins
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const reportsData = {
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCOGS: Number(totalCOGS.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        grossMargin: Number(grossMargin.toFixed(2)),
        netMargin: Number(netMargin.toFixed(2)),
        inventoryValue: Number(inventoryValue.toFixed(2)),
        productsCount: products.length,
        salesCount: sales.length,
        expensesCount: expenses.length,
        sales,
        expenses,
        products
      }
    };
    
    console.log('✅ Reports data generated successfully:', {
      totalRevenue: reportsData.data.totalRevenue,
      netProfit: reportsData.data.netProfit,
      inventoryValue: reportsData.data.inventoryValue,
      salesCount: reportsData.data.salesCount
    });
    
    res.json(reportsData);
  } catch (error) {
    console.error('❌ getReportsData error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reports data',
      error: error.message
    });
  }
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's sales
  const todaySales = await prisma.sale.findMany({
    where: {
      saleDate: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Get products count and low stock
  const [totalProducts, lowStockProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        quantity: { lte: 5 }
      }
    })
  ]);

  // Calculate today's totals
  const todayTotalSales = todaySales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
  const todayTotalTax = todaySales.reduce((sum, sale) => sum + parseFloat(sale.tax.toString()), 0);
  const todayTotalDiscount = todaySales.reduce((sum, sale) => sum + parseFloat(sale.discount.toString()), 0);
  
  // Calculate actual profit from COGS
  let todayProfit = 0;
  for (const sale of todaySales) {
    const saleItems = await prisma.saleItem.findMany({
      where: { saleId: sale.id },
      include: { product: true }
    });
    
    const saleCost = saleItems.reduce((cost, item) => {
      const buyPrice = parseFloat(item.product.buyPrice.toString());
      const quantity = item.quantity;
      return cost + (buyPrice * quantity);
    }, 0);
    
    const saleRevenue = parseFloat(sale.total.toString());
    todayProfit += (saleRevenue - saleCost);
  }

  // Get customers with debt
  const customersWithDebt = await prisma.customer.count({
    where: {
      balance: { gt: 0 }
    }
  });

  // Get recent expenses
  const recentExpenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  const totalExpenses = recentExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

  res.status(200).json({
    success: true,
    data: {
      sales: {
        todayTotal: todayTotalSales,
        todayTax: todayTotalTax,
        todayDiscount: todayTotalDiscount,
        todayProfit: todayProfit,
        transactionCount: todaySales.length
      },
      inventory: {
        totalProducts,
        lowStockProducts
      },
      customers: {
        withDebt: customersWithDebt
      },
      expenses: {
        todayTotal: totalExpenses,
        transactionCount: recentExpenses.length
      }
    }
  });
});

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { 
    startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    endDate = new Date().toISOString(),
    groupBy = 'day'
  } = req.query;

  const sales = await prisma.sale.findMany({
    where: {
      saleDate: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    },
    include: {
      customer: {
        select: { id: true, name: true }
      },
      saleItems: {
        include: {
          product: {
            select: { id: true, name: true, category: true }
          }
        }
      }
    },
    orderBy: { saleDate: 'desc' }
  });

  // Calculate summary
  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
  const totalTax = sales.reduce((sum, sale) => sum + parseFloat(sale.tax.toString()), 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + parseFloat(sale.discount.toString()), 0);
  const totalItems = sales.reduce((sum, sale) => sum + sale.saleItems.length, 0);

  // Group by payment method
  const paymentMethods = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + parseFloat(sale.total.toString());
    return acc;
  }, {} as {cash: number, card: number, [key: string]: number});

  // Group by category
  const categories = sales.reduce((acc, sale) => {
    sale.saleItems.forEach(item => {
      const category = item.product.category;
      acc[category] = (acc[category] || 0) + parseFloat(item.total.toString());
    });
    return acc;
  }, {} as Record<string, number>);

  // Top selling products
  const productSales = sales.reduce((acc, sale) => {
    sale.saleItems.forEach(item => {
      const productId = item.product.id;
      const productName = item.product.name;
      
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: productName,
          totalSales: 0,
          quantitySold: 0
        };
      }
      
      acc[productId].totalSales += parseFloat(item.total.toString());
      acc[productId].quantitySold += item.quantity;
    });
    return acc;
  }, {} as Record<string, any>);

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.totalSales - a.totalSales)
    .slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      period: {
        startDate,
        endDate,
        duration: `${Math.ceil((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24))} days`
      },
      summary: {
        totalSales,
        totalTax,
        totalDiscount,
        totalItems,
        transactionCount: sales.length,
        averageOrderValue: sales.length > 0 ? totalSales / sales.length : 0
      },
      paymentMethods,
      categories,
      topProducts,
      sales
    }
  });
});

export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: {
      supplier: {
        select: { id: true, name: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Calculate inventory value
  const totalInventoryValue = products.reduce((sum, product) => {
    return sum + (product.quantity * parseFloat(product.buyPrice.toString()));
  }, 0);

  // Group by category
  const categorySummary = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = {
        count: 0,
        totalQuantity: 0,
        inventoryValue: 0,
        suppliers: new Set()
      };
    }
    
    acc[product.category].count += 1;
    acc[product.category].totalQuantity += product.quantity;
    acc[product.category].inventoryValue += product.quantity * parseFloat(product.buyPrice.toString());
    if (product.supplier) {
      acc[product.category].suppliers.add(product.supplier.name);
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Convert suppliers Set to Array
  Object.keys(categorySummary).forEach(category => {
    categorySummary[category].suppliers = Array.from(categorySummary[category].suppliers);
  });

  // Low stock products
  const lowStockProducts = products.filter(product => 
    product.quantity <= (product.lowStockThreshold || 10)
  );

  // Products by supplier
  const supplierSummary = products.reduce((acc, product) => {
    const supplierName = product.supplier?.name || 'Unknown';
    
    if (!acc[supplierName]) {
      acc[supplierName] = {
        count: 0,
        totalQuantity: 0,
        inventoryValue: 0
      };
    }
    
    acc[supplierName].count += 1;
    acc[supplierName].totalQuantity += product.quantity;
    acc[supplierName].inventoryValue += product.quantity * parseFloat(product.buyPrice.toString());
    
    return acc;
  }, {} as Record<string, any>);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalProducts: products.length,
        totalInventoryValue,
        totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
        lowStockCount: lowStockProducts.length
      },
      categorySummary,
      supplierSummary,
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        currentStock: product.quantity,
        lowStockThreshold: product.lowStockThreshold,
        supplier: product.supplier?.name
      })),
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        buyPrice: parseFloat(product.buyPrice.toString()),
        sellPrice: parseFloat(product.sellPrice.toString()),
        inventoryValue: product.quantity * parseFloat(product.buyPrice.toString()),
        supplier: product.supplier?.name
      }))
    }
  });
});

export const getExpenseReport = asyncHandler(async (req: Request, res: Response) => {
  const { 
    startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    endDate = new Date().toISOString()
  } = req.query;

  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    },
    orderBy: { date: 'desc' }
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

  // Group by category
  const categories = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount.toString());
    return acc;
  }, {} as Record<string, number>);

  // Monthly trends
  const monthlyTrends = expenses.reduce((acc, expense) => {
    const month = expense.date.toISOString().substring(0, 7); // YYYY-MM format
    
    if (!acc[month]) {
      acc[month] = {
        total: 0,
        count: 0,
        categories: {}
      };
    }
    
    acc[month].total += parseFloat(expense.amount.toString());
    acc[month].count += 1;
    
    if (!acc[month].categories[expense.category]) {
      acc[month].categories[expense.category] = 0;
    }
    acc[month].categories[expense.category] += parseFloat(expense.amount.toString());
    
    return acc;
  }, {} as Record<string, any>);

  res.status(200).json({
    success: true,
    data: {
      period: {
        startDate,
        endDate,
        duration: `${Math.floor((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24))} days`
      },
      summary: {
        totalExpenses,
        transactionCount: expenses.length,
        averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0
      },
      categories,
      monthlyTrends,
      expenses
    }
  });
});

export const getProfitLossReport = asyncHandler(async (req: Request, res: Response) => {
  const { 
    startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    endDate = new Date().toISOString()
  } = req.query;

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: {
        saleDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      }
    }),
    prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      }
    })
  ]);

  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
  const totalTax = sales.reduce((sum, sale) => sum + parseFloat(sale.tax.toString()), 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + parseFloat(sale.discount.toString()), 0);
  
  // Calculate COGS (Cost of Goods Sold) - assuming 70% margin
  const costOfGoodsSold = totalRevenue * 0.7;
  
  // Calculate gross profit
  const grossProfit = totalRevenue - costOfGoodsSold;
  
  // Total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
  
  // Net profit
  const netProfit = grossProfit - totalExpenses;

  res.status(200).json({
    success: true,
    data: {
      period: {
        startDate,
        endDate,
        duration: `${Math.floor((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24))} days`
      },
      revenue: {
        totalRevenue,
        totalTax,
        totalDiscount,
        transactionCount: sales.length
      },
      costs: {
        costOfGoodsSold,
        totalExpenses,
        totalCosts: costOfGoodsSold + totalExpenses
      },
      profit: {
        grossProfit,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      },
      expenses: {
        byCategory: expenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount.toString());
          return acc;
        }, {} as Record<string, number>)
      }
    }
  });
});
