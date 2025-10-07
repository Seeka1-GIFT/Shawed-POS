import React, { useContext, useState, useMemo } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PermissionGuard from '../components/PermissionGuard';
import { PERMISSIONS } from '../context/UserContext';

export default function Suppliers() {
  const context = useContext(RealDataContext);
  const { isDarkMode } = useContext(ThemeContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in Suppliers page');
    return <div className="p-4 text-red-500">Loading suppliers data...</div>;
  }
  
  const { suppliers = [], addSupplier, updateSupplier, deleteSupplier } = context;

  const [form, setForm] = useState({ id: '', name: '', phone: '', email: '', address: '' });
  const [editing, setEditing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filters, setFilters] = useState({ q: '', location: '' });

  const filteredSuppliers = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return suppliers.filter(s => {
      const matchesQ = !q || [s.name, s.email, s.phone].some(v => (v||'').toLowerCase().includes(q));
      const locOk = !filters.location || (s.address||'').toLowerCase().includes(filters.location.toLowerCase());
      return matchesQ && locOk;
    });
  }, [suppliers, filters]);

  const exportCSV = () => {
    const headers = ['Name','Phone','Email','Address'];
    const rows = filteredSuppliers.map(s => [s.name, s.phone||'', s.email||'', s.address||'']);
    const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='suppliers.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const printList = () => {
    const styles = `body{font-family:ui-sans-serif,system-ui;padding:16px} h1{font-size:18px;margin-bottom:12px} table{width:100%;border-collapse:collapse} th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px} th{background:#f5f5f5}`;
    const html = `<html><head><title>Suppliers</title><style>${styles}</style></head><body><h1>Suppliers</h1><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th></tr></thead><tbody>${filteredSuppliers.map(s=>`<tr><td>${s.name}</td><td>${s.phone||''}</td><td>${s.email||''}</td><td>${s.address||''}</td></tr>`).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank'); if(!w) return; w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ id: '', name: '', phone: '', email: '', address: '' });
    setEditing(false);
  };

  const startEdit = (supplier) => {
    setForm({ ...supplier });
    setEditing(true);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    try {
      if (editing) {
        const result = await updateSupplier(form.id, form);
        if (!result.success) {
          alert(`Failed to update supplier: ${result.message}`);
          return;
        }
      } else {
        const result = await addSupplier(form);
        if (!result.success) {
          alert(`Failed to add supplier: ${result.message}`);
          return;
        }
      }
      
      resetForm();
      setIsFormVisible(false);
      
    } catch (error) {
      console.error('Error submitting supplier:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this supplier?')) {
      try {
        const result = await deleteSupplier(id);
        if (!result.success) {
          alert(`Failed to delete supplier: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Suppliers list */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm overflow-auto`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4 flex items-center`}>
            <Truck className="h-5 w-5 mr-2" /> Suppliers
          </h3>
          {/* Filters & Export */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <input className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} placeholder="Search name/phone/email" value={filters.q} onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} />
            <input className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`} placeholder="Filter by location" value={filters.location} onChange={(e)=>setFilters(f=>({...f,location:e.target.value}))} />
            <button onClick={exportCSV} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg px-3`}>Export CSV</button>
            <button onClick={printList} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg px-3`}>Print</button>
          </div>
          {filteredSuppliers.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No suppliers added yet.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} py-2 px-1`}>
                      <Link className={`${isDarkMode ? 'text-blue-300 hover:underline' : 'text-blue-600 hover:underline'}`} to={`/suppliers/${s.id}`}>{s.name}</Link>
                    </td>
                    <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} py-2 px-1`}>{s.phone || '-'}</td>
                    <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} py-2 px-1`}>{s.email || '-'}</td>
                    <td className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} py-2 px-1`}>{s.address || '-'}</td>
                    <td className="py-2 px-1 space-x-2">
                      <PermissionGuard permission={PERMISSIONS.MANAGE_SUPPLIERS} showFallback={false}>
                        <button
                          onClick={() => startEdit(s)}
                          className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline`}
                        >
                          <Edit2 className="inline h-4 w-4 mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} hover:underline`}
                        >
                          <Trash2 className="inline h-4 w-4 mr-1" /> Delete
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit form */}
      <div className="order-1 lg:order-2">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFormVisible(!isFormVisible)}
            className={`w-full flex items-center justify-center py-3 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors mb-4`}
          >
            <Plus className="h-5 w-5 mr-2" /> {editing ? 'Edit Supplier' : 'Add Supplier'}
          </motion.button>

          {isFormVisible && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className={`flex-1 py-2 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors`}>
                  {editing ? 'Update' : 'Add'}
                </button>
                {editing && (
                  <button type="button" onClick={resetForm} className={`py-2 px-4 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-colors`}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

