import React, { useContext } from 'react';
import { DataContext } from '../context/DataContextNew';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { AlertCircle, Package, Clock, DollarSign } from 'lucide-react';

/**
 * InventoryAlerts component displays low stock warnings and
 * inventory management insights for better stock control.
 */
export default function InventoryAlerts() {
  const { data } = useContext(DataContext);
  const { isDarkMode } = useContext(ThemeContext);

  // Calculate low stock products (quantity <= 5)
  const lowStockProducts = data.products.filter(product => product.quantity <= 5);
  
  // Calculate out of stock products
  const outOfStockProducts = data.products.filter(product => product.quantity === 0);
  
  // Calculate products near expiry (within 30 days)
  const nearExpiryProducts = data.products.filter(product => {
    if (!product.expiryDate) return false;
    const expiryDate = new Date(product.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  // Calculate total inventory value
  const totalInventoryValue = data.products.reduce((total, product) => {
    return total + (product.purchasePrice * product.quantity);
  }, 0);

  const alerts = [
    {
      type: 'low-stock',
      count: lowStockProducts.length,
      label: 'Low Stock Items',
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-500',
      lightBg: 'from-amber-50 to-orange-50',
      darkBg: 'from-amber-900/20 to-orange-900/20',
      borderColor: 'border-amber-500/30',
      pulseColor: 'amber',
      products: lowStockProducts
    },
    {
      type: 'out-of-stock',
      count: outOfStockProducts.length,
      label: 'Out of Stock',
      icon: Package,
      gradient: 'from-red-500 to-pink-500',
      lightBg: 'from-red-50 to-pink-50',
      darkBg: 'from-red-900/20 to-pink-900/20',
      borderColor: 'border-red-500/30',
      pulseColor: 'red',
      products: outOfStockProducts
    },
    {
      type: 'near-expiry',
      count: nearExpiryProducts.length,
      label: 'Near Expiry',
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      lightBg: 'from-orange-50 to-red-50',
      darkBg: 'from-orange-900/20 to-red-900/20',
      borderColor: 'border-orange-500/30',
      pulseColor: 'orange',
      products: nearExpiryProducts
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className={`${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ${isDarkMode ? 'border-slate-700 hover:border-indigo-500/50' : 'border-slate-200 hover:border-indigo-300'}`}>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-6 flex items-center`}>
          <div className={`w-2 h-8 rounded-full mr-3 ${isDarkMode ? 'bg-gradient-to-b from-amber-400 to-orange-400' : 'bg-gradient-to-b from-amber-500 to-orange-500'}`}></div>
          <span>Inventory Alerts</span>
          {alerts.some(alert => alert.count > 0) && (
            <motion.span 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`ml-3 px-2 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}
            >
              Active Alerts
            </motion.span>
          )}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`relative overflow-hidden ${isDarkMode ? `bg-gradient-to-br ${alert.darkBg}` : `bg-gradient-to-br ${alert.lightBg}`} p-4 rounded-2xl border ${alert.borderColor} shadow-md hover:shadow-lg transition-all duration-300 ${
                alert.count > 0 ? 'ring-2 ring-opacity-20 animate-pulse' : ''
              } ${
                alert.pulseColor === 'amber' ? (alert.count > 0 ? 'ring-amber-400 animate-pulse' : '') :
                alert.pulseColor === 'red' ? (alert.count > 0 ? 'ring-red-400 animate-pulse' : '') :
                alert.pulseColor === 'orange' ? (alert.count > 0 ? 'ring-orange-400 animate-pulse' : '') : ''
              }`}
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${alert.gradient} opacity-5`}></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl mr-3 bg-gradient-to-br ${alert.gradient} shadow-md`}>
                    <alert.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-sm`}>
                      {alert.label}
                    </span>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                      Items requiring attention
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-3xl font-bold bg-gradient-to-r ${alert.gradient} text-transparent bg-clip-text`}>
                    {alert.count}
                  </span>
                  <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {alert.count === 0 ? 'All Good!' : 'Action Needed'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Inventory Value */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50' : 'bg-gradient-to-r from-emerald-50 to-green-50'} p-4 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-emerald-50 to-green-50'} border-emerald-500/20 backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 mr-3 shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  Total Inventory Value
                </span>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Current stock valuation
                </div>
              </div>
            </div>
            <span className={`text-2xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-emerald-400 to-green-400' : 'from-emerald-600 to-green-600'} text-transparent bg-clip-text`}>
              ${totalInventoryValue.toFixed(2)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Detailed Alerts */}
      {alerts.some(alert => alert.count > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}
        >
          <h4 className={`text-md font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-3`}>
            Alert Details
          </h4>
          <div className="space-y-3">
            {alerts.map(alert => 
              alert.count > 0 && (
                <div key={alert.type} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                  <div className="flex items-center mb-2">
                    <alert.icon className={`h-4 w-4 mr-2 ${alert.color}`} />
                    <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {alert.label} ({alert.count})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {alert.products.slice(0, 3).map(product => (
                      <div key={product.id} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        • {product.name} - Qty: {product.quantity}
                        {alert.type === 'near-expiry' && product.expiryDate && (
                          <span className="ml-2 text-orange-500">
                            (Expires: {new Date(product.expiryDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    ))}
                    {alert.products.length > 3 && (
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ... and {alert.products.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

