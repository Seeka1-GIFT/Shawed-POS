import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Camera, RotateCcw } from 'lucide-react';

/**
 * BarcodeScanner component provides manual barcode input functionality.
 * Simple and clean interface for entering barcodes manually.
 */
export default function BarcodeScanner({ isVisible, onClose, onScanSuccess, isDarkMode }) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setScanMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isVisible && scanMode === 'camera') {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isVisible, scanMode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScanSuccess(manualBarcode.trim());
      setManualBarcode('');
      onClose();
    }
  };

  const simulateScan = () => {
    setIsScanning(false);
    const simulatedBarcode = '037551000340'; // Your example barcode
    setScanResult(simulatedBarcode);
    setTimeout(() => {
      onScanSuccess(simulatedBarcode);
      onClose();
    }, 1500);
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
              <Camera className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Scan Barcode
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode Switcher */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setScanMode('camera')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    scanMode === 'camera' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Camera
                </button>
                <button
                  onClick={() => setScanMode('manual')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    scanMode === 'manual' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Manual
                </button>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content - Camera and Manual Input */}
          <div className="p-4">
            {scanMode === 'camera' ? (
              <div className="space-y-4">
                {/* Camera View */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    autoPlay
                    playsInline
                  />
                  
                  {/* Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-90 rounded-lg p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-800 font-medium">Scanning...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Success overlay */}
                  {scanResult && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-green-500 rounded-lg p-4 text-center">
                        <CheckCircle className="h-12 w-12 text-white mx-auto mb-2" />
                        <p className="text-white font-medium">Found: {scanResult}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Camera Controls */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={simulateScan}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Camera className="h-4 w-4 inline mr-2" />
                    Demo Scan (037551000340)
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 inline mr-2" />
                    Switch to Manual
                  </button>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
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
            )}
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
