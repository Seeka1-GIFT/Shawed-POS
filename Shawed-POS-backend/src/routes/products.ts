import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
} from '../controllers/products';

const router = express.Router();

// GET /api/products
router.get('/', getProducts);

// GET /api/products/low-stock
router.get('/low-stock', getLowStockProducts);

// GET /api/products/:id
router.get('/:id', getProduct);

// POST /api/products
router.post('/', createProduct);

// PUT /api/products/:id
router.put('/:id', updateProduct);

// PUT /api/products/:id/stock
router.put('/:id/stock', updateStock);

// DELETE /api/products/:id
router.delete('/:id', deleteProduct);

export default router;





