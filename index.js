/**
 * BACKEND SERVER CODE - UPDATED FOR AUTHENTICATION & LIMITS
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const jwt = require('jsonwebtoken'); // NEW: For creating user sessions
const User = require('./models/User'); // NEW: Import the User Model

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
// IMPORTANT: Add a secure JWT Secret to your .env file on Render/Glitch
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-for-testing'; 
const MAX_FREE_USES = 3; // The daily limit

// --- DATABASE MODELS ---
// Existing Gig Model
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

// --- HELPER FUNCTIONS ---
// Generates a JWT token for a user
const signToken = id => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '90d' 
    });
};

// --- AUTHENTICATION MIDDLEWARE (CRITICAL for security) ---
const protect = async (req, res, next) => {
    try {
        let token;
        // 1. Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'You are not logged in. Please log in to get access.' });
        }

        // 2. Verification token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Check if user still exists
        // We do NOT select the password here, only the necessary fields
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
        }
        
        // 4. Attach user object to request
        req.user = currentUser; 
        next();
    } catch (err) {
        return res.status(401).json({ status: 'fail', message: 'Invalid token or session expired.' });
    }
};

// --- ROUTES ---

// NEW: 1. AUTHENTICATION ROUTES
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // The password hashing is handled by the Mongoose 'pre' middleware in User.js
        const newUser = await User.create({ email, password });
        const token = signToken(newUser._id);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: { id: newUser._id, email: newUser.email, isPremium: newUser.isPremium }
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: 'fail', message: 'Email already in use.' });
        }
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
        }

        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: { id: user._id, email: user.email, isPremium: user.isPremium }
            }
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Login failed.' });
    }
});


// 2. SOLVER API (PROTECTED & LIMITED)
app.post('/api/solve', protect, async (req, res) => {
    try {
        const { questionText } = req.body;
        const user = req.user; // User object attached by the 'protect' middleware

        if (!questionText) return res.status(400).json({ error: 'No text provided' });
        
        // --- DAILY LIMIT LOGIC ---
        const today = new Date().toISOString().split('T')[0];
        const lastReset = user.dailyUsage.lastResetDate.toISOString().split('T')[0];

        // Reset usage count if a new day has started since the last check
        if (lastReset !== today) {
            user.dailyUsage.count = 0;
            user.dailyUsage.lastResetDate = new Date();
        }

        // Check if user is NOT premium AND has reached the free limit
        if (!user.isPremium && user.dailyUsage.count >= MAX_FREE_USES) {
             // Save the reset (if any) before blocking
             await user.save(); 
             return res.status(403).json({ 
                 error: `Daily limit reached. Free users are limited to ${MAX_FREE_USES} questions per day.`,
                 limitReached: true,
                 count: user.dailyUsage.count
             });
        }
        
        // --- AI PROCESSING ---
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are a helpful tutor for a Nigerian student. 
        Solve this strictly in steps. 
        Question: ${questionText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // --- UPDATE USAGE ---
        if (!user.isPremium) {
            user.dailyUsage.count += 1;
            await user.save(); // Save the updated usage count to MongoDB
        }

        res.json({ 
            answer: text,
            count: user.dailyUsage.count,
            limit: MAX_FREE_USES,
            isPremium: user.isPremium
        });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ answer: "Sorry, I couldn't solve that right now. Try again later." });
    }
});

// 3. GIGS API (UNPROTECTED FOR NOW - requires authentication to post/delete)
app.get('/api/gigs', async (req, res) => {
    try {
        // Return latest 20 gigs, newest first
        const gigs = await Gig.find().sort({ createdAt: -1 }).limit(20);
        res.json(gigs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/gigs', async (req, res) => {
    // NOTE: You should add 'protect' middleware here later to link gigs to a user ID.
    try {
        const { title, desc, price, contact } = req.body;
        if (!title || !price) return res.status(400).json({ error: 'Missing fields' });
        
        const newGig = new Gig({ title, desc, price, contact });
        await newGig.save();
        res.status(201).json(newGig);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. BUNDLES API (Dynamic Pricing)
app.get('/api/bundles', (req, res) => {
    const bundles = [
        { provider: 'MTN', name: '500MB/7 days', mb: 500, price: 200 },
        { provider: 'GLO', name: '1GB/7 days', mb: 1024, price: 300 },
        { provider: 'AIRTEL', name: '250MB/7 days', mb: 250, price: 150 },
        { provider: '9MOBILE', name: '750MB/7 days', mb: 750, price: 250 },
        { provider: 'MTN', name: 'Awoof Special', mb: 2048, price: 500 }
    ];
    res.json(bundles);
});

// 5. SIMPLE HEALTH CHECK
app.get('/', (req, res) => res.send('EduPadi Backend is Live! 🚀'));


// --- STARTUP ---
// Ensure the PORT is defined by the environment variable
const SERVER_PORT = process.env.PORT || 8080; // Use 8080 as a safer local fallback if needed

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB Atlas");
        // Use the host's required port (process.env.PORT) for listening
        app.listen(SERVER_PORT, () => console.log(`Server running on port ${SERVER_PORT}`));
    })
    .catch(err => console.error("DB Connection Error:", err));


// 1. HEALTH CHECK
app.get('/', (req, res) => res.send('EduPadi Backend is Live! 🚀'));

// 2. SOLVER API (Handles the Homework)
app.post('/api/solve', async (req, res) => {
    try {
        const { questionText } = req.body;
        if (!questionText) return res.status(400).json({ error: 'No text provided' });

        // Use Gemini Flash (Fast & Cheap/Free)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
