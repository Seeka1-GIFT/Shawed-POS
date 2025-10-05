import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSales,
  updateCustomerBalance
} from '../controllers/customers';

const router = express.Router();

// GET /api/customers
router.get('/', getCustomers);

// GET /api/customers/:id
router.get('/:id', getCustomer);

// GET /api/customers/:id/sales
router.get('/:id/sales', getCustomerSales);

// POST /api/customers
router.post('/', createCustomer);

// PUT /api/customers/:id
router.put('/:id', updateCustomer);

// PUT /api/customers/:id/balance
router.put('/:id/balance', updateCustomerBalance);

// DELETE /api/customers/:id
router.delete('/:id', deleteCustomer);

export default router;
