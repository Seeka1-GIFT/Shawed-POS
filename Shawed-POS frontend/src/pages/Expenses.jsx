import React, { useContext, useEffect, useMemo, useState } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import InputField from '../components/InputField';
import { Plus, Download, Printer } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import PermissionGuard from '../components/PermissionGuard';
import { UserContext, PERMISSIONS } from '../context/UserContext';

/**
 * Expenses page lists all recorded expenses and provides a form
 * for adding new expenses. Each expense consists of a description,
 * amount, category and date. The data is stored in the
 * DataContext.
 */
export default function Expenses() {
  const context = useContext(RealDataContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined');
    return <div className="p-4 text-red-500">Loading expenses data...</div>;
  }
  
  const { expenses = [], addExpense, updateExpense, deleteExpense, addExpenseCategory, addRecurringExpense, processRecurringExpenses, setExpenseStatus } = context;
  
  // Debug logging
  console.log('Expenses page - context:', !!context);
  console.log('Expenses page - expenses:', expenses);
  console.log('Expenses page - expenses length:', expenses?.length);
  
  const { isDarkMode } = useContext(ThemeContext);
  const { hasPermission } = useContext(UserContext);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: '',
    method: 'Cash',
    status: 'Pending',
    attachments: [],
    isRecurring: false,
    frequency: 'monthly',
    date: new Date().toISOString().slice(0, 10),
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    category: 'all',
    method: 'all',
    status: 'all',
    start: '',
    end: ''
  });

  useEffect(()=>{ processRecurringExpenses && processRecurringExpenses(); }, [processRecurringExpenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((f)=> ({ id: `${f.name}-${f.size}-${Date.now()}`, name: f.name, type: f.type, size: f.size, url: URL.createObjectURL(f) }));
    setForm(prev => ({ ...prev, attachments: [...prev.attachments, ...mapped] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const expense = {
      id: Date.now().toString(),
      description: form.description,
      amount: parseFloat(form.amount || 0),
      category: form.category || 'Other',
      method: form.method,
      status: form.status,
      attachments: form.attachments,
      date: form.date,
    };
    if (editingId) {
      updateExpense({ ...expense, id: editingId });
    } else {
      const created = addExpense(expense);
      if (form.isRecurring) {
        addRecurringExpense({
          description: created.description,
          amount: created.amount,
          category: created.category,
          method: created.method,
          frequency: form.frequency,
          nextDate: form.date,
          attachments: created.attachments
        });
      }
    }
    setForm({ description: '', amount: '', category: '', method: 'Cash', status: 'Pending', attachments: [], isRecurring: false, frequency: 'monthly', date: form.date });
    setEditingId(null);
    setIsFormVisible(false);
  };

  const categories = useMemo(()=>{
    // categories may be objects; allow both id/name and raw name
    const base = ([]).map(c => ({ id: c.id, name: c.name }));
    // also include ad-hoc category names used by existing expenses
    const names = [...new Set(expenses.map(e => e.category).filter(Boolean))];
    names.forEach(n => { if (!base.some(b=> b.name === n || b.id === n)) base.push({ id: n, name: n }); });
    return base;
  }, [expenses]);

  const filteredExpenses = useMemo(()=>{
    const start = filters.start ? new Date(filters.start) : null;
    const end = filters.end ? new Date(filters.end + 'T23:59:59') : null;
    return expenses.filter(e=>{
      const inQ = !filters.q || `${e.description} ${e.category}`.toLowerCase().includes(filters.q.toLowerCase());
      const inCat = filters.category === 'all' || e.category === filters.category || e.category === categories.find(c=>c.id===filters.category)?.name;
      const inMethod = filters.method === 'all' || e.method === filters.method;
      const inStatus = filters.status === 'all' || (e.status || 'Pending') === filters.status;
      const d = new Date(e.date);
      const inStart = !start || d >= start;
      const inEnd = !end || d <= end;
      return inQ && inCat && inMethod && inStatus && inStart && inEnd;
    });
  }, [expenses, filters, categories]);

  const totalFiltered = useMemo(()=> filteredExpenses.reduce((s,e)=> s + (e.amount||0), 0), [filteredExpenses]);
  const byCategory = useMemo(()=>{
    const map = {};
    filteredExpenses.forEach(e=>{ const key = e.category || 'Other'; map[key] = (map[key]||0)+ (e.amount||0); });
    return Object.entries(map).map(([name,value])=> ({ name, value }));
  }, [filteredExpenses]);
  const trend = useMemo(()=>{
    const map = {};
    filteredExpenses.forEach(e=>{ const d = e.date; map[d] = (map[d]||0) + (e.amount||0); });
    return Object.entries(map).sort((a,b)=> new Date(a[0]) - new Date(b[0])).map(([date,value])=> ({ name: date.slice(5), value }));
  }, [filteredExpenses]);

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
  };

  const startEdit = (exp) => {
    setIsFormVisible(true);
    setEditingId(exp.id);
    setForm({
      description: exp.description || '',
      amount: String(exp.amount ?? ''),
      category: exp.category || '',
      method: exp.method || 'Cash',
      status: exp.status || 'Pending',
      attachments: exp.attachments || [],
      isRecurring: false,
      frequency: 'monthly',
      date: exp.date || new Date().toISOString().slice(0,10)
    });
  };

  const handleDelete = (id) => {
    if (!hasPermission(PERMISSIONS.MANAGE_EXPENSES)) return;
    if (confirm('Delete this expense?')) {
      deleteExpense(id);
    }
  };

  const exportCSV = () => {
    const rows = filteredExpenses;
    if (rows.length === 0) return;
    const headers = ['Description','Category','Method','Amount','Date','Status'];
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
      const map = { Description: r.description, Category: r.category, Method: r.method, Amount: r.amount, Date: r.date, Status: r.status };
      return `"${String(map[h] ?? '').replace(/"/g,'""')}"`;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const printList = () => {
    const headers = ['Description','Category','Method','Amount','Date','Status'];
    const rows = filteredExpenses.map(r => ({ Description: r.description, Category: r.category, Method: r.method, Amount: r.amount.toFixed(2), Date: r.date, Status: r.status }));
    const styles = `body{font-family:ui-sans-serif; padding:16px;} h1{font-size:18px;margin-bottom:12px;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:left;} th{background:#f5f5f5;}`;
    const html = `<html><head><title>Expenses</title><style>${styles}</style></head><body><h1>Expenses</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank'); if (!w) return; w.document.open(); w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Expense list */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm overflow-auto`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>Expenses</h3>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
            <input placeholder="Search description..." value={filters.q} onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 md:col-span-2`} />
            <select value={filters.category} onChange={(e)=>setFilters(f=>({...f,category:e.target.value}))} className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2`}>
              <option value="all">All Categories</option>
              {categories.map(c=> (<option key={c.id} value={c.name}>{c.name}</option>))}
            </select>
            <select value={filters.method} onChange={(e)=>setFilters(f=>({...f,method:e.target.value}))} className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2`}>
              <option value="all">All Methods</option>
              {['Cash','Bank Transfer','Mobile Money','Card'].map(m=> (<option key={m} value={m}>{m}</option>))}
            </select>
            <select value={filters.status} onChange={(e)=>setFilters(f=>({...f,status:e.target.value}))} className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2`}>
              <option value="all">All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <input type="date" value={filters.start} onChange={(e)=>setFilters(f=>({...f,start:e.target.value}))} className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2`} />
            <input type="date" value={filters.end} onChange={(e)=>setFilters(f=>({...f,end:e.target.value}))} className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2`} />
          </div>
          <div className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total: ${totalFiltered.toFixed(2)}</div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={exportCSV} className="btn-primary"><Download className="h-4 w-4 mr-2"/>CSV</button>
            <button onClick={printList} className="btn-success"><Printer className="h-4 w-4 mr-2"/>Print</button>
          </div>
          {filteredExpenses.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No expenses recorded.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Method</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Attachments</th>
                  <th className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`py-2 px-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{e.description}</td>
                    <td className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{e.category || '-'}</td>
                    <td className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{e.method || '-'}</td>
                    <td className={`py-2 px-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>${e.amount.toFixed(2)}</td>
                    <td className={`py-2 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{e.date}</td>
                    <td className={`py-2 px-1`}>
                      <span className={`badge ${ (e.status||'Pending')==='Approved' ? 'badge-success' : (e.status||'Pending')==='Rejected' ? 'badge-danger' : 'badge-warning'}`}>{e.status || 'Pending'}</span>
                    </td>
                    <td className={`py-2 px-1`}>
                      <div className="flex flex-wrap gap-1">
                        {(e.attachments || []).map(att => (
                          <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className={`${isDarkMode ? 'text-blue-300' : 'text-primary-600'} underline text-xs`}>{att.name}</a>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-1 space-x-2 whitespace-nowrap">
                      {hasPermission(PERMISSIONS.MANAGE_EXPENSES) && (
                        <>
                          <button onClick={()=>startEdit(e)} className="btn-secondary text-xs">Edit</button>
                          <button onClick={()=>handleDelete(e.id)} className="btn-danger text-xs">Delete</button>
                          <button onClick={()=>setExpenseStatus(e.id,'Approved')} className="btn-success text-xs">Approve</button>
                          <button onClick={()=>setExpenseStatus(e.id,'Rejected')} className="btn-danger text-xs">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <ChartCard title="Expenses by Category" data={byCategory} type="bar" isDarkMode={isDarkMode} />
          <ChartCard title="Expenses Trend" data={trend} type="line" isDarkMode={isDarkMode} />
        </div>
      </div>
      {/* Add expense form */}
      <div className="order-1 lg:order-2">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <PermissionGuard permission={PERMISSIONS.MANAGE_EXPENSES} showFallback={true} fallback={
            <button disabled className={`w-full flex items-center justify-center py-3 px-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} text-gray-100 rounded-lg mb-4`}>Add Expense (view-only)</button>
          }>
            <button
              onClick={toggleForm}
              className={`w-full flex items-center justify-center py-3 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors mb-4`}
            >
              <Plus className="h-5 w-5 mr-2" /> Add Expense
            </button>
          </PermissionGuard>
          
          {isFormVisible && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                isDarkMode={isDarkMode}
              />
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                <div className="flex gap-2">
                  <select name="category" value={form.category} onChange={handleChange} className={`flex-1 px-3 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}>
                    <option value="">Select category</option>
                    {categories.map(c=> (<option key={c.id} value={c.name}>{c.name}</option>))}
                  </select>
                  <input placeholder="New category" value={categoryInput} onChange={(e)=>setCategoryInput(e.target.value)} className={`px-3 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`} />
                  <button type="button" onClick={()=>{ if(categoryInput){ const cat = addExpenseCategory(categoryInput); if(cat){ setForm(f=>({...f, category: cat.name})); } setCategoryInput(''); } }} className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800'}`}>Add</button>
                </div>
              </div>
              <InputField
                label="Amount"
                name="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
                isDarkMode={isDarkMode}
              />
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Method</label>
                <select name="method" value={form.method} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}>
                  {['Cash','Bank Transfer','Mobile Money','Card'].map(m=> (<option key={m}>{m}</option>))}
                </select>
              </div>
              <InputField
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                isDarkMode={isDarkMode}
              />
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Attachments (PDF, images)</label>
                <input type="file" multiple accept="application/pdf,image/*" onChange={handleAttachment} className={`w-full ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                {form.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {form.attachments.map(a=> (<span key={a.id} className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded`}>{a.name}</span>))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input id="recurring" type="checkbox" checked={form.isRecurring} onChange={(e)=>setForm(f=>({...f,isRecurring:e.target.checked}))} />
                <label htmlFor="recurring" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recurring</label>
                {form.isRecurring && (
                  <select name="frequency" value={form.frequency} onChange={handleChange} className={`ml-2 px-3 py-1 border rounded-lg ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                )}
              </div>
              <div className="flex space-x-2">
                <PermissionGuard permission={PERMISSIONS.MANAGE_EXPENSES}>
                  <button
                    type="submit"
                    className={`flex-1 py-2 px-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg transition-colors`}
                  >
                    Add Expense
                  </button>
                </PermissionGuard>
                <button
                  type="button"
                  onClick={toggleForm}
                  className={`py-2 px-4 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} rounded-lg transition-colors`}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
