import React, { useContext, useState, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import Receipt from '../components/Receipt';
import BarcodeScanner from '../components/BarcodeScanner';
import PaymentGateway from '../components/PaymentGateway';
import { Search, Trash2, ChevronDown, ChevronUp, Printer, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Sales page implements a simple POS system. Users can search for
 * products, add them to a cart, adjust quantities and complete
 * the sale. On completion, product quantities are reduced and
 * the sale is recorded in the DataContext. All calculations
 * including subtotal, discount and total are derived on the fly.
 */
export default function Sales() {
  const { products, customers, addSale, updateProduct } = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatusSelect, setPaymentStatusSelect] = useState('Paid'); // Paid | Credit
  const [amountPaid, setAmountPaid] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // Filter products by search query
  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return (products || []).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    ).map(product => ({
      ...product,
      sellPrice: product.sellPrice || product.sellingPrice || 0,
      buyPrice: product.buyPrice || product.purchasePrice || 0
    }));
  }, [query, products]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setQuery('');
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleBarcodeScan = (barcode) => {
    console.log(`Scanned barcode: ${barcode}`);
    
    // Find product by barcode
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      // Normalize product data to ensure proper field names and types
      const normalizedProduct = {
        ...product,
        sellPrice: parseFloat(product.sellPrice || product.sellingPrice || 0),
        buyPrice: parseFloat(product.buyPrice || product.purchasePrice || 0),
        quantity: parseInt(product.quantity || 0)
      };
      
      // Check if already in cart
      const existingItem = cart.find(item => item.product.id === product.id);
      if (existingItem) {
        // Increment quantity of existing item
        setCart(prev => prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        // Add new product to cart
        addToCart(normalizedProduct);
      }
      setQuery(''); // Clear search query
      
      // Show success message
      const successMsg = existingItem 
        ? `Added another ${product.name} to cart` 
        : `Added ${product.name} to cart`;
      console.log(successMsg);
    } else {
      alert(`Product with barcode ${barcode} not found. Would you like to search manually?`);
      setQuery(barcode); // Set the barcode as search query for manual lookup
    }
  };

  // Compute subtotal of items in cart
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * (item.product.sellPrice || 0), 0);
  }, [cart]);

  const discountValue = useMemo(() => {
    const val = parseFloat(discount || 0);
    if (isNaN(val) || val <= 0) return 0;
    // Interpret discount as percentage if <=100 else absolute
    return val <= 100 ? (subtotal * val) / 100 : val;
  }, [discount, subtotal]);

  const total = subtotal - discountValue;
  const paid = parseFloat(amountPaid || '0');
  const balance = Math.max(0, total - (isNaN(paid) ? 0 : paid));
  const paymentStatus = useMemo(()=>{
    if (!customerId) return 'Paid';
    if (paymentStatusSelect === 'Paid') return 'Paid';
    return paid > 0 ? 'Partial / Credit' : 'Credit';
  }, [customerId, paymentStatusSelect, paid]);

  // Keep amountPaid aligned based on customer selection and status
  React.useEffect(()=>{
    if (!customerId) {
      // Walk-in must be paid in full
      setPaymentStatusSelect('Paid');
      setAmountPaid(String(total.toFixed(2)));
    } else if (paymentStatusSelect === 'Paid') {
      setAmountPaid(String(total.toFixed(2)));
    }
  }, [customerId, paymentStatusSelect, total]);

  const completeSale = async (paymentInfo = null) => {
    if (cart.length === 0) return;
    // Check stock
    for (const item of cart) {
      if (item.quantity > item.product.quantity) {
        alert(`Not enough stock for ${item.product.name}`);
        return;
      }
    }
    // Require customer for credit
    if (balance > 0 && !customerId) {
      alert('Please select a customer to record credit sales.');
      return;
    }

    try {
      // Normalize payment info from gateway if provided
      const chosenMethod = paymentInfo?.paymentMethod || paymentMethod;
      const feeAmount = paymentInfo?.fee || 0;
      const computedTax = chosenMethod === 'merchant' ? feeAmount : 0;
      // Create sale record with proper structure for backend
      const saleTotal = subtotal - discountValue + computedTax;
      
      // Determine payment status and amount paid based on user selection
      let paymentStatusToSave;
      let amountPaidToSave;
      
      if (!customerId) {
        // Walk-in customers are always Paid
        paymentStatusToSave = 'Paid';
        amountPaidToSave = saleTotal; // Walk-in always pays full amount
      } else {
        // For customers with accounts, use the user-selected status
        if (paymentStatusSelect === 'Paid') {
          paymentStatusToSave = 'Paid';
          // If user selected "Paid", ensure amountPaid equals total
          amountPaidToSave = saleTotal;
        } else if (paymentStatusSelect === 'Credit') {
          // If Credit selected and partial payment, use "Partial / Credit"
          const paidValue = Number(paid);
          if (paidValue > 0 && paidValue < saleTotal) {
            paymentStatusToSave = 'Partial / Credit';
            amountPaidToSave = paidValue;
          } else {
            paymentStatusToSave = 'Credit'; // Full credit
            amountPaidToSave = paidValue || 0;
          }
        } else {
          // Fallback: calculate based on amounts
          const paidValue = Number(paid);
          amountPaidToSave = paidValue;
          paymentStatusToSave = amountPaidToSave >= saleTotal ? 'Paid' : (amountPaidToSave > 0 ? 'Partial / Credit' : 'Credit');
        }
      }

      const saleData = {
        customerId: customerId || null,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.sellPrice || item.product.sellingPrice || 0
        })),
        discount: discountValue,
        tax: computedTax,
        paymentMethod: chosenMethod,
        total: saleTotal,
        amountPaid: amountPaidToSave,
        paymentStatus: paymentStatusToSave
      };
      
      console.log('🛒 FRONTEND: Sending sale data to backend:', saleData);
      const result = await addSale(saleData);
      
      if (result.success) {
        // Create local sale record for receipt
        const localSale = {
          id: Date.now().toString(),
          date: new Date().toISOString().slice(0, 10),
          items: cart,
          subtotal,
          discount: discountValue,
          total: saleTotal,
          paymentMethod: chosenMethod,
          amountPaid: amountPaidToSave,
          balance: Math.max(0, saleTotal - amountPaidToSave),
          paymentStatus: paymentStatusToSave,
          customerId: customerId || null,
          fee: computedTax
        };
        
        // Store the sale for receipt and show receipt
        setLastSale(localSale);
        setShowReceipt(true);
        
        // Reset POS
        setCart([]);
        setDiscount('');
        setPaymentMethod('Cash');
        setAmountPaid('');
        setCustomerId('');
        alert('Sale completed successfully');
      } else {
        alert(`Failed to complete sale: ${result.message}`);
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      alert(`Error completing sale: ${error.message}`);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side: product search and cart */}
      <div>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm mb-6`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Search Products</h3>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, category or barcode"
              className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500'} rounded-lg focus:outline-none`}
            />
            <Search className={`absolute right-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowScanner(true)}
              className={`absolute right-10 top-2 p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
              title="Scan Barcode"
            >
              <Camera className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </motion.button>
          </div>
          {results.length > 0 && (
            <ul className={`mt-2 max-h-60 overflow-y-auto border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'} rounded-lg`}>
              {results.map((p) => (
                <li
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`px-4 py-2 cursor-pointer ${isDarkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}
                >
                  {p.name} – <span className="text-sm text-gray-500">{p.category}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
          {/* Cart Header */}
          <button
            onClick={() => setIsCartExpanded(!isCartExpanded)}
            className={`w-full px-4 py-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-200`}
          >
            <div className="flex items-center">
              <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Cart</span>
              {cart.length > 0 && (
                <span className={`ml-2 px-2 py-1 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-primary-100 text-primary-600'} text-xs rounded-full`}>
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {isCartExpanded ? (
              <ChevronUp className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200`} />
            ) : (
              <ChevronDown className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200`} />
            )}
          </button>

          {/* Cart Content */}
          <div className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${isCartExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="px-4 pb-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 py-4">No items in cart.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-1">Product</th>
                      <th className="py-2 px-1">Qty</th>
                      <th className="py-2 px-1">Price</th>
                      <th className="py-2 px-1">Total</th>
                      <th className="py-2 px-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      // Ensure product has required fields
                      const product = {
                        ...item.product,
                        sellPrice: item.product.sellPrice || item.product.sellingPrice || 0,
                        buyPrice: item.product.buyPrice || item.product.purchasePrice || 0,
                        quantity: item.product.quantity || 0
                      };
                      
                      return (
                      <tr key={item.product.id} className="border-b">
                        <td className="py-2 px-1">{product.name}</td>
                        <td className="py-2 px-1">
                          <input
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.product.id, parseInt(e.target.value || 1, 10))
                            }
                            className="w-16 px-1 py-1 border border-gray-300 rounded-lg focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-1">${product.sellPrice.toFixed(2)}</td>
                        <td className="py-2 px-1">${(product.sellPrice * item.quantity).toFixed(2)}</td>
                        <td className="py-2 px-1 text-right">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-600 hover:underline"
                          >
                            <Trash2 className="h-4 w-4 inline-block mr-1" />
                            Remove
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Right side: totals and payment */}
      <div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Checkout Header */}
          <button
            onClick={() => setIsCheckoutExpanded(!isCheckoutExpanded)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-800">Checkout</span>
              {cart.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                  ${total.toFixed(2)}
                </span>
              )}
            </div>
            {isCheckoutExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200" />
            )}
          </button>

          {/* Checkout Content */}
          <div className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${isCheckoutExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="px-4 pb-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Discount</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold text-xl">${total.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-600 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                {/* Payment Status and Credit controls */}
                {!customerId ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col col-span-1">
                      <label className="text-gray-600 mb-1">Status</label>
                      <div className={`px-3 py-2 rounded-lg border bg-green-100 border-green-200 text-green-700`}>Paid</div>
                    </div>
                    <div className="flex flex-col col-span-1">
                      <label className="text-gray-600 mb-1">Amount Paid</label>
                      <input type="number" step="0.01" value={amountPaid} onChange={(e)=>setAmountPaid(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" disabled />
                    </div>
                    <div className="flex flex-col col-span-1">
                      <label className="text-gray-600 mb-1">Balance</label>
                      <div className="px-3 py-2 rounded-lg border bg-gray-50 border-gray-300">$0.00</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col">
                      <label className="text-gray-600 mb-1">Payment Status</label>
                      <select value={paymentStatusSelect} onChange={(e)=>setPaymentStatusSelect(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Paid</option>
                        <option>Credit</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-gray-600 mb-1">Amount Paid</label>
                      <input type="number" step="0.01" value={amountPaid} onChange={(e)=>setAmountPaid(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-gray-600 mb-1">Status</label>
                      <div className={`px-3 py-2 rounded-lg border ${paymentStatus==='Paid' ? 'bg-green-100 border-green-200 text-green-700' : (paymentStatus.includes('Partial') ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-red-100 border-red-200 text-red-700')}`}>{paymentStatus}</div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-gray-600 mb-1">Balance</label>
                      <div className="px-3 py-2 rounded-lg border bg-gray-50 border-gray-300">${balance.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col">
                  <label className="text-gray-600 mb-1">Customer (optional)</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Walk-in</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentGateway(true)}
                  disabled={cart.length === 0}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                    cart.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : isDarkMode 
                        ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' 
                        : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                  }`}
                >
                  💳 Secure Checkout - ${total.toFixed(2)}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Receipt Modal */}
    <Receipt 
      sale={lastSale}
      isVisible={showReceipt}
      onClose={() => setShowReceipt(false)}
      isDarkMode={isDarkMode}
    />
    
    {/* Barcode Scanner Modal */}
    <BarcodeScanner
      isVisible={showScanner}
      onClose={() => setShowScanner(false)}
      onScanSuccess={handleBarcodeScan}
      isDarkMode={isDarkMode}
    />

    {/* Payment Gateway Modal */}
    <PaymentGateway
      isVisible={showPaymentGateway}
      onClose={() => setShowPaymentGateway(false)}
      amount={total}
      customerInfo={{
        id: customerId,
        name: customers.find(c => c.id === customerId)?.name || 'Walk-in Customer',
        phone: customers.find(c => c.id === customerId)?.phone || ''
      }}
      onPaymentSuccess={async (paymentResult) => {
        console.log('Payment successful:', paymentResult);
        await completeSale(paymentResult); // Complete the sale with chosen method/fee
        setShowPaymentGateway(false);
      }}
      onPaymentError={(error) => {
        console.error('Payment failed:', error);
        alert(`Payment failed: ${error.message || 'Unknown error'}`);
      }}
      isDarkMode={isDarkMode}
    />
    </>
  );
}
