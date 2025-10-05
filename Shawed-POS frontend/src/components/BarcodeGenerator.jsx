import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Copy, Eye, QrCode } from 'lucide-react';
import JsBarcode from 'jsbarcode';

/**
 * BarcodeGenerator creates visual barcode representations
 * for products with various formats and styles.
 */
export default function BarcodeGenerator({ 
  barcode, 
  productName = '', 
  size = 'medium', 
  format = 'CODE128',
  showLabel = true,
  isDarkMode = false 
}) {
  const canvasRef = useRef(null);
  const [formatOptions] = useState([
    { value: 'CODE128', label: 'Code 128' },
    { value: 'EAN13', label: 'EAN-13' },
    { value: 'EAN8', label: 'EAN-8' },
    { value: 'UPC', label: 'UPC' },
    { value: 'CODE39', label: 'Code 39' },
    { value: 'ITF14', label: 'ITF-14' },
    { value: 'MSI', label: 'MSI' },
    { value: 'pharmacode', label: 'Pharmacode' },
    { value: 'codabar', label: 'Codabar' }
  ]);

  const [selectedFormat, setSelectedFormat] = useState(format);
  const [currentBarcode, setCurrentBarcode] = useState(barcode || '037551000340');

  const generateBarcode = (formattedBarcode, formatType = selectedFormat) => {
    if (!canvasRef.current || !formattedBarcode) return;

    try {
      const options = {
        format: formatType,
        width: size === 'large' ? 3 : size === 'small' ? 1.5 : 2,
        height: size === 'large' ? 80 : size === 'small' ? 40 : 60,
        displayValue: showLabel,
        fontSize: size === 'small' ? 8 : size === 'large' ? 12 : 10,
        background: isDarkMode ? '#1f2937' : '#ffffff',
        lineColor: isDarkMode ? '#ffffff' : '#000000',
        margin: 10,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 2
      };

      // Clear canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Generate barcode
      JsBarcode(canvasRef.current, formattedBarcode, options);

      console.log(`Barcode generated: ${formattedBarcode} (${formatType})`);
    } catch (error) {
      console.error('Barcode generation failed:', error);
      // Fallback to simple text display
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.font = '16px monospace';
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.fillText(`BARCODE: ${formattedBarcode}`, 10, 30);
    }
  };

  useEffect(() => {
    if (currentBarcode) {
      generateBarcode(currentBarcode, selectedFormat);
    }
  }, [currentBarcode, selectedFormat, size, showLabel, isDarkMode]);

  useEffect(() => {
    if (barcode) {
      setCurrentBarcode(barcode);
    }
  }, [barcode]);

  const handleFormatChange = (newFormat) => {
    setSelectedFormat(newFormat);
    generateBarcode(currentBarcode, newFormat);
  };

  const downloadBarcode = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `barcode-${currentBarcode || 'product'}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const copyBarcode = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(() => {
        alert('Barcode copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        navigator.clipboard.writeText(currentBarcode);
        alert('Barcode number copied!');
      });
    });
  };

  const generateRandomBarcode = () => {
    const prefixes = {
      CODE128: '12',
      EAN13: '123',
      EAN8: '1234567',
      UPC: '123',
      CODE39: '123',
      ITF14: '1234567890123',
      MSI: '123',
      pharmacode: '1234',
      codabar: 'A123B'
    };

    const prefix = prefixes[selectedFormat] || '123';
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newBarcode = prefix + randomSuffix;
    
    setCurrentBarcode(newBarcode);
  };

  const regenerate = () => {
    if (currentBarcode) {
      generateBarcode(currentBarcode, selectedFormat);
    }
  };

  return (
    <motion.div 
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6 shadow-lg`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <QrCode className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Barcode Generator
          </h3>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={regenerate}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            <RefreshCw className="h-4 w-4 inline mr-1" />
            Regenerate
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateRandomBarcode}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
          >
            Random
          </motion.button>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Barcode Format:
        </label>
        <select
          value={selectedFormat}
          onChange={(e) => handleFormatChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isDarkMode 
              ? 'border-gray-600 bg-gray-700 text-gray-100' 
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          {formatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Barcode Input */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Barcode Value:
        </label>
        <input
          type="text"
          value={currentBarcode || ''}
          onChange={(e) => setCurrentBarcode(e.target.value)}
          placeholder="Enter barcode (e.g., 037551000340)"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isDarkMode 
              ? 'border-gray-600 bg-gray-700 text-gray-100' 
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
      </div>

      {/* Barcode Display */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="100"
          className="w-full h-20 border border-gray-300 rounded"
        />
        {productName && currentBarcode && (
          <p className={`text-center text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Product: {productName}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadBarcode}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          <Download className="h-4 w-4 inline mr-2" />
          Download
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyBarcode}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
        >
          <Copy className="h-4 w-4 inline mr-2" />
          Copy
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => generateBarcode('037551000340', selectedFormat)}
          className={`px-3 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
          title="Use your example barcode"
        >
          <Eye className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Info */}
      <p className={`text-xs mt-3 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        💡 Try your example barcode: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">037551000340</code>
      </p>
    </motion.div>
  );
}


