import express from 'express';
import {
  getReportsData,
  getDashboardStats,
  getSalesReport,
  getInventoryReport,
  getExpenseReport,
  getProfitLossReport
} from '../controllers/reports';

const router = express.Router();

// GET /api/reports - Comprehensive reports data
router.get('/', getReportsData);

// GET /api/reports/dashboard
router.get('/dashboard', getDashboardStats);

// GET /api/reports/sales
router.get('/sales', getSalesReport);

// GET /api/reports/inventory
router.get('/inventory', getInventoryReport);

// GET /api/reports/expenses
router.get('/expenses', getExpenseReport);

// GET /api/reports/profit-loss
router.get('/profit-loss', getProfitLossReport);

export default router;





