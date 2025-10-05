import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DataContext } from '../context/DataContextNew';
import {
  Home,
  Package2,
  ShoppingCart,
  Coins,
  Users,
  Truck,
  BarChart2,
  Warehouse,
  Receipt,
  ClipboardList,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  UserCog,
} from 'lucide-react';

/**
 * Sidebar is a vertical navigation component that renders a list
 * of links to the main pages of the application. It highlights
 * the currently active route using the NavLink "isActive" prop.
 * At the bottom there is a logout button which calls the
 * onLogout handler provided via props.
 */
export default function Sidebar({ onLogout, onMobileClose, isDarkMode, toggleDarkMode }) {
  const { t } = useTranslation();
  const { data } = useContext(DataContext);
  
  const businessInfo = data.businessSettings || {};
  const businessName = businessInfo.name || 'Business Name';
  const navItems = [
    { to: '/dashboard', label: t('dashboard'), icon: Home },
    { to: '/products', label: t('products'), icon: Package2 },
    { to: '/sales', label: t('sales'), icon: ShoppingCart },
    { to: '/expenses', label: t('expenses'), icon: Coins },
    { to: '/customers', label: t('customers'), icon: Users },
    { to: '/suppliers', label: t('suppliers'), icon: Truck },
    { to: '/purchase-orders', label: t('purchaseOrders'), icon: ClipboardList },
    { to: '/stock', label: t('stockManagement'), icon: Warehouse },
    { to: '/receipts', label: t('receiptHistory'), icon: Receipt },
    { to: '/reports', label: t('reports'), icon: BarChart2 },
    { to: '/users', label: t('userManagement'), icon: UserCog },
    { to: '/settings', label: t('settings'), icon: SettingsIcon },
  ];

  return (
    <motion.aside 
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-60 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}
    >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`p-6 ${isDarkMode ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10' : 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5'} mb-4 mx-4 rounded-xl border ${isDarkMode ? 'border-indigo-500/20' : 'border-indigo-500/10'}`}
        >
          <div className="flex items-center">
            {businessInfo.logo && (
              <div className="relative mr-3">
                <img 
                  src={businessInfo.logo} 
                  alt="Business Logo" 
                  className="w-10 h-10 rounded-lg object-cover shadow-md"
                />
                <div className={`absolute inset-0 rounded-lg ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}></div>
              </div>
            )}
            <div>
              <span className={`text-lg font-bold bg-gradient-to-r ${isDarkMode ? 'from-indigo-400 to-purple-400 text-transparent bg-clip-text' : 'from-indigo-600 to-purple-600 text-transparent bg-clip-text'}`}>
                {businessName}
              </span>
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} opacity-80`}>
                Business POS System
              </div>
            </div>
          </div>
        </motion.div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }, index) => (
            <motion.li 
              key={to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            >
              <NavLink
                to={to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  [
                    'flex items-center px-4 py-3 mx-4 rounded-xl transition-all duration-300 group relative',
                    isActive
                      ? `${isDarkMode ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 border border-indigo-500/20'} font-semibold shadow-lg`
                      : `${isDarkMode ? 'text-slate-300 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-purple-500/5 hover:text-indigo-300' : 'text-slate-600 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-purple-500/5 hover:text-indigo-600'} hover:shadow-md`,
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`mr-3 h-5 w-5 transition-all duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-500' : ''}`} />
                    <span>{label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className={`absolute left-0 top-0 bottom-0 w-1 ${isDarkMode ? 'bg-gradient-to-b from-indigo-400 to-purple-400' : 'bg-gradient-to-b from-indigo-500 to-purple-500'} rounded-r-full`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleDarkMode}
          className={`w-full flex items-center justify-center px-4 py-2 mb-2 ${isDarkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
        >
          {isDarkMode ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
          {t('darkMode')}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className={`w-full flex items-center justify-center px-4 py-2 ${isDarkMode ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
        >
          <LogOut className="h-5 w-5 mr-2" /> {t('logout')}
        </motion.button>
      </motion.div>
    </motion.aside>
  );
}
