import express from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats
} from '../controllers/purchaseOrders';

const router = express.Router();

// GET /api/purchase-orders
router.get('/', getPurchaseOrders);

// GET /api/purchase-orders/stats
router.get('/stats', getPurchaseOrderStats);

// GET /api/purchase-orders/:id
router.get('/:id', getPurchaseOrder);

// POST /api/purchase-orders
router.post('/', createPurchaseOrder);

// PUT /api/purchase-orders/:id
router.put('/:id', updatePurchaseOrder);

// DELETE /api/purchase-orders/:id
router.delete('/:id', deletePurchaseOrder);

export default router;
