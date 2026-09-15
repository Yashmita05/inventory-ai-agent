const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productId: String, 
    productName: String, 
    category: String,
    unitPrice: Number, 
    supplier: String, 
    leadTimeDays: { type: Number, default: 3 }, // Defaulting in case Kaggle doesn't have it
    safetyStock: { type: Number, default: 20 },
    currentStock: { type: Number, default: 50 }, 
});

const SaleSchema = new mongoose.Schema({
    productId: String, 
    productName: String, 
    quantity: Number,
    price: Number, 
    saleDate: Date
});

const PurchaseOrderSchema = new mongoose.Schema({
    orderId: String, 
    supplier: String, 
    items: Array,
    totalItems: Number, 
    totalAmount: Number, 
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }, 
    expectedDeliveryDate: Date
});

const ForecastSchema = new mongoose.Schema({
    productId: String, 
    productName: String, 
    historicalAverage: Number,
    predictedDemand: Number, 
    currentStock: Number, 
    safetyStock: Number,
    leadTimeDays: Number, 
    recommendedOrder: Number,
    explanation: String, 
    generatedAt: { type: Date, default: Date.now }
});

module.exports = {
    Product: mongoose.model('Product', ProductSchema),
    Sale: mongoose.model('Sale', SaleSchema),
    PurchaseOrder: mongoose.model('PurchaseOrder', PurchaseOrderSchema),
    Forecast: mongoose.model('Forecast', ForecastSchema)
};