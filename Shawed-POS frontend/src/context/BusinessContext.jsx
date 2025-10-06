import React, { createContext, useContext } from 'react';
import { RealDataContext } from './RealDataContext';

export const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const context = useContext(RealDataContext);
  
  // Add null safety
  if (!context) {
    console.error('BusinessProvider: RealDataContext is undefined');
    return <div>Loading business settings...</div>;
  }
  
  const { businessSettings } = context;
  
  // Helper function to clean business text fields
  const cleanBusinessText = (text) => {
    if (!text) return '';
    return text.trim().replace(/\n/g, '').replace(/\s+/g, ' ');
  };
  
  const businessInfo = {
    name: cleanBusinessText(businessSettings?.name) || 'Business Name',
    address: cleanBusinessText(businessSettings?.address) || 'Business Address',
    phone: cleanBusinessText(businessSettings?.phone) || 'Business Phone',
    email: cleanBusinessText(businessSettings?.email) || 'business@email.com',
    taxRate: businessSettings?.taxRate || 0,
    logo: businessSettings?.logo || null,
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
    console.error('useBusiness: BusinessContext is undefined');
    return {
      businessInfo: {
        name: 'Business Name',
        address: 'Business Address',
        phone: 'Business Phone',
        email: 'business@email.com',
        taxRate: 0,
        logo: null,
      },
      updateBusinessInfo: () => {},
      cleanBusinessText: (text) => text || '',
      getBusinessName: () => 'Business Name',
      getBusinessAddress: () => 'Business Address',
      getBusinessPhone: () => 'Business Phone',
      getBusinessEmail: () => 'business@email.com',
      getTaxRate: () => 0,
      getBusinessLogo: () => null,
    };
  }
  return context;
};
