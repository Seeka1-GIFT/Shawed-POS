import React, { useContext, useState, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import { ThemeContext } from '../context/ThemeContext';
import PermissionGuard from '../components/PermissionGuard';
import InputField from '../components/InputField';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function UserManagement() {
  return (
    <PermissionGuard permission="manage_users" showFallback={true}>
      <UserManagementContent />
    </PermissionGuard>
  );
}

function UserManagementContent() {
  const { 
    users, 
    currentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus,
    resetLoginAttempts,
    getLoginAttempts,
    isUserLocked,
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS
  } = useContext(UserContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPermissions, setShowPermissions] = useState({});

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: ROLES.CASHIER,
    password: '',
    confirmPassword: ''
  });

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        ...(formData.password && { password: formData.password })
      });
    } else {
      addUser({
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        password: formData.password
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: ROLES.CASHIER,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(false);
    setEditingUser(null);
  };

  const startEdit = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setEditingUser(user);
    setShowAddForm(true);
  };

  const handleDelete = (userId) => {
    if (userId === currentUser?.id) {
      alert('Cannot delete your own account');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  const togglePermissions = (userId) => {
    setShowPermissions(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN: return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case ROLES.MANAGER: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case ROLES.CASHIER: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case ROLES.VIEWER: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (user) => {
    if (!user.isActive) return <UserX className="h-4 w-4 text-red-500" />;
    if (isUserLocked(user.id)) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <UserCheck className="h-4 w-4 text-green-500" />;
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
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            User Management
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage users, roles, and permissions
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </motion.button>
      </div>

      {/* Filters */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Search Users
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500' 
                  : 'border-gray-300 bg-white text-gray-900 focus:ring-primary-500'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500' 
                  : 'border-gray-300 bg-white text-gray-900 focus:ring-primary-500'
              }`}
            >
              <option value="all">All Roles</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.MANAGER}>Manager</option>
              <option value={ROLES.CASHIER}>Cashier</option>
              <option value={ROLES.VIEWER}>Viewer</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500' 
                  : 'border-gray-300 bg-white text-gray-900 focus:ring-primary-500'
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit User Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <button
              onClick={resetForm}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              isDarkMode={isDarkMode}
            />
            
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              isDarkMode={isDarkMode}
            />
            
            <InputField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              isDarkMode={isDarkMode}
            />
            
            <InputField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              isDarkMode={isDarkMode}
            />
            
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-primary-500'
                }`}
                required
              >
                <option value={ROLES.CASHIER}>Cashier</option>
                <option value={ROLES.MANAGER}>Manager</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.VIEWER}>Viewer</option>
              </select>
            </div>
            
            <InputField
              label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingUser}
              isDarkMode={isDarkMode}
            />
            
            {!editingUser && (
              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                isDarkMode={isDarkMode}
              />
            )}

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {editingUser ? 'Update User' : 'Add User'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users Table */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Users ({filteredUsers.length})
          </h3>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No users found matching your criteria.
            </p>
          </div>
        ) : (
          <>
          {/* Desktop table */}
          <div className="overflow-x-auto whitespace-nowrap hidden sm:block">
            <table className="min-w-full">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    User
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Role
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Last Login
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user)}
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {!user.isActive ? 'Inactive' : 
                           isUserLocked(user.id) ? 'Locked' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatLastLogin(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEdit(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        
                        <button
                          onClick={() => togglePermissions(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title="View Permissions"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? 'hover:bg-red-600 text-red-400' : 'hover:bg-red-100 text-red-600'
                            }`}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="block sm:hidden p-4 space-y-3">
            {filteredUsers.map((user)=> (
              <div key={user.id} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3`}>
                <div className="flex items-center justify-between">
                  <div className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-semibold`}>👤 {user.firstName} {user.lastName}</div>
                  <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>🛡️ {user.role}</div>
                </div>
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-xs`}>📧 {user.email}</div>
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-xs`}>✅ {user.isActive ? 'Active' : 'Inactive'}</div>
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>🕒 {formatLastLogin(user.lastLogin)}</div>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={()=>startEdit(user)} className={`h-9 px-3 rounded ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-700'}`}>Edit</button>
                  <button onClick={()=>togglePermissions(user.id)} className={`h-9 px-3 rounded ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-700'}`}>Perms</button>
                  {user.id !== currentUser?.id && (
                    <button onClick={()=>handleDelete(user.id)} className={`h-9 px-3 rounded ${isDarkMode ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Permissions Modal */}
      {Object.keys(showPermissions).map(userId => {
        const user = users.find(u => u.id === userId);
        if (!user) return null;

        return (
          <motion.div
            key={userId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => togglePermissions(userId)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Permissions for {user.firstName} {user.lastName}
                  </h3>
                  <button
                    onClick={() => togglePermissions(userId)}
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PERMISSIONS).map(([key, permission]) => (
                      <div
                        key={permission}
                        className={`flex items-center p-3 rounded-lg ${
                          user.permissions.includes(permission)
                            ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.permissions.includes(permission) ? (
                          <CheckCircle className="h-5 w-5 mr-3" />
                        ) : (
                          <XCircle className="h-5 w-5 mr-3" />
                        )}
                        <span className="text-sm font-medium">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
