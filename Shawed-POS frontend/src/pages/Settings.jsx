import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { DataContext } from '../context/DataContextNew';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

/**
 * Settings page allows the user to adjust application preferences
 * such as language, currency, and business information. The settings are stored in
 * localStorage so they persist across sessions. In a real
 * application these options might be loaded from and saved to
 * a backend service.
 */
export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const { data, updateBusinessSettings, updateReceiptSettings, updateDisplaySettings } = useContext(DataContext);
  const { t } = useTranslation();
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  
  // Business Information Settings
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [businessLogo, setBusinessLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  // Receipt Settings
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [showProductImages, setShowProductImages] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [paperSize, setPaperSize] = useState('thermal');
  
  // Display Settings
  const [compactMode, setCompactMode] = useState(false);
  const [showProductImagesInLists, setShowProductImagesInLists] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [defaultDashboardView, setDefaultDashboardView] = useState('overview');
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    general: false,
    business: false,
    receipt: false,
    display: false,
  });

  useEffect(() => {
    const storedLang = localStorage.getItem('dukaan-lang');
    const storedCurrency = localStorage.getItem('dukaan-currency');
    const storedLogoPreview = localStorage.getItem('dukaan-logo-preview');
    
    if (storedLang) setLanguage(storedLang);
    if (storedCurrency) setCurrency(storedCurrency);
    if (storedLogoPreview) setLogoPreview(storedLogoPreview);
    
    // Load business settings from DataContext
    const businessSettings = data.businessSettings;
    if (businessSettings) {
      setBusinessName(businessSettings.name || '');
      setBusinessAddress(businessSettings.address || '');
      setBusinessPhone(businessSettings.phone || '');
      setBusinessEmail(businessSettings.email || '');
      setTaxRate(businessSettings.taxRate || '');
    }
    
    // Load receipt settings from DataContext
    const receiptSettings = data.receiptSettings;
    if (receiptSettings) {
      setReceiptHeader(receiptSettings.header || '');
      setReceiptFooter(receiptSettings.footer || '');
      setShowProductImages(receiptSettings.showProductImages || false);
      setPrinterName(receiptSettings.printerName || '');
      setPaperSize(receiptSettings.paperSize || 'thermal');
    }
    
    // Load display settings from DataContext
    const displaySettings = data.displaySettings;
    if (displaySettings) {
      setCompactMode(displaySettings.compactMode || false);
      setShowProductImagesInLists(displaySettings.showProductImagesInLists !== false);
      setItemsPerPage(displaySettings.itemsPerPage || 20);
      setDefaultDashboardView(displaySettings.defaultDashboardView || 'overview');
    }
  }, [data.businessSettings, data.receiptSettings, data.displaySettings]);

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBusinessLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoDataUrl = e.target.result;
        setLogoPreview(logoDataUrl);
        localStorage.setItem('dukaan-logo-preview', logoDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleSave = () => {
    localStorage.setItem('dukaan-lang', language);
    localStorage.setItem('dukaan-currency', currency);
    
    // Save business settings to DataContext with proper logo handling
    updateBusinessSettings({
      name: businessName.trim(),
      address: businessAddress.trim(),
      phone: businessPhone.trim(),
      email: businessEmail.trim(),
      taxRate: parseFloat(taxRate) || 0,
      logo: businessLogo || logoPreview || null,
    });
    
    // Save receipt settings to DataContext
    updateReceiptSettings({
      header: receiptHeader,
      footer: receiptFooter,
      showProductImages: showProductImages,
      printerName: printerName,
      paperSize: paperSize,
    });
    
    // Save display settings to DataContext
    updateDisplaySettings({
      theme: isDarkMode ? 'dark' : 'light',
      compactMode: compactMode,
      showProductImagesInLists: showProductImagesInLists,
      itemsPerPage: itemsPerPage,
      defaultDashboardView: defaultDashboardView,
    });
    
    alert('Settings saved');
  };

  return (
    <div className="max-w-7xl">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>{t('settings')}</h3>
        
        <div className="space-y-6">
          {/* General Settings */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
            <button
              onClick={() => toggleSection('general')}
              className={`w-full px-6 py-4 text-left flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
            >
              <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {t('generalSettings')}
              </h4>
              {expandedSections.general ? (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>
            
            {expandedSections.general && (
              <div className="px-6 pb-6 space-y-4">
        <div className="flex flex-col">
                  <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('language')}</label>
          <select
            value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
            className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
          >
                    <option value="en">{t('english')}</option>
                    <option value="so">{t('somali')}</option>
                    <option value="ar">{t('arabic')}</option>
          </select>
        </div>
                
        <div className="flex flex-col">
                  <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('currency')}</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
          >
                    <option value="USD">{t('usd')}</option>
                    <option value="SOS">{t('sos')}</option>
                    <option value="KES">{t('kes')}</option>
                    <option value="ETB">{t('etb')}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Business Information */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
            <button
              onClick={() => toggleSection('business')}
              className={`w-full px-6 py-4 text-left flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
            >
              <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                <span className="mr-2">📊</span>
                {t('businessInformation')}
              </h4>
              {expandedSections.business ? (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>
            
            {expandedSections.business && (
              <div className="px-6 pb-6 space-y-4">
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('businessName')}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={t('yourCompanyStoreName')}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('businessAddress')}</label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder={t('fullAddressForReceipts')}
                rows={3}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg resize-none`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('businessPhone')}</label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder={t('contactNumber')}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('businessEmail')}</label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder={t('contactEmail')}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('taxRate')}</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder={t('percentageForTaxCalculation')}
                min="0"
                max="100"
                step="0.01"
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('businessLogo')}</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 ${isDarkMode ? 'file:bg-gray-600 file:text-gray-100' : 'file:bg-gray-200 file:text-gray-700'}`}
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img
                      src={logoPreview}
                      alt="Business Logo Preview"
                      className="w-20 h-20 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
              </div>
            )}
          </div>

          {/* Receipt Settings */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
            <button
              onClick={() => toggleSection('receipt')}
              className={`w-full px-6 py-4 text-left flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
            >
              <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                <span className="mr-2">🧾</span>
                {t('receiptSettings')}
              </h4>
              {expandedSections.receipt ? (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>
            
            {expandedSections.receipt && (
              <div className="px-6 pb-6 space-y-4">
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('receiptHeader')}</label>
              <textarea
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder={t('customMessageAtTop')}
                rows={2}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg resize-none`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('receiptFooter')}</label>
              <textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder={t('customMessageAtBottom')}
                rows={2}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg resize-none`}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showProductImages"
                checked={showProductImages}
                onChange={(e) => setShowProductImages(e.target.checked)}
                className={`w-4 h-4 ${isDarkMode ? 'text-blue-600 bg-gray-700 border-gray-600' : 'text-blue-600 bg-white border-gray-300'} rounded focus:ring-blue-500`}
              />
              <label htmlFor="showProductImages" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('showProductImages')}
              </label>
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('printerName')}</label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder={t('configurePrinter')}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-lg`}
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('paperSize')}</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
              >
                <option value="thermal">{t('thermal80mm')}</option>
                <option value="a4">{t('a4')}</option>
                <option value="letter">{t('letter')}</option>
                <option value="thermal-58">{t('thermal58mm')}</option>
              </select>
            </div>
              </div>
            )}
          </div>

          {/* Display Settings */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
            <button
              onClick={() => toggleSection('display')}
              className={`w-full px-6 py-4 text-left flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
            >
              <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                <span className="mr-2">📊</span>
                {t('displaySettings')}
              </h4>
              {expandedSections.display ? (
                <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
            </button>
            
            {expandedSections.display && (
              <div className="px-6 pb-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('theme')}
              </label>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="compactMode"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className={`w-4 h-4 ${isDarkMode ? 'text-blue-600 bg-gray-700 border-gray-600' : 'text-blue-600 bg-white border-gray-300'} rounded focus:ring-blue-500`}
              />
              <label htmlFor="compactMode" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('compactMode')}
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showProductImagesInLists"
                checked={showProductImagesInLists}
                onChange={(e) => setShowProductImagesInLists(e.target.checked)}
                className={`w-4 h-4 ${isDarkMode ? 'text-blue-600 bg-gray-700 border-gray-600' : 'text-blue-600 bg-white border-gray-300'} rounded focus:ring-blue-500`}
              />
              <label htmlFor="showProductImagesInLists" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('showProductImages')}
              </label>
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('itemsPerPage')}</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
              >
                <option value={10}>{t('tenItems')}</option>
                <option value={20}>{t('twentyItems')}</option>
                <option value={50}>{t('fiftyItems')}</option>
                <option value={100}>{t('hundredItems')}</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{t('defaultDashboardView')}</label>
              <select
                value={defaultDashboardView}
                onChange={(e) => setDefaultDashboardView(e.target.value)}
                className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
              >
                <option value="overview">{t('overview')}</option>
                <option value="sales">{t('salesFocus')}</option>
                <option value="inventory">{t('inventoryFocus')}</option>
                <option value="analytics">{t('analyticsFocus')}</option>
          </select>
            </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
            className={`py-3 px-6 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors font-medium`}
        >
            {t('saveSettings')}
        </button>
      </div>
      </div>
    </div>
  );
}
