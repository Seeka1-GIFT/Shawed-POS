import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

/**
 * ChartCard wraps Recharts components to display either a line
 * chart or a bar chart. It receives a `data` array of objects
 * where each object represents a point. The `type` prop defines
 * whether to render a line chart or bar chart. The chart is
 * responsive and will adjust to fill its parent container.
 */
export default function ChartCard({ title, data, type = 'line', isDarkMode, onPointClick }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.3 }
      }}
      className={`${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ${isDarkMode ? 'border-slate-700 hover:border-indigo-500/50' : 'border-slate-200 hover:border-indigo-300'}`}
    >
      <motion.h3 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-4 sm:mb-6 flex items-center`}
      >
        <div className={`w-2 h-6 sm:h-8 rounded-full mr-3 ${isDarkMode ? 'bg-gradient-to-b from-indigo-500 to-purple-500' : 'bg-gradient-to-b from-indigo-600 to-purple-600'}`}></div>
        {title}
      </motion.h3>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="h-48 sm:h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} onClick={(e)=>{ if(onPointClick && e && e.activeLabel){ onPointClick(e); } }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDarkMode ? '#6366f1' : '#4338ca'} />
                  <stop offset="100%" stopColor={isDarkMode ? '#8b5cf6' : '#7c3aed'} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#475569' : '#cbd5e1'} opacity={0.3} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.1)',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
              />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} onClick={(e)=>{ if(onPointClick && e && e.activeLabel){ onPointClick(e); } }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDarkMode ? '#6366f1' : '#4338ca'} />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#475569' : '#cbd5e1'} opacity={0.3} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.1)',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                strokeWidth={3} 
                stroke={isDarkMode ? '#6366f1' : '#4338ca'}
                dot={{ fill: isDarkMode ? '#6366f1' : '#4338ca', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: isDarkMode ? '#8b5cf6' : '#7c3aed' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
