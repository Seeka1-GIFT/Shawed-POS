import React from 'react';

/**
 * A reusable input field component with label and error message.
 * It forwards the supplied props to the underlying input element.
 */
export default function InputField({ label, error, className = '', isDarkMode, ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500'} rounded-lg shadow-sm focus:outline-none`}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
