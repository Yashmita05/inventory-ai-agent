// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Package, TrendingUp, ShoppingCart, Activity, PlusSquare } from 'lucide-react';
import AIBox from './AIBox.jsx';

// API base URL
const API = import.meta.env.VITE_API_URL || 'https://inventory-ai-agent-w2vb.onrender.com';

// Header component – full width top bar
const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-7 py-3.5 bg-white border-b border-[#E8EAF3] shadow-xs">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl bg-[#5B5CE6] flex items-center justify-center text-white shadow-xs">
          <LayoutDashboard size={20} />
        </div>
        <div className="flex flex-col text-left">
          <h1 className="text-base font-bold text-gray-900 leading-tight">SmartStock AI</h1>
          <p className="text-xs text-gray-500">Intelligent Inventory &amp; Forecasting</p>
        </div>
      </div>
      <button
        onClick={() => navigate('/ai-agent')}
        className="px-5 py-2 rounded-full bg-[#5B5CE6] text-white text-sm font-medium hover:bg-[#4d4ecb] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        Ask AI
      </button>
    </header>
  );
};

// Left sidebar – workspace identity + navigation menu
const Sidebar = () => {
  const menu = [
    { to: '/', label: 'Dashboard', subtitle: 'Your overview', icon: <LayoutDashboard size={18} /> },
    { to: '/inventory', label: 'Inventory', subtitle: 'Live stock levels', icon: <Package size={18} /> },
    { to: '/forecast', label: 'Forecast', subtitle: '7‑day demand plan', icon: <TrendingUp size={18} /> },
    { to: '/orders', label: 'Orders', subtitle: 'Purchase orders', icon: <ShoppingCart size={18} /> },
    { to: '/record-sale', label: 'Record Sale', subtitle: 'Log a transaction', icon: <PlusSquare size={18} /> },
  ];

  return (
    <aside className="flex flex-col space-y-4">
      {/* Workspace identity card */}
      <div className="bg-white rounded-3xl p-4 border border-[#E8EAF3] shadow-sm">
        <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">WORKSPACE</h2>
        <p className="mt-1 text-base font-bold text-gray-800">SmartStock AI</p>
      </div>
      {/* Navigation menu */}
      <nav className="flex flex-col space-y-2">
        {menu.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-white border border-[#E8EAF3] shadow-sm text-gray-900'
                  : 'bg-white/50 text-gray-600 hover:bg-white hover:text-gray-900'
              }`
            }
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B5CE6] flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">{item.label}</span>
              <span className="text-xs text-gray-400">{item.subtitle}</span>
            </div>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

// Right workspace panel – always docked, never overlaps centre
const RightPanel = ({ products = [] }) => {
  const navigate = useNavigate();
  const totalProducts = products.length;
  const lowStock = products.filter(p => p.currentStock <= p.safetyStock).length;
  const categories = ['Clothing', 'Groceries', 'Furniture', 'Electronics'];

  return (
    <section className="flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 border border-[#E8EAF3] shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LayoutDashboard size={18} className="text-[#5B5CE6]" />
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">YOUR WORKSPACE</h2>
        </div>
        <span className="text-xs font-medium text-gray-600">SmartStock AI</span>
      </div>
      {/* Summary numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl p-4 text-center border border-[#E8EAF3] shadow-sm">
          <p className="text-xs font-medium text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 text-center border border-[#E8EAF3] shadow-sm">
          <p className="text-xs font-medium text-gray-400">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">{lowStock}</p>
        </div>
      </div>
      {/* Category pills */}
      <div className="grid grid-cols-2 gap-2">
        {categories.map(cat => {
          const count = products.filter(p => p.category === cat).length;
          return (
            <span key={cat} className="inline-block bg-indigo-50 text-[#5B5CE6] text-xs font-medium py-1.5 px-3 rounded-full text-center border border-indigo-100/60">
              {cat} {count > 0 && `(${count})`}
            </span>
          );
        })}
      </div>
      {/* Bottom info box */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8EAF3] shadow-sm text-xs text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800">Predict • Review • Act</p>
        <p className="text-gray-500 leading-relaxed">
          Use the AI Agent to analyze low‑stock items, generate forecasts, and create supplier purchase orders.
        </p>
        <button
          onClick={() => navigate('/ai-agent')}
          className="w-full mt-2 py-2 rounded-full bg-[#F4F5FB] hover:bg-indigo-50 text-[#5B5CE6] font-semibold border border-[#E8EAF3] transition-colors cursor-pointer text-center"
        >
          Open AI Agent
        </button>
      </div>
    </section>
  );
};

// --- Page components ---
const Dashboard = ({ products = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="bg-white rounded-3xl p-7 border border-[#E8EAF3] shadow-sm flex items-center justify-between">
        <div className="space-y-2 max-w-lg">
          <h2 className="text-2xl font-bold text-gray-800">Hi, Manager</h2>
          <p className="text-sm text-gray-500">Intelligent Inventory &amp; Demand Forecasting Dashboard</p>
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 bg-[#F4F5FB] p-3 rounded-2xl border border-[#E8EAF3]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-gray-600">Your inventory agent is ready to assist.</span>
              <button
                onClick={() => navigate('/ai-agent')}
                className="px-4 py-1.5 rounded-full bg-[#5B5CE6] text-white text-xs font-medium hover:bg-[#4d4ecb] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                Open chat
              </button>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-indigo-50 text-[#5B5CE6] items-center justify-center">
          <Activity size={32} />
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-[#E8EAF3] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Products</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{products.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-[#E8EAF3] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Low Stock Alerts</p>
          <p className="text-3xl font-bold text-rose-500 mt-2">{products.filter(p => p.currentStock <= p.safetyStock).length}</p>
        </div>
      </div>
    </div>
  );
};

const Inventory = ({ products = [], fetchProducts, addLog }) => {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    addLog('Analyzing inventory & sales history...');
    try {
      await axios.post(`${API}/api/forecast`);
      addLog('Generated new demand forecasts.');
      if (fetchProducts) fetchProducts();
      alert('Analysis complete! Check the Forecast tab.');
    } catch (e) {
      alert('Forecast failed. Is the Python ML service running on port 8000?');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Status</h2>
          <p className="text-xs text-gray-500">Real-time stock levels across categories</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-full bg-[#5B5CE6] text-white text-sm font-medium hover:bg-[#4d4ecb] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px] disabled:opacity-50"
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {analyzing ? 'Analyzing...' : 'Analyze Inventory'}
        </button>
      </div>
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-[#E8EAF3]">
        <table className="w-full text-left">
          <thead className="bg-[#F8F9FD] border-b border-[#E8EAF3]">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="border-t border-[#F1F3F9] hover:bg-slate-50/50">
                <td className="p-4 font-medium text-gray-800">{p.productName}</td>
                <td className="p-4 text-gray-500 text-sm">{p.category}</td>
                <td className="p-4 font-bold text-gray-800">{p.currentStock}</td>
                <td className="p-4">
                  {p.currentStock > p.safetyStock + 10 ? (
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">Healthy</span>
                  ) : p.currentStock > p.safetyStock ? (
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-100">Low Stock</span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-medium border border-rose-100">Critical</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ForecastPage = ({ addLog, fetchProducts }) => {
  const [forecasts, setForecasts] = useState([]);
  const [orderDraft, setOrderDraft] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/forecasts`).then(res => {
      setForecasts(res.data);
      const initialDraft = {};
      res.data.forEach(f => { if (f.recommendedOrder > 0) initialDraft[f.productId] = f.recommendedOrder; });
      setOrderDraft(initialDraft);
    });
  }, []);

  const handleUpdateQty = (id, delta) => setOrderDraft(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const submitOrder = async () => {
    addLog('Merchant approved order.');
    addLog('Validating and grouping by supplier...');
    const items = Object.entries(orderDraft).map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return alert('Order is empty');
    try {
      const res = await axios.post(`${API}/api/orders`, { items });
      res.data.orders.forEach(o => addLog(`Generated PO: ${o.orderId} for ${o.supplier}`));
      addLog('Simulated supplier order sent.');
      if (fetchProducts) fetchProducts();
      alert('Orders submitted successfully!');
      navigate('/orders');
    } catch (e) {
      alert('Error submitting order');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">AI Forecast &amp; Recommendations</h2>
        <p className="text-xs text-gray-500">7-day machine-learning demand forecast</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecasts.map(f => (
          <div key={f._id} className="bg-white rounded-3xl p-5 border border-[#E8EAF3] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-800 mb-1">{f.productName}</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{f.explanation}</p>
            </div>
            <div className="flex items-center justify-between bg-[#F8F9FD] p-3 rounded-2xl border border-[#E8EAF3]">
              <span className="text-xs font-medium text-gray-600">Recommended Order:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleUpdateQty(f.productId, -1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">-</button>
                <span className="font-bold text-sm text-gray-800 min-w-6 text-center">{orderDraft[f.productId] || 0}</span>
                <button onClick={() => handleUpdateQty(f.productId, 1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {forecasts.length > 0 ? (
        <button
          onClick={submitOrder}
          className="w-full py-3 rounded-full bg-[#5B5CE6] text-white text-sm font-medium hover:bg-[#4d4ecb] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          Confirm &amp; Order
        </button>
      ) : (
        <p className="text-gray-400 italic text-sm">No forecasts generated yet. Go to Inventory to analyze data.</p>
      )}
    </div>
  );
};

const OrdersPage = ({ fetchProducts }) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = () => axios.get(`${API}/api/orders`).then(res => setOrders(res.data));
  useEffect(() => { fetchOrders(); }, []);

  const markReceived = async (id) => {
    await axios.post(`${API}/api/orders/${id}/receive`);
    fetchOrders();
    if (fetchProducts) fetchProducts();
    alert('Inventory updated!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
        <p className="text-xs text-gray-500">Track supplier shipments and fulfillments</p>
      </div>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o._id} className="bg-white rounded-3xl p-5 flex justify-between items-center border border-[#E8EAF3] shadow-sm">
            <div>
              <div className="font-bold text-base text-gray-800">{o.orderId} - {o.supplier}</div>
              <div className="text-xs text-gray-500 mt-1">Items: {o.totalItems} | Expected: {new Date(o.expectedDeliveryDate).toLocaleDateString()}</div>
              <div className="text-xs mt-1.5">
                Status: <span className={`font-semibold ${o.status==='Received'?'text-emerald-600':'text-amber-600'}`}>{o.status}</span>
              </div>
            </div>
            {o.status === 'Pending' && (
              <button
                onClick={() => markReceived(o._id)}
                className="px-4 py-2 rounded-full bg-[#5B5CE6] text-white text-xs font-medium hover:bg-[#4d4ecb] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                Mark as Received
              </button>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-400 text-sm">No orders placed yet.</p>}
      </div>
    </div>
  );
};

const RecordSale = ({ products = [], fetchProducts, addLog }) => {
  const [form, setForm] = useState({ productId: '', quantity: 1 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/sales`, form);
      const prod = products.find(p => p.productId === form.productId);
      addLog(`Recorded sale: ${form.quantity} unit(s) of ${prod?.productName || form.productId}`);
      if (fetchProducts) fetchProducts();
      alert('Sale recorded successfully!');
    } catch (e) {
      alert('Error recording sale. Check stock limits.');
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Record Sale</h2>
        <p className="text-xs text-gray-500">Simulate customer order transaction</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 space-y-4 border border-[#E8EAF3] shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product</label>
          <select
            className="w-full border border-gray-200 p-2.5 rounded-xl text-sm bg-[#F8F9FD] focus:outline-none focus:ring-2 focus:ring-indigo-100"
            required
            value={form.productId}
            onChange={e => setForm({ ...form, productId: e.target.value })}
          >
            <option value="">Select a product...</option>
            {products.map(p => (
              <option key={p.productId} value={p.productId}>{p.productName} (Stock: {p.currentStock})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity Sold</label>
          <input
            type="number"
            min="1"
            className="w-full border border-gray-200 p-2.5 rounded-xl text-sm bg-[#F8F9FD] focus:outline-none focus:ring-2 focus:ring-indigo-100"
            required
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-full bg-[#5B5CE6] text-white text-sm font-medium hover:bg-[#4d4ecb] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          Record Sale
        </button>
      </form>
    </div>
  );
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState(['Agent initialized. Ready to assist.']);

  const addLog = msg => setLogs(prev => [msg, ...prev].slice(0, 10));
  const fetchProducts = () => axios.get(`${API}/api/products`).then(res => setProducts(res.data)).catch(err => console.error('Fetch products error:', err));

  useEffect(() => { fetchProducts(); }, []);

  return (
    <Router>
      <div className="bg-[#F4F5FB] min-h-screen flex flex-col">
        <Header />
        <div className="grid grid-cols-[240px_1fr_300px] gap-6 p-6 flex-1 min-h-0">
          <Sidebar />
          <main className="overflow-y-auto min-h-0 flex flex-col flex-1">
            <Routes>
              <Route path="/" element={<Dashboard products={products} />} />
              <Route path="/inventory" element={<Inventory products={products} fetchProducts={fetchProducts} addLog={addLog} />} />
              <Route path="/forecast" element={<ForecastPage addLog={addLog} fetchProducts={fetchProducts} />} />
              <Route path="/orders" element={<OrdersPage fetchProducts={fetchProducts} />} />
              <Route path="/record-sale" element={<RecordSale products={products} fetchProducts={fetchProducts} addLog={addLog} />} />
              <Route path="/ai-agent" element={<AIBox API={API} products={products} fetchProducts={fetchProducts} logs={logs} addLog={addLog} />} />
            </Routes>
          </main>
          <RightPanel products={products} />
        </div>
      </div>
    </Router>
  );
}
