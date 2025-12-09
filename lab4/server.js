const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lab4_db';

let db;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db();
        
        db.collection('products').createIndex({ name: 1 }).catch(err => {
            console.log('Index already exists or error creating index:', err.message);
        });
    })
    .catch(error => console.error('MongoDB connection error:', error));

app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, sort } = req.query;
        const query = {};
        
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        
        let sortOption = {};
        if (sort === 'price-asc') sortOption = { price: 1 };
        else if (sort === 'price-desc') sortOption = { price: -1 };
        else if (sort === 'name') sortOption = { name: 1 };
        
        const products = await db.collection('products')
            .find(query)
            .sort(sortOption)
            .toArray();
            
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await db.collection('products').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, description, price, category, quantity } = req.body;
        
        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }
        
        const newProduct = {
            name,
            description: description || '',
            price: parseFloat(price),
            category,
            quantity: parseInt(quantity) || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('products').insertOne(newProduct);
        newProduct._id = result.insertedId;
        
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, description, price, category, quantity } = req.body;
        const updateDoc = { 
            $set: { 
                updatedAt: new Date() 
            } 
        };
        
        if (name !== undefined) updateDoc.$set.name = name;
        if (description !== undefined) updateDoc.$set.description = description;
        if (price !== undefined) updateDoc.$set.price = parseFloat(price);
        if (category !== undefined) updateDoc.$set.category = category;
        if (quantity !== undefined) updateDoc.$set.quantity = parseInt(quantity);
        
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            updateDoc
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updatedProduct = await db.collection('products').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await db.collection('products').deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.collection('products').distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/statistics', async (req, res) => {
    try {
        const stats = await db.collection('products').aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                    avgPrice: { $avg: '$price' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    totalValue: { $round: ['$totalValue', 2] },
                    avgPrice: { $round: ['$avgPrice', 2] },
                    _id: 0
                }
            }
        ]).toArray();
        
        const totalStats = await db.collection('products').aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]).toArray();
        
        res.json({
            byCategory: stats,
            total: totalStats[0] || { totalProducts: 0, totalValue: 0, totalQuantity: 0 }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});