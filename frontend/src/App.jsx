import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Package, TrendingUp, ShoppingCart, Activity, PlusSquare } from 'lucide-react';

const API = 'https://inventory-ai-agent-w2vb.onrender.com';

const Sidebar = ({ logs }) => (
  <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
    <h1 className="text-2xl font-bold mb-8 text-blue-400">InventoryAI</h1>
    <nav className="flex-1 space-y-2">
      <Link to="/" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded"><LayoutDashboard size={18}/> Dashboard</Link>
      <Link to="/inventory" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded"><Package size={18}/> Inventory</Link>
      <Link to="/forecast" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded"><TrendingUp size={18}/> Forecast</Link>
      <Link to="/orders" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded"><ShoppingCart size={18}/> Orders</Link>
      <Link to="/record-sale" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded"><PlusSquare size={18}/> Record Sale</Link>
    </nav>
    <div className="mt-auto bg-gray-800 p-3 rounded-lg">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><Activity size={16}/> AI Agent Logs</h3>
      <div className="text-xs space-y-2 h-32 overflow-y-auto">
        {logs.map((log, i) => <div key={i}>🤖 {log}</div>)}
      </div>
    </div>
  </div>
);

const Dashboard = ({ products }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
        <h3 className="text-gray-500">Total Products</h3>
        <p className="text-3xl font-bold">{products.length}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border-t-4 border-red-500">
        <h3 className="text-gray-500">Low Stock Alerts</h3>
        <p className="text-3xl font-bold text-red-500">{products.filter(p => p.currentStock <= p.safetyStock).length}</p>
      </div>
    </div>
  </div>
);

const Inventory = ({ products, addLog }) => {
  const handleAnalyze = async () => {
    addLog('Analyzing inventory & sales history...');
    try {
      await axios.post(`${API}/api/forecast`); // ADDED /api
      addLog('Generated new demand forecasts.');
      alert('Analysis complete! Check the Forecast tab.');
    } catch (e) { alert('Forecast failed. Is the Python ML service running on port 8000?'); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventory Status</h2>
        <button onClick={handleAnalyze} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold shadow">
          ANALYZE INVENTORY
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Product</th><th className="p-4">Category</th>
              <th className="p-4">Stock</th><th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="border-t">
                <td className="p-4">{p.productName}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4 font-bold">{p.currentStock}</td>
                <td className="p-4">
                  {p.currentStock > p.safetyStock + 10 ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">Healthy</span> :
                   p.currentStock > p.safetyStock ? <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-bold">Low Stock</span> :
                   <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-bold">Critical</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ForecastPage = ({ addLog }) => {
  const [forecasts, setForecasts] = useState([]);
  const [orderDraft, setOrderDraft] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/forecasts`).then(res => { // ADDED /api
      setForecasts(res.data);
      const initialDraft = {};
      res.data.forEach(f => { if(f.recommendedOrder > 0) initialDraft[f.productId] = f.recommendedOrder; });
      setOrderDraft(initialDraft);
    });
  }, []);

  const handleUpdateQty = (id, delta) => setOrderDraft(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const submitOrder = async () => {
    addLog('Merchant approved order.');
    addLog('Validating and grouping by supplier...');
    const items = Object.entries(orderDraft).map(([productId, quantity]) => ({ productId, quantity }));
    if(items.length === 0) return alert('Order is empty');
    
    try {
      const res = await axios.post(`${API}/api/orders`, { items }); // ADDED /api
      res.data.orders.forEach(o => addLog(`Generated PO: ${o.orderId} for ${o.supplier}`));
      addLog('Simulated supplier order sent.');
      alert('Orders submitted successfully!');
      navigate('/orders');
    } catch(e) { alert('Error submitting order'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">AI Forecast & Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {forecasts.map(f => (
            <div key={f._id} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-purple-500">
              <h3 className="font-bold text-lg">{f.productName}</h3>
              <p className="text-sm text-gray-500 mb-2">{f.explanation}</p>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded mt-4">
                <span>Recommended Order:</span>
                <button onClick={() => handleUpdateQty(f.productId, -1)} className="bg-gray-300 px-3 py-1 rounded font-bold">-</button>
                <span className="font-bold text-lg">{orderDraft[f.productId] || 0}</span>
                <button onClick={() => handleUpdateQty(f.productId, 1)} className="bg-gray-300 px-3 py-1 rounded font-bold">+</button>
              </div>
            </div>
          ))}
          {forecasts.length > 0 ? (
            <button onClick={submitOrder} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 mt-4 shadow-lg">
              CONFIRM & ORDER
            </button>
          ) : (
            <p className="text-gray-500 italic">No forecasts generated yet. Go to Inventory to analyze data.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  
  const fetchOrders = () => axios.get(`${API}/api/orders`).then(res => setOrders(res.data)); // ADDED /api
  useEffect(() => { fetchOrders(); }, []);

  const markReceived = async (id) => {
    await axios.post(`${API}/api/orders/${id}/receive`); // ADDED /api
    fetchOrders();
    alert('Inventory updated!');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Purchase Orders</h2>
      <div className="space-y-4">
        {orders.map(o => (
          <div key={o._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{o.orderId} - {o.supplier}</div>
              <div className="text-sm text-gray-500">Items: {o.totalItems} | Expected: {new Date(o.expectedDeliveryDate).toLocaleDateString()}</div>
              <div className="text-sm mt-1">Status: <span className={`font-bold ${o.status==='Received'?'text-green-600':'text-orange-500'}`}>{o.status}</span></div>
            </div>
            {o.status === 'Pending' && (
              <button onClick={() => markReceived(o._id)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-blue-700">MARK AS RECEIVED</button>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500">No orders placed yet.</p>}
      </div>
    </div>
  );
};

const RecordSale = ({ products, fetchProducts, addLog }) => {
  const [form, setForm] = useState({ productId: '', quantity: 1 });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/sales`, form); // ADDED /api
      addLog(`Recorded sale: ${form.quantity} unit(s) of ${products.find(p=>p.productId===form.productId)?.productName}`);
      fetchProducts();
      alert('Sale recorded successfully!');
    } catch(e) { alert('Error recording sale. Check stock limits.'); }
  };

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-6">Simulate Sale</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Product</label>
          <select className="w-full border p-2 rounded" required onChange={e => setForm({...form, productId: e.target.value})}>
            <option value="">Select a product...</option>
            {products.map(p => <option key={p.productId} value={p.productId}>{p.productName} (Stock: {p.currentStock})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Quantity Sold</label>
          <input type="number" min="1" className="w-full border p-2 rounded" required value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}/>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 shadow">RECORD SALE</button>
      </form>
    </div>
  );
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState(['Agent initialized. Ready to assist.']);

  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 10));
  const fetchProducts = () => axios.get(`${API}/api/products`).then(res => setProducts(res.data)); // ADDED /api

  useEffect(() => { fetchProducts(); }, []);

  return (
    <Router>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar logs={logs} />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard products={products} />} />
            <Route path="/inventory" element={<Inventory products={products} addLog={addLog} />} />
            <Route path="/forecast" element={<ForecastPage addLog={addLog} />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/record-sale" element={<RecordSale products={products} fetchProducts={fetchProducts} addLog={addLog} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}