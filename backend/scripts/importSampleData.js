const mongoose = require('mongoose');
const fs = require('fs');
const { Product, Sale } = require('../models');
require('dotenv').config();

async function importData() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory_ai');
    
    // Clear existing data to prevent duplicates
    await Product.deleteMany({});
    await Sale.deleteMany({});
    console.log('Cleared old data...');

    const productsMap = {};
    const sales = [];

    // Read the file manually to handle Kaggle's empty rows and formatting
    const rawData = fs.readFileSync('../data/Retail Sales Transactions 2024-2025.csv', 'utf-8');
    const lines = rawData.split('\n');

    // Find the header row (skipping the empty ones at the top)
    let headerIndex = 0;
    while (!lines[headerIndex].includes('Order_ID')) {
        headerIndex++;
    }

    const headers = lines[headerIndex].split(',').map(h => h.trim());
    
    // Mappings based on your Kaggle CSV
    const idxProduct = headers.indexOf('Product');
    const idxCategory = headers.indexOf('Category');
    const idxQuantity = headers.indexOf('Quantity');
    const idxPrice = headers.indexOf('Unit_Price');
    const idxDate = headers.indexOf('Order_Date');

    for (let i = headerIndex + 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length < headers.length || !row[idxProduct]) continue; // Skip empty/invalid rows

        const productName = row[idxProduct].trim();
        const category = (row[idxCategory] || 'General').trim().toUpperCase(); // Fix inconsistent casing
        const productId = `PROD-${productName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
        
        let quantity = parseInt(row[idxQuantity]);
        if (isNaN(quantity) || quantity <= 0) quantity = 1; // Default to 1 if missing in CSV
        
        let price = parseFloat(row[idxPrice]);
        if (isNaN(price)) price = 100.0; 

        // 1. Create or update Product
        if (!productsMap[productId]) {
            productsMap[productId] = {
                productId: productId,
                productName: productName,
                category: category,
                unitPrice: price,
                supplier: `${category}_SUPPLIER`, // Generated
                leadTimeDays: Math.floor(Math.random() * 5) + 1, // Random 1-5 days
                safetyStock: Math.floor(Math.random() * 30) + 10, // Random 10-40
                currentStock: Math.floor(Math.random() * 100) + 20, // Starting stock
            };
        }

        // 2. Create Sale Record
        const saleDate = new Date(row[idxDate]);
        sales.push({
            productId: productId,
            productName: productName,
            quantity: quantity,
            price: price,
            saleDate: isNaN(saleDate) ? new Date() : saleDate
        });
    }

    // Save to MongoDB
    await Product.insertMany(Object.values(productsMap));
    console.log(`Imported ${Object.keys(productsMap).length} Products.`);
    
    await Sale.insertMany(sales);
    console.log(`Imported ${sales.length} Sales.`);

    console.log('Kaggle Data successfully imported! You can now start the backend.');
    process.exit(0);
}

importData();