import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseReport
} from '../controllers/expenses';

const router = express.Router();

// GET /api/expenses
router.get('/', getExpenses);

// GET /api/expenses/report
router.get('/report', getExpenseReport);

// GET /api/expenses/:id
router.get('/:id', getExpense);

// POST /api/expenses
router.post('/', createExpense);

// PUT /api/expenses/:id
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id
router.delete('/:id', deleteExpense);

export default router;



