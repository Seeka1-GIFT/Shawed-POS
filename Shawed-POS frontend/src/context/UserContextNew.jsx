import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  VIEWER: 'viewer'
};

// Permission definitions
export const PERMISSIONS = {
  // User Management
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  VIEW_USERS: 'view_users',
  
  // Product Management
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  VIEW_PRODUCTS: 'view_products',
  
  // Sales Management
  CREATE_SALES: 'create_sales',
  EDIT_SALES: 'edit_sales',
  DELETE_SALES: 'delete_sales',
  VIEW_SALES: 'view_sales',
  
  // Customer Management
  CREATE_CUSTOMERS: 'create_customers',
  EDIT_CUSTOMERS: 'edit_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  VIEW_CUSTOMERS: 'view_customers',
  
  // Expense Management
  CREATE_EXPENSES: 'create_expenses',
  EDIT_EXPENSES: 'edit_expenses',
  DELETE_EXPENSES: 'delete_expenses',
  VIEW_EXPENSES: 'view_expenses',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  VIEW_RECEIPTS: 'view_receipts'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.EDIT_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_EXPENSES,
    PERMISSIONS.EDIT_EXPENSES,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_RECEIPTS
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_RECEIPTS
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_RECEIPTS
  ]
};

export const UserContext = createContext();

export function UserProvider({ children }) {
  const DEFAULT_STATE = {
    users: [],
    currentUser: null,
    isAuthenticated: false,
    token: null,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    loginAttempts: {},
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  };

  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem('shawed-users');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (err) {
      console.error('Failed to parse users data from localStorage', err);
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('shawed-users', JSON.stringify(state));
  }, [state]);

  // Authentication functions
  const login = async (email, password) => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success) {
        const { token, user } = response.data;
        
        const updatedUser = {
          ...user,
          lastLogin: new Date().toISOString(),
          permissions: ROLE_PERMISSIONS[user.role] || []
        };

        setState(prev => ({
          ...prev,
          currentUser: updatedUser,
          isAuthenticated: true,
          token: token,
          loginAttempts: {
            ...prev.loginAttempts,
            [`${user.id}-attempts`]: 0,
            [`${user.id}-lockout`]: 0
          }
        }));

        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        const { token, user } = response.data;
        
        const newUser = {
          ...user,
          permissions: ROLE_PERMISSIONS[user.role] || []
        };

        setState(prev => ({
          ...prev,
          currentUser: newUser,
          isAuthenticated: true,
          token: token,
          users: [...prev.users, newUser]
        }));

        return { success: true, user: newUser };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false,
      token: null
    }));
  };

  // User management functions (placeholder for now)
  const addUser = (userData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      permissions: ROLE_PERMISSIONS[userData.role] || []
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser]
    }));

    return newUser;
  };

  const updateUser = (updated) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === updated.id ? { ...u, ...updated } : u),
      currentUser: prev.currentUser?.id === updated.id ? { ...prev.currentUser, ...updated } : prev.currentUser
    }));
  };

  const deleteUser = (id) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
      currentUser: prev.currentUser?.id === id ? null : prev.currentUser,
      isAuthenticated: prev.currentUser?.id === id ? false : prev.isAuthenticated
    }));
  };

  const toggleUserStatus = (id) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u)
    }));
  };

  // Permission checking
  const hasPermission = (permission) => {
    if (!state.currentUser) return false;
    return state.currentUser.permissions?.includes(permission) || false;
  };

  const hasRole = (role) => {
    if (!state.currentUser) return false;
    return state.currentUser.role === role;
  };

  const hasAnyRole = (roles) => {
    if (!state.currentUser) return false;
    return roles.includes(state.currentUser.role);
  };

  // Session management
  const getLoginAttempts = (userId) => {
    return state.loginAttempts[`${userId}-attempts`] || 0;
  };

  const isUserLocked = (userId) => {
    const lockoutEnd = state.loginAttempts[`${userId}-lockout`];
    if (!lockoutEnd) return false;
    return Date.now() < lockoutEnd;
  };

  const resetLoginAttempts = (userId) => {
    setState(prev => ({
      ...prev,
      loginAttempts: {
        ...prev.loginAttempts,
        [`${userId}-attempts`]: 0,
        [`${userId}-lockout`]: 0
      }
    }));
  };

  // Auto-logout on session timeout
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const timeout = setTimeout(() => {
      logout();
    }, state.sessionTimeout);

    return () => clearTimeout(timeout);
  }, [state.isAuthenticated, state.sessionTimeout]);

  return (
    <UserContext.Provider
      value={{
        // State
        users: state.users,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        
        // Authentication
        login,
        register,
        logout,
        
        // User Management
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        
        // Permissions
        hasPermission,
        hasRole,
        hasAnyRole,
        
        // Session Management
        getLoginAttempts,
        isUserLocked,
        resetLoginAttempts,
        
        // Constants
        ROLES,
        PERMISSIONS,
        ROLE_PERMISSIONS
      }}
    >
      {children}
    </UserContext.Provider>
  );
}


