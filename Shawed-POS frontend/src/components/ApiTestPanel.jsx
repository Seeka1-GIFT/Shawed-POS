/**
 * API Test Panel - Demonstrates backend integration
 * Simple panel to test API connectivity and data sync
 */

import React, { useState } from 'react';
import { Database, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../services/api';

export function ApiTestPanel() {
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [backendData, setBackendData] = useState({
    products: [],
    customers: [],
    sales: []
  });

  const runApiTests = async () => {
    setIsTesting(true);
    setTestResults({});

    const results = {};

    try {
      // Test 1: Health Check
      console.log('Testing health check...');
      const healthResponse = await api.healthAPI.checkHealth();
      results.health = {
        success: true,
        message: 'Backend is healthy',
        data: healthResponse
      };
    } catch (error) {
      results.health = {
        success: false,
        message: `Health check failed: ${error.message}`
      };
    }

    try {
      // Test 2: Products API
      console.log('Testing products API...');
      const productsResponse = await api.productsAPI.getProducts();
      results.products = {
        success: true,
        message: `Found ${productsResponse.data?.length || 0} products`,
        data: productsResponse.data
      };
      setBackendData(prev => ({ ...prev, products: productsResponse.data || [] }));
    } catch (error) {
      results.products = {
        success: false,
        message: `Products API failed: ${error.message}`
      };
    }

    try {
      // Test 3: Customers API
      console.log('Testing customers API...');
      const customersResponse = await api.customersAPI.getCustomers();
      results.customers = {
        success: true,
        message: `Found ${customersResponse.data?.length || 0} customers`,
        data: customersResponse.data
      };
      setBackendData(prev => ({ ...prev, customers: customersResponse.data || [] }));
    } catch (error) {
      results.customers = {
        success: false,
        message: `Customers API failed: ${error.message}`
      };
    }

    try {
      // Test 4: Sales API
      console.log('Testing sales API...');
      const salesResponse = await api.salesAPI.getSales();
      results.sales = {
        success: true,
        message: `Found ${salesResponse.data?.length || 0} sales`,
        data: salesResponse.data
      };
      setBackendData(prev => ({ ...prev, sales: salesResponse.data || [] }));
    } catch (error) {
      results.sales = {
        success: false,
        message: `Sales API failed: ${error.message}`
      };
    }

    setTestResults(results);
    setIsTesting(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Backend Integration Test
          </h3>
        </div>
        
        <button
          onClick={runApiTests}
          disabled={isTesting}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2
            ${isTesting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            }
          `}
        >
          {isTesting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Test Connection</span>
            </>
          )}
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-3 mb-6">
          {Object.entries(testResults).map(([key, result]) => (
            <div key={key} className={`
              flex items-center space-x-3 p-3 rounded-lg
              ${result.success 
                ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20' 
                : 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
              }
            `}>
              <CheckCircle className={`
                w-5 h-5 ${result.success ? 'text-green-600' : 'text-red-600'}
              `} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {key} API
                </p>
                <p className={`
                  text-sm ${result.success 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                  }
                `}>
                  {result.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backend Data Preview */}
      {Object.values(backendData).some(data => data.length > 0) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Backend Data Preview
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {backendData.products.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-3 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-100">Products ({backendData.products.length})</h5>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {backendData.products.slice(0, 3).map(product => (
                    <li key={product.id}>• {product.name}</li>
                  ))}
                  {backendData.products.length > 3 && (
                    <li className="text-blue-600 dark:text-blue-400">+{backendData.products.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {backendData.customers.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 p-3 rounded-lg">
                <h5 className="font-medium text-purple-900 dark:text-purple-100">Customers ({backendData.customers.length})</h5>
                <ul className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {backendData.customers.slice(0, 3).map(customer => (
                    <li key={customer.id}>• {customer.name}</li>
                  ))}
                  {backendData.customers.length > 3 && (
                    <li className="text-purple-600 dark:text-purple-400">+{backendData.customers.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {backendData.sales.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-3 rounded-lg">
                <h5 className="font-medium text-green-900 dark:text-green-100">Sales ({backendData.sales.length})</h5>
                <ul className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {backendData.sales.slice(0, 3).map(sale => (
                    <li key={sale.id}>• • ${sale.total}</li>
                  ))}
                  {backendData.sales.length > 3 && (
                    <li className="text-green-600 dark:text-green-400">+{backendData.sales.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiTestPanel;
