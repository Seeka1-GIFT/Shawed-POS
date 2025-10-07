import express from 'express';
import {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  getSalesReport
} from '../controllers/sales';

const router = express.Router();

// GET /api/sales
router.get('/', getSales);

// GET /api/sales/report
router.get('/report', getSalesReport);

// GET /api/sales/:id
router.get('/:id', getSale);

// POST /api/sales
router.post('/', createSale);

// PUT /api/sales/:id
router.put('/:id', updateSale);

// DELETE /api/sales/:id
router.delete('/:id', deleteSale);

export default router;





