require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Serve Static Files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database (Handle Vercel/Read-Only Filesystem)
const dbPath = process.env.VERCEL || process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'kisan360.db') 
    : './kisan360.db';

console.log(`Using SQLite database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        
        // 1. Create Farmers Table
        db.run(`CREATE TABLE IF NOT EXISTS farmers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            village TEXT,
            state TEXT
        )`, (err) => {
            if (err) console.error("Error creating farmers table: " + err.message);
        });

        // 2. Create Buyers Table
        db.run(`CREATE TABLE IF NOT EXISTS buyers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            city TEXT,
            phone TEXT
        )`, (err) => {
            if (err) console.error("Error creating buyers table: " + err.message);
        });
    }
});

// Explicit route for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure Multer for processing image uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Groq Client (Conditionally)
let groq;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
} else {
    console.warn("WARNING: GROQ_API_KEY is missing. AI features will not work locally.");
}

// --- ROUTES ---

// AUTH ROUTES
app.post('/register', async (req, res) => {
    // Extract everything, including potential buyer fields (city, phone) or farmer fields (village, state)
    const { name, email, password, role, village, state, city, phone } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Name, email, password and role are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let sql;
        let params;
        let tableName;

        if (role === 'farmer') {
            tableName = 'farmers';
            sql = `INSERT INTO farmers (name, email, password, village, state) VALUES (?, ?, ?, ?, ?)`;
            params = [name, email, hashedPassword, village, state];
        } else if (role === 'buyer') {
            tableName = 'buyers';
            sql = `INSERT INTO buyers (name, email, password, city, phone) VALUES (?, ?, ?, ?, ?)`;
            // Note: Map state -> phone if using existing frontend logic, or ensure frontend sends correct keys
            params = [name, email, hashedPassword, city, phone];
        } else {
            return res.status(400).json({ error: "Invalid role" });
        }

        db.run(sql, params, function(err) {
            if (err) {
                console.error("Registration DB Error:", err);
                return res.status(400).json({ error: `${role} with this email already exists` });
            }
            res.json({ message: "Registered successfully", userId: this.lastID });
        });
    } catch (e) {
        console.error("Registration Server Error:", e);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/login', (req, res) => {
    const { email, password, role } = req.body; // Role is optional but recommended

    // If role is provided, only check that specific table
    if (role === 'farmer') {
         db.get(`SELECT * FROM farmers WHERE email = ?`, [email], async (err, user) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (!user) return res.status(400).json({ error: "Farmer account not found" });

            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.json({ message: "Login successful", user: { ...user, role: 'farmer' } });
            } else {
                res.status(400).json({ error: "Invalid password" });
            }
        });
        return;
    } 
    
    if (role === 'buyer') {
         db.get(`SELECT * FROM buyers WHERE email = ?`, [email], async (err, user) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (!user) return res.status(400).json({ error: "Buyer account not found" });

            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.json({ message: "Login successful", user: { ...user, role: 'buyer' } });
            } else {
                res.status(400).json({ error: "Invalid password" });
            }
        });
        return;
    }

    // Fallback: Check farmers table first if no role specified (Legacy support)
    const sqlFarmer = `SELECT * FROM farmers WHERE email = ?`;
    
    db.get(sqlFarmer, [email], async (err, farmer) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        if (farmer) {
            const match = await bcrypt.compare(password, farmer.password);
            if (match) {
                return res.json({ 
                    message: "Login successful", 
                    user: { ...farmer, role: 'farmer' } 
                });
            } else {
                return res.status(400).json({ error: "Invalid password" });
            }
        }

        // If not found in farmers, check buyers
        const sqlBuyer = `SELECT * FROM buyers WHERE email = ?`;
        db.get(sqlBuyer, [email], async (err, buyer) => {
            if (err) return res.status(500).json({ error: "Database error" });
            
            if (buyer) {
                const match = await bcrypt.compare(password, buyer.password);
                if (match) {
                    return res.json({ 
                        message: "Login successful", 
                        user: { ...buyer, role: 'buyer' } 
                    });
                } else {
                    return res.status(400).json({ error: "Invalid password" });
                }
            }

            // Not found in either
            res.status(400).json({ error: "User not found" });
        });
    });
});

// --- REALISTIC MOCK DATA FOR DEMO ---
const MOCK_MANDI_DATA = {
    records: [
        { state: "Maharashtra", district: "Pune", market: "Pune", commodity: "Onion", min_price: "2200", max_price: "2600", modal_price: "2450", arrival_date: "29/01/2026" },
        { state: "Maharashtra", district: "Nashik", market: "Lasalgaon", commodity: "Onion", min_price: "2100", max_price: "2550", modal_price: "2300", arrival_date: "29/01/2026" },
        { state: "Maharashtra", district: "Pune", market: "Khed", commodity: "Tomato", min_price: "1200", max_price: "1500", modal_price: "1350", arrival_date: "29/01/2026" },
        { state: "Maharashtra", district: "Pune", market: "Pune", commodity: "Potato", min_price: "1800", max_price: "2200", modal_price: "2000", arrival_date: "29/01/2026" },
        { state: "Maharashtra", district: "Satara", market: "Satara", commodity: "Wheat", min_price: "2800", max_price: "3200", modal_price: "3000", arrival_date: "29/01/2026" },
        { state: "Maharashtra", district: "Pune", market: "Pune", commodity: "Soybean", min_price: "4500", max_price: "4800", modal_price: "4650", arrival_date: "29/01/2026" },
        { state: "Punjab", district: "Ludhiana", market: "Ludhiana", commodity: "Wheat", min_price: "2100", max_price: "2300", modal_price: "2200", arrival_date: "29/01/2026" },
        { state: "Madhya Pradesh", district: "Indore", market: "Indore", commodity: "Soybean", min_price: "4200", max_price: "4600", modal_price: "4400", arrival_date: "29/01/2026" }
    ]
};

// 2. Mandi Prices Route (Proxy to Data.gov.in with Demo Fallback)
app.get('/api/mandi', async (req, res) => {
    try {
        const apiKey = process.env.DATA_GOV_API_KEY;
        
        // If no API key is set, use Mock Data immediately
        if (!apiKey || apiKey === "your_govt_api_key_here") {
            console.log("Using Mock Data (Demo Mode)");
            return res.json(MOCK_MANDI_DATA);
        }

        // Using native fetch (Node 18+)
        // Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
        const apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=100`;
        
        console.log(`Fetching Mandi data...`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Upstream API failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Validation: If API returns error or empty records, fallback to mock
        if (data.status === 'error' || !data.records) {
             console.log("API returned auth error or empty records. Falling back to Mock Data.");
             return res.json(MOCK_MANDI_DATA);
        }

        res.json(data);

    } catch (error) {
        console.error("Mandi API Error (Using Fallback):", error.message);
        // Fallback on crash
        res.json(MOCK_MANDI_DATA);
    }
});

