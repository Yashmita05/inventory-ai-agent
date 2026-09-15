require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { Product, Sale, PurchaseOrder, Forecast } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory_ai')
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch(err => console.error('MongoDB error:', err));

// --- API ROUTES ---

// 1. Get all products and inventory
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// 2. Record a new sale
app.post('/api/sales', async (req, res) => {
    const { productId, quantity, price, date } = req.body;
    const product = await Product.findOne({ productId });
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.currentStock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const sale = new Sale({ 
        productId, 
        productName: product.productName, 
        quantity, 
        price: price || product.unitPrice, 
        saleDate: date || new Date() 
    });
    await sale.save();

    // Decrease inventory
    product.currentStock -= quantity;
    await product.save();

    res.json({ message: 'Sale recorded', product });
});

// 3. Get recent sales
app.get('/api/sales', async (req, res) => {
    const sales = await Sale.find().sort({ saleDate: -1 }).limit(100);
    res.json(sales);
});

// 4. Trigger AI Forecast (Calls Python ML Service)
app.post('/api/forecast', async (req, res) => {
    try {
        const products = await Product.find();
        const forecasts = [];

        for (const p of products) {
            const sales = await Sale.find({ productId: p.productId });
            const salesHistory = sales.map(s => ({
                date: s.saleDate.toISOString().split('T')[0],
                quantity: s.quantity
            }));

            if (salesHistory.length === 0) continue;

            // Talk to our Python service (which we will build next)
            const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'}/forecast`, {
                productId: p.productId,
                productName: p.productName,
                currentStock: p.currentStock,
                leadTimeDays: p.leadTimeDays,
                safetyStock: p.safetyStock,
                salesHistory
            });

            const data = mlResponse.data;
            const forecast = new Forecast({
                productId: p.productId,
                productName: p.productName,
                historicalAverage: data.historicalAverage,
                predictedDemand: data.predictedDemand,
                currentStock: p.currentStock,
                safetyStock: p.safetyStock,
                leadTimeDays: p.leadTimeDays,
                recommendedOrder: data.recommendedOrder,
                explanation: data.explanation
            });
            
            await Forecast.deleteMany({ productId: p.productId }); // Keep only latest forecast
            await forecast.save();
            forecasts.push(forecast);
        }
        res.json({ message: 'Forecasts generated', forecasts });
    } catch (error) {
        console.error('Forecasting failed. Make sure Python ML service is running.');
        res.status(500).json({ error: 'Forecasting failed' });
    }
});

// 5. Get latest forecasts
app.get('/api/forecasts', async (req, res) => {
    const forecasts = await Forecast.find();
    res.json(forecasts);
});

// 6. AI Agent: Create Purchase Orders
app.post('/api/orders', async (req, res) => {
    const { items } = req.body; // [{ productId, quantity }]
    const grouped = {};
    
    for (const item of items) {
        if (item.quantity <= 0) continue;
        const p = await Product.findOne({ productId: item.productId });
        if (!p) continue;

        if (!grouped[p.supplier]) grouped[p.supplier] = { items: [], totalAmount: 0, totalQty: 0, maxLeadTime: 0 };
        
        grouped[p.supplier].items.push({ productId: p.productId, productName: p.productName, quantity: item.quantity, price: p.unitPrice });
        grouped[p.supplier].totalAmount += item.quantity * p.unitPrice;
        grouped[p.supplier].totalQty += item.quantity;
        grouped[p.supplier].maxLeadTime = Math.max(grouped[p.supplier].maxLeadTime, p.leadTimeDays);
    }

    const createdOrders = [];
    for (const supplier in grouped) {
        const orderId = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
        const g = grouped[supplier];
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + g.maxLeadTime);

        const po = new PurchaseOrder({ orderId, supplier, items: g.items, totalItems: g.totalQty, totalAmount: g.totalAmount, expectedDeliveryDate });
        await po.save();
        createdOrders.push(po);
    }

    res.json({ message: 'Orders created successfully via AI Agent', orders: createdOrders });
});

// 7. Get Orders
app.get('/api/orders', async (req, res) => {
    const orders = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json(orders);
});

// 8. Mark Order Received (Increases Inventory)
app.post('/api/orders/:id/receive', async (req, res) => {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'Received') return res.status(400).json({ error: 'Already received' });

    for (const item of order.items) {
        await Product.findOneAndUpdate({ productId: item.productId }, { $inc: { currentStock: item.quantity } });
    }
    
    order.status = 'Received';
    await order.save();
    res.json({ message: 'Order received. Inventory updated.', order });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));