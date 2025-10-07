import React, { useContext, useMemo, useState } from 'react';
import { RealDataContext } from '../context/RealDataContext';
import { ThemeContext } from '../context/ThemeContext';
import ChartCard from '../components/ChartCard';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Printer
} from 'lucide-react';

/**
 * Advanced Reports page provides comprehensive business analytics including
 * profit/loss statements, inventory valuation, supplier performance,
 * sales trends, and financial insights.
 */
export default function Reports() {
  const context = useContext(RealDataContext);
  
  // Add null safety check
  if (!context) {
    console.error('RealDataContext is undefined in Reports page');
    return <div className="p-4 text-red-500">Loading reports data...</div>;
  }
  
  const { 
    products = [], 
    customers = [], 
    sales = [], 
    expenses = [], 
    suppliers = [], 
    purchaseOrders = [], 
    businessSettings = {} 
  } = context;
  
  // Placeholder data for properties not yet implemented in RealDataContext
  const purchases = []; // Placeholder - not yet implemented
  const debts = []; // Placeholder - not yet implemented  
  const payments = []; // Placeholder - not yet implemented
  const { isDarkMode } = useContext(ThemeContext);
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // days
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  // New filters for sales transactions
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Date range calculations
  const getDateRange = (days) => {
    if (days === 'custom' && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      end.setHours(23,59,59,999);
      return { start, end };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));
    return { start, end };
  };

  const { start, end } = getDateRange(selectedPeriod);

  // Filter data by date range
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const inRange = saleDate >= start && saleDate <= end;
      const categoryOk = categoryFilter === 'all' || sale.items.some(it => (it.product.category || 'Uncategorized') === categoryFilter);
      const customerOk = customerFilter === 'all' || sale.customerId === customerFilter;
      const paymentOk = paymentFilter === 'all' || (String(sale.paymentMethod||'').toLowerCase() === String(paymentFilter).toLowerCase());
      // derive status if missing
      const paid = Number(sale.amountPaid ?? 0);
      const totalAmt = Number(sale.total ?? 0);
      let status = sale.paymentStatus || (paid <= 0 ? 'Credit' : (paid >= totalAmt ? 'Paid' : 'Partial / Credit'));
      const statusOk = statusFilter === 'all' || status.toLowerCase().startsWith(String(statusFilter).toLowerCase());
      return inRange && categoryOk && customerOk && paymentOk && statusOk;
    });
  }, [sales, start, end, categoryFilter, customerFilter]);

  // Build enriched sales transactions for table
  const salesTransactions = useMemo(()=> {
    return filteredSales.map(s => {
      const paid = Number(s.amountPaid ?? 0);
      const totalAmt = Number(s.total ?? 0);
      const status = s.paymentStatus || (paid <= 0 ? 'Credit' : (paid >= totalAmt ? 'Paid' : 'Partial / Credit'));
      const balance = Math.max(0, totalAmt - paid);
      const customerName = s.customerId ? (customers.find(c=> c.id === s.customerId)?.name || 'Customer') : 'Walk-in';
      return { ...s, paid, totalAmt, status, balance, customerName };
    }).sort((a,b)=> new Date(b.date) - new Date(a.date));
  }, [filteredSales, customers]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  }, [expenses, start, end]);

  // Profit & Loss Analysis
  const profitLossData = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate cost of goods sold (COGS)
    const cogs = filteredSales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + ((item.product.buyPrice || item.product.purchasePrice || 0) * item.quantity);
      }, 0);
    }, 0);

    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMargin,
      netMargin,
    };
  }, [filteredSales, filteredExpenses]);

  // Inventory Valuation
  const inventoryData = useMemo(() => {
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + ((product.buyPrice || product.purchasePrice || 0) * product.quantity);
    }, 0);

    const totalSellingValue = products.reduce((sum, product) => {
      return sum + ((product.sellPrice || product.sellingPrice || 0) * product.quantity);
    }, 0);

    const lowStockProducts = products.filter(p => p.quantity <= 5);
    const outOfStockProducts = products.filter(p => p.quantity === 0);

    const categoryBreakdown = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { value: 0, count: 0, inventoryValue: 0 };
      }
      acc[category].value += product.quantity;
      acc[category].count += 1;
      acc[category].inventoryValue += (product.buyPrice || product.purchasePrice || 0) * product.quantity;
      return acc;
    }, {});

    return {
      totalInventoryValue,
      totalSellingValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalProducts: products.length,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, categoryData]) => ({
        name,
        value: categoryData.value,
        count: categoryData.count,
        inventoryValue: categoryData.inventoryValue,
      })),
    };
  }, [products]);

  // Supplier Performance
  const supplierData = useMemo(() => {
    const supplierStats = {};
    
    // Analyze purchase orders and purchases data
    [...purchaseOrders, ...purchases].forEach(order => {
      if (!supplierStats[order.supplierId]) {
        supplierStats[order.supplierId] = {
          name: order.supplierName,
          totalOrders: 0,
          totalValue: 0,
          avgDeliveryTime: 0,
          onTimeDeliveries: 0,
          orders: [],
        };
      }
      
      supplierStats[order.supplierId].totalOrders += 1;
      supplierStats[order.supplierId].totalValue += order.totalAmount;
      supplierStats[order.supplierId].orders.push(order);
    });

    // Calculate delivery performance
    Object.values(supplierStats).forEach(supplier => {
      const receivedOrders = supplier.orders.filter(o => o.status === 'received');
      if (receivedOrders.length > 0) {
        const avgDeliveryDays = receivedOrders.reduce((sum, order) => {
          if (order.receivedDate && order.expectedDate) {
            const received = new Date(order.receivedDate);
            const expected = new Date(order.expectedDate);
            const diffDays = Math.ceil((received - expected) / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }
          return sum;
        }, 0) / receivedOrders.length;
        
        supplier.avgDeliveryTime = avgDeliveryDays;
        supplier.onTimeDeliveries = receivedOrders.filter(o => {
          if (o.receivedDate && o.expectedDate) {
            const received = new Date(o.receivedDate);
            const expected = new Date(o.expectedDate);
            return received <= expected;
          }
          return false;
        }).length;
      }
    });

    let arr = Object.values(supplierStats).sort((a, b) => b.totalValue - a.totalValue);
    if (supplierFilter !== 'all') {
      arr = arr.filter(s => (suppliers.find(x => x.id === supplierFilter)?.name || '') === s.name);
    }
    return arr;
  }, [purchaseOrders, purchases, supplierFilter, suppliers]);

  // Sales Trends
  const salesTrends = useMemo(() => {
    const days = [];
    const now = new Date();
    const periodDays = parseInt(selectedPeriod);
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const salesOfDay = filteredSales.filter(sale => sale.date === dateStr);
      const expensesOfDay = filteredExpenses.filter(exp => exp.date === dateStr);
      
      const salesTotal = salesOfDay.reduce((sum, s) => sum + s.total, 0);
      const expensesTotal = expensesOfDay.reduce((sum, e) => sum + e.amount, 0);
      const transactions = salesOfDay.length;
      
      days.push({
        name: dayLabel,
        date: dateStr,
        Sales: salesTotal,
        Expenses: expensesTotal,
        Transactions: transactions,
        Profit: salesTotal - expensesTotal,
      });
    }
    
    return days;
  }, [filteredSales, filteredExpenses, selectedPeriod]);

  // Top Products Analysis
  const topProducts = useMemo(() => {
    const productStats = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productStats[item.product.id]) {
          productStats[item.product.id] = {
            name: item.product.name,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productStats[item.product.id].quantitySold += item.quantity;
        productStats[item.product.id].revenue += (item.product.sellPrice || item.product.sellingPrice || 0) * item.quantity;
        productStats[item.product.id].profit += ((item.product.sellPrice || item.product.sellingPrice || 0) - (item.product.buyPrice || item.product.purchasePrice || 0)) * item.quantity;
      });
    });
    
    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  // Sales by Category & Discounts
  const salesByCategory = useMemo(() => {
    const map = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const cat = item.product.category || 'Uncategorized';
        if (!map[cat]) map[cat] = { name: cat, quantity: 0, revenue: 0 };
        map[cat].quantity += item.quantity;
        map[cat].revenue += (item.product.sellPrice || item.product.sellingPrice || 0) * item.quantity;
      });
    });
    return Object.values(map).sort((a,b)=> b.revenue - a.revenue);
  }, [filteredSales]);

  const discountsUsed = useMemo(() => {
    let totalDiscount = 0;
    filteredSales.forEach(s => {
      if (typeof s.discount === 'number') totalDiscount += s.discount;
      s.items.forEach(it => { if (typeof it.discount === 'number') totalDiscount += it.discount; });
    });
    return totalDiscount;
  }, [filteredSales]);

  // Cash Flow & Tax
  const cashFlow = useMemo(() => {
    const inflow = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const purchaseOut = (purchases || []).filter(p=>{
      const d = new Date(p.date); return d >= start && d <= end;
    }).reduce((sum,p)=> sum + p.totalAmount, 0);
    const outflow = expensesTotal + purchaseOut;
    return { inflow, outflow, net: inflow - outflow };
  }, [filteredSales, filteredExpenses, purchases, start, end]);

  const taxReport = useMemo(() => {
    const rate = (businessSettings?.taxRate || 0) / 100;
    const taxable = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const taxCollected = taxable * rate;
    return { rate: rate * 100, taxable, taxCollected };
  }, [filteredSales, businessSettings]);

  // Customers outstanding balances helper
  const customerBalances = useMemo(() => {
    const balances = {};
    customers.forEach((c) => { balances[c.id] = { name: c.name, owed: 0, purchases: 0 } });

    sales.forEach((sale) => {
      if (sale.customerId && balances[sale.customerId]) {
        balances[sale.customerId].owed += sale.total;
        balances[sale.customerId].purchases += 1;
      }
    });
    (debts || []).forEach((debt) => {
      if (debt.customerId && balances[debt.customerId]) {
        balances[debt.customerId].owed += debt.amount;
      }
    });
    (payments || []).forEach((payment) => {
      if (payment.customerId && balances[payment.customerId]) {
        balances[payment.customerId].owed -= payment.amount;
      }
    });
    return Object.values(balances).sort((a,b)=> b.owed - a.owed);
  }, [customers, sales, payments, debts]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  // Build data for export/print based on selected report
  const getCurrentReportRows = () => {
    switch (selectedReport) {
      case 'financial':
        return salesTrends.map(d => ({ Date: d.date, Revenue: d.Sales, Expenses: d.Expenses, Profit: d.Profit }));
      case 'sales':
        return topProducts.map(p => ({ Product: p.name, Quantity: p.quantitySold, Revenue: p.revenue.toFixed(2), Profit: p.profit.toFixed(2) }));
      case 'inventory':
        return inventoryData.categoryBreakdown.map(c => ({ Category: c.name, Items: c.count, Quantity: c.value, InventoryValue: c.inventoryValue.toFixed(2) }));
      case 'customers':
        return customerBalances.map(c => ({ Customer: c.name, Purchases: c.purchases, Outstanding: c.owed.toFixed(2) }));
      case 'suppliers':
        return supplierData.map(s => ({ Supplier: s.name, Orders: s.totalOrders, TotalValue: s.totalValue.toFixed(2), AvgDeliveryDays: Number.isFinite(s.avgDeliveryTime) ? s.avgDeliveryTime.toFixed(1) : '-' }));
      case 'staff':
        {
          const byUser = {};
          filteredSales.forEach(s => {
            const key = s.userId || s.userName || 'Unknown';
            if (!byUser[key]) byUser[key] = { name: key, sales: 0, transactions: 0 };
            byUser[key].sales += s.total; byUser[key].transactions += 1;
          });
          return Object.values(byUser).map(u => ({ User: u.name, Transactions: u.transactions, Sales: u.sales.toFixed(2) }));
        }
      case 'purchases':
        return (purchases || []).filter(p=> new Date(p.date) >= start && new Date(p.date) <= end)
          .map(p => ({ OrderId: p.id, Supplier: p.supplierName, Date: p.date, Items: p.items.length, Total: p.totalAmount.toFixed(2), Status: p.status }));
      default:
        return salesTrends.map(d => ({ Date: d.date, Sales: d.Sales, Expenses: d.Expenses, Profit: d.Profit }));
    }
  };

  const exportJSON = () => {
    const reportData = {
      period: selectedPeriod === 'custom' ? 'custom' : `${selectedPeriod} days`,
      dateRange: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      report: selectedReport,
      rows: getCurrentReportRows(),
    };
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exports for sales transactions
  const exportSalesCSV = () => {
    const headers = ['Date','Sale ID','Customer','Payment Method','Subtotal','Discount','Total','Amount Paid','Balance','Status'];
    const rows = salesTransactions.map(s=> [s.date, s.id, s.customerName, s.paymentMethod || '', (s.subtotal||0).toFixed(2), (s.discount||0).toFixed(2), (s.totalAmt||0).toFixed(2), (s.paid||0).toFixed(2), (s.balance||0).toFixed(2), s.status]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sales-transactions.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportSalesXLS = () => {
    const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const headers = ['Date','Sale ID','Customer','Payment Method','Subtotal','Discount','Total','Amount Paid','Balance','Status'];
    const xmlRows = salesTransactions.map(s => [s.date, s.id, s.customerName, s.paymentMethod||'', (s.subtotal||0).toFixed(2), (s.discount||0).toFixed(2), (s.totalAmt||0).toFixed(2), (s.paid||0).toFixed(2), (s.balance||0).toFixed(2), s.status]);
    const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sales"><Table><Row>${headers.map(h=>`<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>${xmlRows.map(r=>`<Row>${r.map(c=>`<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
    const blob = new Blob([xml], { type:'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sales-transactions.xls'; a.click(); URL.revokeObjectURL(url);
  };

  const printSales = () => {
    const headers = ['Date','Sale ID','Customer','Payment Method','Subtotal','Discount','Total','Amount Paid','Balance','Status'];
    const styles = `body{font-family:ui-sans-serif,system-ui;padding:16px} h1{font-size:18px;margin-bottom:8px} table{width:100%;border-collapse:collapse;margin-top:8px} th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:12px} th{background:#f5f5f5}`;
    const body = salesTransactions.map(s=> `<tr><td>${s.date}</td><td>${s.id}</td><td>${s.customerName}</td><td>${s.paymentMethod||''}</td><td>$${(s.subtotal||0).toFixed(2)}</td><td>$${(s.discount||0).toFixed(2)}</td><td>$${(s.totalAmt||0).toFixed(2)}</td><td>$${(s.paid||0).toFixed(2)}</td><td>$${(s.balance||0).toFixed(2)}</td><td>${s.status}</td></tr>`).join('');
    const html = `<html><head><title>Sales Transactions</title><style>${styles}</style></head><body><h1>Sales Transactions</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></body></html>`;
    const w = window.open('', '_blank'); if(!w) return; w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const exportCSV = () => {
    const rows = getCurrentReportRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const rows = getCurrentReportRows();
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const title = `Report - ${selectedReport}`;
    const styles = `body{font-family:ui-sans-serif,system-ui; padding:16px;} h1{font-size:18px;margin-bottom:12px;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:left;} th{background:#f5f5f5;}`;
    const html = `<html><head><title>${title}</title><style>${styles}</style></head><body><h1>${title} (${start.toLocaleDateString()} - ${end.toLocaleDateString()})</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${profitLossData.totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net Profit</p>
              <p className={`text-2xl font-bold ${profitLossData.netProfit >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                ${profitLossData.netProfit.toFixed(2)}
              </p>
            </div>
            {profitLossData.netProfit >= 0 ? (
              <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            ) : (
              <TrendingDown className={`h-8 w-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            )}
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inventory Value</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${inventoryData.totalInventoryValue.toFixed(2)}
              </p>
            </div>
            <Package className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {inventoryData.totalProducts}
              </p>
            </div>
            <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Sales vs Expenses Trend"
          data={salesTrends.map(d=>({ name: d.name, value: d.Sales, date: d.date }))}
          type="line"
          isDarkMode={isDarkMode}
          onPointClick={(e)=>{
            if (!e || !e.activeLabel) return;
            const day = salesTrends.find(d => d.name === e.activeLabel);
            if (!day) return;
            alert(`Details for ${day.date}\nSales: $${day.Sales.toFixed(2)}\nExpenses: $${day.Expenses.toFixed(2)}\nTransactions: ${day.Transactions}`);
          }}
        />
        
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}>
            Top Selling Products
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.slice(0, 5)} onClick={(e)=>{
                if (e && e.activeLabel) {
                  const p = topProducts.find(tp => tp.name === e.activeLabel);
                  if (p) alert(`Product: ${p.name}\nRevenue: $${p.revenue.toFixed(2)}\nQuantity Sold: ${p.quantitySold}`);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    color: isDarkMode ? '#f3f4f6' : '#111827'
                  }}
                />
                <Bar dataKey="revenue" fill={isDarkMode ? '#3b82f6' : '#0a72ff'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Sales Transactions Table */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Sales Transactions</h3>
          <div className="flex items-center gap-2">
            <button onClick={exportSalesCSV} className="btn-primary">CSV</button>
            <button onClick={exportSalesXLS} className="btn-secondary">XLS</button>
            <button onClick={printSales} className="btn-success">Print/PDF</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <select value={customerFilter} onChange={(e)=>setCustomerFilter(e.target.value)} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
            <option value="all">All Customers</option>
            {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
            <option value="all">All Methods</option>
            {['Cash','Mobile Money','Card'].map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Credit">Credit</option>
          </select>
          {/* Date range already controlled by report header; showing summary here */}
        </div>
        {/* Desktop/Table view */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Sale ID</th>
                <th className="text-left py-2 px-2">Customer</th>
                <th className="text-left py-2 px-2">Method</th>
                <th className="text-right py-2 px-2 hidden lg:table-cell">Subtotal</th>
                <th className="text-right py-2 px-2 hidden lg:table-cell">Discount</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-right py-2 px-2 hidden md:table-cell">Paid</th>
                <th className="text-right py-2 px-2">Balance</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {salesTransactions.map((s)=> (
                <tr key={s.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{new Date(s.date).toLocaleDateString()}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{s.id.slice(-6)}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.customerName}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.paymentMethod || '-'}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} hidden lg:table-cell`}>${(s.subtotal||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} hidden lg:table-cell`}>${(s.discount||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.totalAmt||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} hidden md:table-cell`}>${(s.paid||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.balance||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? (s.status==='Paid' ? 'text-green-300' : s.status.includes('Partial') ? 'text-yellow-300' : 'text-red-300') : (s.status==='Paid' ? 'text-green-600' : s.status.includes('Partial') ? 'text-yellow-600' : 'text-red-600')}`}>{s.status}</td>
                </tr>
              ))}
              {salesTransactions.length === 0 && (
                <tr><td colSpan="10" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} py-4 text-center`}>No transactions in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile/Card view */}
        <div className="block sm:hidden space-y-3">
          {salesTransactions.length === 0 && (
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} py-4 text-center`}>No transactions in this period</div>
          )}
          {salesTransactions.map((s)=> (
            <div key={s.id} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3`}>
              <div className="flex items-center justify-between">
                <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>#{s.id.slice(-6)}</div>
                <div className={`${isDarkMode ? (s.status==='Paid' ? 'text-green-300' : s.status.includes('Partial') ? 'text-yellow-300' : 'text-red-300') : (s.status==='Paid' ? 'text-green-600' : s.status.includes('Partial') ? 'text-yellow-600' : 'text-red-600')} text-sm`}>{s.status}</div>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.customerName} • {s.paymentMethod || '-'}</div>
              <div className="flex items-center justify-between mt-1">
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{new Date(s.date).toLocaleDateString()}</div>
                <div className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-semibold`}>${(s.totalAmt||0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfitLoss = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}
      >
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>
          Profit & Loss Statement
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Revenue</span>
            <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              ${profitLossData.totalRevenue.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cost of Goods Sold</span>
            <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              ${profitLossData.cogs.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gross Profit</span>
            <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              ${profitLossData.grossProfit.toFixed(2)} ({profitLossData.grossMargin.toFixed(1)}%)
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Operating Expenses</span>
            <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              ${profitLossData.totalExpenses.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
            <span className={`font-bold text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Net Profit</span>
            <span className={`font-bold text-lg ${profitLossData.netProfit >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
              ${profitLossData.netProfit.toFixed(2)} ({profitLossData.netMargin.toFixed(1)}%)
            </span>
          </div>
        </div>
      </motion.div>

      <ChartCard title="Profit Trend" data={salesTrends.map(d => ({ name: d.name, Profit: d.Profit }))} type="line" isDarkMode={isDarkMode} />
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}
        >
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>
            Inventory Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Inventory Value</span>
              <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${inventoryData.totalInventoryValue.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Potential Selling Value</span>
              <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${inventoryData.totalSellingValue.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Low Stock Items</span>
              <span className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {inventoryData.lowStockCount}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Out of Stock Items</span>
              <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {inventoryData.outOfStockCount}
              </span>
            </div>
          </div>
        </motion.div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>
            Inventory by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="inventoryValue"
                >
                  {inventoryData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    color: isDarkMode ? '#f3f4f6' : '#111827'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPurchases = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}
      >
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>
          Purchase History
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order ID</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Items</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases
                .filter(purchase => {
                  const purchaseDate = new Date(purchase.date);
                  return purchaseDate >= start && purchaseDate <= end;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((purchase, index) => (
                <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    #{purchase.id.slice(-6)}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {purchase.supplierName}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {new Date(purchase.date).toLocaleDateString()}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {purchase.items.length} items
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    ${purchase.totalAmount.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4`}>
                    <span className={`badge ${purchase.status === 'received' ? 'badge-success' : 'badge-warning'}`}>{purchase.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Purchase Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Purchases</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${purchases
                  .filter(purchase => {
                    const purchaseDate = new Date(purchase.date);
                    return purchaseDate >= start && purchaseDate <= end;
                  })
                  .reduce((sum, purchase) => sum + purchase.totalAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Orders Count</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {purchases
                  .filter(purchase => {
                    const purchaseDate = new Date(purchase.date);
                    return purchaseDate >= start && purchaseDate <= end;
                  }).length}
              </p>
            </div>
            <Package className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Order Value</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                ${purchases
                  .filter(purchase => {
                    const purchaseDate = new Date(purchase.date);
                    return purchaseDate >= start && purchaseDate <= end;
                  })
                  .reduce((sum, purchase, _, arr) => sum + purchase.totalAmount / arr.length, 0)
                  .toFixed(2)}
              </p>
            </div>
            <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
      </div>
    </div>
  );

  // New comprehensive report sections
  const renderFinancial = () => (
    <div className="space-y-6">
      {renderProfitLoss()}
      <ChartCard 
        title="Revenue Trend"
        data={salesTrends.map(d => ({ name: d.name, value: d.Sales, date: d.date }))}
        type="line"
        isDarkMode={isDarkMode}
        onPointClick={(e)=>{
          if (e && e.activeLabel) {
            const day = salesTrends.find(d => d.name === e.activeLabel);
            if (day) alert(`Revenue detail for ${day.date}: $${day.Sales.toFixed(2)}`);
          }
        }}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Cash Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inflow</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>${cashFlow.inflow.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outflow</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>${cashFlow.outflow.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net Cash</p>
            <p className={`text-2xl font-bold ${cashFlow.net >= 0 ? (isDarkMode ? 'text-green-300' : 'text-green-600') : (isDarkMode ? 'text-red-300' : 'text-red-600')}`}>${cashFlow.net.toFixed(2)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Tax Report</h3>
        <div className="flex justify-between">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tax Rate</div>
          <div className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{taxReport.rate.toFixed(2)}%</div>
        </div>
        <div className="flex justify-between">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Taxable Sales</div>
          <div className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${taxReport.taxable.toFixed(2)}</div>
        </div>
        <div className="flex justify-between border-t mt-2 pt-2">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tax Collected</div>
          <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${taxReport.taxCollected.toFixed(2)}</div>
        </div>
      </motion.div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      {/* Sales Transactions Table moved to top for visibility */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Sales Transactions <span className={`ml-2 px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{salesTransactions.length}</span></h3>
          <div className="flex items-center gap-2">
            <button onClick={exportSalesCSV} className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-lg px-3 py-2`}>CSV</button>
            <button onClick={exportSalesXLS} className={`${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'} text-white rounded-lg px-3 py-2`}>XLS</button>
            <button onClick={printSales} className={`${isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg px-3 py-2`}>Print/PDF</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <select value={customerFilter} onChange={(e)=>setCustomerFilter(e.target.value)} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
            <option value="all">All Customers</option>
            {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
            <option value="all">All Methods</option>
            {['Cash','Mobile Money','Card'].map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'border-gray-300'} rounded-lg`}>
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Sale ID</th>
                <th className="text-left py-2 px-2">Customer</th>
                <th className="text-left py-2 px-2">Method</th>
                <th className="text-right py-2 px-2">Subtotal</th>
                <th className="text-right py-2 px-2">Discount</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-right py-2 px-2">Paid</th>
                <th className="text-right py-2 px-2">Balance</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {salesTransactions.map((s)=> (
                <tr key={s.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{new Date(s.date).toLocaleDateString()}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{s.id.slice(-6)}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.customerName}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.paymentMethod || '-'}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.subtotal||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.discount||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.totalAmt||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.paid||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${(s.balance||0).toFixed(2)}</td>
                  <td className={`py-2 px-2 ${isDarkMode ? (s.status==='Paid' ? 'text-green-300' : s.status.includes('Partial') ? 'text-yellow-300' : 'text-red-300') : (s.status==='Paid' ? 'text-green-600' : s.status.includes('Partial') ? 'text-yellow-600' : 'text-red-600')}`}>{s.status}</td>
                </tr>
              ))}
              {salesTransactions.length === 0 && (
                <tr><td colSpan="10" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} py-4 text-center`}>No transactions in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ChartCard title="Sales Trend" data={salesTrends.map(d => ({ name: d.name, Sales: d.Sales }))} type="line" isDarkMode={isDarkMode} />
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Top Products (By Revenue)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb', color: isDarkMode ? '#f3f4f6' : '#111827' }} />
              <Bar dataKey="revenue" fill={isDarkMode ? '#3b82f6' : '#0a72ff'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Sales by Category</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb', color: isDarkMode ? '#f3f4f6' : '#111827' }} />
              <Bar dataKey="revenue" fill={isDarkMode ? '#10b981' : '#16a34a'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Discounts Used</h3>
        <div className="flex justify-between">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Discounts</div>
          <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${discountsUsed.toFixed(2)}</div>
        </div>
      </motion.div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Outstanding Balances</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Purchases</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {customerBalances.map((c, i) => (
                <tr key={i} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{c.name}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{c.purchases}</td>
                  <td className={`py-3 px-4 ${c.owed > 0 ? (isDarkMode ? 'text-red-300' : 'text-red-600') : (isDarkMode ? 'text-green-300' : 'text-green-600')}`}>${c.owed.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Supplier Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Orders</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Value</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Delivery (days)</th>
                <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>On‑time Deliveries</th>
              </tr>
            </thead>
            <tbody>
              {supplierData.map((s, i) => (
                <tr key={i} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{s.name}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.totalOrders}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${s.totalValue.toFixed(2)}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{Number.isFinite(s.avgDeliveryTime) ? s.avgDeliveryTime.toFixed(1) : '-'}</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.onTimeDeliveries || 0} / {s.totalOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );

  const renderStaff = () => {
    const byUser = {};
    filteredSales.forEach(s => {
      const key = s.userId || s.userName || 'Unknown';
      if (!byUser[key]) byUser[key] = { name: key, sales: 0, transactions: 0 };
      byUser[key].sales += s.total;
      byUser[key].transactions += 1;
    });
    const rows = Object.values(byUser).sort((a,b)=> b.sales - a.sales);
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-6`}>Sales by User</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User</th>
                  <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Transactions</th>
                  <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sales</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u,i)=> (
                  <tr key={i} className={`border-b ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{u.name}</td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{u.transactions}</td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${u.sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Controls */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
        <div className="flex items-center mb-6">
          {businessSettings?.logo && (
            <img 
              src={businessSettings.logo} 
              alt="Business Logo" 
              className="w-12 h-12 rounded mr-4 object-cover"
            />
          )}
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {(businessSettings?.name || 'Business').trim().replace(/\n/g, '')} Reports
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Comprehensive Business Analytics • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
            <option value="custom">Custom</option>
              </select>
          {selectedPeriod === 'custom' && (
            <div className="flex items-center space-x-2">
              <input type="date" value={customRange.start} onChange={(e)=>setCustomRange(r=>({...r,start:e.target.value}))} className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`} />
              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>to</span>
              <input type="date" value={customRange.end} onChange={(e)=>setCustomRange(r=>({...r,end:e.target.value}))} className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`} />
            </div>
          )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
        {/* Filters */}
        <div className="hidden lg:flex items-center space-x-2">
          <Filter className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}>
            <option value="all">All Categories</option>
            {[...new Set(products.map(p => p.category || 'Uncategorized'))].map((c,i)=> (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
          <select value={supplierFilter} onChange={(e)=>setSupplierFilter(e.target.value)} className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}>
            <option value="all">All Suppliers</option>
            {suppliers.map(s=> (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={customerFilter} onChange={(e)=>setCustomerFilter(e.target.value)} className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}>
            <option value="all">All Customers</option>
            {customers.map(c=> (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className={`px-3 py-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
            >
              <option value="overview">Overview</option>
              <option value="financial">Financial</option>
              <option value="sales">Sales</option>
              <option value="inventory">Inventory</option>
              <option value="customers">Customers</option>
              <option value="suppliers">Suppliers</option>
              <option value="staff">Staff / Users</option>
              <option value="purchases">Purchases</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="btn-primary" title="Export CSV">
                <Download className="h-4 w-4 mr-2" /> CSV
              </button>
              <button onClick={exportJSON} className="btn-secondary" title="Export JSON">JSON</button>
              <button onClick={printReport} className="btn-success" title="Print / Save as PDF">
                <Printer className="h-4 w-4 mr-2" /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && renderOverview()}
      {selectedReport === 'financial' && renderFinancial()}
      {selectedReport === 'sales' && renderSales()}
      {selectedReport === 'inventory' && renderInventory()}
      {selectedReport === 'customers' && renderCustomers()}
      {selectedReport === 'suppliers' && renderSuppliers()}
      {selectedReport === 'staff' && renderStaff()}
      {selectedReport === 'purchases' && renderPurchases()}
    </motion.div>
  );
}
