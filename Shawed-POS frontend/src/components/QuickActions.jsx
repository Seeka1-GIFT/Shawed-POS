import React, { useContext, useState } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  Plus,
  Minus,
  RotateCcw,
  AlertTriangle,
  Package,
  Clock,
  Zap,
  CheckCircle,
} from 'lucide-react';

/**
 * QuickActions component provides one-click operations for common
 * inventory management tasks like bulk adjustments and quick reorders.
 */
export default function QuickActions() {
  const { products, suppliers, updateProduct, addPurchaseOrder } = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  const [bulkQuantity, setBulkQuantity] = useState(10);
  const [selectedAction, setSelectedAction] = useState('');

  // Get low stock products
  const lowStockProducts = products.filter(p => p.quantity <= 5 && p.quantity > 0);
  const outOfStockProducts = products.filter(p => p.quantity === 0);
  const nearExpiryProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiryDate = new Date(p.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const handleBulkRestock = () => {
    const productsToRestock = [...lowStockProducts, ...outOfStockProducts];
    
    productsToRestock.forEach(product => {
      const newQuantity = Math.max(10, product.quantity + bulkQuantity);
      updateProduct(product.id, { ...product, quantity: newQuantity });
    });
    
    alert(`Restocked ${productsToRestock.length} products with ${bulkQuantity} units each`);
  };

  const handleQuickReorder = () => {
    if (suppliers.length === 0) {
      alert('No suppliers available. Please add suppliers first.');
      return;
    }

    const supplier = suppliers[0]; // Use first supplier for quick reorder
    const reorderItems = [...lowStockProducts, ...outOfStockProducts].map(product => ({
      id: Date.now().toString() + Math.random(),
      productId: product.id,
      productName: product.name,
      quantity: Math.max(10, product.quantity + bulkQuantity),
      unitPrice: product.purchasePrice,
    }));

    if (reorderItems.length === 0) {
      alert('No products need reordering');
      return;
    }

    const purchaseOrder = {
      id: Date.now().toString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      status: 'pending',
      notes: 'Quick reorder for low stock items',
      items: reorderItems,
      totalAmount: reorderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
      createdAt: new Date().toISOString(),
    };

    addPurchaseOrder(purchaseOrder);
    alert(`Created purchase order for ${reorderItems.length} products`);
  };

  const handleBulkAdjustment = (adjustment) => {
    const productsToAdjust = [...lowStockProducts, ...outOfStockProducts];
    
    productsToAdjust.forEach(product => {
      const newQuantity = Math.max(0, product.quantity + adjustment);
      updateProduct(product.id, { ...product, quantity: newQuantity });
    });
    
    alert(`Adjusted ${productsToAdjust.length} products by ${adjustment > 0 ? '+' : ''}${adjustment} units`);
  };

  const handleClearExpired = () => {
    const expiredProducts = products.filter(p => {
      if (!p.expiryDate) return false;
      const expiryDate = new Date(p.expiryDate);
      const today = new Date();
      return expiryDate < today;
    });

    if (expiredProducts.length === 0) {
      alert('No expired products found');
      return;
    }

    if (confirm(`Remove ${expiredProducts.length} expired products from inventory?`)) {
      expiredProducts.forEach(product => {
        updateProduct(product.id, { ...product, quantity: 0 });
      });
      alert(`Marked ${expiredProducts.length} expired products as out of stock`);
    }
  };

  const quickActions = [
    {
      id: 'restock',
      label: 'Quick Restock',
      description: `Restock ${lowStockProducts.length + outOfStockProducts.length} low/out of stock items`,
      icon: Package,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: handleBulkRestock,
      disabled: lowStockProducts.length === 0 && outOfStockProducts.length === 0,
    },
    {
      id: 'reorder',
      label: 'Create Reorder',
      description: 'Generate purchase order for low stock items',
      icon: RotateCcw,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: handleQuickReorder,
      disabled: (lowStockProducts.length === 0 && outOfStockProducts.length === 0) || suppliers.length === 0,
    },
    {
      id: 'adjust-up',
      label: 'Bulk Add Stock',
      description: `Add ${bulkQuantity} units to low stock items`,
      icon: Plus,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      onClick: () => handleBulkAdjustment(bulkQuantity),
      disabled: lowStockProducts.length === 0 && outOfStockProducts.length === 0,
    },
    {
      id: 'adjust-down',
      label: 'Bulk Reduce Stock',
      description: `Remove ${bulkQuantity} units from low stock items`,
      icon: Minus,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => handleBulkAdjustment(-bulkQuantity),
      disabled: lowStockProducts.length === 0 && outOfStockProducts.length === 0,
    },
    {
      id: 'clear-expired',
      label: 'Clear Expired',
      description: 'Mark expired products as out of stock',
      icon: Clock,
      color: 'bg-red-500 hover:bg-red-600',
      onClick: handleClearExpired,
      disabled: nearExpiryProducts.length === 0,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
    >
      <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
        <Zap className="h-5 w-5 mr-2 text-yellow-500" />
        Quick Actions
      </h3>

      {/* Bulk Quantity Selector */}
      <div className="mb-4">
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Bulk Quantity
        </label>
        <select
          value={bulkQuantity}
          onChange={(e) => setBulkQuantity(parseInt(e.target.value))}
          className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
        >
          <option value={5}>5 units</option>
          <option value={10}>10 units</option>
          <option value={25}>25 units</option>
          <option value={50}>50 units</option>
          <option value={100}>100 units</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              ${action.color} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              text-white p-3 rounded-lg transition-all duration-200
              flex flex-col items-center text-center
            `}
          >
            <action.icon className="h-6 w-6 mb-2" />
            <span className="font-medium text-sm">{action.label}</span>
            <span className="text-xs opacity-90 mt-1">{action.description}</span>
          </motion.button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {lowStockProducts.length}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {outOfStockProducts.length}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              {nearExpiryProducts.length}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Near Expiry</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {products.length - lowStockProducts.length - outOfStockProducts.length}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Stock</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

