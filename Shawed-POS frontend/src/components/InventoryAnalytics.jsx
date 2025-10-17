import React, { useContext, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  DollarSign,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

/**
 * InventoryAnalytics component provides detailed inventory insights
 * including turnover rates, movement trends, and performance metrics.
 */
export default function InventoryAnalytics() {
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in InventoryAnalytics');
    return <div className="p-4 text-red-500">Loading analytics data...</div>;
  }
  
  const { products = [], sales = [] } = context;

  // Calculate inventory turnover rates
  const inventoryMetrics = useMemo(() => {
    const numeric = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const safeQty = (q) => {
      const n = Number(q);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    const totalInventoryValue = (products || []).reduce((sum, p) => {
      const purchasePrice = numeric(p?.purchasePrice);
      const quantity = safeQty(p?.quantity);
      return sum + purchasePrice * quantity;
    }, 0);

    const totalSellingValue = (products || []).reduce((sum, p) => {
      const sellingPrice = numeric(p?.sellingPrice);
      const quantity = safeQty(p?.quantity);
      return sum + sellingPrice * quantity;
    }, 0);
    
    // Calculate turnover based on sales data
    const totalSalesValue = (sales || []).reduce((sum, sale) => sum + numeric(sale?.total), 0);
    const avgInventoryValue = totalInventoryValue / 2; // Simplified average
    const turnoverRate = avgInventoryValue > 0 ? totalSalesValue / avgInventoryValue : 0;
    
    // Calculate days sales outstanding (simplified)
    const avgDailySales = (sales && sales.length > 0) ? totalSalesValue / 30 : 0; // Assuming 30-day period
    const daysSalesOutstanding = avgDailySales > 0 ? totalInventoryValue / avgDailySales : 0;

    return {
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      totalSellingValue: Number(totalSellingValue.toFixed(2)),
      turnoverRate: Number(turnoverRate.toFixed(2)),
      daysSalesOutstanding: Number(daysSalesOutstanding.toFixed(0)),
      totalProducts: (products || []).length,
      avgInventoryValue: Number(avgInventoryValue.toFixed(2)),
    };
  }, [products, sales]);

  // Calculate stock movement trends
  const stockMovementTrends = useMemo(() => {
    const days = [];
    const now = new Date();
    
    // Get last 7 days of stock movements (simplified - would need actual movement tracking)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Calculate sales for this day (proxy for stock movement)
      const salesOfDay = (sales || []).filter(sale => {
        const sDate = sale?.saleDate || sale?.date || sale?.createdAt;
        return sDate ? String(sDate).slice(0, 10) === dateStr : false;
      });
      const salesValue = salesOfDay.reduce((sum, sale) => sum + (sale?.total || 0), 0);
      const salesQuantity = salesOfDay.reduce((sum, sale) => {
        const items = sale?.items || sale?.saleItems || [];
        return sum + items.reduce((itemSum, item) => itemSum + (item?.quantity || 0), 0);
      }, 0);
      
      days.push({
        name: dayLabel,
        date: dateStr,
        SalesValue: salesValue,
        SalesQuantity: salesQuantity,
        Transactions: salesOfDay.length,
      });
    }
    
    return days;
  }, [sales]);

  // Calculate category performance
  const categoryPerformance = useMemo(() => {
    const categoryStats = {};
    
    (products || []).forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          totalValue: 0,
          totalQuantity: 0,
          productCount: 0,
          avgPrice: 0,
        };
      }
      
      const purchasePrice = Number.isFinite(Number(product?.purchasePrice)) ? Number(product.purchasePrice) : 0;
      const quantity = Number.isFinite(Number(product?.quantity)) ? Number(product.quantity) : 0;
      categoryStats[category].totalValue += purchasePrice * quantity;
      categoryStats[category].totalQuantity += quantity;
      categoryStats[category].productCount += 1;
    });
    
    // Calculate average prices
    Object.values(categoryStats).forEach(category => {
      category.avgPrice = category.productCount > 0 ? category.totalValue / category.totalQuantity : 0;
    });
    
    return Object.values(categoryStats).sort((a, b) => b.totalValue - a.totalValue);
  }, [products]);

  // Calculate top movers (products with most sales)
  const topMovers = useMemo(() => {
    const productSales = {};
    
    (sales || []).forEach(sale => {
      const items = sale?.items || sale?.saleItems || [];
      items.forEach(item => {
        if (!item?.product?.id) {
          return;
        }
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = {
            name: item.product.name,
            category: item.product.category,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
          };
        }
        const quantity = item?.quantity || 0;
        const sellPrice = item?.product?.sellingPrice || 0;
        const buyPrice = item?.product?.purchasePrice || 0;
        productSales[item.product.id].quantitySold += quantity;
        productSales[item.product.id].revenue += sellPrice * quantity;
        productSales[item.product.id].profit += (sellPrice - buyPrice) * quantity;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
  }, [sales]);

  // Calculate inventory health score
  const inventoryHealthScore = useMemo(() => {
    const totalProducts = products.length;
    if (totalProducts === 0) return 0;
    
    const lowStockCount = products.filter(p => p.quantity <= 5 && p.quantity > 0).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    const nearExpiryCount = products.filter(p => {
      if (!p.expiryDate) return false;
      const expiryDate = new Date(p.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;
    
    // Calculate health score (0-100)
    const lowStockPenalty = (lowStockCount / totalProducts) * 20;
    const outOfStockPenalty = (outOfStockCount / totalProducts) * 40;
    const expiryPenalty = (nearExpiryCount / totalProducts) * 10;
    
    const healthScore = Math.max(0, 100 - lowStockPenalty - outOfStockPenalty - expiryPenalty);
    
    return {
      score: Math.round(healthScore),
      lowStockCount,
      outOfStockCount,
      nearExpiryCount,
      totalProducts,
    };
  }, [products]);

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return AlertCircle;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inventory Value</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${inventoryMetrics.totalInventoryValue.toFixed(2)}
              </p>
            </div>
            <Package className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Turnover Rate</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {inventoryMetrics.turnoverRate.toFixed(2)}x
              </p>
            </div>
            <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Days Outstanding</p>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {Math.round(inventoryMetrics.daysSalesOutstanding)} days
              </p>
            </div>
            <Clock className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Health Score</p>
              <p className={`text-xl font-bold ${getHealthColor(inventoryHealthScore.score)}`}>
                {inventoryHealthScore.score}%
              </p>
            </div>
            {(() => {
              const Icon = getHealthIcon(inventoryHealthScore.score);
              return <Icon className={`h-8 w-8 ${getHealthColor(inventoryHealthScore.score)}`} />;
            })()}
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movement Trends */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <BarChart3 className="h-5 w-5 mr-2" />
            Stock Movement Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockMovementTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    color: isDarkMode ? '#f3f4f6' : '#111827'
                  }}
                />
                <Line type="monotone" dataKey="SalesQuantity" stroke={isDarkMode ? '#3b82f6' : '#0a72ff'} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <Package className="h-5 w-5 mr-2" />
            Category Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    color: isDarkMode ? '#f3f4f6' : '#111827'
                  }}
                />
                <Bar dataKey="totalValue" fill={isDarkMode ? '#10b981' : '#059669'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Movers */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
          <TrendingUp className="h-5 w-5 mr-2" />
          Top Moving Products
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Sold</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {topMovers.map((product, index) => (
                <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.name}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.category}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.quantitySold}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${product.revenue.toFixed(2)}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>${product.profit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Score Breakdown */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
          <AlertCircle className="h-5 w-5 mr-2" />
          Inventory Health Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {inventoryHealthScore.totalProducts}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {inventoryHealthScore.lowStockCount}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {inventoryHealthScore.outOfStockCount}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              {inventoryHealthScore.nearExpiryCount}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Near Expiry</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