// 3. Plant Analysis Route (Groq AI)
app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!groq) {
            return res.status(503).json({ 
                error: "AI Service Unavailable", 
                details: "Server is running without GROQ_API_KEY. Configure .env file to enable this feature." 
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        const userLang = req.body.language || "en";
        const base64Image = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        console.log(`Processing image for analysis (Language: ${userLang})...`);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are 'Kisan360 Doctor', a friendly agricultural expert helping a farmer. 
                            Analyze this plant image for diseases. 
                            
                            Instructions:
                            1. Use very simple, easy-to-understand language.
                            2. Avoid complex scientific jargon.
                            3. Focus on practical, actionable advice.
                            4. TRULY TRANSLATE the VALUES (name, description, treatments) into: ${userLang}.
                            5. KEEP all JSON KEYS (name, severity, severityColor, confidence, description, treatments) in English.
                            
                            Return a strictly valid JSON object.
                            Do not accept markdown formatting like \`\`\`json. Just the raw JSON.
                            
                            The JSON schema must be:
                            {
                                "name": "Simple Name of disease (e.g., 'Leaf Rust')",
                                "severity": "Low, Moderate, High, or Critical",
                                "severityColor": "Hex color code (e.g., #27ae60 for healthy, #e74c3c for critical)",
                                "confidence": "Percentage string (e.g., '95%')",
                                "description": "1-2 simple sentences explaining what is wrong.",
                                "treatments": ["Simple Step 1", "Simple Step 2", "Simple Step 3"]
                            }`
                        },
                        {
                            type: "image_url",
                            image_url: { url: dataUrl }
                        }
                    ]
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct", 
            temperature: 0.1,
            max_tokens: 1024,
            response_format: { type: "json_object" },
            stream: false
        });

        const resultArgs = completion.choices[0]?.message?.content;
        
        if (!resultArgs) throw new Error("No response content from Groq");

        console.log("Analysis Complete");
        res.json(JSON.parse(resultArgs));

    } catch (error) {
        console.error("Error analyzing image:", error);
        res.status(500).json({ 
            error: "Failed to analyze image", 
            details: error.message 
        });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Kisan360 Backend running at http://localhost:${port}`);
    });
}

module.exports = app;
