import React, { useContext, useMemo, useRef, useState } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import InputField from '../components/InputField';
import BarcodeScanner from '../components/BarcodeScanner';
import BarcodeGenerator from '../components/BarcodeGenerator';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Package, ChevronDown, ChevronUp, Camera, Download, Upload, Printer, Image as ImageIcon, Info, QrCode, X } from 'lucide-react';

/**
 * Products page allows users to view existing products and add
 * or edit product information. Products are stored in the
 * DataContext. When editing a product the form is prefilled.
 */
export default function Products() {
  const { products, suppliers, addProduct, updateProduct, deleteProduct } = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  const asNumber = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const getBuy = (p) => asNumber(p.buyPrice ?? p.purchasePrice ?? p.buy_price);
  const getSell = (p) => asNumber(p.sellPrice ?? p.sellingPrice ?? p.sell_price);
  const getMargin = (p) => {
    const b = getBuy(p);
    const s = getSell(p);
    return b > 0 ? ((s - b) / b) * 100 : 0;
  };
  const [form, setForm] = useState({
    id: '',
    name: '',
    category: '',
    barcode: '',
    supplierId: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    expiryDate: '',
    imageUrl: '',
    lowStockThreshold: 5,
    variants: [],
    batches: [],
    serialNumbers: []
  });
  const [editing, setEditing] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [filters, setFilters] = useState({ q: '', category: 'all', supplier: 'all', stock: 'all', expiry: 'all' });
  const fileInputRef = useRef(null);
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const supplierMap = useMemo(()=> Object.fromEntries(suppliers.map(s=> [s.id, s.name])), [suppliers]);
  const addVariant = () => setForm(f=> ({ ...f, variants: [...(f.variants||[]), { unit: '', size: '', color: '', qtyPerUnit: '', barcode: '' }] }));
  const updateVariant = (i, key, val) => setForm(f=> ({ ...f, variants: f.variants.map((v,idx)=> idx===i ? { ...v, [key]: val } : v) }));
  const removeVariant = (i) => setForm(f=> ({ ...f, variants: f.variants.filter((_,idx)=> idx!==i) }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      category: '',
      barcode: '',
      supplierId: '',
      quantity: '',
      purchasePrice: '',
      sellingPrice: '',
      expiryDate: '',
      imageUrl: '',
      lowStockThreshold: 5,
      variants: [],
      batches: [],
      serialNumbers: []
    });
    setEditing(false);
    setIsFormExpanded(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.name || !form.category) {
      alert('Product name and category are required');
      return;
    }
    
    const buyPrice = parseFloat(form.purchasePrice);
    const sellPrice = parseFloat(form.sellingPrice);
    
    if (isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0 || sellPrice <= 0) {
      alert('Valid buy and sell prices are required (must be numbers greater than 0)');
      return;
    }
    
    if (sellPrice < buyPrice) {
      alert('Selling price should not be less than purchase price');
      return;
    }
    
    // Prepare backend-safe payload
    const productData = editing ? {
      ...form,
      id: form.id,
      quantity: parseInt(form.quantity) || 0,
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString().split('T')[0] : null,
      supplierId: form.supplierId || null,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
    } : {
      name: String(form.name || '').trim(),
      category: String(form.category || '').trim(),
      barcode: form.barcode || '',
      quantity: parseInt(form.quantity) || 0,
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString().split('T')[0] : null,
      supplierId: form.supplierId || null,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
    };

    try {
      if (editing) {
        const result = await updateProduct(form.id, productData);
        if (!result.success) {
          alert(`Failed to update product: ${result.message}`);
          return;
        }
      } else {
        const result = await addProduct(productData);
        if (!result.success) {
          alert(`Failed to add product: ${result.message}`);
          return;
        }
      }
      
      resetForm();
      setIsFormExpanded(false);
      alert('Product ' + (editing ? 'updated' : 'added') + ' successfully');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setForm({
      ...product,
      quantity: product.quantity.toString(),
      purchasePrice: (product.buyPrice || product.purchasePrice || 0).toString(),
      sellingPrice: (product.sellPrice || product.sellingPrice || 0).toString()
    });
    setEditing(true);
    setIsFormExpanded(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const result = await deleteProduct(id);
        if (!result.success) {
          alert(`Failed to delete product: ${result.message}`);
        } else {
          alert('Product deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  const calculateMargin = () => {
    const purchasePrice = parseFloat(form.purchasePrice) || 0;
    const sellingPrice = parseFloat(form.sellingPrice) || 0;
    if (purchasePrice > 0) {
      return ((sellingPrice - purchasePrice) / purchasePrice * 100).toFixed(1);
    }
    return '0';
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(filters.q.toLowerCase()) ||
                          product.category?.toLowerCase().includes(filters.q.toLowerCase()) ||
                          product.barcode?.toLowerCase().includes(filters.q.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      
      const matchesSupplier = filters.supplier === 'all' || product.supplierId === filters.supplier;
      
      let matchesStock = true;
      if (filters.stock === 'low') {
        matchesStock = product.quantity <= (product.lowStockThreshold || 5);
      } else if (filters.stock === 'ok') {
        matchesStock = product.quantity > (product.lowStockThreshold || 5);
      }
      
      let matchesExpiry = true;
      if (filters.expiry === 'soon' && product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        matchesExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      } else if (filters.expiry === 'expired' && product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        const today = new Date();
        matchesExpiry = expiryDate < today;
      }
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesStock && matchesExpiry;
    });
  }, [products, filters]);

  const toggleForm = () => {
    setIsFormExpanded(!isFormExpanded);
    if (!isFormExpanded && editing) {
      resetForm();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm({ ...form, imageUrl: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Barcode', 'Supplier', 'Quantity', 'Purchase Price', 'Selling Price', 'Margin %', 'Expiry Date'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(p => [
        p.name,
        p.category || '',
        p.barcode || '',
        p.supplierName || '',
        p.quantity,
        p.buyPrice || p.purchasePrice || 0,
        p.sellPrice || p.sellingPrice || 0,
        (() => {
          const buyPrice = parseFloat(p.buyPrice || p.purchasePrice || 0);
          const sellPrice = parseFloat(p.sellPrice || p.sellingPrice || 0);
          return buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice * 100).toFixed(1) : '0.0';
        })(),
        p.expiryDate || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLS = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = ['Name', 'Category', 'Barcode', 'Supplier', 'Quantity', 'Purchase Price', 'Selling Price', 'Margin %', 'Expiry Date'];
      const data = [
        headers,
        ...filteredProducts.map(p => [
          p.name,
          p.category || '',
          p.barcode || '',
          p.supplierName || '',
          p.quantity,
          p.buyPrice || p.purchasePrice || 0,
          p.sellPrice || p.sellingPrice || 0,
          (() => {
            const buyPrice = parseFloat(p.buyPrice || p.purchasePrice || 0);
            const sellPrice = parseFloat(p.sellPrice || p.sellingPrice || 0);
            return buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice * 100).toFixed(1) : '0.0';
          })(),
          p.expiryDate || ''
        ])
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, 'products.xlsx');
    } catch (error) {
      console.error('XLSX export failed:', error);
      exportCSV(); // Fallback to CSV
      alert('XLSX export failed. Exported as CSV instead.');
    }
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const product = headers.reduce((acc, header, index) => {
            if (values[index]) {
              acc[header.toLowerCase().replace(' ', '')] = values[index];
            }
            return acc;
          }, {});
          
          if (product.name) {
            addProduct({
              ...product,
              id: Date.now().toString() + i,
              quantity: parseInt(product.quantity) || 0,
              buyPrice: parseFloat(product.purchaseprice) || 0,
              sellPrice: parseFloat(product.sellingprice) || 0,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
      
      alert('Products imported successfully');
    };
    reader.readAsText(file);
  };

  const exportPDF = () => {
    const printContent = `
      <h1>Products Report</h1>
      <table border="1" style="width:100%; border-collapse:collapse;">
        <tr style="background:#f4f4f4;">
          <th>Name</th><th>Category</th><th>Supplier</th><th>Quantity</th><th>Buy Price</th><th>Sell Price</th><th>Margin %</th>
        </tr>
        ${filteredProducts.map(p => `
          <tr>
            <td>${p.name}</td>
            <td>${p.category || '-'}</td>
            <td>${p.supplierName || '-'}</td>
            <td>${p.quantity}</td>
            <td>$${(p.buyPrice || p.purchasePrice || 0).toFixed(2)}</td>
            <td>$${(p.sellPrice || p.sellingPrice || 0).toFixed(2)}</td>
            <td>${(() => {
              const buyPrice = parseFloat(p.buyPrice || p.purchasePrice || 0);
              const sellPrice = parseFloat(p.sellPrice || p.sellingPrice || 0);
              return buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice * 100).toFixed(1) : '0.0';
            })()}%</td>
          </tr>
        `).join('')}
      </table>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Products Report</title></head>
        <body onload="window.print()">${printContent}</body>
      </html>
    `);
    printWindow.document.close();
  };

  const printLabels = (products) => {
    const labelsHTML = products.map(p => `
      <div style="width:180px; height:120px; border:1px solid #ccc; padding:5px; margin:5px; float:left; text-align:center; font-size:10px;">
        <b>${p.name}</b><br/>
        ${p.category || ''}<br/>
        Price: $${(p.sellPrice || p.sellingPrice || 0).toFixed(2)}<br/>
        ${p.barcode ? `Code: ${p.barcode}` : ''}
      </div>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Product Labels</title></head>
        <body onload="window.print()">${labelsHTML}</body>
      </html>
    `);
    printWindow.document.close();
  };

  // Removed addSampleData
  /* const addSampleData = async () => {
    const sampleProducts = [
      {
        name: 'Copper Plus',
        category: 'Electronics',
        barcode: '037551000340',
        quantity: 29,
        buyPrice: 15.50,
        sellPrice: 25.99,
        purchasePrice: 15.50,
        sellingPrice: 25.99,
        expiryDate: '2026-06-29',
        supplierName: 'Tech Supplies Co.',
        lowStockThreshold: 5
      },
      {
        name: 'Smartphone Case',
        category: 'Electronics',
        barcode: '123456789012',
        quantity: 45,
        buyPrice: 8.00,
        sellPrice: 15.99,
        purchasePrice: 8.00,
        sellingPrice: 15.99,
        expiryDate: '',
        supplierName: 'Mobile Accessories Ltd.',
        lowStockThreshold: 10
      },
      {
        name: 'Wireless Headphones',
        category: 'Electronics',
        barcode: '987654321098',
        quantity: 12,
        buyPrice: 45.00,
        sellPrice: 79.99,
        purchasePrice: 45.00,
        sellingPrice: 79.99,
        expiryDate: '2025-12-31',
        supplierName: 'Audio Solutions Inc.',
        lowStockThreshold: 5
      },
      {
        name: 'USB Cable',
        category: 'Electronics',
        barcode: '555666777888',
        quantity: 67,
        buyPrice: 3.50,
        sellPrice: 7.99,
        purchasePrice: 3.50,
        sellingPrice: 7.99,
        expiryDate: '',
        supplierName: 'Cable World',
        lowStockThreshold: 15
      },
      {
        name: 'Power Bank',
        category: 'Electronics',
        barcode: '111222333444',
        quantity: 8,
        buyPrice: 20.00,
        sellPrice: 35.99,
        purchasePrice: 20.00,
        sellingPrice: 35.99,
        expiryDate: '2025-08-15',
        supplierName: 'Power Solutions',
        lowStockThreshold: 5
      }
    ];

    try {
      for (const product of sampleProducts) {
        await addProduct({
          ...product,
          id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      alert('Sample products added successfully!');
    } catch (error) {
      console.error('Error adding sample data:', error);
      alert('Error adding sample data: ' + error.message);
    }
  }; */

  // Removed fixExistingData
  /* const fixExistingData = async () => {
    try {
      // Find products with empty or zero prices and update them
      const productsToFix = products.filter(product => {
        const buyPrice = parseFloat(product.buyPrice || product.purchasePrice || 0);
        const sellPrice = parseFloat(product.sellPrice || product.sellingPrice || 0);
        return buyPrice === 0 || sellPrice === 0 || isNaN(buyPrice) || isNaN(sellPrice);
      });

      if (productsToFix.length === 0) {
        alert('No products need fixing - all products have valid prices!');
        return;
      }

      let fixedCount = 0;
      for (const product of productsToFix) {
        // Set default prices based on product name or category
        let defaultBuyPrice = 10.00;
        let defaultSellPrice = 18.99;

        if (product.name.toLowerCase().includes('copper')) {
          defaultBuyPrice = 15.50;
          defaultSellPrice = 25.99;
        } else if (product.name.toLowerCase().includes('phone') || product.name.toLowerCase().includes('case')) {
          defaultBuyPrice = 8.00;
          defaultSellPrice = 15.99;
        } else if (product.name.toLowerCase().includes('headphone') || product.name.toLowerCase().includes('audio')) {
          defaultBuyPrice = 45.00;
          defaultSellPrice = 79.99;
        } else if (product.name.toLowerCase().includes('cable') || product.name.toLowerCase().includes('usb')) {
          defaultBuyPrice = 3.50;
          defaultSellPrice = 7.99;
        } else if (product.name.toLowerCase().includes('power') || product.name.toLowerCase().includes('battery')) {
          defaultBuyPrice = 20.00;
          defaultSellPrice = 35.99;
        }

        const updatedProduct = {
          ...product,
          buyPrice: defaultBuyPrice,
          sellPrice: defaultSellPrice,
          purchasePrice: defaultBuyPrice,
          sellingPrice: defaultSellPrice,
          updatedAt: new Date().toISOString()
        };

        await updateProduct(product.id, updatedProduct);
        fixedCount++;
      }

      alert(`Fixed ${fixedCount} products with invalid prices!`);
    } catch (error) {
      console.error('Error fixing existing data:', error);
      alert('Error fixing existing data: ' + error.message);
    }
  }; */

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'} p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} flex items-center mb-6`}>
          <div className={`w-2 h-8 rounded-full mr-3 ${isDarkMode ? 'bg-gradient-to-b from-purple-400 to-pink-400' : 'bg-gradient-to-b from-purple-500 to-pink-500'}`}></div>
          <Package className="h-6 w-6 mr-3" />
          Products Management
        </h1>
        
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Left Side - Filters */}
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {/* Mobile Search */}
            <input 
              placeholder="Search products..." 
              value={filters.q} 
              onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} 
              className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-indigo-400' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none transition-colors block md:hidden w-full`} 
            />
            
            {/* Desktop Search */}
            <input 
              placeholder="Search products..." 
              value={filters.q} 
              onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} 
              className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-indigo-400' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none transition-colors hidden md:block flex-1 min-w-48`} 
            />
            
            <select value={filters.category} onChange={(e)=>setFilters(f=>({...f,category:e.target.value}))} className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-indigo-400' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none transition-colors`}>
              <option value="all">All Categories</option>
              {[...new Set(products.map(p=> p.category || 'General'))].map((c,i)=> (<option key={i} value={c}>{c}</option>))}
            </select>
            <select value={filters.supplier} onChange={(e)=>setFilters(f=>({...f,supplier:e.target.value}))} className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-indigo-400' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none transition-colors`}>
              <option value="all">All Suppliers</option>
              {suppliers.map(s=> (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <select value={filters.stock} onChange={(e)=>setFilters(f=>({...f,stock:e.target.value}))} className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-indigo-400' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none transition-colors`}>
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="ok">In Stock</option>
            </select>
            <select value={filters.expiry} onChange={(e)=>setFilters(f=>({...f,expiry:e.target.value}))} className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-indigo-400' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none transition-colors`}>
              <option value="all">Any Expiry</option>
              <option value="soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button onClick={exportCSV} title="Export CSV" className={`px-3 py-2 rounded-lg flex items-center text-sm ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white transition-colors' : 'bg-blue-500 hover:bg-blue-600 text-white transition-colors'}`}><Download className="h-4 w-4 mr-1"/>CSV</button>
              <button onClick={exportXLS} title="Export Excel" className={`px-3 py-2 rounded-lg flex items-center text-sm ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white transition-colors' : 'bg-green-500 hover:bg-green-600 text-white transition-colors'}`}>XLS</button>
              <button onClick={()=> fileInputRef.current?.click()} title="Import CSV" className={`px-3 py-2 rounded-lg flex items-center text-sm ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white transition-colors' : 'bg-gray-500 hover:bg-gray-600 text-white transition-colors'}`}><Upload className="h-4 w-4"/></button>
              {/* Sample and Fix buttons removed */}
              <input ref={fileInputRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
            </div>
          </div>
          
          {/* Top-right Add Product button */}
          <div className="flex justify-end">
            <motion.button
              onClick={() => { resetForm(); setEditing(false); setShowAddModal(true); }}
              whileHover={{ scale: 1.03 }}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} shadow`}
            >
              <Plus className="h-5 w-5" />
              Add Product
            </motion.button>
          </div>
        </div>
        
        {/* Mobile Add Product button removed */}
      </div>
      
      {/* Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {/* Product List (full width) */}
      <div className="lg:col-span-1">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
          {products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No products added yet.</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>Click "Add Product" to get started.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="table-fixed w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-12`}>Image</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-32`}>Name</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-24`}>Category</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-32 `}>Barcode</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-28`}>Supplier</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-800' : 'text-gray-700'} w-16 text-center`}>Qty</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-16`}>Buy</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-16`}>Sell</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-20`}>Margin %</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-28`}>Expiry</th>
                        <th className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} w-24`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:bg-gray-50 transition-colors`}>
                          <td className="py-2 px-4">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-6 w-6 object-cover rounded" />
                            ) : (
                              <div className={`h-6 w-6 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <Package className="h-3 w-3 text-gray-500" />
                              </div>
                            )}
                          </td>
                          <td className={`py-2 px-4 truncate whitespace-nowrap ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{product.name}</td>
                          <td className={`py-2 px-4 truncate whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.category}</td>
                          <td className={`py-2 px-4 truncate whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.barcode}</td>
                          <td className={`py-2 px-4 truncate whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.supplierName}</td>
                          <td className={`py-2 px-4 text-center ${product.quantity <= (product.lowStockThreshold || 5) ? 'text-red-500 font-semibold' : product.quantity <= 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {product.quantity}
                          </td>
                          <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {`$${getBuy(product).toFixed(2)}`}
                          </td>
                          <td className={`py-2 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {`$${getSell(product).toFixed(2)}`}
                          </td>
                          <td className={`py-2 px-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-semibold`}>
                            {getMargin(product).toFixed(1)}%
                          </td>
                          <td className={`py-2 px-4 truncate whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex gap-2 justify-center">
                              <button onClick={()=>handleEdit(product)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} title="Edit product">
                                <Edit2 className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                              </button>
                              <button onClick={()=>handleDelete(product.id)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} title="Delete product">
                                <Trash2 className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                      </button>
                              {product.variants && product.variants.length > 0 && (
                                <button onClick={()=>setShowHistoryFor(product.id)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} title="View product details">
                                  <Info className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </button>
                              )}
                            </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
                
                {/* Mobile cards */}
                <div className="block sm:hidden">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded" />
                          ) : (
                            <div className={`h-12 w-12 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <Package className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{product.name}</h3>
                            <div className="flex gap-2">
                              <button onClick={()=>handleEdit(product)} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} title="Edit product">
                                <Edit2 className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                              </button>
                              <button onClick={()=>handleDelete(product.id)} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} title="Delete product">
                                <Trash2 className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                              </button>
                            </div>
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                            <div>Category: {product.category || 'No Category'}</div>
                            <div className="flex gap-4">
                              <span>Qty: <span className={`font-semibold ${product.quantity <= (product.lowStockThreshold || 5) ? 'text-red-500' : 'text-green-500'}`}>{product.quantity}</span></span>
                              <span>Sell: <span className="font-semibold">{`$${getSell(product).toFixed(2)}`}</span></span>
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supplier: {product.supplierName}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
          )}
        </div>
      </div>
        
      {/* Add/Edit form panel removed */}
      </div>
      
      {/* Scanner Modal */}
      {showScanner && (
      <BarcodeScanner
          onScan={(barcode) => {
            setForm({ ...form, barcode });
            setShowScanner(false);
          }}
        onClose={() => setShowScanner(false)}
      />
      )}

      {/* Barcode Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <QrCode className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Generate Barcode
                </h3>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <BarcodeGenerator
                barcode={form.barcode || '037551000340'}
                productName={form.name || 'Product Name'}
                size="large"
                showLabel={true}
                isDarkMode={isDarkMode}
              />
              
              {/* Use Generated Barcode */}
              <div className="mt-6 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowGenerator(false);
                    setIsFormExpanded(true);
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                >
                  Use This Barcode
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setForm({ ...form, barcode: '037551000340' });
                    setShowGenerator(false);
                  }}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                >
                  Use Example (037551000340)
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=> setShowAddModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-2xl rounded-2xl shadow-xl mx-4 overflow-hidden`}
            onClick={(e)=> e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={()=> setShowAddModal(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <InputField label="Product Name" value={form.name} onChange={(e)=> setForm({ ...form, name: e.target.value })} required />
              <InputField label="Category" value={form.category} onChange={(e)=> setForm({ ...form, category: e.target.value })} />
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Barcode</label>
                <input name="barcode" type="text" value={form.barcode} onChange={handleChange} placeholder="Enter barcode"
                  className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Supplier</label>
                <select value={form.supplierId} onChange={(e)=> setForm({ ...form, supplierId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'}`}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Quantity" type="number" value={form.quantity} onChange={(e)=> setForm({ ...form, quantity: e.target.value })} required />
                <InputField label="Low Stock Threshold" type="number" value={form.lowStockThreshold} onChange={(e)=> setForm({ ...form, lowStockThreshold: parseInt(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Purchase Price ($)" type="number" step="0.01" min="0" value={form.purchasePrice}
                  onChange={(e)=> { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, purchasePrice: v }); }} required />
                <InputField label="Selling Price ($)" type="number" step="0.01" min="0" value={form.sellingPrice}
                  onChange={(e)=> { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, sellingPrice: v }); }} required />
              </div>
              {form.purchasePrice && form.sellingPrice && (
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-lg`}>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                    Profit Margin: <span className="font-semibold text-green-600">{calculateMargin()}%</span>
                  </div>
                </div>
              )}
              <InputField label="Expiry Date" type="date" value={form.expiryDate} onChange={(e)=> setForm({ ...form, expiryDate: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className={`${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg px-4 py-2`}>{editing ? 'Update Product' : 'Add Product'}</button>
                <button type="button" onClick={()=> { resetForm(); setShowAddModal(false); }} className={`border rounded-lg px-4 py-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
