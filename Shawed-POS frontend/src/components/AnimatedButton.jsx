import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedButton component provides consistent button animations
 * with hover and tap effects throughout the application.
 */
export default function AnimatedButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  isDarkMode = false,
  ...props 
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return isDarkMode 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-primary-600 hover:bg-primary-700 text-white';
      case 'secondary':
        return isDarkMode 
          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      case 'danger':
        return isDarkMode 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return isDarkMode 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-primary-600 hover:bg-primary-700 text-white';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

