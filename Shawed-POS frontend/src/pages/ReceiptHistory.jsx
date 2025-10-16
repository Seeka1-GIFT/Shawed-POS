import React, { useContext, useState, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import Receipt from '../components/Receipt';
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
  Printer, 
  Download, 
  Search, 
  Calendar,
  Eye,
  Receipt as ReceiptIcon,
  TrendingUp,
  DollarSign,
  BarChart3,
  Filter,
  FileText,
} from 'lucide-react';

/**
 * Enhanced ReceiptHistory page displays all completed sales with
 * advanced analytics, filtering, and receipt management capabilities.
 */
export default function ReceiptHistory() {
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in ReceiptHistory page');
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading receipt history data...</p>
        </div>
      </div>
    );
  }
  
  const { sales = [], isLoading, hasError, getError } = context;
  
  // Use sales data directly
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [filterBy, setFilterBy] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date'); // date, total, items
  const [viewMode, setViewMode] = useState('list'); // list, analytics

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    const salesData = sales || [];
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filtered = salesData.filter(sale => {
      // Search filter
      if (searchQuery) {
        const query = String(searchQuery).toLowerCase();
        const matchesId = sale?.id ? String(sale.id).toLowerCase().includes(query) : false;
        const matchesPayment = sale?.paymentMethod ? String(sale.paymentMethod).toLowerCase().includes(query) : false;
        const matchesCustomer = sale?.customerId ? String(sale.customerId).toLowerCase().includes(query) : false;
        const matchesItems = getSaleItems(sale).some(item => 
          item?.product?.name?.toLowerCase().includes(query)
        );
        
        if (!matchesId && !matchesPayment && !matchesCustomer && !matchesItems) {
          return false;
        }
      }

      // Date filter
      const saleDate = new Date(getSaleDate(sale));
      switch (filterBy) {
        case 'today':
          return saleDate.toDateString() === today.toDateString();
        case 'week':
          return saleDate >= weekAgo;
        case 'month':
          return saleDate >= monthAgo;
        default:
          return true;
      }
    });

    // Sort
    switch (sortBy) {
      case 'total':
        return filtered.sort((a, b) => (b?.total || 0) - (a?.total || 0));
      case 'items':
        return filtered.sort((a, b) => (getSaleItems(b).length || 0) - (getSaleItems(a).length || 0));
      default:
        return filtered.sort((a, b) => new Date(getSaleDate(b) || 0) - new Date(getSaleDate(a) || 0));
    }
  }, [sales, searchQuery, filterBy, sortBy]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const salesData = sales || [];
    const days = [];
    const now = new Date();
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const salesOfDay = salesData.filter(sale => {
        const saleDate = getSaleDate(sale);
        return saleDate && saleDate.slice(0, 10) === dateStr;
      });
      const totalRevenue = salesOfDay.reduce((sum, sale) => sum + (sale?.total || 0), 0);
      const totalTransactions = salesOfDay.length;
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      days.push({
        name: dayLabel,
        date: dateStr,
        Revenue: totalRevenue,
        Transactions: totalTransactions,
        AvgValue: avgTransactionValue,
      });
    }
    
    return days;
  }, [sales]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const salesData = sales || [];
    const breakdown = {};
    
    salesData.forEach(sale => {
      const paymentMethod = sale?.paymentMethod || 'Unknown';
      if (!breakdown[paymentMethod]) {
        breakdown[paymentMethod] = { count: 0, total: 0 };
      }
      breakdown[paymentMethod].count += 1;
      breakdown[paymentMethod].total += (sale?.total || 0);
    });
    
    const totalSalesValue = salesData.reduce((sum, s) => sum + (s?.total || 0), 0);
    
    return Object.entries(breakdown).map(([method, methodData]) => ({
      method,
      count: salesData.length,
      total: totalSalesValue,
      percentage: 100,
    }));
  }, [sales]);

  const handleViewReceipt = (sale) => {
    setSelectedSale(sale);
    setShowReceipt(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get the correct date field from sale data
  const getSaleDate = (sale) => {
    return sale?.saleDate || sale?.date || sale?.createdAt || null;
  };

  // Get the correct items field from sale data
  const getSaleItems = (sale) => {
    return sale?.saleItems || sale?.items || [];
  };

  const getTotalSales = () => {
    return (filteredSales || []).reduce((total, sale) => total + (sale?.total || 0), 0);
  };

  const getTotalTransactions = () => {
    return (filteredSales || []).length;
  };

  const getAverageTransactionValue = () => {
    const sales = filteredSales || [];
    const totalSales = (sales || []).reduce((total, sale) => total + (sale?.total || 0), 0);
    return sales.length > 0 ? totalSales / sales.length : 0;
  };

  const exportReceipts = () => {
    const sales = filteredSales || [];
    const receiptsData = sales.map(sale => ({
      id: sale?.id || 'Unknown',
      date: sale?.date || 'Unknown',
      total: sale?.total || 0,
      paymentMethod: sale?.paymentMethod || 'Unknown',
      customerId: sale?.customerId || 'Unknown',
      itemsCount: (sale?.items || []).length,
      items: (sale?.items || []).map(item => ({
        name: item?.product?.name || 'Unknown',
        quantity: item?.quantity || 0,
        price: item?.product?.sellingPrice || 0,
        total: (item?.product?.sellingPrice || 0) * (item?.quantity || 0),
      })),
    }));

    const dataStr = JSON.stringify(receiptsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipts-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${getTotalSales().toFixed(2)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transactions</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {getTotalTransactions()}
              </p>
            </div>
            <ReceiptIcon className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
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
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Transaction</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${getAverageTransactionValue().toFixed(2)}
              </p>
            </div>
            <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <BarChart3 className="h-5 w-5 mr-2" />
            Daily Revenue Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData || []}>
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
                <Line type="monotone" dataKey="Revenue" stroke={isDarkMode ? '#3b82f6' : '#0a72ff'} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <ReceiptIcon className="h-5 w-5 mr-2" />
            Payment Methods
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="method" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    color: isDarkMode ? '#f3f4f6' : '#111827'
                  }}
                />
                <Bar dataKey="total" fill={isDarkMode ? '#10b981' : '#059669'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReceiptList = () => (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
          <FileText className="h-5 w-5 mr-2" />
          Receipt History ({(filteredSales || []).length})
        </h3>
        <button
          onClick={exportReceipts}
          className={`px-3 py-1 text-sm ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors`}
        >
          Export All
        </button>
      </div>

      {(filteredSales || []).length === 0 ? (
        <div className="text-center py-8">
          <ReceiptIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
            {(sales || []).length === 0 
              ? "No receipts found. Complete some sales to see them here."
              : "No receipts found matching your criteria."
            }
          </p>
          {(sales || []).length === 0 && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Go to the Sales page to make your first sale!
            </p>
          )}
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="overflow-x-auto whitespace-nowrap hidden sm:block">
          <table className="min-w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Receipt #</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date & Time</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Items</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale, index) => (
                <motion.tr
                  key={sale?.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    <span className="font-mono text-sm">#{sale?.id || 'Unknown'}</span>
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="text-sm">{formatDate(getSaleDate(sale))}</div>
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    <div className="text-sm">{(getSaleItems(sale).length || 0)} item{(getSaleItems(sale).length || 0) !== 1 ? 's' : ''}</div>
                    <div className="text-xs text-gray-500">
                      {getSaleItems(sale).slice(0, 2).map(item => item?.product?.name || 'Unknown').join(', ')}
                      {(getSaleItems(sale).length || 0) > 2 && '...'}
                    </div>
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="text-sm">{sale?.paymentMethod || 'Unknown'}</span>
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    <span className="font-semibold">${Number(sale?.total || 0).toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewReceipt(sale)}
                        className={`px-3 py-1 text-xs ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} rounded-lg transition-colors`}
                      >
                        <Eye className="h-3 w-3 inline mr-1" />
                        View
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="block sm:hidden space-y-3">
          {filteredSales.map((sale, idx)=> (
            <div key={sale?.id || idx} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3` }>
              <div className="flex items-center justify-between">
                <div className={`font-mono text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>📄 #{sale?.id || 'Unknown'}</div>
                <div className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-semibold`}>💰 ${Number(sale?.total || 0).toFixed(2)}</div>
              </div>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-xs mt-1`}>🕒 {formatDate(getSaleDate(sale))}</div>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-xs`}>🛒 {(getSaleItems(sale).length || 0)} item{(getSaleItems(sale).length || 0) !== 1 ? 's' : ''}</div>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-xs`}>💳 {sale?.paymentMethod || 'Unknown'}</div>
              <div className="flex justify-end mt-2">
                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>handleViewReceipt(sale)} className={`px-3 py-1 text-xs ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} rounded-lg`}>
                  <Eye className="h-3 w-3 inline mr-1"/>View
                </motion.button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );

  // Show loading state
  if (isLoading && isLoading('sales')) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading receipt history...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError && hasError('sales')) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>
            Something went wrong
          </h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            We're sorry, but something unexpected happened. Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors`}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search receipts by ID, customer, payment method, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
            >
              <option value="date">Sort by Date</option>
              <option value="total">Sort by Total</option>
              <option value="items">Sort by Items</option>
            </select>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
            >
              <option value="list">List View</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {viewMode === 'analytics' ? renderAnalytics() : renderReceiptList()}

      {/* Receipt Modal */}
      <Receipt
        sale={selectedSale}
        isVisible={showReceipt}
        onClose={() => setShowReceipt(false)}
        isDarkMode={isDarkMode}
      />
    </motion.div>
  );
}
