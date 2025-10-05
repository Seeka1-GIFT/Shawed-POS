import React, { createContext, useContext } from 'react';
import { DataContext } from './DataContextNew';

export const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const { data } = useContext(DataContext);
  
  // Helper function to clean business text fields
  const cleanBusinessText = (text) => {
    if (!text) return '';
    return text.trim().replace(/\n/g, '').replace(/\s+/g, ' ');
  };
  
  const businessInfo = {
    name: cleanBusinessText(data.businessSettings?.name) || 'Business Name',
    address: cleanBusinessText(data.businessSettings?.address) || 'Business Address',
    phone: cleanBusinessText(data.businessSettings?.phone) || 'Business Phone',
    email: cleanBusinessText(data.businessSettings?.email) || 'business@email.com',
    taxRate: data.businessSettings?.taxRate || 0,
    logo: data.businessSettings?.logo || null,
  };

  const updateBusinessInfo = (updates) => {
    // This will be handled by DataContext's updateBusinessSettings
    return updates;
  };

  return (
    <BusinessContext.Provider 
      value={{ 
        businessInfo,
        updateBusinessInfo,
        cleanBusinessText,
        // Helper methods
        getBusinessName: () => businessInfo.name,
        getBusinessAddress: () => businessInfo.address,
        getBusinessPhone: () => businessInfo.phone,
        getBusinessEmail: () => businessInfo.email,
        getTaxRate: () => businessInfo.taxRate,
        getBusinessLogo: () => businessInfo.logo,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

// Custom hook for easy access
export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
