import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

// Default roles and permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Products & Inventory
  MANAGE_PRODUCTS: 'manage_products',
  VIEW_PRODUCTS: 'view_products',
  MANAGE_INVENTORY: 'manage_inventory',
  
  // Sales & Transactions
  PROCESS_SALES: 'process_sales',
  VIEW_SALES: 'view_sales',
  MANAGE_SALES: 'manage_sales',
  
  // Customers
  MANAGE_CUSTOMERS: 'manage_customers',
  VIEW_CUSTOMERS: 'view_customers',
  
  // Suppliers & Orders
  MANAGE_SUPPLIERS: 'manage_suppliers',
  MANAGE_PURCHASE_ORDERS: 'manage_purchase_orders',
  
  // Financial & Reports
  VIEW_REPORTS: 'view_reports',
  MANAGE_REPORTS: 'manage_reports',
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  
  // Expenses
  MANAGE_EXPENSES: 'manage_expenses',
  VIEW_EXPENSES: 'view_expenses',
  
  // Settings & System
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  
  // Receipts
  VIEW_RECEIPTS: 'view_receipts',
  MANAGE_RECEIPTS: 'manage_receipts'
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin has all permissions
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.MANAGE_PURCHASE_ORDERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_RECEIPTS,
    PERMISSIONS.MANAGE_RECEIPTS
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_RECEIPTS
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_RECEIPTS
  ]
};

export function UserProvider({ children }) {
  const DEFAULT_STATE = {
    users: [],
    currentUser: null,
    isAuthenticated: false,
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
  const login = (username, password) => {
    const user = state.users.find(u => 
      (u.username === username || u.email === username) && u.isActive
    );

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Check if user is locked out
    const now = Date.now();
    const lockoutKey = `${user.id}-lockout`;
    const lockoutEnd = state.loginAttempts[lockoutKey];
    
    if (lockoutEnd && now < lockoutEnd) {
      const remainingTime = Math.ceil((lockoutEnd - now) / 60000);
      return { 
        success: false, 
        message: `Account locked. Try again in ${remainingTime} minutes.` 
      };
    }

    // Simple password check (in production, use proper hashing)
    const correctPassword = user.password || 'password123';
    if (password !== correctPassword) {
      // Increment login attempts
      const attemptKey = `${user.id}-attempts`;
      const attempts = (state.loginAttempts[attemptKey] || 0) + 1;
      
      setState(prev => ({
        ...prev,
        loginAttempts: {
          ...prev.loginAttempts,
          [attemptKey]: attempts
        }
      }));

      if (attempts >= state.maxLoginAttempts) {
        // Lock account
        setState(prev => ({
          ...prev,
          loginAttempts: {
            ...prev.loginAttempts,
            [lockoutKey]: now + state.lockoutDuration
          }
        }));
        return { 
          success: false, 
          message: 'Too many failed attempts. Account locked for 15 minutes.' 
        };
      }

      return { 
        success: false, 
        message: `Invalid credentials. ${state.maxLoginAttempts - attempts} attempts remaining.` 
      };
    }

    // Successful login
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
      permissions: ROLE_PERMISSIONS[user.role] || []
    };

    setState(prev => ({
      ...prev,
      currentUser: updatedUser,
      isAuthenticated: true,
      loginAttempts: {
        ...prev.loginAttempts,
        [`${user.id}-attempts`]: 0,
        [`${user.id}-lockout`]: 0
      }
    }));

    return { success: true, user: updatedUser };
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false
    }));
  };

  // User management functions
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

  const updateUser = (userId, updates) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              ...updates, 
              permissions: ROLE_PERMISSIONS[updates.role] || user.permissions 
            }
          : user
      )
    }));
  };

  const deleteUser = (userId) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId)
    }));
  };

  const toggleUserStatus = (userId) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    }));
  };

  // Permission checking
  const hasPermission = (permission) => {
    if (!state.currentUser) return false;
    return state.currentUser.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!state.currentUser) return false;
    return permissions.some(permission => 
      state.currentUser.permissions.includes(permission)
    );
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
  const checkSession = () => {
    if (!state.currentUser) return false;
    
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return true;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity < state.sessionTimeout;
  };

  const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  // Security functions
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

  const getLoginAttempts = (userId) => {
    const attemptKey = `${userId}-attempts`;
    return state.loginAttempts[attemptKey] || 0;
  };

  const isUserLocked = (userId) => {
    const lockoutKey = `${userId}-lockout`;
    const lockoutEnd = state.loginAttempts[lockoutKey];
    return lockoutEnd && Date.now() < lockoutEnd;
  };

  return (
    <UserContext.Provider
      value={{
        // State
        users: state.users,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        
        // Authentication
        login,
        logout,
        
        // User Management
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        
        // Permissions
        hasPermission,
        hasAnyPermission,
        hasRole,
        hasAnyRole,
        
        // Session Management
        checkSession,
        updateLastActivity,
        
        // Security
        resetLoginAttempts,
        getLoginAttempts,
        isUserLocked,
        
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
