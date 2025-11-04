import React, { useContext, useState, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import InputField from '../components/InputField';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  DollarSign, 
  Users, 
  TrendingUp,
  Phone,
  MapPin,
  Calendar,
  X,
  CreditCard,
  History,
  AlertTriangle,
  Printer,
  Download
} from 'lucide-react';

/**
 * Customers page manages the list of customers and their credit
 * balances. Users can add new customers and view the total
 * amount owed by each customer based on recorded sales. This
 * implementation assumes that each sale's total amount is owed
 * until paid in full; partial payments are not tracked.
 */
export default function Customers() {
  const { customers, sales, payments, debts, addCustomer, updateCustomer, deleteCustomer, addPayment, addDebt } = useContext(RealDataContext);
  
  // Add null safety check
  const context = useContext(RealDataContext);
  if (!context) {
    console.error('RealDataContext is undefined in Customers page');
    return <div className="p-4 text-red-500">Loading customers data...</div>;
  }
  const { isDarkMode } = useContext(ThemeContext);
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [debtForm, setDebtForm] = useState({ amount: '', reason: '', notes: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    try {
      if (editingCustomer) {
        const result = await updateCustomer(editingCustomer.id, form);
        if (!result.success) {
          alert(`Failed to update customer: ${result.message}`);
          return;
        }
      } else {
        const customer = { 
          id: Date.now().toString(), 
          ...form,
          createdAt: new Date().toISOString()
        };
        const result = await addCustomer(customer);
        if (!result.success) {
          alert(`Failed to add customer: ${result.message}`);
          return;
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error submitting customer:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', address: '', email: '' });
    setIsFormVisible(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer) => {
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      email: customer.email || ''
    });
    setEditingCustomer(customer);
    setIsFormVisible(true);
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        // Show success message
        alert('Customer deleted successfully!');
      } catch (error) {
        // Show error message to user
        const errorMessage = error.message || 'Failed to delete customer';
        alert(`Error: ${errorMessage}`);
        console.error('Delete customer error:', error);
      }
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handlePayment = (customer) => {
    setSelectedCustomer(customer);
    const currentBalance = creditMap[customer.id] || 0;
    setPaymentForm({ 
      amount: currentBalance > 0 ? currentBalance.toFixed(2) : '', 
      method: 'cash', 
      notes: '' 
    });
    setShowPaymentModal(true);
  };

  const handlePaymentHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowPaymentHistory(true);
  };

  const handleAddDebt = (customer) => {
    setSelectedCustomer(customer);
    setDebtForm({ amount: '', reason: '', notes: '' });
    setShowDebtModal(true);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDebtChange = (e) => {
    const { name, value } = e.target;
    setDebtForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !selectedCustomer) return;

    const paymentAmount = parseFloat(paymentForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const payment = {
      id: Date.now().toString(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount: paymentAmount,
      method: paymentForm.method,
      notes: paymentForm.notes,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      const result = await addPayment(payment);
      if (result && result.success) {
        setPaymentForm({ amount: '', method: 'cash', notes: '' });
        setShowPaymentModal(false);
        alert(`Payment of $${paymentAmount.toFixed(2)} recorded successfully!`);
      } else {
        alert(`Failed to record payment: ${result?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(`Error recording payment: ${error.message}`);
    }
  };

  const handleDebtSubmit = async (e) => {
    e.preventDefault();
    if (!debtForm.amount || !selectedCustomer || !debtForm.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const debtAmount = parseFloat(debtForm.amount);
    if (isNaN(debtAmount) || debtAmount <= 0) {
      alert('Please enter a valid debt amount');
      return;
    }

    const debt = {
      id: Date.now().toString(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount: debtAmount,
      reason: debtForm.reason,
      notes: debtForm.notes,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      const result = await addDebt(debt);
      if (result && result.success) {
        setDebtForm({ amount: '', reason: '', notes: '' });
        setShowDebtModal(false);
        alert(`Debt of $${debtAmount.toFixed(2)} added successfully!`);
      } else {
        alert(`Failed to add debt: ${result?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding debt:', error);
      alert(`Error adding debt: ${error.message}`);
    }
  };

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
    if (isFormVisible) {
      resetForm();
    }
  };

  // Compute outstanding credit for each customer by summing the
  // totals of all sales referencing their id, adding manual debts, and subtracting payments.
  const creditMap = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      map[c.id] = 0;
    });
    
    // Add sales amounts
    sales.forEach((sale) => {
      if (sale.customerId && map[sale.customerId] != null) {
        map[sale.customerId] += sale.total;
      }
    });
    
    // Add manual debts
    const customerDebts = debts || [];
    customerDebts.forEach((debt) => {
      if (debt.customerId && map[debt.customerId] != null) {
        map[debt.customerId] += debt.amount;
      }
    });
    
    // Handle payments
    const customerPayments = payments || [];
    customerPayments.forEach((payment) => {
      if (payment.customerId && map[payment.customerId] != null) {
        map[payment.customerId] -= payment.amount;
      }
    });
    
    return map;
  }, [customers, sales, payments, debts]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalOwed = Object.values(creditMap).reduce((sum, amount) => sum + amount, 0);
    const customersWithDebt = customers.filter(c => creditMap[c.id] > 0).length;
    const totalSales = sales.filter(s => s.customerId).length;
    
    return {
      totalCustomers,
      totalOwed,
      customersWithDebt,
      totalSales
    };
  }, [customers, sales, creditMap]);

  // Calculate transaction history (payments and debts) with running balances
  const getPaymentHistoryWithBalances = (customerId) => {
    const customerSales = sales.filter(sale => sale.customerId === customerId);
    const customerPayments = (payments || []).filter(p => p.customerId === customerId);
    const customerDebts = (debts || []).filter(d => d.customerId === customerId);

    // Combine sales, payments, and debts with proper date handling
    const allTransactions = [
      ...customerSales.map((sale, idx) => ({
        type: 'sale',
        date: sale.saleDate || sale.createdAt || sale.date || new Date(Date.now() - idx * 1000).toISOString(),
        amount: sale.total || 0,
        id: sale.id || `sale-${idx}`,
        method: sale.paymentMethod || 'SALE',
        notes: sale.notes || ''
      })),
      ...customerDebts.map((debt, idx) => ({
        type: 'debt',
        date: debt.date || debt.createdAt || new Date(Date.now() - (idx + customerSales.length) * 1000).toISOString(),
        amount: debt.amount || 0,
        id: debt.id || `debt-${idx}`,
        method: `DEBT - ${debt.reason ? debt.reason.replace('_', ' ') : 'MANUAL'}`,
        notes: debt.notes || ''
      })),
      ...customerPayments.map((payment, idx) => ({
        type: 'payment',
        date: payment.date || payment.createdAt || new Date(Date.now() - (idx + customerSales.length + customerDebts.length) * 1000).toISOString(),
        amount: -(payment.amount || 0), // Negative for payments
        id: payment.id || `payment-${idx}`,
        method: payment.method || 'PAYMENT',
        notes: payment.notes || ''
      }))
    ].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() === dateB.getTime()) {
        // If same timestamp, sort by type (sale first, then debt, then payment)
        const typeOrder = { sale: 0, debt: 1, payment: 2 };
        return (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3);
      }
      return dateA - dateB;
    });

    // Calculate running balance and produce ALL transaction rows for the history
    let runningBalance = 0;
    const history = [];

    allTransactions.forEach(transaction => {
      const previousDebt = runningBalance;
      
      if (transaction.type === 'sale') {
        runningBalance += transaction.amount;
      } else {
        runningBalance += transaction.amount; // adds (debt) or subtracts (payment)
      }
      
      const remainingBalance = runningBalance;

      history.push({
        id: transaction.id,
        date: transaction.date,
        previousDebt,
        remainingBalance,
        amountAbs: transaction.type === 'sale' ? transaction.amount : Math.abs(transaction.amount),
        method: transaction.method,
        type: transaction.type,
        notes: transaction.notes
      });
    });

    // Sort by date descending (most recent first)
    return history.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  };

  const printPaymentHistory = () => {
    if (!selectedCustomer) return;
    const rows = getPaymentHistoryWithBalances(selectedCustomer.id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = `Payment History - ${selectedCustomer.name}`;
    const styles = `
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 16px; }
      h1 { font-size: 18px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; text-align: left; }
      th { background: #f5f5f5; }
      .right { text-align: right; }
      .red { color: #dc2626; }
      .green { color: #16a34a; }
    `;
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>${styles}</style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="right">Previous Debt</th>
                <th class="right">Amount</th>
                <th>Method</th>
                <th class="right">Remaining</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td class="right ${r.previousDebt > 0 ? 'red' : 'green'}">$${r.previousDebt.toFixed(2)}</td>
                  <td class="right ${r.type === 'payment' ? 'green' : 'red'}">$${r.amountAbs.toFixed(2)}</td>
                  <td>${(r.method || '').toString().replace('_', ' ').toUpperCase()}</td>
                  <td class="right ${r.remainingBalance > 0 ? 'red' : 'green'}">$${r.remainingBalance.toFixed(2)}</td>
                  <td>${r.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-750 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} p-5 sm:p-6 rounded-2xl shadow-lg`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
              Customers
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your customer relationships and track balances
            </p>
          </div>
          <button
            onClick={toggleForm}
            className={`flex items-center px-5 py-3 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105`}
          >
            <Plus className="h-5 w-5 mr-2" />
            <span className="font-semibold">{editingCustomer ? 'Update Customer' : 'Add Customer'}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'} p-4 sm:p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'} mb-1 uppercase tracking-wide`}>Total Customers</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                {stats.totalCustomers}
              </p>
            </div>
            <div className={`p-3 ${isDarkMode ? 'bg-blue-800/50' : 'bg-blue-200/50'} rounded-xl`}>
              <Users className={`h-7 w-7 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'} p-4 sm:p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-600'} mb-1 uppercase tracking-wide`}>Total Owed</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                ${stats.totalOwed.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 ${isDarkMode ? 'bg-green-800/50' : 'bg-green-200/50'} rounded-xl`}>
              <DollarSign className={`h-7 w-7 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-700/50' : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'} p-4 sm:p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-600'} mb-1 uppercase tracking-wide`}>With Debt</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-amber-900'}`}>
                {stats.customersWithDebt}
              </p>
            </div>
            <div className={`p-3 ${isDarkMode ? 'bg-amber-800/50' : 'bg-amber-200/50'} rounded-xl`}>
              <TrendingUp className={`h-7 w-7 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'} p-4 sm:p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} mb-1 uppercase tracking-wide`}>Total Sales</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                {stats.totalSales}
              </p>
            </div>
            <div className={`p-3 ${isDarkMode ? 'bg-purple-800/50' : 'bg-purple-200/50'} rounded-xl`}>
              <Calendar className={`h-7 w-7 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Customer List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Customer list */}
        <div className="lg:col-span-2">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm`}>
            {/* Search */}
            <div className="relative mb-6">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} z-10`} />
              <input
                type="text"
                placeholder="Search customers by name, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3.5 border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700/50 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-gray-50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}
              />
            </div>

            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>
              Customers ({filteredCustomers.length})
            </h3>
            
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchTerm ? 'No customers found matching your search.' : 'No customers added yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on mobile */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                        <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</th>
                        <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</th>
                        <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Owed</th>
                        <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className={`border-b transition-all duration-200 ${isDarkMode ? 'border-gray-700/50 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50/80'}`}>
                          <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            <div className="font-semibold text-base">{customer.name}</div>
                            {customer.email && (
                              <div className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                          </td>
                          <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 opacity-50" />
                              {customer.phone || '-'}
                            </div>
                          </td>
                          <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 opacity-50" />
                              <span className="truncate max-w-xs">{customer.address || '-'}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-3`}>
                            {creditMap[customer.id] > 0 ? (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700/50' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                ${creditMap[customer.id]?.toFixed(2) ?? '0.00'}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-700/50' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                ${creditMap[customer.id]?.toFixed(2) ?? '0.00'}
                              </span>
                            )}
                          </td>
                          <td className={`py-4 px-3`}>
                            <div className="flex space-x-1.5">
                              <button
                                onClick={() => handleViewDetails(customer)}
                                className={`p-2.5 ${isDarkMode ? 'hover:bg-blue-900/30 text-blue-400 hover:text-blue-300' : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'} rounded-lg transition-all duration-200 hover:scale-110`}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePayment(customer)}
                                className={`p-2.5 ${isDarkMode ? 'hover:bg-green-900/30 text-green-400 hover:text-green-300' : 'hover:bg-green-50 text-green-600 hover:text-green-700'} rounded-lg transition-all duration-200 hover:scale-110`}
                                title="Record Payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAddDebt(customer)}
                                className={`p-2.5 ${isDarkMode ? 'hover:bg-amber-900/30 text-amber-400 hover:text-amber-300' : 'hover:bg-amber-50 text-amber-600 hover:text-amber-700'} rounded-lg transition-all duration-200 hover:scale-110`}
                                title="Add Debt"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePaymentHistory(customer)}
                                className={`p-2.5 ${isDarkMode ? 'hover:bg-purple-900/30 text-purple-400 hover:text-purple-300' : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'} rounded-lg transition-all duration-200 hover:scale-110`}
                                title="Payment History"
                              >
                                <History className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(customer)}
                                className={`p-2.5 ${isDarkMode ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'} rounded-lg transition-all duration-200 hover:scale-110`}
                                title="Edit Customer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(customer.id)}
                                className={`p-2.5 ${isDarkMode ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-600 hover:text-red-700'} rounded-lg transition-all duration-200 hover:scale-110`}
                                title="Delete Customer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Hidden on desktop */}
                <div className="sm:hidden space-y-4">
                  {filteredCustomers.map((customer) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 shadow-sm`}
                    >
                      {/* Customer Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {customer.name}
                          </h4>
                          {customer.email && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                              📧 {customer.email}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-bold ${creditMap[customer.id] > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                            ${creditMap[customer.id]?.toFixed(2) ?? '0.00'}
                          </span>
                          <span className={`text-xs ${creditMap[customer.id] > 0 ? (isDarkMode ? 'text-red-300' : 'text-red-500') : (isDarkMode ? 'text-green-300' : 'text-green-500')}`}>
                            {creditMap[customer.id] > 0 ? 'Owed' : 'Clear'}
                          </span>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Phone className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {customer.phone || 'No phone number'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} flex-1`}>
                            {customer.address || 'No address provided'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewDetails(customer)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-colors text-sm font-medium`}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handlePayment(customer)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} rounded-lg transition-colors text-sm font-medium`}
                        >
                          <CreditCard className="h-4 w-4" />
                          Payment
                        </button>
                        <button
                          onClick={() => handlePaymentHistory(customer)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} rounded-lg transition-colors text-sm font-medium`}
                        >
                          <History className="h-4 w-4" />
                          History
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'} rounded-lg transition-colors text-sm font-medium`}
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleAddDebt(customer)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'} rounded-lg transition-colors text-sm font-medium`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Add Debt
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${isDarkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} rounded-lg transition-colors text-sm font-medium`}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add/Edit Customer Form */}
        <div>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm`}>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            
            {isFormVisible && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <InputField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  isDarkMode={isDarkMode}
                />
                <InputField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  isDarkMode={isDarkMode}
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  isDarkMode={isDarkMode}
                />
                <InputField
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  isDarkMode={isDarkMode}
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className={`flex-1 py-2 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors`}
                  >
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`py-2 px-4 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
            
            {!isFormVisible && (
              <div className="text-center py-8">
                <Users className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  Click "Add Customer" to create a new customer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowCustomerDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Customer Details
              </h3>
              <button
                onClick={() => setShowCustomerDetails(false)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Name</h4>
                <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedCustomer.name}</p>
              </div>
              
              {selectedCustomer.phone && (
                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Phone</h4>
                  <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedCustomer.phone}</p>
                </div>
              )}
              
              {selectedCustomer.email && (
                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Email</h4>
                  <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedCustomer.email}</p>
                </div>
              )}
              
              {selectedCustomer.address && (
                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Address</h4>
                  <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedCustomer.address}</p>
                </div>
              )}
              
              <div>
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Amount Owed</h4>
                <p className={`text-xl font-bold ${creditMap[selectedCustomer.id] > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                  ${creditMap[selectedCustomer.id]?.toFixed(2) ?? '0.00'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowPaymentModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${isDarkMode ? 'bg-gradient-to-b from-gray-800 to-gray-850 border border-gray-700' : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'} rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 ${isDarkMode ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border-b border-green-700/30' : 'bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-200'} rounded-t-2xl`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${isDarkMode ? 'bg-green-800/50' : 'bg-green-200/50'} rounded-lg`}>
                  <CreditCard className={`h-5 w-5 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Record Payment
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'} transition-all duration-200 hover:scale-110`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Customer</h4>
                <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedCustomer.name}</p>
              </div>
              
              <div>
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Current Balance</h4>
                <p className={`text-xl font-bold ${creditMap[selectedCustomer.id] > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                  ${creditMap[selectedCustomer.id]?.toFixed(2) ?? '0.00'}
                </p>
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Payment Amount
                    </label>
                    {creditMap[selectedCustomer.id] > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const balance = creditMap[selectedCustomer.id] || 0;
                          setPaymentForm(prev => ({ ...prev, amount: balance.toFixed(2) }));
                        }}
                        className={`text-xs px-2 py-1 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded transition-colors`}
                      >
                        Fill Balance
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={creditMap[selectedCustomer.id] || 0}
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    placeholder="Enter payment amount"
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  {creditMap[selectedCustomer.id] > 0 && (
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Maximum: ${creditMap[selectedCustomer.id].toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Payment Method
                  </label>
                  <select
                    name="method"
                    value={paymentForm.method}
                    onChange={handlePaymentChange}
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handlePaymentChange}
                    placeholder="Payment notes..."
                    rows={3}
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className={`flex-1 py-3 px-4 ${isDarkMode ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center`}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className={`py-3 px-6 ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'} ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} rounded-xl transition-all duration-200 font-medium hover:scale-105`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowPaymentHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Payment History - {selectedCustomer.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={printPaymentHistory}
                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors`}
                  title="Print"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowPaymentHistory(false)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</th>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Previous Debt</th>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</th>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Method</th>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Remaining Balance</th>
                      <th className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows = getPaymentHistoryWithBalances(selectedCustomer.id);
                      let lastDateStr = '';
                      return rows.map((row, idx) => {
                        const dateObj = new Date(row.date);
                        const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const showDateHeader = dateStr !== lastDateStr;
                        lastDateStr = dateStr;
                        return (
                          <React.Fragment key={row.id}>
                            {showDateHeader && (
                              <tr>
                                <td colSpan="7" className={`py-3 px-4 ${isDarkMode ? 'bg-gray-700/70 border-t border-b border-gray-600' : 'bg-gray-100 border-t border-b border-gray-200'}`}>
                                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    📅 {dateStr}
                                  </div>
                                </td>
                              </tr>
                            )}
                            <tr className={`border-b-2 ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                <div className="font-semibold">{dateStr}</div>
                                <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{timeStr}</div>
                              </td>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                  row.type === 'sale' ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-300') :
                                  row.type === 'payment' ? (isDarkMode ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-300') :
                                  (isDarkMode ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-100 text-red-700 border border-red-300')
                                }`}>
                                  {row.type === 'sale' ? 'SALE' : row.type === 'payment' ? 'PAYMENT' : 'DEBT'}
                                </span>
                              </td>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                <span className={`font-semibold text-sm ${row.previousDebt > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                                  ${row.previousDebt.toFixed(2)}
                                </span>
                              </td>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                <span className={`font-bold text-base ${
                                  row.type === 'payment' ? 'text-green-600' : 
                                  row.type === 'sale' ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                  {row.type === 'payment' ? '−' : row.type === 'sale' ? '+' : '+'}${row.amountAbs.toFixed(2)}
                                </span>
                              </td>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">{row.method.replace('_', ' ').toUpperCase()}</span>
                              </td>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                <span className={`font-bold text-sm ${row.remainingBalance > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                                  ${row.remainingBalance.toFixed(2)}
                                </span>
                              </td>
                              <td className={`py-4 px-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="text-sm">{row.notes || '-'}</span>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                
                {getPaymentHistoryWithBalances(selectedCustomer.id).length === 0 && (
                  <div className="text-center py-8">
                    <History className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No payment history found for this customer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Debt Modal */}
      {showDebtModal && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowDebtModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${isDarkMode ? 'bg-gradient-to-b from-gray-800 to-gray-850 border border-gray-700' : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'} rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 ${isDarkMode ? 'bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-b border-amber-700/30' : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200'} rounded-t-2xl`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${isDarkMode ? 'bg-amber-800/50' : 'bg-amber-200/50'} rounded-lg`}>
                  <AlertTriangle className={`h-5 w-5 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`} />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Add Debt
                </h3>
              </div>
              <button
                onClick={() => setShowDebtModal(false)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'} transition-all duration-200 hover:scale-110`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Customer</h4>
                <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedCustomer.name}</p>
              </div>
              
              <div>
                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Current Balance</h4>
                <p className={`text-xl font-bold ${creditMap[selectedCustomer.id] > 0 ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600')}`}>
                  ${creditMap[selectedCustomer.id]?.toFixed(2) ?? '0.00'}
                </p>
              </div>
              
              <form onSubmit={handleDebtSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Debt Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="amount"
                    value={debtForm.amount}
                    onChange={handleDebtChange}
                    placeholder="Enter debt amount"
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Reason for Debt
                  </label>
                  <select
                    name="reason"
                    value={debtForm.reason}
                    onChange={handleDebtChange}
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="loan">Loan</option>
                    <option value="credit_purchase">Credit Purchase</option>
                    <option value="service_fee">Service Fee</option>
                    <option value="penalty">Penalty</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={debtForm.notes}
                    onChange={handleDebtChange}
                    placeholder="Additional notes about this debt..."
                    rows={3}
                    className={`w-full px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className={`flex-1 py-3 px-4 ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'} text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center`}
                  >
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Add Debt
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDebtModal(false)}
                    className={`py-3 px-6 ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'} ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} rounded-xl transition-all duration-200 font-medium hover:scale-105`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
