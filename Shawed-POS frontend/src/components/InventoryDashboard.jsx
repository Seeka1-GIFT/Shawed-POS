import React, { useContext, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * InventoryDashboard provides comprehensive inventory insights
 * including stock levels, value, turnover, and management metrics.
 */
export default function InventoryDashboard() {
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in InventoryDashboard');
    return <div className="p-4 text-red-500">Loading inventory data...</div>;
  }
  
  const { products = [] } = context;

  const inventoryMetrics = useMemo(() => {
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.quantity <= 5).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
    const totalSellingValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    
    // Calculate average stock level
    const avgStockLevel = totalProducts > 0 
      ? products.reduce((sum, p) => sum + p.quantity, 0) / totalProducts 
      : 0;

    // Calculate products by category
    const categoryCount = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Calculate potential profit
    const potentialProfit = totalSellingValue - totalInventoryValue;

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      totalSellingValue,
      avgStockLevel,
      categoryCount,
      potentialProfit
    };
  }, [products]);

  const metrics = [
    {
      icon: Package,
      label: 'Total Products',
      value: inventoryMetrics.totalProducts,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900'
    },
    {
      icon: AlertTriangle,
      label: 'Low Stock',
      value: inventoryMetrics.lowStockCount,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      darkBgColor: 'bg-yellow-900'
    },
    {
      icon: CheckCircle,
      label: 'In Stock',
      value: inventoryMetrics.totalProducts - inventoryMetrics.outOfStockCount,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900'
    },
    {
      icon: DollarSign,
      label: 'Inventory Value',
      value: `$${inventoryMetrics.totalInventoryValue.toFixed(2)}`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      darkBgColor: 'bg-purple-900'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Main Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${isDarkMode ? metric.darkBgColor : metric.bgColor} mr-4`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div className="text-right">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {metric.label}
                </p>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {metric.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Level Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Stock Insights
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average Stock Level</span>
              <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {inventoryMetrics.avgStockLevel.toFixed(1)} units
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Potential Profit</span>
              <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ${inventoryMetrics.potentialProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Selling Value</span>
              <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                ${inventoryMetrics.totalSellingValue.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <Package className="h-5 w-5 mr-2 text-blue-500" />
            Categories
          </h3>
          <div className="space-y-2">
            {Object.entries(inventoryMetrics.categoryCount).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {category}
                </span>
                <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {count} products
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

