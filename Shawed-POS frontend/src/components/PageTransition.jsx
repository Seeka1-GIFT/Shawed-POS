import React from 'react';
import { motion } from 'framer-motion';

/**
 * PageTransition wrapper component that provides consistent
 * page entrance animations for all pages in the application.
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

