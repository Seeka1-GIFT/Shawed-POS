import React from 'react';
import { motion } from 'framer-motion';

/**
 * StatsCard displays a single statistic with an icon and label.
 * It is used on the dashboard to surface key metrics such as
 * total sales or number of products. The card utilises rounded
 * corners, subtle shadows and spacing consistent with the
 * design guidelines.
 */
export default function StatsCard({ icon: Icon, label, value, isDarkMode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800' : 'bg-gradient-to-br from-white to-slate-50 hover:from-slate-50 hover:to-white'} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border cursor-pointer transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'border-slate-700 hover:border-indigo-500/50' : 'border-slate-200 hover:border-indigo-300'} w-full`}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-indigo-500/5 to-purple-500/5' : 'from-indigo-500/3 to-purple-500/3'} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`flex items-center justify-center h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-md mr-4 sm:mr-6 ${
            label === 'Sales Today' ? 
              (isDarkMode ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600') :
            label === 'Profit Today' ?
              (isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600') :
            label === 'Products' ?
              (isDarkMode ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400' : 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-600') :
              (isDarkMode ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400' : 'bg-gradient-to-br from-amber-500/10 to-amber-600/10 text-amber-600')
          }`}
        >
          <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
        </motion.div>
        
        <div className="flex-1">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-1 sm:mb-2 opacity-90`}
          >
            {label}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2 sm:mb-3`}
          >
            {value}
          </motion.p>
          {/* Progress indicator bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className={`h-1 w-full rounded ${isDarkMode ? 'bg-gradient-to-r from-indigo-500/50 to-purple-500/50' : 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30'}`}
          >
            <div className={`h-full w-full rounded gradient-rainbow`}></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
