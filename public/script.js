// ========== GLOBAL VARIABLES ==========
let currentImageBase64 = null;
let uploadedImageData = null;
let currentSample = null;
let lastDiagnosisText = '';

// ========== MULTI-LANGUAGE SUPPORT ==========
const i18n = {
    en: {
        analyzing: "🤖 Analyzing...",
        diagnosisPrompt: `You are an expert agricultural scientist. Analyze this plant/crop image and provide:
1. Plant disease name or "Healthy Plant"
2. Severity level (None, Low, Moderate, High, or Critical)
3. Brief description of symptoms
4. 3-4 specific treatment recommendations

Respond ONLY with valid JSON:
{
"name": "disease name or Healthy Plant",
"severity": "severity level",
"description": "symptoms description",
"treatments": ["treatment 1", "treatment 2", "treatment 3"]
}`
    },
    mr: {
        analyzing: "🤖 विश्लेषण करत आहे...",
        diagnosisPrompt: `तुम्ही कृषी तज्ञ आहात. वनस्पती प्रतिमेचे विश्लेषण करा:
{
"name": "रोगाचे नाव",
"severity": "तीव्रता",
"description": "लक्षणे",
"treatments": ["उपचार 1", "उपचार 2", "उपचार 3"]
}`
    },
    hi: {
        analyzing: "🤖 विश्लेषण कर रहे हैं...",
        diagnosisPrompt: `आप कृषि विशेषज्ञ हैं। पौधे की तस्वीर का विश्लेषण करें:
{
"name": "बीमारी का नाम",
"severity": "गंभीरता",
"description": "लक्षण",
"treatments": ["उपचार 1", "उपचार 2", "उपचार 3"]
}`
    }
};

// ========== HELPER FUNCTIONS ==========
// Retry failed API calls
async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// ========== TRANSLATIONS ==========
const translations = {
    en: {
        dashboard: "Dashboard",
        doctor: "AI Crop Doctor",
        market: "Mandi Rates",
        finance: "Loans & Schemes",
        equipment: "Equipments",
        myshop: "Sell Produce",
        learn: "Learning Hub",
        community: "Community",
        welcome: "Welcome back, here is your daily farming overview."
    },
    mr: {
        dashboard: "डॅशबोर्ड",
        doctor: "पीक डॉक्टर",
        market: "बाजार भाव",
        finance: "कर्ज आणि योजना",
        equipment: "शेती अवजारे",
        myshop: "शेतमाल विक्री",
        learn: "प्रशिक्षण केंद्र",
        community: "शेतकरी चर्चा",
        welcome: "स्वागत आहे, येथे तुमचा दैनंदिन शेतीचा आढावा आहे."
    },
    hi: {
        dashboard: "डैशबोर्ड",
        doctor: "फसल डॉक्टर",
        market: "मंडी भाव",
        finance: "ऋण और योजनाएं",
        equipment: "कृषि उपकरण",
        myshop: "उपज बेचें",
        learn: "शिक्षण केंद्र",
        community: "किसान समुदाय",
        welcome: "वापसी पर स्वागत है, यहाँ आपकी दैनिक खेती का अवलोकन है।"
    }
};

