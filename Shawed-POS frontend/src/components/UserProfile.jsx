import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { User, Shield, Clock, LogOut, Settings } from 'lucide-react';

export default function UserProfile() {
  const { currentUser, logout, ROLES } = useContext(UserContext);
  const { isDarkMode } = useContext(ThemeContext);

  if (!currentUser) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN: return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case ROLES.MANAGER: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case ROLES.CASHIER: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case ROLES.VIEWER: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          User Profile
        </h3>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-red-600 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}>
          <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
          </span>
        </div>
        <div>
          <h4 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {currentUser.firstName} {currentUser.lastName}
          </h4>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentUser.email}
          </p>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getRoleColor(currentUser.role)}`}>
            {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Username
            </p>
            <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {currentUser.username}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Shield className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Permissions
            </p>
            <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {currentUser.permissions.length} permissions granted
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Clock className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Last Login
            </p>
            <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {formatLastLogin(currentUser.lastLogin)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`h-5 w-5 rounded-full ${currentUser.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </p>
            <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {currentUser.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
          Account Created
        </h5>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </motion.div>
  );
}

