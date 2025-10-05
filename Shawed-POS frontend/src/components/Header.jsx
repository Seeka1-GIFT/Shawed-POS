import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

/**
 * Header displays the title of the current page based on the
 * pathname from the router. It could also be extended to show
 * breadcrumbs or other actions. The mapping between routes and
 * titles is defined locally here; adding a new page requires
 * updating this mapping.
 */
export default function Header({ onMenuClick, isDarkMode }) {
  const location = useLocation();
  const path = location.pathname;

  const titleMap = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/sales': 'Sales',
    '/expenses': 'Expenses',
    '/customers': 'Customers',
    '/suppliers': 'Suppliers',
    '/purchase-orders': 'Purchase Orders',
    '/stock': 'Stock Management',
    '/receipts': 'Receipt History',
    '/reports': 'Reports',
    '/users': 'User Management',
    '/settings': 'Settings',
  };

  const title = titleMap[path] || 'Dashboard';

  return (
    <header className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-6 py-3 shadow-sm`}>
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mr-3`}
        >
          <Menu className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h1>
      </div>
    </header>
  );
}
