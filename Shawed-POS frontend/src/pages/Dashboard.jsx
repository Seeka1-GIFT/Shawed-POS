import React, { useContext, useMemo, useEffect } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import InventoryAlerts from '../components/InventoryAlerts';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
} from 'lucide-react';

/**
 * Dashboard aggregates key metrics and visualisations from the
 * global data context. It displays summary statistics for the
 * current day's sales and profit, stock levels and low stock
 * alerts. A line chart visualises sales volume over the last
 * seven days. All computations are memoised for performance.
 */
export default function Dashboard() {
  const { 
    getDashboardData, 
    isLoading, 
    hasError,
    fetchProducts,
    fetchSales,
    fetchDashboardStats
  } = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);

  // We rely on local computed data for the dashboard to avoid noisy
  // network errors if the remote reporting endpoint is sleeping.
  // If in the future you want to enable server stats, uncomment below.
  // useEffect(() => {
  //   const token = localStorage.getItem('authToken');
  //   if (token) {
  //     fetchDashboardStats();
  //   }
  // }, [fetchDashboardStats]);

  // Determine current date string in YYYY-MM-DD format
  const todayStr = new Date().toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const dashboardData = getDashboardData();
    
    return {
      totalSales: dashboardData.salesToday || 0,
      totalProfit: dashboardData.profitToday || 0,
      productsCount: dashboardData.totalProducts || 0,
      lowStockCount: dashboardData.lowStockCount || 0,
    };
  }, [getDashboardData]);

  // Prepare data for sales line chart. We group sales by date for the last 7 days.
  const chartData = useMemo(() => {
    const dashboardData = getDashboardData();
    const sales = dashboardData.recentSales || [];
    
    // If we have sales data, use it; otherwise create sample data
    if (sales.length > 0) {
      return sales.slice(0, 7).map(sale => ({
        name: sale.date,
        value: sale.total
      }));
    }
    
    // Fallback to last 7 days with zero sales
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      days.push({ name: dayLabel, value: 0 });
    }
    return days;
  }, [getDashboardData]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >

      {/* Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 sm:mt-4"
      >
        <StatsCard icon={DollarSign} label="Sales Today" value={`$${metrics.totalSales.toFixed(2)}`} isDarkMode={isDarkMode} />
        <StatsCard icon={TrendingUp} label="Profit Today" value={`$${metrics.totalProfit.toFixed(2)}`} isDarkMode={isDarkMode} />
        <StatsCard icon={Package} label="Products" value={metrics.productsCount} isDarkMode={isDarkMode} />
        <StatsCard icon={AlertTriangle} label="Low Stock" value={metrics.lowStockCount} isDarkMode={isDarkMode} />
      </motion.div>
      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-3 sm:mt-6"
      >
        <ChartCard title="Sales Last 7 Days" data={chartData} type="line" isDarkMode={isDarkMode} />
      </motion.div>

      {/* Advanced Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-3 sm:mt-6"
      >
        <AdvancedAnalytics data={getDashboardData()} isDarkMode={isDarkMode} />
      </motion.div>



      {/* Inventory Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-3 sm:mt-6"
      >
        <InventoryAlerts />
      </motion.div>
    </motion.div>
  );
}
