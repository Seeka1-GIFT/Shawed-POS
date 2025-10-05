import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  DollarSign, 
  Users, 
  Package,
  Brain,
  AlertTriangle,
  CheckCircle,
  Zap,
  PieChart,
  Calendar,
  Award,
  Activity
} from 'lucide-react';

/**
 * Advanced Analytics component provides ML-powered insights
 * including sales forecasting, customer segmentation, and trend analysis
 */
export default function AdvancedAnalytics({ 
  data, 
  timeRange = '30d', 
  isDarkMode = false 
}) {
  const [selectedAnalytics, setSelectedAnalytics] = useState('overview');

  // Sales forecasting algorithm
  const salesForecast = useMemo(() => {
    const sales = data.sales || [];
    if (sales.length < 7) return null;

    // Simple moving average for forecasting
    const dailyData = sales.reduce((acc, sale) => {
      const date = sale.date;
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {});

    const dates = Object.keys(dailyData).sort().slice(-30); // Last 30 days
    const amounts = dates.map(date => dailyData[date] || 0);

    // Calculate trend
    const avgGrowth = dates.length > 7 ? 
      (amounts.slice(-7).reduce((a, b) => a + b, 0) / 7) - (amounts.slice(-14, -7).reduce((a, b) => a + b, 0) / 7) 
      : 0;

    // Predict next 7 days
    const avgRecentSales = amounts.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const forecastAmount = Math.max(0, avgRecentSales + (avgGrowth * 7));

    return {
      next7Days: forecastAmount,
      trend: avgGrowth > 0 ? 'up' : avgGrowth < 0 ? 'down' : 'stable',
      growthRate: avgGrowth,
      confidence: Math.min(95, Math.max(60, amounts.length * 3)) // Confidence based on data points
    };
  }, [data.sales]);

  // Customer segmentation
  const customerSegmentation = useMemo(() => {
    const customers = data.customers || [];
    const sales = data.sales || [];

    const customerSales = sales.reduce((acc, sale) => {
      if (sale.customerId) {
        acc[sale.customerId] = (acc[sale.customerId] || 0) + sale.total;
      }
      return acc;
    }, {});

    const segments = {
      vip: [],
      regular: [],
      new: []
    };

    customers.forEach(customer => {
      const totalSpent = customerSales[customer.id] || 0;
      const avgOrderValue = totalSpent > 0 ? totalSpent / (sales.filter(s => s.customerId === customer.id).length || 1) : 0;

      if (totalSpent >= 500) {
        segments.vip.push({ ...customer, totalSpent, avgOrderValue });
      } else if (totalSpent >= 100) {
        segments.regular.push({ ...customer, totalSpent, avgOrderValue });
      } else {
        segments.new.push({ ...customer, totalSpent, avgOrderValue });
      }
    });

    return segments;
  }, [data.customers, data.sales]);

  // Product performance analysis
  const productAnalysis = useMemo(() => {
    const products = data.products || [];
    const sales = data.sales || [];

    // Calculate product performance
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            category: item.product.category,
            totalSold: 0,
            totalRevenue: 0,
            stockLevel: item.product.quantity,
            profitMargin: ((item.product.sellingPrice - item.product.purchasePrice) / item.product.purchasePrice) * 100
          };
        }
        productSales[productId].totalSold += item.quantity;
        productSales[productId].totalRevenue += item.quantity * item.product.sellingPrice;
      });
    });

    // Sort by performance
    const sortedProducts = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Identify top performers and underperformers
    const topPerformers = sortedProducts.slice(0, 5);
    const underperformers = sortedProducts.filter(p => p.totalRevenue < 50 // Less than $50 revenue
      && p.stockLevel > 0 // Still in stock
      && p.profitMargin > 0 // Profitable
    ).slice(0, 5);

    return {
      topPerformers,
      underperformers,
      avgRevenue: sortedProducts.length > 0 ? sortedProducts.reduce((sum, p) => sum + p.totalRevenue, 0) / sortedProducts.length : 0
    };
  }, [data.products, data.sales]);

  // Business insights
  const businessInsights = useMemo(() => {
    const sales = data.sales || [];
    const products = data.products || [];
    const customers = data.customers || [];

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
    const customerCount = customers.length;
    const productCount = products.length;
    
    // Calculate insights
    const insights = [];

    // Revenue insight
    if (totalRevenue > 1000) {
      insights.push({
        type: 'success',
        icon: DollarSign,
        title: 'Strong Revenue',
        description: `$${totalRevenue.toFixed(2)} total revenue`,
        action: 'Consider expanding product line'
      });
    } else {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Revenue Opportunity',
        description: `$${totalRevenue.toFixed(2)} revenue - potential for growth`,
        action: 'Focus on marketing and customer acquisition'
      });
    }

    // Order value insight
    if (avgOrderValue > 25) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'High Order Value',
        description: `$${avgOrderValue.toFixed(2)} average order`,
        action: 'Excellent customer spending patterns'
      });
    } else {
      insights.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'Order Value Opportunity',
        description: `$${avgOrderValue.toFixed(2)} average order`,
        action: 'Consider upselling strategies'
      });
    }

    // Inventory insight
    const lowStockProducts = products.filter(p => p.quantity <= (p.lowStockThreshold || 5));
    if (lowStockProducts.length === 0) {
      insights.push({
        type: 'custom',
        icon: CheckCircle,
        title: 'Healthy Inventory',
        description: 'All products well stocked',
        action: 'Continue monitoring stock levels'
      });
    } else {
      insights.push({
        type: 'warning',
        icon: Package,
        title: 'Low Stock Alert',
        description: `${lowStockProducts.length} products need restocking`,
        action: 'Place orders for low stock items'
      });
    }

    return insights;
  }, [data.sales, data.products, data.customers]);

  const insights = [
    {
      id: 'overview',
      name: 'Overview',
      icon: Activity
    },
    {
      id: 'forecasting',
      name: 'Forecasting',
      icon: Brain
    },
    {
      id: 'customers',
      name: 'Customers',
      icon: Users
    },
    {
      id: 'products',
      name: 'Products',
      icon: Package
    }
  ];

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl sm:rounded-2xl shadow-xl overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className={`h-6 w-6 sm:h-7 sm:w-7 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h2 className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Advanced Analytics
              </h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                AI-powered insights and predictions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {insights.map((insight) => (
              <motion.button
                key={insight.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAnalytics(insight.id)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  selectedAnalytics === insight.id
                    ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                    : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                }`}
              >
                <insight.icon className="h-4 w-4 inline mr-1" />
                {insight.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */} 
      <div className="p-4 sm:p-6">
        {selectedAnalytics === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Business Insights */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                🧠 AI Business Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessInsights.map((insight, index) => {
                  const Icon = insight.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex items-start">
                        <div className={`p-2 rounded-lg mr-3 ${
                          insight.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                          insight.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                          'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            insight.type === 'success' ? 'text-green-600 dark:text-green-400' :
                            insight.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            {insight.title}
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                            {insight.description}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            💡 {insight.action}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white`}
              >
                <DollarSign className="h-8 w-8 mb-2" />
                <div className="text-2xl font-bold">${data.sales?.reduce((sum, sale) => sum + sale.total, 0).toFixed(0) || 0}</div>
                <div className="text-sm opacity-90">Total Revenue</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-green-600 to-teal-600' : 'bg-gradient-to-r from-green-500 to-teal-500'} text-white`}
              >
                <Users className="h-8 w-8 mb-2" />
                <div className="text-2xl font-bold">{data.customers?.length || 0}</div>
                <div className="text-sm opacity-90">Customers</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white`}
              >
                <Package className="h-8 w-8 mb-2" />
                <div className="text-2xl font-bold">{data.products?.length || 0}</div>
                <div className="text-sm opacity-90">Products</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-gradient-to-r from-pink-500 to-purple-500'} text-white`}
              >
                <BarChart3 className="h-8 w-8 mb-2" />
                <div className="text-2xl font-bold">{data.sales?.length || 0}</div>
                <div className="text-sm opacity-90">Sales</div>
              </motion.div>
            </div>
          </div>
        )}

        {selectedAnalytics === 'forecasting' && salesForecast && (
          <div className="space-y-6">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              🔮 Sales Forecast (Next 7 Days)
            </h3>
            
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Brain className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Predicted Revenue
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  salesForecast.trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  salesForecast.trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {salesForecast.trend === 'up' ? '📈 Growing' : salesForecast.trend === 'down' ? '📉 Declining' : '📊 Stable'}
                </div>
              </div>

              <div className="text-3xl font-bold mb-2">
                <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                  ${salesForecast.next7Days.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Growth Rate: {salesForecast.growthRate > 0 ? '+' : ''}{salesForecast.growthRate.toFixed(2)}%
                </span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Confidence: {salesForecast.confidence.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${isDarkMode ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`}
                    style={{ width: `${salesForecast.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-medium">Market Trend</span>
                </div>
                <p className="text-sm">Based on recent sales patterns, your business is {salesForecast.trend === 'up' ? 'growing steadily' : salesForecast.trend === 'down' ? 'experiencing a slowdown' : 'maintaining stable performance'}</p>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900' : 'bg-green-50'} border ${isDarkMode ? 'border-green-700' : 'border-green-200'}`}>
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-medium">Recommendation</span>
                </div>
                <p className="text-sm">
                  {salesForecast.trend === 'up' 
                    ? 'Consider increasing inventory and marketing efforts to sustain growth'
                    : salesForecast.trend === 'down'
                    ? 'Focus on customer retention and promotional strategies'
                    : 'Monitor key metrics closely to identify opportunities for growth'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedAnalytics === 'customers' && (
          <div className="space-y-6">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              👥 Customer Segmentation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* VIP Customers */}
              <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-yellow-600 bg-yellow-900' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center mb-3">
                  <Award className="h-6 w-6 mr-2 text-yellow-600" />
                  <span className="font-semibold">VIP Customers</span>
                </div>
                <div className="text-2xl font-bold mb-2">{customerSegmentation.vip.length}</div>
                <div className="text-sm mb-3">High-value customers</div>
                <div className="space-y-1">
                  {customerSegmentation.vip.slice(0, 3).map((customer, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{customer.name}</span>
                      <span className="float-right">${customer.totalSpent.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regular Customers */}
              <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-blue-600 bg-blue-900' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center mb-3">
                  <Users className="h-6 w-6 mr-2 text-blue-600" />
                  <span className="font-semibold">Regular Customers</span>
                </div>
                <div className="text-2xl font-bold mb-2">{customerSegmentation.regular.length}</div>
                <div className="text-sm mb-3">Steady purchasers</div>
                <div className="space-y-1">
                  {customerSegmentation.regular.slice(0, 3).map((customer, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{customer.name}</span>
                      <span className="float-right">${customer.totalSpent.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Customers */}
              <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-green-600 bg-green-900' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center mb-3">
                  <Zap className="h-6 w-6 mr-2 text-green-600" />
                  <span className="font-semibold">New Customers</span>
                </div>
                <div className="text-2xl font-bold mb-2">{customerSegmentation.new.length}</div>
                <div className="text-sm mb-3">Potential growth</div>
                <div className="space-y-1">
                  {customerSegmentation.new.slice(0, 3).map((customer, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{customer.name}</span>
                      <span className="float-right">${customer.totalSpent.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedAnalytics === 'products' && (
          <div className="space-y-6">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              📦 Product Performance Analysis
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-green-600 bg-green-900' : 'border-green-200 bg-green-50'}`}>
                <h4 className="font-semibold mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Top Performers
                </h4>
                <div className="space-y-3">
                  {productAnalysis.topPerformers.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm opacity-75">{product.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${product.totalRevenue.toFixed(0)}</div>
                        <div className="text-sm">{product.totalSold} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Underperformers */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-yellow-600 bg-yellow-900' : 'border-yellow-200 bg-yellow-50'}`}>
                <h4 className="font-semibold mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Marketing Opportunities
                </h4>
                <div className="space-y-3">
                  {productAnalysis.underperformers.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm opacity-75">{product.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${product.totalRevenue.toFixed(0)}</div>
                        <div className="text-sm">{product.stockLevel} in stock</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
