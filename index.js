/**
 * BACKEND SERVER CODE
 * Hosting Recommendation: Glitch.com or Render.com (Free Tiers)
 * * Dependencies to install (package.json):
 * npm install express mongoose cors dotenv @google/generative-ai
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; // Get this from MongoDB Atlas
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Get from Google AI Studio

// --- DATABASE MODELS ---
const gigSchema = new mongoose.Schema({
    title: String,
    desc: String,
    price: Number,
    contact: String,
    createdAt: { type: Date, default: Date.now }
});
const Gig = mongoose.model('Gig', gigSchema);

// --- AI CONFIG ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- ROUTES ---

// 1. HEALTH CHECK
app.get('/', (req, res) => res.send('EduPadi Backend is Live! 🚀'));

// 2. SOLVER API (Handles the Homework)
app.post('/api/solve', async (req, res) => {
    try {
        const { questionText } = req.body;
        if (!questionText) return res.status(400).json({ error: 'No text provided' });

        // Use Gemini Flash (Fast & Cheap/Free)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a helpful tutor for a Nigerian student. 
        Solve this strictly in steps. 
        Question: ${questionText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ answer: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ answer: "Sorry, I couldn't solve that right now. Try again later." });
    }
});

// 3. GIGS API (Shared Marketplace)
app.get('/api/gigs', async (req, res) => {
    try {
        // Return latest 20 gigs, newest first
        const gigs = await Gig.find().sort({ createdAt: -1 }).limit(20);
        res.json(gigs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/gigs', async (req, res) => {
    try {
        const { title, desc, price, contact } = req.body;
        // Basic validation
        if (!title || !price) return res.status(400).json({ error: 'Missing fields' });
        
        const newGig = new Gig({ title, desc, price, contact });
        await newGig.save();
        res.status(201).json(newGig);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. BUNDLES API (Dynamic Pricing)
app.get('/api/bundles', (req, res) => {
    // You can update this array on the server without updating the app
    const bundles = [
        { provider: 'MTN', name: '500MB/7 days', mb: 500, price: 200 },
        { provider: 'GLO', name: '1GB/7 days', mb: 1024, price: 300 },
        { provider: 'AIRTEL', name: '250MB/7 days', mb: 250, price: 150 },
        { provider: '9MOBILE', name: '750MB/7 days', mb: 750, price: 250 },
        { provider: 'MTN', name: 'Awoof Special', mb: 2048, price: 500 } // Exclusive deal!
    ];
    res.json(bundles);
});

// --- STARTUP ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB Atlas");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error("DB Connection Error:", err));
