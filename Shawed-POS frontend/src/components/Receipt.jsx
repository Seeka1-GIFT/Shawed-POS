import React, { useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, X, QrCode, Share2 } from 'lucide-react';
import { RealDataContext } from '../context/RealDataContext';
import { useReactToPrint } from 'react-to-print';

/**
 * Enhanced Receipt component generates a printable receipt for completed sales
 * with QR codes, better formatting, company branding, and modern features.
 */
export default function Receipt({ 
  sale, 
  isVisible, 
  onClose, 
  isDarkMode = false 
}) {
  const { businessSettings, customers = [] } = useContext(RealDataContext);
  const receiptRef = useRef();

  // Debug logging will run only when visible/sale exist (we guard below)
  console.log('Receipt component - sale:', sale);
  console.log('Receipt component - sale.items:', sale?.items);
  console.log('Receipt component - sale.saleItems:', sale?.saleItems);
  console.log('Receipt component - sale.date:', sale?.date);
  console.log('Receipt component - sale.saleDate:', sale?.saleDate);
  console.log('Receipt component - sale.total:', sale?.total);
  console.log('Receipt component - sale.subtotal:', sale?.subtotal);
  console.log('Receipt component - businessSettings:', businessSettings);
  
  const businessInfo = businessSettings || {};

  // Generate a numeric receipt number, preferring existing numeric values
  const getReceiptNumber = () => {
    const explicit = sale?.receiptNumber || sale?.receiptNo || sale?.receipt;
    if (explicit && /^\d+$/.test(String(explicit))) return String(explicit);
    const dateStr = getSaleDate();
    const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
    // Use last 8 digits of epoch millis to keep it short and numeric
    return String(ts).slice(-8);
  };

  // Print functionality - moved after helper definitions
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: sale ? `Receipt-${getReceiptNumber()}` : 'Receipt',
    pageStyle: `
      @media print {
        body { margin: 0; padding: 10px; }
        .no-print { display: none !important; }
        .receipt-content { 
          max-width: none !important; 
          margin: 0 !important; 
          box-shadow: none !important; 
        }
      }
    `,
    onBeforeGetContent: () => {
      console.log('Print: Preparing content for printing...');
    },
    onAfterPrint: () => {
      console.log('Print: Print dialog closed');
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
    }
  });

  if (!isVisible || !sale) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get the correct date field from sale data
  const getSaleDate = () => {
    return sale?.saleDate || sale?.date || sale?.createdAt || null;
  };

  // Items helper (moved up to avoid TDZ issues)
  const getSaleItems = () => {
    return sale?.saleItems || sale?.items || [];
  };

  // Calculations (moved up so later functions can rely on them)
  const calculateSubtotal = () => {
    if (sale?.subtotal) return sale.subtotal;
    const items = getSaleItems();
    return items.reduce((sum, item) => {
      const price = item?.price || item?.product?.sellPrice || item?.product?.sellingPrice || 0;
      const quantity = item?.quantity || 0;
      const itemTotal = item?.total || (price * quantity);
      return sum + itemTotal;
    }, 0);
  };

  const calculateTax = () => {
    const taxRate = businessInfo.taxRate || 0;
    const subtotal = calculateSubtotal();
    return subtotal * (taxRate / 100);
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax();
    const discountAmount = sale?.discount || 0;
    return subtotal + taxAmount - discountAmount;
  };


  // Generate QR code data (after helpers are available)
  const generateQRData = () => {
    const receiptData = {
      id: getReceiptNumber(),
      date: getSaleDate() || new Date().toISOString(),
      total: sale.total || 0,
      items: getSaleItems().map(item => ({
        name: item.product?.name || item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.price || item.product?.sellPrice || item.product?.sellingPrice || 0
      })),
      paymentMethod: sale.paymentMethod || 'Cash',
      customerId: sale.customerId || null
    };
    return JSON.stringify(receiptData);
  };

  const handleDownload = () => {
    const printContent = document.getElementById('receipt-content');
    const content = printContent.innerHTML;
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0; 
              padding: 20px;
              background: white;
            }
            .receipt { 
              max-width: 400px; 
              margin: 0 auto; 
              border: 1px solid #ddd;
              padding: 20px;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 15px; 
              margin-bottom: 20px; 
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px; 
              color: #2563eb;
            }
            .company-details { 
              font-size: 12px; 
              color: #666; 
              margin-bottom: 5px;
            }
            .receipt-number {
              font-size: 14px;
              font-weight: bold;
              color: #374151;
            }
            .receipt-details { 
              margin-bottom: 20px; 
              font-size: 12px;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              font-size: 12px;
            }
            .items-table th, .items-table td { 
              padding: 6px 4px; 
              text-align: left; 
              border-bottom: 1px solid #ddd; 
            }
            .items-table th { 
              background-color: #f8f9fa; 
              font-weight: bold; 
              font-size: 11px;
            }
            .items-table td:last-child,
            .items-table th:last-child {
              text-align: right;
            }
            .items-table td:nth-child(2) {
              text-align: center;
            }
            .totals { 
              border-top: 2px solid #000; 
              padding-top: 10px; 
              font-size: 12px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
            }
            .final-total { 
              font-weight: bold; 
              font-size: 16px; 
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 11px; 
              color: #666; 
            }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt { border: none; max-width: none; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${getReceiptNumber()}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${getReceiptNumber()}`,
          text: `Receipt from ${businessInfo.name || 'Business POS'} - Total: $${grandTotal.toFixed(2)}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      const receiptText = `Receipt #${getReceiptNumber()}\nDate: ${formatDate(getSaleDate())}\nTotal: $${grandTotal.toFixed(2)}\nItems: ${getSaleItems().length}`;
      navigator.clipboard.writeText(receiptText);
      alert('Receipt details copied to clipboard!');
    }
  };


  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const grandTotal = calculateGrandTotal();
  
  // Debug calculations
  console.log('Receipt calculations - subtotal:', subtotal);
  console.log('Receipt calculations - tax:', tax);
  console.log('Receipt calculations - grandTotal:', grandTotal);
  console.log('Receipt calculations - saleDate:', getSaleDate());
  console.log('Receipt calculations - saleItems:', getSaleItems());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} px-6 py-4 rounded-t-2xl flex items-center justify-between sticky top-0`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
            Receipt Preview
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div 
            ref={receiptRef}
            id="receipt-content"
            className={`receipt-content ${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-6 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} font-mono text-sm`}
          >
            {/* Receipt Header */}
            <div className={`text-center border-b-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-400'} pb-4 mb-6`}>
              {businessInfo.logo && (
                <div className="mb-3">
                  <img 
                    src={businessInfo.logo} 
                    alt="Business Logo" 
                    className="w-16 h-16 mx-auto object-contain"
                  />
                </div>
              )}
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                {(businessInfo.name || 'Business Name').trim().replace(/\n/g, '')}
              </div>
              {businessInfo.address && (
                <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mb-1`}>
                  {businessInfo.address.trim().replace(/\n/g, '')}
                </div>
              )}
              <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mb-1`}>
                {businessInfo.phone && `Phone: ${businessInfo.phone.trim().replace(/\n/g, '')}`}
                {businessInfo.email && ` • Email: ${businessInfo.email.trim().replace(/\n/g, '')}`}
              </div>
              <div className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Receipt #: {getReceiptNumber()}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date & Time:</span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatDate(getSaleDate())}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method:</span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{sale?.paymentMethod || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer:</span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {(() => {
                    const nameFromSale = sale?.customer?.name || sale?.customerName;
                    const nameFromList = customers.find(c => c.id === sale?.customerId)?.name;
                    return nameFromSale || nameFromList || 'Walk-in Customer';
                  })()}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <th className={`text-left py-2 text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Item</th>
                  <th className={`text-center py-2 text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Qty</th>
                  <th className={`text-right py-2 text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price</th>
                  <th className={`text-right py-2 text-xs font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {getSaleItems().map((item, index) => (
                  <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`py-2 text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item?.product?.name || 'Unknown Item'}</td>
                    <td className={`py-2 text-xs text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item?.quantity || 0}</td>
                    <td className={`py-2 text-xs text-right ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>${(item?.price || item?.product?.sellPrice || item?.product?.sellingPrice || 0).toFixed(2)}</td>
                    <td className={`py-2 text-xs text-right font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      ${(item?.total || (item?.price || item?.product?.sellPrice || item?.product?.sellingPrice || 0) * (item?.quantity || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className={`border-t-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-400'} pt-4`}>
              <div className="flex justify-between text-sm mb-2">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal:</span>
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tax ({businessInfo.taxRate || 0}%):</span>
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>${tax.toFixed(2)}</span>
              </div>
              {(sale?.discount || 0) > 0 && (
                <div className="flex justify-between text-sm mb-2 text-red-500">
                  <span>Discount:</span>
                  <span>-${(sale.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className={`flex justify-between text-lg font-bold border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} pt-2`}>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total:</span>
                <span className="font-bold text-green-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className={`text-center mt-8 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Thank you for your business!</div>
              {businessInfo.email && (
                <div className={`mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(businessInfo.email).trim().replace(/\n/g, '')}</div>
              )}
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Generated by {(businessInfo.name || 'Business POS').trim().replace(/\n/g, '')} v1.0</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert('QR Code feature coming soon!')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
