import express from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  getSupplierPurchaseOrders
} from '../controllers/suppliers';

const router = express.Router();

// GET /api/suppliers
router.get('/', getSuppliers);

// GET /api/suppliers/:id
router.get('/:id', getSupplier);

// GET /api/suppliers/:id/products
router.get('/:id/products', getSupplierProducts);

// GET /api/suppliers/:id/purchase-orders
router.get('/:id/purchase-orders', getSupplierPurchaseOrders);

// POST /api/suppliers
router.post('/', createSupplier);

// PUT /api/suppliers/:id
router.put('/:id', updateSupplier);

// DELETE /api/suppliers/:id
router.delete('/:id', deleteSupplier);

export default router;



