import React, { useContext, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import { DollarSign, Calendar, Phone, Mail, MapPin, Globe, FileText, Download, Printer, ArrowLeft, CreditCard, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SupplierProfile() {
  const { id } = useParams();
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // All hooks must be called before any conditional returns
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    notes: '',
    orderId: 'all' // 'all' for all orders, or specific order ID
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Add null safety check AFTER hooks
  if (!context) {
    console.error('RealDataContext is undefined in SupplierProfile page');
    return <div className="p-4 text-red-500">Loading supplier data...</div>;
  }
  
  const { suppliers = [], purchaseOrders = [], addPurchasePayment, updatePurchaseOrder } = context;

  // Helper function to safely convert to number (defined before use in useMemo)
  const toNumber = (value) => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const num = parseFloat(value || 0);
    return isNaN(num) ? 0 : num;
  };

  const supplier = suppliers.find(s => s.id === id);
  const orders = useMemo(()=> purchaseOrders.filter(o => o.supplierId === id), [purchaseOrders, id]);

  const totals = useMemo(()=> {
    const total = orders.reduce((sum,o)=> {
      const amt = toNumber(o.totalAmount);
      return sum + amt;
    }, 0);
    const paid = orders.reduce((sum,o)=> {
      const amt = toNumber(o.amountPaid);
      return sum + amt;
    }, 0);
    return { total, paid, outstanding: total - paid };
  }, [orders]);

  const onTime = useMemo(()=> orders.filter(o => o.receivedDate && o.expectedDate && new Date(o.receivedDate) <= new Date(o.expectedDate)).length, [orders]);
  const onTimePct = orders.length ? (onTime / orders.length) * 100 : 0;

  // Get orders with outstanding balance (defined before conditional return)
  const ordersWithBalance = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.filter(o => {
      const total = toNumber(o.totalAmount);
      const paid = toNumber(o.amountPaid);
      return total - paid > 0;
    });
  }, [orders]);

  if (!supplier) {
    return (
      <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier not found. <Link to="/suppliers" className="text-blue-600">Back</Link></div>
    );
  }

  const exportCSV = () => {
    const headers = ['Order ID','Date','Status','Items','Total','Paid','Balance'];
    const rows = orders.map(o => {
      const total = toNumber(o.totalAmount);
      const paid = toNumber(o.amountPaid);
      const balance = total - paid;
      return [o.id, o.orderDate, o.status, o.items?.length || 0, total.toFixed(2), paid.toFixed(2), balance.toFixed(2)];
    });
    const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`supplier-${supplier.name}-orders.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const printProfile = () => {
    const styles = `body{font-family:ui-sans-serif,system-ui;padding:16px} h1{font-size:18px;margin-bottom:8px} table{width:100%;border-collapse:collapse;margin-top:8px} th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px} th{background:#f5f5f5}`;
    const html = `<html><head><title>${supplier.name}</title><style>${styles}</style></head><body><h1>Supplier: ${supplier.name}</h1><div>Email: ${supplier.email||'-'} | Phone: ${supplier.phone||'-'}</div><div>Address: ${supplier.address||'-'}</div><div>Total Purchases: $${totals.total.toFixed(2)} | Outstanding: $${totals.outstanding.toFixed(2)}</div><table><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead><tbody>${orders.map(o=>{
      const total = toNumber(o.totalAmount);
      const paid = toNumber(o.amountPaid);
      const balance = total - paid;
      return `<tr><td>${o.id}</td><td>${o.orderDate}</td><td>${o.status}</td><td>$${total.toFixed(2)}</td><td>$${paid.toFixed(2)}</td><td>$${balance.toFixed(2)}</td></tr>`;
    }).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank'); if(!w) return; w.document.write(html); w.document.close(); w.focus(); w.print();
  };


  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentForm.amount);
    
    if (!amount || amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      if (paymentForm.orderId === 'all') {
        // Pay towards all outstanding orders proportionally
        const totalOutstanding = totals.outstanding;
        if (amount > totalOutstanding) {
          alert(`Payment amount cannot exceed total outstanding balance of $${totalOutstanding.toFixed(2)}`);
          return;
        }
        
        // Distribute payment proportionally across orders
        for (const order of ordersWithBalance) {
          const orderTotal = toNumber(order.totalAmount);
          const orderPaid = toNumber(order.amountPaid);
          const orderBalance = orderTotal - orderPaid;
          const orderProportion = orderBalance / totalOutstanding;
          const orderPaymentAmount = Math.round((amount * orderProportion) * 100) / 100; // Round to 2 decimals
          
          if (orderPaymentAmount > 0.01) { // Only process if payment > $0.01
            const newAmountPaid = orderPaid + orderPaymentAmount;
            const newBalance = orderTotal - newAmountPaid;
            const paymentStatus = newBalance <= 0.01 ? 'paid' : 'partially_paid';
            
            // Update order payment using addPurchasePayment (it handles the update)
            if (addPurchasePayment) {
              await addPurchasePayment(order.id, {
                amount: orderPaymentAmount,
                method: paymentForm.method,
                notes: paymentForm.notes || `Part of $${amount.toFixed(2)} payment to ${supplier.name}`,
                date: new Date().toISOString().split('T')[0]
              });
            }
          }
        }
        
        alert(`Payment of $${amount.toFixed(2)} applied to all outstanding orders successfully!`);
      } else {
        // Pay towards specific order
        const order = orders.find(o => o.id === paymentForm.orderId);
        if (!order) {
          alert('Order not found');
          return;
        }
        
        const orderTotal = toNumber(order.totalAmount);
        const orderPaid = toNumber(order.amountPaid);
        const orderBalance = orderTotal - orderPaid;
        
        if (amount > orderBalance) {
          alert(`Payment amount cannot exceed order balance of $${orderBalance.toFixed(2)}`);
          return;
        }
        
        // Record payment using addPurchasePayment (it handles the update)
        if (addPurchasePayment) {
          const result = await addPurchasePayment(order.id, {
            amount: amount,
            method: paymentForm.method,
            notes: paymentForm.notes,
            date: new Date().toISOString().split('T')[0]
          });
          
          if (result && result.success) {
            alert(`Payment of $${amount.toFixed(2)} recorded successfully for order ${order.id?.slice(-6) || order.id}!`);
          } else {
            alert(`Failed to record payment: ${result?.message || 'Unknown error'}`);
            return;
          }
        } else {
          alert('Payment function not available');
          return;
        }
      }
      
      // Close modal and reset form
      setPaymentForm({ amount: '', method: 'cash', notes: '', orderId: 'all' });
      setShowPaymentModal(false);
      
      // Trigger a re-render by updating state - no need for full reload
      // The context update should trigger a re-render automatically
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Error processing payment: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Suppliers Button */}
      <Link
        to="/suppliers"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isDarkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Suppliers</span>
      </Link>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{supplier.name}</h2>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg px-3 py-2 flex items-center`}><Download className="h-4 w-4 mr-1"/>CSV</button>
            <button onClick={printProfile} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg px-3 py-2 flex items-center`}><Printer className="h-4 w-4 mr-1"/>Print</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><Phone className="h-4 w-4 inline mr-1"/> {supplier.phone || '-'}</div>
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><Mail className="h-4 w-4 inline mr-1"/> {supplier.email || '-'}</div>
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><MapPin className="h-4 w-4 inline mr-1"/> {supplier.address || '-'}</div>
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><Globe className="h-4 w-4 inline mr-1"/> {supplier.website || '-'}</div>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Orders</p><p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{orders.length}</p></div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>On‑time %</p><p className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>{onTimePct.toFixed(0)}%</p></div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outstanding</p><p className={`text-2xl font-bold ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>${totals.outstanding.toFixed(2)}</p></div>
        </div>
      </div>

      {/* Bank & Tax Details removed as requested */}
      {/* Attachments section removed as requested */}

      {/* Payment Section */}
      {totals.outstanding > 0 && (
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-2 border-blue-700/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'} rounded-2xl shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-800/50' : 'bg-blue-200/50'}`}>
                <CreditCard className={`h-6 w-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                  Make Payment
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
                  Outstanding Balance: <span className="font-semibold">${totals.outstanding.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className={`px-6 py-3 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2`}
            >
              <Plus className="h-5 w-5" />
              Record Payment
            </button>
          </div>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Purchase Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order</th>
                <th className={`text-left py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                <th className={`text-left py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                <th className={`text-right py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</th>
                <th className={`text-right py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Paid</th>
                <th className={`text-right py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const total = toNumber(o.totalAmount);
                const paid = toNumber(o.amountPaid);
                const balance = total - paid;
                return (
                  <tr key={o.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{o.id?.slice(-6) || o.id}</td>
                    <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.orderDate}</td>
                    <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === 'paid' ? (isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700') :
                        o.status === 'partially_paid' || o.status === 'partial' ? (isDarkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700') :
                        (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
                      }`}>
                        {o.status === 'partially_paid' ? 'Partially Paid' : o.status === 'partial' ? 'Partial' : o.status || 'Pending'}
                      </span>
                    </td>
                    <td className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} text-right font-medium`}>${total.toFixed(2)}</td>
                    <td className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} text-right font-medium ${paid > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''}`}>
                      ${paid.toFixed(2)}
                    </td>
                    <td className={`text-right font-semibold ${balance > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                      ${balance.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-800/50' : 'bg-green-200/50'}`}>
                  <CreditCard className={`h-5 w-5 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Record Payment
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {/* Order Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Apply Payment To
                </label>
                <select
                  value={paymentForm.orderId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, orderId: e.target.value }))}
                  className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Outstanding Orders (${totals.outstanding.toFixed(2)})</option>
                  {ordersWithBalance.map(order => {
                    const total = toNumber(order.totalAmount);
                    const paid = toNumber(order.amountPaid);
                    const balance = total - paid;
                    return (
                      <option key={order.id} value={order.id}>
                        Order {order.id?.slice(-6) || order.id} - Balance: ${balance.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Payment Amount */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={paymentForm.orderId === 'all' ? totals.outstanding : orders.find(o => o.id === paymentForm.orderId) ? toNumber(orders.find(o => o.id === paymentForm.orderId).totalAmount) - toNumber(orders.find(o => o.id === paymentForm.orderId).amountPaid) : 0}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter payment amount"
                    required
                    className={`w-full pl-10 pr-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Maximum: ${paymentForm.orderId === 'all' ? totals.outstanding.toFixed(2) : orders.find(o => o.id === paymentForm.orderId) ? (toNumber(orders.find(o => o.id === paymentForm.orderId).totalAmount) - toNumber(orders.find(o => o.id === paymentForm.orderId).amountPaid)).toFixed(2) : '0.00'}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Method
                </label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                  className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({ amount: '', method: 'cash', notes: '', orderId: 'all' });
                  }}
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
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  } shadow-lg hover:shadow-xl`}
                >
                  Record Payment
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}


