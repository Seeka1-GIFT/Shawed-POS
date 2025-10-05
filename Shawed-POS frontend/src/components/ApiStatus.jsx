/**
 * API Connection Status Indicator
 * Shows connection status between frontend and backend
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useApiContext } from '../services/apiContext';

export function ApiStatus() {
  const [isVisible, setIsVisible] = useState(true);
  const { apiConnected, apiError, loading } = useApiContext();

  // Auto-hide after 5 seconds if connected
  useEffect(() => {
    if (apiConnected && !loading) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [apiConnected, loading]);

  if (!isVisible || (!apiError && !loading)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg
        ${apiConnected 
          ? 'bg-green-500 text-white' 
          : apiError 
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white'
        }
      `}>
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Connecting to API...</span>
          </>
        ) : apiConnected ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Connected to Backend</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        )}
        
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ApiStatus;