// ========== NAVIGATION ==========
function navigate(sectionId) {
    const sections = document.querySelectorAll('.section-page');
    sections.forEach(sec => sec.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if(target) target.classList.add('active');

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    const currentLang = document.querySelector('.lang-switch button.active').innerText === 'मराठी' ? 'mr' : 
                        (document.querySelector('.lang-switch button.active').innerText === 'हिंदी' ? 'hi' : 'en');
    setLanguage(currentLang);
    
    // Auto-load data based on page
    if (sectionId === 'dashboard') {
        setTimeout(() => fetchWeatherData(), 500);
    } else if (sectionId === 'market') {
        setTimeout(() => fetchMandiRates(), 500);
    }
}

// ========== LANGUAGE SWITCHING ==========
function setLanguage(lang) {
    document.querySelectorAll('.lang-switch button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    document.getElementById('page-subtitle').innerText = translations[lang].welcome;

    const activeSection = document.querySelector('.section-page.active').id;
    if (translations[lang][activeSection]) {
        document.getElementById('page-title').innerText = translations[lang][activeSection];
    }
}

// ========== WEATHER API (Open-Meteo: Free, No Key Required) ==========
async function fetchWeatherData() {
    const tempEl = document.getElementById('weatherTemp');
    const descEl = document.getElementById('weatherDesc');
    const locEl = document.getElementById('weatherLocation');
    const iconEl = document.getElementById('weatherIcon');

    // 1. Functions to handle success/error of location
    const success = async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            // A. Fetch Weather Data (Open-Meteo)
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const weatherData = await weatherRes.json();
            
            if(!weatherData.current_weather) throw new Error("No weather data");

            const current = weatherData.current_weather;
            
            // Update UI
            tempEl.innerText = Math.round(current.temperature) + '°C';
            
            // Interpret WMO Weather Code
            const status = getWeatherStatus(current.weathercode);
            descEl.innerText = status.desc;
            iconEl.className = `fas ${status.icon}`;
            
            // B. Fetch City Name (Reverse Geocoding - BigDataCloud Free API)
            const cityRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            const cityData = await cityRes.json();
            locEl.innerText = cityData.city || cityData.locality || "Your Farm";

        } catch (error) {
            console.error("Weather API Error:", error);
            locEl.innerText = "Weather unavailable";
        }
    };

    const error = () => {
        // Fallback if user denies location permission (Default: Pune)
        console.warn("Location access denied. Using default.");
        fetchWeatherDataByCoords(18.5204, 73.8567, "Pune (Default)");
    };

    // 2. Request User Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        error();
    }
}

// Helper: Fetch for a specific default location
async function fetchWeatherDataByCoords(lat, lon, cityName) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const current = data.current_weather;
        
        document.getElementById('weatherTemp').innerText = Math.round(current.temperature) + '°C';
        
        const status = getWeatherStatus(current.weathercode);
        document.getElementById('weatherDesc').innerText = status.desc;
        document.getElementById('weatherIcon').className = `fas ${status.icon}`;
        document.getElementById('weatherLocation').innerText = cityName;
    } catch (e) {
        console.error(e);
    }
}

// Helper: Map WMO codes to Icons & Text
function getWeatherStatus(code) {
    // WMO Weather interpretation codes
    const map = {
        0: { desc: 'Clear Sky', icon: 'fa-sun' },
        1: { desc: 'Mainly Clear', icon: 'fa-cloud-sun' },
        2: { desc: 'Partly Cloudy', icon: 'fa-cloud' },
        3: { desc: 'Overcast', icon: 'fa-cloud' },
        45: { desc: 'Foggy', icon: 'fa-smog' },
        48: { desc: 'Depositing Rime Fog', icon: 'fa-smog' },
        51: { desc: 'Light Drizzle', icon: 'fa-cloud-rain' },
        53: { desc: 'Moderate Drizzle', icon: 'fa-cloud-rain' },
        55: { desc: 'Dense Drizzle', icon: 'fa-cloud-showers-heavy' },
        61: { desc: 'Slight Rain', icon: 'fa-cloud-rain' },
        63: { desc: 'Moderate Rain', icon: 'fa-cloud-rain' },
        65: { desc: 'Heavy Rain', icon: 'fa-cloud-showers-heavy' },
        71: { desc: 'Light Snow', icon: 'fa-snowflake' },
        73: { desc: 'Moderate Snow', icon: 'fa-snowflake' },
        75: { desc: 'Heavy Snow', icon: 'fa-snowflake' },
        80: { desc: 'Rain Showers', icon: 'fa-cloud-rain' },
        81: { desc: 'Heavy Showers', icon: 'fa-cloud-showers-heavy' },
        95: { desc: 'Thunderstorm', icon: 'fa-bolt' },
        96: { desc: 'Hailstorm', icon: 'fa-bolt' },
        99: { desc: 'Heavy Hailstorm', icon: 'fa-bolt' }
    };
    return map[code] || { desc: 'Unknown', icon: 'fa-cloud' };
}

// ========== CROP DOCTOR - IMAGE UPLOAD ==========
function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert("Image too large! Please use an image under 5MB.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        uploadedImageData = base64Data;
        currentImageBase64 = base64Data.split(',')[1];
        
        // Show preview
        document.getElementById('previewIcon').innerHTML = `
            <img src="${base64Data}" style="max-width: 100%; max-height: 200px; border-radius: 10px; object-fit: contain;">
        `;
        document.getElementById('previewText').innerText = "Image Loaded! Ready to analyze.";
        document.getElementById('analyzeBtn').disabled = false;
        document.getElementById('scanResult').style.display = 'none';
        
        // Clear demo sample selection
        currentSample = null;
        document.querySelectorAll('.sample-thumb').forEach(t => {
            t.classList.remove('selected');
            t.style.borderColor = '#ddd';
            t.style.background = 'white';
        });
    };
    
    reader.readAsDataURL(file);
}

