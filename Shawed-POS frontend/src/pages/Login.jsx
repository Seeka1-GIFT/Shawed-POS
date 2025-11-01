import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Lock, User, Mail, X, CheckCircle, Send } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated, getLoginAttempts, isUserLocked, resetLoginAttempts } = useContext(UserContext);
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
        setLoginAttempts(getLoginAttempts(result.user?.id || 'unknown'));
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
    setResetEmail('');
    setResetSuccess(false);
    setResetError('');
  };

  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
    setResetError('');
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address');
      setResetLoading(false);
      return;
    }

    try {
      // In a real app, this would call the API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo: Show success for demo email, error for others
      if (resetEmail.toLowerCase() === 'mainadmin@shawedpos.com' || resetEmail.toLowerCase().includes('admin')) {
        setResetSuccess(true);
        setTimeout(() => {
          setShowForgotPasswordModal(false);
          setResetEmail('');
          setResetSuccess(false);
        }, 3000);
      } else {
        setResetError('Email not found. For demo purposes, use: mainadmin@shawedpos.com');
      }
    } catch (err) {
      setResetError('Failed to send reset email. Please try again later.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setResetEmail('');
    setResetSuccess(false);
    setResetError('');
  };

  const handleUnlockAccount = () => {
    if (window.confirm('Reset login attempts for this account?')) {
      resetLoginAttempts('admin');
      setLoginAttempts(0);
      setError('');
    }
  };

  const isAccountLocked = isUserLocked('admin') && formData.username === 'admin';

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-primary-600'}`}>
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className={`mt-6 text-3xl font-extrabold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Sign in to Shawed-POS
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enterprise Point of Sale System
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-8 px-6 shadow-xl rounded-2xl`}
        >
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            {/* Hidden fields to prevent browser auto-fill */}
            <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
            <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
            
            {/* Username Field */}
            <div>
              <label htmlFor="username" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username or Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="off"
                  data-form-type="other"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                  } rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  data-form-type="other"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full pl-10 pr-10 py-3 border ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                  } rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                }`}
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Account Locked Message */}
            {isAccountLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                <div className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  <span className="text-sm">Account is locked due to multiple failed attempts.</span>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockAccount}
                  className="text-sm underline hover:no-underline"
                >
                  Unlock
                </button>
              </motion.div>
            )}

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < 5 && !isAccountLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'
                }`}
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">
                  {5 - loginAttempts} attempts remaining before account lockout.
                </span>
              </motion.div>
            )}

            {/* Submit Button */}
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || isAccountLocked}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                  isLoading || isAccountLocked
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                      : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </motion.button>
            </div>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-primary-600 hover:text-primary-500'} hover:underline`}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </motion.div>

        {/* Theme Toggle */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </motion.button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForgotPasswordModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl z-50`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Reset Password
                </h3>
                <button
                  onClick={closeForgotPasswordModal}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {resetSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                        <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                    </div>
                    <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Reset Email Sent!
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      We've sent a password reset link to your email address. Please check your inbox.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label htmlFor="resetEmail" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="resetEmail"
                          type="email"
                          value={resetEmail}
                          onChange={handleResetEmailChange}
                          placeholder="Enter your email address"
                          required
                          className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                            resetError
                              ? isDarkMode
                                ? 'border-red-500 bg-red-900/20 text-red-300'
                                : 'border-red-500 bg-red-50 text-red-900'
                              : isDarkMode
                                ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                          } rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                        />
                      </div>
                      {resetError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-2 text-sm flex items-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {resetError}
                        </motion.p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeForgotPasswordModal}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={resetLoading || !resetEmail}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                          resetLoading || !resetEmail
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                      >
                        {resetLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Reset Link
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
