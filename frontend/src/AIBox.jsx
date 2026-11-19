// src/AIBox.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle, Package, ShoppingCart } from 'lucide-react';

/**
 * Inline AI assistant panel rendered visibly inside the centre column.
 * Fully wired to real backend endpoints and live inventory state.
 */
const AIBox = ({ API, products = [], fetchProducts, logs = [], addLog }) => {
  const resolvedAPI = API || import.meta.env.VITE_API_URL || 'https://inventory-ai-agent-w2vb.onrender.com';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hi! I'm your SmartStock AI Assistant. I can analyze sales history, run 7-day demand forecasts with our ML service, monitor critical stock levels, and generate supplier purchase orders. How can I help you today?",
      time: 'Just now'
    }
  ]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Keep chat sync'd when external logs arrive
  useEffect(() => {
    if (logs && logs.length > 0) {
      const latestLog = logs[0];
      if (latestLog && !latestLog.startsWith('Agent initialized')) {
        setChatMessages(prev => {
          if (prev.length > 0 && prev[prev.length - 1].text === latestLog) {
            return prev;
          }
          const isUser = latestLog.startsWith('You: ');
          return [
            ...prev,
            {
              id: Date.now().toString() + Math.random(),
              sender: isUser ? 'user' : 'agent',
              text: isUser ? latestLog.replace(/^You:\s*/, '') : latestLog,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
        });
      }
    }
  }, [logs]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  const pushMessage = (sender, text) => {
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // 1. Predict: Trigger ML forecast pipeline
  const runForecastPipeline = async () => {
    setLoading(true);
    if (addLog) addLog('AI Agent: Initiating ML demand forecast pipeline...');
    try {
      const res = await axios.post(`${resolvedAPI}/api/forecast`);
      const forecasts = res.data.forecasts || [];
      if (addLog) addLog(`Generated new demand forecasts for ${forecasts.length} products.`);
      if (fetchProducts) fetchProducts();

      const itemsWithOrders = forecasts.filter(f => f.recommendedOrder > 0);
      let replyText = `Analysis complete! Generated 7-day demand forecasts for ${forecasts.length} products using the Python ML service.`;
      if (itemsWithOrders.length > 0) {
        replyText += `\n\nIdentified ${itemsWithOrders.length} item(s) requiring re-orders:\n` +
          itemsWithOrders.map(f => `• ${f.productName}: Predicted demand ${f.predictedDemand}, Recommended order ${f.recommendedOrder}`).join('\n') +
          `\n\nYou can review and confirm these in the Forecast tab or ask me to "Generate Purchase Orders".`;
      } else {
        replyText += `\n\nAll products currently have sufficient stock to satisfy predicted 7-day demand plus safety thresholds.`;
      }
      pushMessage('agent', replyText);
    } catch (err) {
      const errMsg = 'Forecast failed. Please ensure the Python ML service is running on port 8000.';
      if (addLog) addLog(`AI Agent Error: ${errMsg}`);
      pushMessage('agent', errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Review: Check low stock items
  const checkLowStock = async () => {
    setLoading(true);
    try {
      let currentProducts = products;
      if (!currentProducts || currentProducts.length === 0) {
        const res = await axios.get(`${resolvedAPI}/api/products`);
        currentProducts = res.data;
        if (fetchProducts) fetchProducts();
      }

      const lowStockItems = currentProducts.filter(p => p.currentStock <= p.safetyStock);
      const criticalItems = currentProducts.filter(p => p.currentStock <= Math.max(1, Math.floor(p.safetyStock / 2)));

      let replyText = `Inventory Stock Health Summary:\n`;
      replyText += `• Total Products Monitored: ${currentProducts.length}\n`;
      replyText += `• Healthy SKUs: ${currentProducts.length - lowStockItems.length}\n`;
      replyText += `• Low Stock Warnings: ${lowStockItems.length}\n`;
      replyText += `• Critical Stock Alerts: ${criticalItems.length}`;

      if (lowStockItems.length > 0) {
        replyText += `\n\nItems at or below safety stock:\n` +
          lowStockItems.map(p => `• ${p.productName} (${p.category}): Stock ${p.currentStock} / Safety ${p.safetyStock} | Supplier: ${p.supplier} (Lead: ${p.leadTimeDays}d)`).join('\n') +
          `\n\nRecommended Action: Trigger a demand forecast or approve purchase orders to replenish stock.`;
      } else {
        replyText += `\n\nAll inventory levels are currently in a healthy range.`;
      }

      if (addLog) addLog(`AI Agent: Checked inventory. Found ${lowStockItems.length} low stock items.`);
      pushMessage('agent', replyText);
    } catch (err) {
      pushMessage('agent', 'Failed to retrieve real-time inventory levels from backend.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Act: Generate and approve purchase orders
  const generatePurchaseOrders = async () => {
    setLoading(true);
    if (addLog) addLog('AI Agent: Reviewing forecasts to compile purchase orders...');
    try {
      const forecastRes = await axios.get(`${resolvedAPI}/api/forecasts`);
      const forecasts = forecastRes.data || [];

      // Build order items from recommended orders or low stock products
      let itemsToOrder = [];
      forecasts.forEach(f => {
        if (f.recommendedOrder > 0) {
          itemsToOrder.push({ productId: f.productId, quantity: f.recommendedOrder });
        }
      });

      // Fallback: if no forecast recommended orders, order 10 units of any low-stock products
      if (itemsToOrder.length === 0) {
        const prodRes = await axios.get(`${resolvedAPI}/api/products`);
        const lowProds = prodRes.data.filter(p => p.currentStock <= p.safetyStock);
        lowProds.forEach(p => {
          itemsToOrder.push({ productId: p.productId, quantity: p.safetyStock * 2 || 10 });
        });
      }

      if (itemsToOrder.length === 0) {
        pushMessage('agent', 'All items have healthy inventory levels and no purchase orders are currently needed. Run "Analyze inventory health" to update forecasts.');
        setLoading(false);
        return;
      }

      const orderRes = await axios.post(`${resolvedAPI}/api/orders`, { items: itemsToOrder });
      const createdOrders = orderRes.data.orders || [];

      if (fetchProducts) fetchProducts();
      createdOrders.forEach(o => {
        if (addLog) addLog(`Generated PO: ${o.orderId} for ${o.supplier} (${o.totalItems} items, $${o.totalAmount})`);
      });

      let replyText = `Successfully generated ${createdOrders.length} purchase order(s) grouped by supplier:\n\n` +
        createdOrders.map(o => `• ${o.orderId} — ${o.supplier}: ${o.totalItems} items ($${o.totalAmount}) | Expected: ${new Date(o.expectedDeliveryDate).toLocaleDateString()}`).join('\n') +
        `\n\nYou can track and receive these shipments in the Orders tab.`;

      pushMessage('agent', replyText);
    } catch (err) {
      pushMessage('agent', 'Error creating purchase orders. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  // 4. View Pending Orders
  const viewPendingOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${resolvedAPI}/api/orders`);
      const orders = res.data || [];
      const pending = orders.filter(o => o.status === 'Pending');
      const received = orders.filter(o => o.status === 'Received');

      let replyText = `Purchase Orders Status:\n• Total Orders: ${orders.length}\n• Pending Deliveries: ${pending.length}\n• Completed / Received: ${received.length}`;
      if (pending.length > 0) {
        replyText += `\n\nPending shipments:\n` +
          pending.slice(0, 5).map(o => `• ${o.orderId} (${o.supplier}): ${o.totalItems} items, Expected ${new Date(o.expectedDeliveryDate).toLocaleDateString()}`).join('\n');
        if (pending.length > 5) replyText += `\n...and ${pending.length - 5} more in the Orders tab.`;
      } else {
        replyText += `\n\nNo pending purchase orders awaiting delivery.`;
      }
      pushMessage('agent', replyText);
    } catch (err) {
      pushMessage('agent', 'Failed to fetch orders from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (textToSend) => {
    const messageText = typeof textToSend === 'string' ? textToSend : input;
    if (!messageText || !messageText.trim() || loading) return;

    const trimmed = messageText.trim();
    pushMessage('user', trimmed);
    if (addLog) addLog(`You: ${trimmed}`);
    setInput('');

    const lower = trimmed.toLowerCase();

    // Route to actual backend actions based on intent
    if (lower.includes('forecast') || lower.includes('predict') || lower.includes('analyze') || lower.includes('analysis')) {
      runForecastPipeline();
    } else if (lower.includes('stock') || lower.includes('low') || lower.includes('inventory') || lower.includes('alert') || lower.includes('health')) {
      checkLowStock();
    } else if (lower.includes('order') && (lower.includes('create') || lower.includes('generate') || lower.includes('purchase') || lower.includes('buy') || lower.includes('approve') || lower.includes('confirm'))) {
      generatePurchaseOrders();
    } else if (lower.includes('order') || lower.includes('po') || lower.includes('pending') || lower.includes('supplier')) {
      viewPendingOrders();
    } else {
      // General live status response with real counts
      setLoading(true);
      setTimeout(() => {
        const lowCount = products.filter(p => p.currentStock <= p.safetyStock).length;
        const reply = `I'm tracking ${products.length} active products across 4 categories. Currently ${lowCount} item(s) are flagged with low stock alerts.\n\nQuick actions you can take right now:\n• "Run 7-day demand forecast" — invokes our Python ML forecasting engine\n• "Check low stock items" — reviews SKUs below safety thresholds\n• "Generate purchase orders" — batches re-orders by supplier\n• "Review pending orders" — checks shipment arrival dates`;
        pushMessage('agent', reply);
        setLoading(false);
      }, 400);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestionChips = [
    { label: 'Run 7-day demand forecast', action: runForecastPipeline },
    { label: 'Check low stock items', action: checkLowStock },
    { label: 'Generate purchase orders', action: generatePurchaseOrders },
    { label: 'Review pending orders', action: viewPendingOrders },
  ];

  return (
    <div className="flex flex-col flex-1 h-full min-h-[580px] bg-white rounded-3xl border border-[#E8EAF3] shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E8EAF3]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              SUPPORT AGENT
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              How can I help?
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-[#5B5CE6] text-white shadow-sm'
                  : 'bg-[#F4F5FB] text-slate-800 border border-[#E8EAF3]'
              }`}
            >
              {msg.text}
            </div>
            {msg.time && (
              <span className="text-[11px] text-slate-400 mt-1 px-1">
                {msg.time}
              </span>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 max-w-[85%]">
            <Loader2 size={16} className="animate-spin text-[#5B5CE6]" />
            <span>Processing real-time request with backend &amp; ML services...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-6 pt-2 pb-3 bg-white flex flex-wrap gap-2 border-t border-[#F1F3F9]">
        {suggestionChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => {
              pushMessage('user', chip.label);
              chip.action();
            }}
            disabled={loading}
            className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-[#F4F5FB] hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-[#E8EAF3] transition-colors cursor-pointer disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-4 bg-white border-t border-[#E8EAF3]">
        <div className="flex items-center gap-2 bg-[#F4F5FB] rounded-full p-1.5 border border-[#E8EAF3] focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask AI (e.g. 'Run forecast', 'Check low stock', 'Create purchase orders')..."
            className="flex-1 px-4 py-2 text-sm bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#5B5CE6] hover:bg-[#4d4ecb] disabled:opacity-40 disabled:hover:bg-[#5B5CE6] text-white transition-all cursor-pointer shrink-0"
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBox;
