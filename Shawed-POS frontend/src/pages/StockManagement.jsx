import React, { useContext, useState, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import InventoryAnalytics from '../components/InventoryAnalytics';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Minus, 
  Edit2, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * StockManagement page provides comprehensive inventory control
 * including stock adjustments, bulk operations, and inventory tracking.
 */
export default function StockManagement() {
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in StockManagement page');
    return <div className="p-4 text-red-500">Loading stock data...</div>;
  }
  
  const { products = [], updateProduct } = context;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, low-stock, out-of-stock, near-expiry
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAdjustment, setBulkAdjustment] = useState(0);

  // Filter products based on search and filter criteria
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.barcode?.includes(query)
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'low-stock':
        filtered = filtered.filter(p => p.quantity <= 5 && p.quantity > 0);
        break;
      case 'out-of-stock':
        filtered = filtered.filter(p => p.quantity === 0);
        break;
      case 'near-expiry':
        filtered = filtered.filter(p => {
          if (!p.expiryDate) return false;
          const expiryDate = new Date(p.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, filterBy]);

  const handleStockAdjustment = (productId, adjustment) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newQuantity = Math.max(0, product.quantity + adjustment);
      updateProduct(productId, { ...product, quantity: newQuantity });
    }
  };

  const handleBulkAdjustment = () => {
    selectedProducts.forEach(productId => {
      handleStockAdjustment(productId, bulkAdjustment);
    });
    setSelectedProducts([]);
    setBulkAdjustment(0);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { status: 'out-of-stock', color: 'text-red-500', icon: AlertTriangle };
    if (product.quantity <= 5) return { status: 'low-stock', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'in-stock', color: 'text-green-500', icon: CheckCircle };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Filter */}
          <div className="lg:w-48">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Products</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="near-expiry">Near Expiry</option>
            </select>
          </div>
        </div>

        {/* Bulk Operations */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                {selectedProducts.length} products selected
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Adjustment"
                  value={bulkAdjustment}
                  onChange={(e) => setBulkAdjustment(parseInt(e.target.value) || 0)}
                  className={`w-24 px-2 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded text-sm`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkAdjustment}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Apply
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearSelection}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Clear
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Stock Management ({filteredProducts.length} products)
            </h3>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={selectAllProducts}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear All
              </motion.button>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto whitespace-nowrap hidden sm:block">
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={() => selectedProducts.length === filteredProducts.length ? clearSelection() : selectAllProducts()}
                    className="rounded"
                  />
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Product
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Stock
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product);
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {product.name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.category || 'No category'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {product.quantity}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {React.createElement(stockStatus.icon, { 
                          className: `h-4 w-4 mr-2 ${stockStatus.color}` 
                        })}
                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                          {stockStatus.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleStockAdjustment(product.id, -1)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleStockAdjustment(product.id, 1)}
                          className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="block sm:hidden p-4 space-y-3">
          {filteredProducts.map((product)=>{
            const stockStatus = getStockStatus(product);
            const Icon = stockStatus.icon;
            return (
              <div key={product.id} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.name}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Icon className={`h-3 w-3 inline mr-1 ${stockStatus.color}`} />
                      {stockStatus.status.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.quantity}</div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-2">
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>handleStockAdjustment(product.id,-1)} className="h-9 w-9 flex items-center justify-center rounded bg-red-50 text-red-600 dark:bg-red-900">
                    <Minus className="h-5 w-5" />
                  </motion.button>
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>handleStockAdjustment(product.id,1)} className="h-9 w-9 flex items-center justify-center rounded bg-green-50 text-green-600 dark:bg-green-900">
                    <Plus className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions removed as requested */}

      {/* Inventory Analytics */}
      <InventoryAnalytics />
    </motion.div>
  );
}