// ========== CROP DOCTOR - DEMO SAMPLES ==========
const diseaseDB = {
    'healthy': {
        title: 'Healthy Crop',
        severity: 'None',
        severityColor: '#27ae60',
        confidence: '99%',
        desc: 'The plant shows no signs of disease or nutrient deficiency. Leaves are vibrant green with healthy veins.',
        treatments: ['Continue regular watering.', 'Maintain current fertilizer schedule.', 'Monitor for any changes.']
    },
    'nitrogen': {
        title: 'Nitrogen Deficiency',
        severity: 'Moderate',
        severityColor: '#f1c40f',
        confidence: '94%',
        desc: 'Leaves are turning yellow (chlorosis) starting from the tips and moving down the midrib. Older leaves are affected first.',
        treatments: ['Apply Nitrogen-rich fertilizer (Urea or Ammonium Sulfate).', 'Add composted manure to the soil.', 'Ensure soil is not waterlogged.']
    },
    'rust': {
        title: 'Leaf Rust (Fungal)',
        severity: 'High',
        severityColor: '#e67e22',
        confidence: '91%',
        desc: 'Orange-brown pustules (spots) are visible on the underside of leaves. Can cause leaf drop and yield loss.',
        treatments: ['Spray Propiconazole or Mancozeb fungicide.', 'Remove and burn infected leaves.', 'Avoid overhead watering to keep leaves dry.']
    },
    'pest': {
        title: 'Aphid Infestation',
        severity: 'Critical',
        severityColor: '#e74c3c',
        confidence: '88%',
        desc: 'Small insects visible on leaf undersides. Leaves may curl or become distorted. Sticky residue (honeydew) present.',
        treatments: ['Spray Neem Oil or Insecticidal Soap.', 'Introduce beneficial insects like Ladybugs.', 'Use yellow sticky traps.']
    }
};

function selectSample(type, el) {
    currentSample = type;
    uploadedImageData = null;
    currentImageBase64 = null;
    
    // Visual feedback
    document.querySelectorAll('.sample-thumb').forEach(t => {
        t.classList.remove('selected');
        t.style.borderColor = '#ddd';
        t.style.background = 'white';
    });
    el.classList.add('selected');
    el.style.borderColor = 'var(--secondary-color)';
    el.style.background = '#e8f5e9';
    
    // Update Preview
    const iconMap = {
        'healthy': ['fa-leaf', '#2ecc71'],
        'nitrogen': ['fa-leaf', '#f1c40f'],
        'rust': ['fa-leaf', '#e67e22'],
        'pest': ['fa-bug', '#e74c3c']
    };
    
    const prevIcon = document.getElementById('previewIcon');
    prevIcon.className = `fas ${iconMap[type][0]} big-icon`;
    prevIcon.style.color = iconMap[type][1];
    prevIcon.style.fontSize = '80px';
    
    document.getElementById('previewText').innerText = "Demo Sample Loaded. Ready to Analyze.";
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('scanResult').style.display = 'none';
}

// ========== CROP DOCTOR - ANALYSIS ==========
async function startAnalysis() {
    if (!currentImageBase64 && !currentSample) {
        alert("Please upload an image or select a demo sample!");
        return;
    }
    
    const btn = document.getElementById('analyzeBtn');
    const frame = document.getElementById('scanFrame');
    const currentLangCode = document.querySelector('.lang-switch button.active').id.replace('btn-', '');
    
    btn.disabled = true;
    btn.innerText = i18n[currentLangCode]?.analyzing || "🤖 Analyzing...";
    frame.classList.add('scanning');
    
    if (currentImageBase64) {
        // Real image - use Groq API
        await runGroqAnalysis();
    } else if (currentSample) {
        // Demo sample - use fake data
        await runDemoAnalysis();
    }
    
    frame.classList.remove('scanning');
    btn.disabled = false;
    btn.innerText = "Start AI Diagnosis";
}

