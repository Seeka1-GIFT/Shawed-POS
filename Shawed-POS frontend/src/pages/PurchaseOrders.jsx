import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../context/UserContext';
import InputField from '../components/InputField';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  ShoppingCart,
  Calendar,
  DollarSign,
  Search,
  X
} from 'lucide-react';

/**
 * PurchaseOrders page allows users to create, view, and manage
 * purchase orders from suppliers. Orders can be pending, received, or cancelled.
 */
export default function PurchaseOrders() {
  const context = useContext(RealDataContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in PurchaseOrders page');
    return <div className="p-4 text-red-500">Loading purchase orders data...</div>;
  }
  
  const { products = [], suppliers = [], purchaseOrders = [], addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder, createProductFromPurchase, addPurchasePayment } = context;
  const { isDarkMode } = useContext(ThemeContext);
  
  const [form, setForm] = useState({
    id: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: '',
    items: [],
    paymentStatus: 'unpaid',
    amountPaid: ''
  });
  
  const [editing, setEditing] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: '',
    unitPrice: ''
  });
  const newItemTotal = useMemo(()=> (Number(newItem.quantity||0) * Number(newItem.unitPrice||0)), [newItem.quantity, newItem.unitPrice]);
  
  // Searchable product input state
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showAddNewProduct, setShowAddNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  
  const dropdownRef = useRef(null);

  // Order details modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [filters, setFilters] = useState({ q: '', supplierId: 'all', status: 'all', from: '', to: '' });
  const [view, setView] = useState('cards'); // cards | table

  const filteredOrders = purchaseOrders.filter(o => {
    const q = filters.q.trim().toLowerCase();
    const inSearch = !q || o.id.includes(q) || o.items.some(it => it.productName.toLowerCase().includes(q));
    const supplierOk = filters.supplierId === 'all' || o.supplierId === filters.supplierId;
    const statusOk = filters.status === 'all' || o.status === filters.status;
    const d = new Date(o.orderDate);
    const rangeOk = (!filters.from || d >= new Date(filters.from)) && (!filters.to || d <= new Date(filters.to));
    return inSearch && supplierOk && statusOk && rangeOk;
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
        setShowAddNewProduct(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const resetForm = () => {
    setForm({
      id: '',
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      notes: '',
      items: []
    });
    setNewItem({ productId: '', quantity: '', unitPrice: '' });
    setProductSearch('');
    setShowProductDropdown(false);
    setShowAddNewProduct(false);
    setNewProductName('');
    setEditing(false);
    setIsFormExpanded(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto compute payment status when amountPaid changes
    if (name === 'amountPaid') {
      const total = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
      const paid = parseFloat(value || '0');
      let status = 'unpaid';
      if (paid <= 0) status = 'unpaid';
      else if (paid >= total) status = 'paid';
      else status = 'partially_paid';
      setForm(prev => ({ ...prev, amountPaid: value, paymentStatus: status }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Compute order total live
  const orderTotal = useMemo(()=> form.items.reduce((sum, item) => sum + (Number(item.quantity||0) * Number(item.unitPrice||0)), 0), [form.items]);

  // Keep payment status consistent when items or amountPaid change
  useEffect(()=>{
    const paid = parseFloat(form.amountPaid || '0');
    let status = 'unpaid';
    if (paid <= 0) status = 'unpaid';
    else if (paid >= orderTotal) status = 'paid';
    else status = 'partially_paid';
    setForm(prev => ({ ...prev, paymentStatus: status }));
  }, [orderTotal]);

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  // Product search functions
  const handleProductSearch = (value) => {
    setProductSearch(value);
    setShowProductDropdown(value.length > 0);
    setShowAddNewProduct(false);
    
    // Check if there are matching products
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    
    if (value.length > 0 && filteredProducts.length === 0) {
      setShowAddNewProduct(true);
    }
  };

  const selectProduct = (product) => {
    // When selecting a product, set productId and prefill unitPrice if empty
    setNewItem(prev => ({ 
      ...prev, 
      productId: product.id,
      unitPrice: prev.unitPrice || product.buyPrice || product.sellPrice || ''
    }));
    setProductSearch(product.name);
    setShowProductDropdown(false);
    setShowAddNewProduct(false);
  };

  const addNewProduct = () => {
    if (!newProductName.trim()) {
      alert('Please enter a product name');
      return;
    }

    const newProductId = `new-${Date.now()}`;
    setNewItem(prev => ({ ...prev, productId: newProductId }));
    setProductSearch(newProductName.trim());
    setShowProductDropdown(false);
    setShowAddNewProduct(false);
    setNewProductName('');
  };

  const clearProductSearch = () => {
    setProductSearch('');
    setNewItem(prev => ({ ...prev, productId: '' }));
    setShowProductDropdown(false);
    setShowAddNewProduct(false);
  };

  const addItem = () => {
    // If user typed but did not click dropdown, try to resolve the product by name
    let resolvedProductId = newItem.productId;
    if (!resolvedProductId && productSearch) {
      const match = products.find(p => p.name.toLowerCase() === productSearch.toLowerCase()) 
        || products.find(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
      if (match) {
        resolvedProductId = match.id;
      }
    }

    const qty = parseInt(newItem.quantity || '0', 10);
    const priceNum = parseFloat(newItem.unitPrice || '0');
    if (!resolvedProductId || qty <= 0 || !Number.isFinite(priceNum) || priceNum < 0) {
      alert('Please fill in all item fields');
      return;
    }

    // Handle new products created from search
    let product;
    if (resolvedProductId.startsWith && resolvedProductId.startsWith('new-')) {
      // This is a new product - create it first
      const productName = productSearch;
      product = createProductFromPurchase(productName, 'temp');
      // Update the productId to the actual product ID
      setNewItem(prev => ({ ...prev, productId: product.id }));
    } else {
      // Existing product
      product = products.find(p => p.id === resolvedProductId);
    }
    
    if (!product) return;

    const item = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: priceNum
    };

    setForm(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({ productId: '', quantity: '', unitPrice: '' });
    setProductSearch('');
    setShowProductDropdown(false);
    setShowAddNewProduct(false);
  };

  const removeItem = (itemId) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItemField = (itemId, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(it => it.id === itemId ? { ...it, [field]: field === 'quantity' || field === 'unitPrice' ? Number(value || 0) : value } : it)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.supplierId || form.items.length === 0) {
      alert('Please select a supplier and add at least one item');
      return;
    }

    const totalAmount = orderTotal;
    const amtPaid = parseFloat(form.amountPaid || '0');
    const computedStatus = amtPaid <= 0 ? 'unpaid' : (amtPaid >= totalAmount ? 'paid' : 'partially_paid');

    const order = {
      id: editing ? form.id : Date.now().toString(),
      supplierId: form.supplierId,
      supplierName: suppliers.find(s => s.id === form.supplierId)?.name || 'Unknown',
      orderDate: form.orderDate,
      expectedDate: form.expectedDate,
      status: 'pending',
      notes: form.notes,
      items: form.items,
      totalAmount,
      amountPaid: amtPaid,
      paymentStatus: form.paymentStatus || computedStatus,
      createdAt: editing ? form.createdAt : new Date().toISOString(),
    };

    if (editing) {
      updatePurchaseOrder(order);
      alert('Purchase order updated successfully!');
    } else {
      addPurchaseOrder(order);
      alert(`Purchase order created successfully!\n\nOrder #${order.id.slice(-6)}\nTotal: $${order.totalAmount.toFixed(2)}\n\nStock quantities have been updated automatically.`);
    }

    resetForm();
  };

  const startEdit = (order) => {
    setForm({
      id: order.id,
      supplierId: order.supplierId,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      notes: order.notes,
      items: order.items,
      paymentStatus: order.paymentStatus || 'unpaid',
      amountPaid: String(order.amountPaid || '') ,
      createdAt: order.createdAt
    });
    setEditing(true);
    setIsFormExpanded(true);
  };

  const toggleForm = () => {
    setIsFormExpanded(!isFormExpanded);
    if (!isFormExpanded && editing) {
      resetForm();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'received': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partially_received': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-gray-500';
      case 'pending': return 'text-yellow-600';
      case 'received': return 'text-green-600';
      case 'partially_received': return 'text-blue-600';
      case 'completed': return 'text-emerald-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // helper to move between statuses
  const setOrderStatus = (order, status) => {
    if (!order) return;
    if (status === 'received') {
      receivePurchaseOrder(order.id);
      setSelectedOrder({ ...order, status: 'received', receivedDate: new Date().toISOString().split('T')[0] });
    } else {
      updatePurchaseOrder({ ...order, status });
      setSelectedOrder({ ...order, status });
    }
  };

  // Export helpers
  const exportOrderCSV = (order) => {
    const headers = ['Product','Quantity','Unit Price','Line Total'];
    const rows = order.items.map(it => [it.productName, it.quantity, it.unitPrice.toFixed(2), (it.quantity*it.unitPrice).toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(',')), '', `Total,,,$${order.totalAmount.toFixed(2)}`].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `purchase-order-${order.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printOrder = (order) => {
    const styles = `body{font-family:ui-sans-serif,system-ui;padding:16px} h1{font-size:18px;margin-bottom:8px} table{width:100%;border-collapse:collapse;margin-top:8px} th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px} th{background:#f5f5f5}`;
    const html = `<html><head><title>PO ${order.id}</title><style>${styles}</style></head><body>
      <h1>Purchase Order #${order.id.slice(-6)}</h1>
      <div>Supplier: ${order.supplierName}</div>
      <div>Date: ${order.orderDate}${order.expectedDate ? ' | Expected: '+order.expectedDate : ''}</div>
      <div>Status: ${order.status}</div>
      ${order.notes ? '<div>Notes: '+order.notes+'</div>' : ''}
      <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
        ${order.items.map(it => `<tr><td>${it.productName}</td><td>${it.quantity}</td><td>$${it.unitPrice.toFixed(2)}</td><td>$${(it.quantity*it.unitPrice).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <div style="text-align:right;margin-top:8px"><strong>Total: $${order.totalAmount.toFixed(2)}</strong></div>
    </body></html>`;
    const w = window.open('', '_blank'); if(!w) return; w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Orders List */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm overflow-auto`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <ShoppingCart className="h-5 w-5 mr-2" /> Purchase Orders
          </h3>
          {/* View switch */}
          <div className="flex items-center gap-2 mb-3">
            <button onClick={()=>setView('cards')} className={`${view==='cards' ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border')} px-3 py-1 rounded-lg border`}>Cards</button>
            <button onClick={()=>setView('table')} className={`${view==='table' ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border')} px-3 py-1 rounded-lg border`}>Table</button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
            <input className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} placeholder="Search order # or product" value={filters.q} onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} />
            <select className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} value={filters.supplierId} onChange={(e)=>setFilters(f=>({...f,supplierId:e.target.value}))}>
              <option value="all">All Suppliers</option>
              {suppliers.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} value={filters.status} onChange={(e)=>setFilters(f=>({...f,status:e.target.value}))}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="partially_received">Partially Received</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="date" className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} value={filters.from} onChange={(e)=>setFilters(f=>({...f,from:e.target.value}))} />
            <input type="date" className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} value={filters.to} onChange={(e)=>setFilters(f=>({...f,to:e.target.value}))} />
          </div>

          {filteredOrders.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No purchase orders yet.</p>
          ) : (
            <>
              {view === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <th className="text-left py-2">Order #</th>
                        <th className="text-left py-2">Supplier</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">Paid</th>
                        <th className="text-right py-2">Balance</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id} className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <td className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} py-2`}>{order.id.slice(-6)}</td>
                          <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} py-2`}>{order.supplierName}</td>
                          <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} py-2`}>{order.orderDate}</td>
                          <td className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} py-2 text-right`}>${order.totalAmount.toFixed(2)}</td>
                          <td className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} py-2 text-right`}>${Number(order.amountPaid||0).toFixed(2)}</td>
                          <td className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} py-2 text-right`}>${(order.totalAmount - (order.amountPaid||0)).toFixed(2)}</td>
                          <td className={`${getStatusColor(order.status)} py-2 flex items-center gap-1`}>{getStatusIcon(order.status)} {order.status}</td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <button onClick={()=>receivePurchaseOrder(order.id)} className="btn-success text-xs">Receive</button>
                              )}
                              <button onClick={()=>startEdit(order)} className="btn-secondary text-xs">Edit</button>
                              <button onClick={()=>deletePurchaseOrder(order.id)} className="btn-danger text-xs">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredOrders.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-xl p-3`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>#{order.id.slice(-6)} • {order.supplierName}</div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-xs`}>{order.orderDate}</div>
                        </div>
                        <div className={`text-xs ${getStatusColor(order.status)} flex items-center gap-1`}>{getStatusIcon(order.status)} {order.status}</div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Total</div>
                        <div className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-semibold`}>${order.totalAmount.toFixed(2)}</div>
                      </div>
                      {/* Collapsible items */}
                      <details className="mt-2">
                        <summary className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-xs cursor-pointer`}>Items ({order.items.length})</summary>
                        <ul className="mt-1 space-y-1">
                          {order.items.map(it => (
                            <li key={it.id} className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-xs flex justify-between`}>
                              <span>{it.productName}</span>
                              <span>{it.quantity} × ${it.unitPrice.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                      <div className="flex gap-2 mt-3">
                        {order.status === 'pending' && (
                          <button onClick={()=>receivePurchaseOrder(order.id)} className={`px-2 py-1 text-xs ${isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'} rounded`}>Receive</button>
                        )}
                        <button onClick={()=>startEdit(order)} className={`px-2 py-1 text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'} rounded`}>Edit</button>
                        <button onClick={()=>deletePurchaseOrder(order.id)} className={`px-2 py-1 text-xs ${isDarkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'} rounded`}>Delete</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Order Form */}
      <PermissionGuard permission={PERMISSIONS.MANAGE_PURCHASE_ORDERS} showFallback={true} fallback={null}>
      <div className="order-1 lg:order-2">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
          <button
            onClick={toggleForm}
            className={`w-full px-4 py-4 flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-200`}
          >
            <div className="flex items-center">
              <Plus className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-primary-600'}`} />
              <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {editing ? 'Edit Order' : 'New Order'}
              </span>
            </div>
            {isFormExpanded ? (
              <ChevronUp className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200`} />
            ) : (
              <ChevronDown className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200`} />
            )}
          </button>

          <div className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${isFormExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="px-4 pb-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Supplier
                  </label>
                  <select
                    name="supplierId"
                    value={form.supplierId}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <InputField 
                    label="Order Date" 
                    name="orderDate" 
                    type="date" 
                    value={form.orderDate} 
                    onChange={handleChange} 
                    required 
                    isDarkMode={isDarkMode} 
                  />
                  <InputField 
                    label="Expected Date" 
                    name="expectedDate" 
                    type="date" 
                    value={form.expectedDate} 
                    onChange={handleChange} 
                    isDarkMode={isDarkMode} 
                  />
                </div>

                <InputField 
                  label="Notes" 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleChange} 
                  isDarkMode={isDarkMode} 
                />

                {/* Payment Section */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-4`}>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Payment Status</label>
                    <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange} className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
                      <option value="paid">Paid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Amount Paid</label>
                    <input name="amountPaid" type="number" step="0.01" value={form.amountPaid} onChange={handleChange} className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Balance</label>
                    <div className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      ${ (orderTotal - parseFloat(form.amountPaid||'0')).toFixed(2) }
                    </div>
                  </div>
                </div>

                {/* Add Items Section */}
                <div className="mb-4">
                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Add Items
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2 mb-2">
                    {/* Searchable Product Input */}
                    <div className="relative" ref={dropdownRef}>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <input
                          type="text"
                          placeholder="Search for product..."
                          value={productSearch}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          onFocus={() => setShowProductDropdown(productSearch.length > 0)}
                          className={`w-full pl-10 pr-10 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        />
                        {productSearch && (
                          <button
                            type="button"
                            onClick={clearProductSearch}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Product Dropdown */}
                      {showProductDropdown && (
                        <div className={`absolute z-10 w-full mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                          {products
                            .filter(product =>
                              product.name.toLowerCase().includes(productSearch.toLowerCase())
                            )
                            .map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(product)}
                                className={`w-full text-left px-4 py-2 hover:${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'} ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                              >
                                {product.name}
                              </button>
                            ))}
                          
                          {/* Add New Product Option */}
                          {showAddNewProduct && (
                            <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} p-2`}>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="Enter new product name"
                                  value={newProductName}
                                  onChange={(e) => setNewProductName(e.target.value)}
                                  className={`flex-1 px-2 py-1 text-sm border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded`}
                                />
                                <button
                                  type="button"
                                  onClick={addNewProduct}
                                  className={`px-3 py-1 text-sm ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-100 hover:bg-green-200 text-green-800'} rounded transition-colors`}
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <input
                        type="number"
                        name="quantity"
                        placeholder="Quantity"
                        value={newItem.quantity}
                        onChange={handleItemChange}
                        className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        name="unitPrice"
                        placeholder="Unit Price"
                        value={newItem.unitPrice}
                        onChange={handleItemChange}
                        className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      <div className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-sm text-right`}>${newItemTotal.toFixed(2)}</div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addItem}
                      className={`py-2 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors`}
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Items List */}
                  {form.items.length > 0 && (
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                      <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Order Items ({form.items.length})
                      </h5>
                      <div className="space-y-1">
                        {form.items.map((item) => (
                          <div key={item.id} className={`grid grid-cols-5 gap-2 items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="col-span-2 truncate">{item.productName}</div>
                            <input type="number" value={item.quantity} onChange={(e)=>updateItemField(item.id,'quantity',e.target.value)} className={`px-2 py-1 border rounded ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} />
                            <input type="number" step="0.01" value={item.unitPrice} onChange={(e)=>updateItemField(item.id,'unitPrice',e.target.value)} className={`px-2 py-1 border rounded ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} />
                            <div className="text-right">${(Number(item.quantity||0) * Number(item.unitPrice||0)).toFixed(2)}</div>
                            <div className="col-span-5 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} hover:underline`}
                              >
                                <Trash2 className="h-3 w-3 inline" /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <div className="flex justify-between font-medium">
                          <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>Total:</span>
                          <span className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>
                            ${orderTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className={`flex-1 btn-primary`}
                  >
                    {editing ? 'Update Order' : 'Create Order'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`py-2 px-4 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-colors`}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      </PermissionGuard>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=>setShowOrderModal(false)}>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-3xl rounded-2xl shadow-xl mx-4 overflow-hidden`} onClick={(e)=>e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Purchase Order #{selectedOrder.id.slice(-6)}</h3>
              <button onClick={()=>setShowOrderModal(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Supplier & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier</p>
                  <p className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-medium`}>{selectedOrder.supplierName}</p>
                  {selectedOrder.notes && (
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Notes: {selectedOrder.notes}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Order: {selectedOrder.orderDate}</div>
                  {selectedOrder.expectedDate && (
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Expected: {selectedOrder.expectedDate}</div>
                  )}
                  {selectedOrder.receivedDate && (
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Received: {selectedOrder.receivedDate}</div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Items</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <th className="text-left py-1">Product</th>
                      <th className="text-right py-1">Qty</th>
                      <th className="text-right py-1">Unit Price</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((it)=> (
                      <tr key={it.id} className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        <td className="py-1">{it.productName}</td>
                        <td className="py-1 text-right">{it.quantity}</td>
                        <td className="py-1 text-right">${it.unitPrice.toFixed(2)}</td>
                        <td className="py-1 text-right">${(it.quantity * it.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} flex justify-end`}>
                  <div className="text-right">
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</div>
                    <div className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${selectedOrder.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className={`font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Payments</div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Paid: ${Number(selectedOrder.amountPaid || 0).toFixed(2)}</div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Outstanding: ${(selectedOrder.totalAmount - (selectedOrder.amountPaid || 0)).toFixed(2)}</div>
                </div>
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className={`font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Record Payment</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" step="0.01" placeholder="Amount" value={paymentForm.amount} onChange={(e)=>setPaymentForm(f=>({...f,amount:e.target.value}))} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'} rounded-lg`} />
                    <select value={paymentForm.method} onChange={(e)=>setPaymentForm(f=>({...f,method:e.target.value}))} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'} rounded-lg`}>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                    <button onClick={()=>{ const amt = parseFloat(paymentForm.amount||'0'); if(!amt) return; addPurchasePayment(selectedOrder.id,{ amount: amt, method: paymentForm.method, notes: paymentForm.notes, date: new Date().toISOString().split('T')[0] }); setSelectedOrder({ ...selectedOrder, amountPaid: (selectedOrder.amountPaid||0) + amt }); setPaymentForm({ amount:'', method:'cash', notes:'' }); }} className={`${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg px-3`}>Add</button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                {selectedOrder.status !== 'received' && (
                  <button onClick={()=> setOrderStatus(selectedOrder,'received')} className={`${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg px-4 py-2`}>Mark Received</button>
                )}
                {selectedOrder.status !== 'partially_received' && (
                  <button onClick={()=> setOrderStatus(selectedOrder,'partially_received')} className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg px-4 py-2`}>Mark Partial</button>
                )}
                {selectedOrder.status !== 'completed' && (
                  <button onClick={()=> setOrderStatus(selectedOrder,'completed')} className={`${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg px-4 py-2`}>Complete</button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button onClick={()=> setOrderStatus(selectedOrder,'cancelled')} className={`${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg px-4 py-2`}>Cancel</button>
                )}
                <button onClick={()=>exportOrderCSV(selectedOrder)} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg px-4 py-2`}>Export CSV</button>
                <button onClick={()=>printOrder(selectedOrder)} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg px-4 py-2`}>Print Invoice</button>
                <button onClick={()=>setShowOrderModal(false)} className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg px-4 py-2`}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
