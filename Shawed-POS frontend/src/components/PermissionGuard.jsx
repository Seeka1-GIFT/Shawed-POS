import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * PermissionGuard component that conditionally renders children based on user permissions
 * @param {Object} props
 * @param {string|Array} props.permission - Single permission or array of permissions
 * @param {string|Array} props.role - Single role or array of roles
 * @param {React.ReactNode} props.children - Content to render if permission is granted
 * @param {React.ReactNode} props.fallback - Content to render if permission is denied
 * @param {boolean} props.requireAll - If true, user must have ALL permissions (default: false)
 * @param {boolean} props.showFallback - If true, shows fallback content instead of hiding (default: false)
 */
export default function PermissionGuard({ 
  permission, 
  role, 
  children, 
  fallback = null, 
  requireAll = false,
  showFallback = false 
}) {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, isAuthenticated } = useContext(UserContext);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return showFallback ? (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <AlertTriangle className="h-8 w-8 mr-3" />
        <span>Please log in to access this content</span>
      </div>
    ) : null;
  }

  let hasAccess = true;

  // Check permissions
  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = requireAll 
        ? permission.every(p => hasPermission(p))
        : hasAnyPermission(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  // Check roles (only if permission check passed or no permission specified)
  if (hasAccess && role) {
    if (Array.isArray(role)) {
      hasAccess = hasAnyRole(role);
    } else {
      hasAccess = hasRole(role);
    }
  }

  if (!hasAccess) {
    if (showFallback) {
      return fallback || (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center p-8 text-gray-500"
        >
          <Shield className="h-8 w-8 mr-3" />
          <span>You don't have permission to access this content</span>
        </motion.div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook for checking permissions in components
 */
export function usePermissions() {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasRole, 
    hasAnyRole, 
    currentUser,
    isAuthenticated 
  } = useContext(UserContext);

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    currentUser,
    isAuthenticated,
    canManageUsers: hasPermission('manage_users'),
    canViewReports: hasPermission('view_reports'),
    canProcessSales: hasPermission('process_sales'),
    canManageProducts: hasPermission('manage_products'),
    canManageCustomers: hasPermission('manage_customers'),
    canManageSuppliers: hasPermission('manage_suppliers'),
    canManageExpenses: hasPermission('manage_expenses'),
    canManageSettings: hasPermission('manage_settings'),
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
    isCashier: hasRole('cashier'),
    isViewer: hasRole('viewer')
  };
}

/**
 * Higher-order component for protecting entire pages
 */
export function withPermissionGuard(WrappedComponent, requiredPermission, requiredRole) {
  return function ProtectedComponent(props) {
    return (
      <PermissionGuard 
        permission={requiredPermission} 
        role={requiredRole}
        showFallback={true}
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        }
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}