// Run Groq AI Analysis
async function runGroqAnalysis() {
// 1. Get the actual file from the input element
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    // Check if a file actually exists
    if (!file) {
        alert("Please upload an image first!");
        return;
    }

    // 2. Prepare the data to send to your local server
    const formData = new FormData();
    formData.append("image", file); // This MUST match upload.single("image") in server.js

    try {
        console.log('Sending request to /analyze...');
        // 3. Send to your Node.js backend
        const response = await fetch("/analyze", {
            method: "POST",
            body: formData
            // Note: Do NOT set headers manually; the browser handles it for FormData
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        console.log('Analysis result:', data);

        // 4. Show the results on the screen
        displayDiagnosisResults(data);

    } catch (err) {
        console.error('Frontend Error:', err);
        alert(`Analysis failed: ${err.message}. Check if server is running on http://localhost:3000`);
        throw err; // This triggers the "Analysis failed" alert in startAnalysis()
    }
}

// Run Demo Analysis
async function runDemoAnalysis() {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const demoData = diseaseDB[currentSample];
    const data = {
        name: demoData.title,
        severity: demoData.severity,
        description: demoData.desc,
        treatments: demoData.treatments,
        confidence: demoData.confidence
    };
    
    displayDiagnosisResults(data);
}

// Display Results
function displayDiagnosisResults(data) {
    const severityColors = {
        'None': '#27ae60',
        'Low': '#27ae60',
        'Moderate': '#f1c40f',
        'High': '#e67e22',
        'Critical': '#e74c3c'
    };
    
    document.getElementById('resTitle').innerText = data.name;
    document.getElementById('resSeverity').innerText = `Severity: ${data.severity}`;
    document.getElementById('resSeverity').style.color = severityColors[data.severity] || '#f1c40f';
    document.getElementById('resDesc').innerText = data.description;
    
    const list = document.getElementById('resTreatment');
    list.innerHTML = '';
    (data.treatments || []).forEach(treatment => {
        const li = document.createElement('li');
        li.innerText = treatment;
        li.style.marginTop = '4px';
        list.appendChild(li);
    });
    
    if (data.confidence) {
        document.getElementById('resConfidence').innerText = `${data.confidence} Match`;
    } else {
        document.getElementById('resConfidence').innerText = 'AI Analysis';
    }
    
    document.getElementById('scanResult').style.display = 'block';
}

// ========== MANDI RATES API ==========
async function fetchMandiRates() {
    const container = document.getElementById('mandiRatesContainer');
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">📊 Loading market data...</p>';
    
    try {
        // Fetch from our local proxy which connects to data.gov.in
        const response = await fetch('/api/mandi');
        
        if (!response.ok) {
           throw new Error("Failed to fetch from API");
        }
        
        const data = await response.json();
        const records = data.records; 
        
        if (records && records.length > 0) {
             const mappedData = records.map(r => ({
                commodity: r.commodity || r.Commodity, // handle variations in API response keys
                market: r.market || r.Market,
                icon: 'fa-seedling', 
                iconColor: '#27ae60',
                min_price: r.min_price || r.Min_Price,
                max_price: r.max_price || r.Max_Price,
                modal_price: r.modal_price || r.Modal_Price,
                trend: 'Live',
                trendUp: true
             }));
             displayMandiRates(mappedData);
        } else {
             console.warn("API returned empty records, showing sample data.");
             displayMandiRates(getSampleMandiData());
        }

    } catch (error) {
        console.error('Mandi rates error:', error);
        // Fallback to sample data on error
        displayMandiRates(getSampleMandiData());
    }
}

function getSampleMandiData() {
    // Sample data
    return [
        { 
            commodity: 'Onion (Kanda)', 
            market: 'Pune APMC',
            icon: 'fa-circle',
            iconColor: '#8B4513',
            min_price: '1800', 
            max_price: '2500', 
            modal_price: '2150',
            trend: '+2.5%',
            trendUp: true
        },
        { 
            commodity: 'Tomato', 
            market: 'Mumbai',
            icon: 'fa-circle',
            iconColor: '#FF6347',
            min_price: '800', 
            max_price: '1400', 
            modal_price: '1100',
            trend: '-1.2%',
            trendUp: false
        },
        { 
            commodity: 'Wheat (Gahu)', 
            market: 'Nashik',
            icon: 'fa-seedling',
            iconColor: '#DAA520',
            min_price: '2800', 
            max_price: '3200', 
            modal_price: '3050',
            trend: '+0.8%',
            trendUp: true
        },
        { 
            commodity: 'Rice (Paddy)', 
            market: 'Pune APMC',
            icon: 'fa-seedling',
            iconColor: '#F5DEB3',
            min_price: '2200', 
            max_price: '2600', 
            modal_price: '2400',
            trend: '+1.5%',
            trendUp: true
        },
        { 
            commodity: 'Cotton', 
            market: 'Akola',
            icon: 'fa-cloud',
            iconColor: '#F0F8FF',
            min_price: '5500', 
            max_price: '6200', 
            modal_price: '5850',
            trend: '-0.5%',
            trendUp: false
        },
        { 
            commodity: 'Soybean', 
            market: 'Latur',
            icon: 'fa-circle',
            iconColor: '#8FBC8F',
            min_price: '4000', 
            max_price: '4600', 
            modal_price: '4300',
            trend: '+3.2%',
            trendUp: true
        },
        { 
            commodity: 'Sugarcane', 
            market: 'Kolhapur',
            icon: 'fa-leaf',
            iconColor: '#90EE90',
            min_price: '2600', 
            max_price: '3000', 
            modal_price: '2800',
            trend: '+0.3%',
            trendUp: true
        },
        { 
            commodity: 'Potato (Batata)', 
            market: 'Pune APMC',
            icon: 'fa-circle',
            iconColor: '#D2691E',
            min_price: '500', 
            max_price: '900', 
            modal_price: '700',
            trend: '-2.1%',
            trendUp: false
        }
    ];
}

function displayMandiRates(records) {
    const container = document.getElementById('mandiRatesContainer');
    
    if (records.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">No data available</p>';
        return;
    }
    
    let html = '<div style="overflow-x: auto;">';
    html += '<table class="market-table" style="width: 100%; border-collapse: collapse;">';
    html += `
        <thead style="background: var(--primary-color); color: white;">
            <tr>
                <th style="padding: 15px; text-align: left;">Commodity</th>
                <th style="padding: 15px; text-align: left;">Market</th>
                <th style="padding: 15px; text-align: right;">Min (₹/Qtl)</th>
                <th style="padding: 15px; text-align: right;">Max (₹/Qtl)</th>
                <th style="padding: 15px; text-align: right;">Modal (₹/Qtl)</th>
                <th style="padding: 15px; text-align: center;">24h Trend</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    records.forEach((record, index) => {
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const trendColor = record.trendUp ? 'var(--secondary-color)' : '#e74c3c';
        const trendIcon = record.trendUp ? 'fa-arrow-up' : 'fa-arrow-down';
        
        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px; font-weight: 600;">
                    <i class="fas ${record.icon}" style="color: ${record.iconColor}; margin-right: 8px;"></i>
                    ${record.commodity}
                </td>
                <td style="padding: 12px; color: var(--text-light);">${record.market}</td>
                <td style="padding: 12px; text-align: right;">₹${record.min_price}</td>
                <td style="padding: 12px; text-align: right;">₹${record.max_price}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--secondary-color); font-size: 16px;">
                    ₹${record.modal_price}
                </td>
                <td style="padding: 12px; text-align: center; font-weight: 600; color: ${trendColor};">
                    <i class="fas ${trendIcon}"></i> ${record.trend}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    html += `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
            <p style="color: var(--text-light); font-size: 12px; margin: 0;">
                📅 Last updated: ${new Date().toLocaleString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit'
                })}
            </p>
            <p style="color: var(--text-light); font-size: 11px; margin: 0; font-style: italic;">
                💡 Prices are indicative and may vary at actual mandi
            </p>
        </div>
    `;
    
    container.innerHTML = html;
}

// ========== FINANCE CALCULATOR ==========
function calculateLoan() {
    const acres = parseFloat(document.getElementById('landInput').value);
    const scaleOfFinance = parseInt(document.getElementById('cropInput').value);
    const resultDisplay = document.getElementById('loanResult');
    const amountDisplay = document.getElementById('amountDisplay');

    if (isNaN(acres) || acres <= 0) {
        alert("Please enter a valid land size in acres.");
        return;
    }

    const totalLoan = acres * scaleOfFinance;
    amountDisplay.innerText = "₹" + totalLoan.toLocaleString('en-IN');
    resultDisplay.style.display = 'block';
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    navigate('dashboard');
    fetchWeatherData(); // Load weather on startup
});
