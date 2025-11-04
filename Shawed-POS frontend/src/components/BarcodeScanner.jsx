import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

/**
 * BarcodeScanner component provides manual barcode input functionality.
 * Simple and clean interface for entering barcodes manually.
 */
export default function BarcodeScanner({ isVisible, onClose, onScanSuccess, isDarkMode }) {
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScanSuccess(manualBarcode.trim());
      setManualBarcode('');
      onClose();
    }
  };

  const handleClose = () => {
    setManualBarcode('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center">
              <CheckCircle className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Scan Barcode
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content - Manual Input only */}
          <div className="p-4">
            <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Enter barcode manually:
                  </p>
                </div>
                
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Enter barcode number (e.g., 037551000340)"
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit(e);
                      }
                    }}
                  />
                  
                  <button
                    type="submit"
                    className={`w-full py-3 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors font-medium`}
                  >
                    <CheckCircle className="h-5 w-5 inline mr-2" />
                    Use Barcode
                  </button>
                </form>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              💡 Try scanning your example barcode: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">037551000340</code>
              <br />
              Supported formats: UPC, EAN, Code 128, QR Code, and more
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
