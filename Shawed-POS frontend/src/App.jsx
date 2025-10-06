import React, { useState, useContext, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import SupplierProfile from './pages/SupplierProfile';
import PurchaseOrders from './pages/PurchaseOrders';
import Settings from './pages/Settings';
import StockManagement from './pages/StockManagement';
import ReceiptHistory from './pages/ReceiptHistory';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

// Lazy load heavy components
const Reports = lazy(() => import('./pages/Reports'));
import { ThemeContext } from './context/ThemeContext';
import { UserContext } from './context/UserContext';
import { BusinessProvider } from './context/BusinessContext';
import { RealDataProvider } from './context/RealDataContext';
import { Menu, X } from 'lucide-react';

/**
 * The top level component for the application. Manages
 * authentication state and renders either the login
 * screen or the application shell with sidebar, header and
 * page content. The shell uses nested routes to load
 * appropriate page components. When a user logs in the
 * auth flag is stored in localStorage so that session
 * persists across refreshes.
 */
export default function App() {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isAuthenticated, logout } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // If the user is not authenticated show the login page.
  if (!isAuthenticated) {
    return <Login />;
  }

  // Once authenticated render the application shell. The sidebar
  // stays persistent and the header displays the current page
  // title and logout option.
  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} overflow-hidden`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          onLogout={handleLogout} 
          onMobileClose={() => setSidebarOpen(false)}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>
      
      <div className="flex flex-col flex-1 lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} isDarkMode={isDarkMode} />
        <main className={`flex-1 overflow-y-auto p-2 sm:p-4 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50'}`}>
          <BusinessProvider>
              <AnimatePresence mode="wait">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/suppliers/:id" element={<SupplierProfile />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/stock" element={<StockManagement />} />
                    <Route path="/receipts" element={<ReceiptHistory />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* Catch-all route redirects unknown paths to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
          </BusinessProvider>
        </main>
      </div>
    </div>
  );
}
