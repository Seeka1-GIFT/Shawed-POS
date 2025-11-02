import React, { useContext, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import { DollarSign, Calendar, Phone, Mail, MapPin, Globe, FileText, Download, Printer, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function SupplierProfile() {
  const { id } = useParams();
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in SupplierProfile page');
    return <div className="p-4 text-red-500">Loading supplier data...</div>;
  }
  
  const { suppliers = [], purchaseOrders = [] } = context;

  const supplier = suppliers.find(s => s.id === id);
  const orders = useMemo(()=> purchaseOrders.filter(o => o.supplierId === id), [purchaseOrders, id]);

  const totals = useMemo(()=> {
    const total = orders.reduce((sum,o)=> {
      const amt = typeof o.totalAmount === 'number' ? o.totalAmount : parseFloat(o.totalAmount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    const paid = orders.reduce((sum,o)=> {
      const amt = typeof o.amountPaid === 'number' ? o.amountPaid : parseFloat(o.amountPaid || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    return { total, paid, outstanding: total - paid };
  }, [orders]);

  const onTime = useMemo(()=> orders.filter(o => o.receivedDate && o.expectedDate && new Date(o.receivedDate) <= new Date(o.expectedDate)).length, [orders]);
  const onTimePct = orders.length ? (onTime / orders.length) * 100 : 0;

  const monthlyData = useMemo(()=>{
    const map = {};
    orders.forEach(o=>{
      const key = (o.orderDate||'').slice(0,7);
      if(!map[key]) map[key] = { month:key, value:0, orders:0 };
      const amt = typeof o.totalAmount === 'number' ? o.totalAmount : parseFloat(o.totalAmount || 0);
      map[key].value += (isNaN(amt) ? 0 : amt);
      map[key].orders += 1;
    });
    return Object.values(map).sort((a,b)=> a.month.localeCompare(b.month));
  },[orders]);

  if (!supplier) {
    return (
      <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier not found. <Link to="/suppliers" className="text-blue-600">Back</Link></div>
    );
  }

  // Helper function to safely convert to number
  const toNumber = (value) => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const num = parseFloat(value || 0);
    return isNaN(num) ? 0 : num;
  };

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
        <div className="mt-4">
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Monthly Orders Count</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb', color: isDarkMode ? '#f3f4f6' : '#111827' }} />
                  <Bar dataKey="orders" fill={isDarkMode ? '#10b981' : '#16a34a'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bank & Tax Details removed as requested */}
      {/* Attachments section removed as requested */}

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
    </div>
  );
}


