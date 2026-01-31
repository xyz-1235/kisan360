// ========== GLOBAL VARIABLES ==========
let currentImageBase64 = null;
let uploadedImageData = null;
let currentSample = null;
let lastDiagnosisText = '';
const currentUser = JSON.parse(localStorage.getItem("user"));

// ========== AUTHENTICATION CHECK ==========
function checkAuth() {
    const loggedInDiv = document.getElementById('userLoggedIn');
    const loggedOutDiv = document.getElementById('userLoggedOut');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');

    if (currentUser) {
        loggedInDiv.style.display = 'block';
        loggedOutDiv.style.display = 'none';
        userNameEl.innerText = currentUser.name;
        userRoleEl.innerText = currentUser.role || 'Farmer';
        userAvatarEl.innerText = currentUser.name.charAt(0).toUpperCase();

        // Update welcome message if element exists
        const subtitle = document.getElementById('page-subtitle');
        if (subtitle) {
             // Keep translation logic but append name
             // (Translating first, then updating might be tricky, checking structure)
        }
    } else {
        loggedInDiv.style.display = 'none';
        loggedOutDiv.style.display = 'block';
    }
}

// Call on startup
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Start with Dashboard
    navigate('dashboard');
});

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// ========== API CONFIGURATION ==========
// If running on Live Server (ports 5500-5510), point to Node backend on port 3000.
// Otherwise, assume backend is serving the frontend (same origin).
const API_BASE_URL = (window.location.port && parseInt(window.location.port) >= 5500 && parseInt(window.location.port) <= 5510)
    ? 'http://localhost:3000'
    : '';

// ========== MULTI-LANGUAGE SUPPORT ==========
// Handled by lang.js (translations, setLanguage, currentLang)

// Alias for AI Crop Doctor to use current translation
const i18n = translations;

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
/* Translations formerly here are merged into the main object */

// ========== NAVIGATION ==========
function navigate(sectionId) {
    const sections = document.querySelectorAll('.section-page');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });

    const target = document.getElementById(sectionId);
    if(target) {
        target.classList.add('active');
        target.style.display = 'block';

        // Load Content Dynamically if not already loaded
        if (!target.classList.contains('loaded')) {
            target.innerHTML = '<div style="text-align:center; padding:50px; color:#666;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading Section...</p></div>';
            
            fetch(`sections/farmer_dashboard/${sectionId}.html`)
            .then(res => {
                if(!res.ok) throw new Error("Section not found");
                return res.text();
            })
            .then(html => {
                target.innerHTML = html;
                target.classList.add('loaded');

                // Re-apply translations
                const currentLang = localStorage.getItem('kisan360_lang') || 'en';
                if (typeof setLanguage === 'function') {
                    setLanguage(currentLang);
                }

                // Initialize Section Specific Logic
                if (sectionId === 'dashboard') {
                    fetchWeatherData();
                } else if (sectionId === 'market') {
                    fetchMandiRates();
                } else if (sectionId === 'equipment') {
                    initEquipment(); 
                }
            })
            .catch(err => {
                console.error(err);
                target.innerHTML = '<div style="text-align:center; padding:50px; color:red;"><i class="fas fa-exclamation-triangle fa-2x"></i><p>Error Loading Section</p></div>';
            });
        }
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    const currentLang = document.querySelector('.lang-switch button.active') ? 
                        (document.querySelector('.lang-switch button.active').innerText === 'मराठी' ? 'mr' : 
                        (document.querySelector('.lang-switch button.active').innerText === 'हिंदी' ? 'hi' : 'en')) 
                        : 'en';
    setLanguage(currentLang);
}

// ========== LANGUAGE SWITCHING ==========
// Handled by lang.js

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

// Call on startup
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // fetchWeatherData(); // Removed duplicative call as it overrides DOMContentLoaded below
});

// Helper: Fetch for a specific default default location
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
    en: {
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
    },
    mr: {
        'healthy': {
            title: 'निरोगी पीक',
            severity: 'काहीही नाही',
            severityColor: '#27ae60',
            confidence: '९९%',
            desc: 'वनस्पतीवर कोणताही रोग किंवा कमतरता दिसत नाही. पाने हिरवीगार आणि तजेलदार आहेत.',
            treatments: ['नियमित पाणी देणे चालू ठेवा.', 'सध्याचे खत नियोजन सुरू ठेवा.', 'पिकाचे निरीक्षण करा.']
        },
        'nitrogen': {
            title: 'नायट्रोजनची कमतरता',
            severity: 'मध्यम',
            severityColor: '#f1c40f',
            confidence: '९४%',
            desc: 'पाने पिवळी पडत आहेत (क्लोरोसिस), शेंड्यापासून सुरुवात होऊन मध्य शिरेपर्यंत पसरत आहे. जुनी पाने आधी प्रभावित होतात.',
            treatments: ['नायट्रोजनयुक्त खत (युरिया) द्या.', 'शेणखत / कंपोस्ट खत टाका.', 'जमिनीत पाणी साचणार नाही याची काळजी घ्या.']
        },
        'rust': {
            title: 'पानांवरील तांबेरा (बुरशी)',
            severity: 'जास्त',
            severityColor: '#e67e22',
            confidence: '९१%',
            desc: 'पानांच्या खालच्या बाजूला नारंगी-तपकिरी ठिपके दिसत आहेत.',
            treatments: ['प्रोपिकोनाझोल (Propiconazole) फवारणी करा.', 'संसर्ग झालेली पाने नष्ट करा.', 'पाने कोरडी ठेवा.']
        },
        'pest': {
            title: 'मावा / तुडतुडे',
            severity: 'गंभीर',
            severityColor: '#e74c3c',
            confidence: '८८%',
            desc: 'पानांच्या खाली लहान कीटक दिसत आहेत. पाने वाकडी होऊ शकतात. चिकट पदार्थ जमा झाला आहे.',
            treatments: ['कडुनिंब तेल किंवा कीटकनाशक साबण फवारणी करा.', 'पिवळे चिकट सापळे वापरा.']
        }
    },
    hi: {
        'healthy': {
            title: 'स्वस्थ फसल',
            severity: 'कोई नहीं',
            severityColor: '#27ae60',
            confidence: '99%',
            desc: 'पौधे में बीमारी या पोषक तत्वों की कमी के कोई संकेत नहीं हैं। पत्तियां हरी-भरी हैं।',
            treatments: ['नियमित पानी देना जारी रखें।', 'वर्तमान खाद अनुसूची बनाए रखें।', 'निगरानी करते रहें।']
        },
        'nitrogen': {
            title: 'नाइट्रोजन की कमी',
            severity: 'मध्यम',
            severityColor: '#f1c40f',
            confidence: '94%',
            desc: 'पत्तियां पीली पड़ रही हैं (क्लोरोसिस)। पुरानी पत्तियां पहले प्रभावित होती हैं।',
            treatments: ['नाइट्रोजन युक्त उर्वरक (यूरिया) डालें।', 'मिट्टी में खाद डालें।', 'सुनिश्चित करें कि जल जमाव न हो।']
        },
        'rust': {
            title: 'रतुआ रोग (फंगल)',
            severity: 'उच्च',
            severityColor: '#e67e22',
            confidence: '91%',
            desc: 'पत्तियों के नीचे नारंगी-भूरे रंग के धब्बे दिखाई देते हैं।',
            treatments: ['प्रोपिकोनाज़ोल (Propiconazole) का छिड़काव करें।', 'संक्रमित पत्तियों को हटा दें।', 'पत्तियों को सूखा रखें।']
        },
        'pest': {
            title: 'एफिड संक्रमण (कीट)',
            severity: 'गंभीर',
            severityColor: '#e74c3c',
            confidence: '88%',
            desc: 'पत्तियों के नीचे छोटे कीड़े दिखाई दे रहे हैं। पत्तियां मुड़ सकती हैं।',
            treatments: ['नीम का तेल छिड़कें।', 'पीले चिपचिपे जाल का प्रयोग करें।']
        }
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
    prevIcon.innerHTML = ''; // Clear any uploaded image from file upload
    prevIcon.className = `fas ${iconMap[type][0]} big-icon`;
    prevIcon.style.color = iconMap[type][1];
    prevIcon.style.fontSize = '80px';
    
    const readyMsg = {
        en: "Demo Sample Loaded. Ready to Analyze.",
        mr: "डेमो सॅम्पल लोड झाले. विश्लेषणासाठी तयार.",
        hi: "डेमो नमूना लोड किया गया। विश्लेषण के लिए तैयार।"
    };
    
    document.getElementById('previewText').innerText = readyMsg[currentLang] || readyMsg['en'];
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
    const currentLangCode = currentLang; // Use global variable set by setLanguage
    
    btn.disabled = true;
    btn.innerText = translations[currentLangCode]?.analyzing || "🤖 Analyzing...";
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
    btn.innerText = translations[currentLangCode]?.run_ai || "Run AI Analysis";
}

// Run Groq AI Analysis
async function runGroqAnalysis() {
    // 1. Get the actual file from the input element OR from memory (fragility fix)
    const fileInput = document.getElementById('fileInput');
    let file = fileInput.files[0];

    // Fallback if fileInput is empty but we have an image in memory (e.g. via drag-and-drop or other UI flow)
    if (!file && currentImageBase64) {
        try {
            // Convert base64 back to a binary blob
            const byteCharacters = atob(currentImageBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            file = new Blob([byteArray], { type: 'image/jpeg' });
        } catch (e) {
            console.error("Failed to convert base64 to blob:", e);
        }
    }

    // Check if a file actually exists
    if (!file) {
        alert("Please upload an image first!");
        return;
    }

    // 2. Prepare the data to send to your local server
    const formData = new FormData();
    formData.append("image", file); 
    // Explicitly send current language (default 'en')
    formData.append("language", currentLang || "en"); 

    try {
        console.log('Sending request to /analyze...');
        // 3. Send to your Node.js backend
        const response = await fetch(`${API_BASE_URL}/analyze`, {
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
    
    // Select language db, fallback to 'en'
    const langDB = diseaseDB[currentLang] || diseaseDB['en'];
    const demoData = langDB[currentSample];
    
    const data = {
        name: demoData.title,
        severity: demoData.severity,
        severityColor: demoData.severityColor, // Pass color from DB
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
        'Critical': '#e74c3c',
        // Localized Keys
        'काहीही नाही': '#27ae60', 'मध्यम': '#f1c40f', 'जास्त': '#e67e22', 'गंभीर': '#e74c3c',
        'कोई नहीं': '#27ae60', 'उच्च': '#e67e22'
    };
    
    document.getElementById('resTitle').innerText = data.name;
    
    const sevLabel = translations[currentLang]?.severity || 'Severity';
    document.getElementById('resSeverity').innerText = `${sevLabel}: ${data.severity}`;
    
    if (data.severityColor) {
         document.getElementById('resSeverity').style.color = data.severityColor;
    } else {
         document.getElementById('resSeverity').style.color = severityColors[data.severity] || '#f1c40f';
    }

    document.getElementById('resDesc').innerText = data.description;
    
    const list = document.getElementById('resTreatment');
    list.innerHTML = '';
    (data.treatments || []).forEach(treatment => {
        const li = document.createElement('li');
        li.innerText = treatment;
        li.style.marginTop = '4px';
        list.appendChild(li);
    });
    
    const matchLabel = translations[currentLang]?.confidence || 'Match';
    if (data.confidence) {
        document.getElementById('resConfidence').innerText = `${data.confidence} ${matchLabel}`;
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
        const response = await fetch(`${API_BASE_URL}/api/mandi`);
        
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

// ========== EQUIPMENT HUB FUNCTIONS ==========
const equipmentData = [
    { id: 1, name: 'Mahindra 575 DI', type: 'rent', icon: 'fa-tractor', price: 600, unit: '/hr', specs: '45 HP • Rotavator Included • Diesel' },
    { id: 2, name: 'Agri Drone Sprayer', type: 'rent', icon: 'fa-plane-departure', price: 1200, unit: '/acre', specs: '10L Capacity • Pilot Included • Precision Spraying' },
    { id: 3, name: 'Drip Irrigation Kit', type: 'buy', icon: 'fa-water', price: 15000, unit: '', specs: '1 Acre Full Set • Used 1 year • Good Condition' },
    { id: 4, name: 'Harvest Pickup', type: 'rent', icon: 'fa-truck-pickup', price: 25, unit: '/km', specs: 'Tata Ace • 1 Ton Capacity • Driver Included' },
    { id: 5, name: 'Rotavator 6ft', type: 'buy', icon: 'fa-fan', price: 35000, unit: '', specs: 'Heavy Duty • 42 Blades • 2 Years Old' },
    { id: 6, name: 'Power Tiller', type: 'rent', icon: 'fa-dharmachakra', price: 400, unit: '/hr', specs: 'Petrol Engine • Easy Handling • With Attachments' }
];

let selectedItem = null;
let bookings = [];

function initEquipment() {
    renderCards('all');
    setupTabs();
    
    // Set min date to today
    const dateInput = document.getElementById('date');
    if(dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
}

function renderCards(filter) {
    const container = document.getElementById('cardsContainer');
    if(!container) return;
    
    const items = filter === 'all' ? equipmentData : equipmentData.filter(e => e.type === filter);
    
    container.innerHTML = items.map(item => `
        <div class="card">
            <div class="card-header">
                <i class="fas ${item.icon}"></i>
                <span class="tag ${item.type}">${item.type === 'buy' ? 'Buy Used' : 'Rent'}</span>
            </div>
            <div class="card-content">
                <h3>${item.name}</h3>
                <div class="price">₹${item.price.toLocaleString()}<span style="font-size:14px; font-weight:500; color:#7f8c8d">${item.unit}</span></div>
                <div class="specs">${item.specs}</div>
                <button class="btn-primary" style="width:100%; margin-top:10px" onclick="openModal(${item.id})">
                    <i class="fas ${item.type === 'buy' ? 'fa-phone' : 'fa-calendar-check'}"></i>
                    ${item.type === 'buy' ? 'Contact Seller' : 'Book Now'}
                </button>
            </div>
        </div>
    `).join('');
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderCards(e.target.dataset.filter);
        });
    });
}

function openModal(id) {
    selectedItem = equipmentData.find(e => e.id === id);
    const modal = document.getElementById('modal');
    const formView = document.getElementById('formView');
    const confirmView = document.getElementById('confirmView');
    const rentFields = document.getElementById('rentFields');
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('confirmBtn');

    if(!modal) return;

    if(formView) formView.style.display = 'block';
    if(confirmView) confirmView.classList.remove('show');
    
    const bookingForm = document.getElementById('bookingForm');
    if(bookingForm) bookingForm.reset();
    
    if(document.getElementById('date')) {
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }

    if (selectedItem.type === 'buy') {
        if(title) title.innerHTML = `<i class="fas fa-phone"></i> Contact Seller`;
        if(rentFields) rentFields.style.display = 'none';
        if(btn) btn.innerHTML = `Request Callback`;
    } else {
        if(title) title.innerHTML = `<i class="fas fa-calendar-check"></i> Book ${selectedItem.name}`;
        if(rentFields) rentFields.style.display = 'block';
        if(btn) btn.innerHTML = `Confirm Booking`;
        if(document.getElementById('unitPrice')) document.getElementById('unitPrice').textContent = `₹${selectedItem.price} ${selectedItem.unit}`;
        updatePrice();
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if(modal) modal.classList.remove('active');
}

function updatePrice() {
    if (!selectedItem || selectedItem.type === 'buy') return;
    const qtyInput = document.getElementById('quantity');
    const qty = qtyInput ? qtyInput.value : 1;
    const total = selectedItem.price * qty;
    const totalEl = document.getElementById('totalPrice');
    if(totalEl) totalEl.textContent = `₹${total.toLocaleString()}`;
}

function submitForm(e) {
    if(e) e.preventDefault();
    const btn = document.getElementById('confirmBtn');
    
    if(btn) {
        btn.classList.add('loading');
        btn.textContent = 'Processing...';
    }

    setTimeout(() => {
        const nameInput = document.getElementById('name');
        const dateInput = document.getElementById('date');
        const qtyInput = document.getElementById('quantity');
        const phoneInput = document.getElementById('phone');
        
        const formData = {
            id: Date.now(),
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            icon: selectedItem.icon,
            type: selectedItem.type,
            customer: nameInput ? nameInput.value : 'Customer',
            date: dateInput ? dateInput.value : '',
            quantity: qtyInput ? qtyInput.value : 1,
            total: selectedItem.type === 'buy' ? selectedItem.price : (selectedItem.price * (qtyInput ? qtyInput.value : 1))
        };

        bookings.push(formData);
        updateBookedList();
        showSuccessView(formData);
        fireConfetti();
        
        if(btn) btn.classList.remove('loading');
    }, 800);
}

function showSuccessView(data) {
    const formView = document.getElementById('formView');
    const confirmView = document.getElementById('confirmView');
    const details = document.getElementById('confDetails');
    const title = document.getElementById('confHead');
    const sub = document.getElementById('confSub');

    if(formView) formView.style.display = 'none';
    if(confirmView) confirmView.classList.add('show');

    if (data.type === 'buy') {
        if(title) title.textContent = 'Interest Registered!';
        if(sub) sub.textContent = 'The seller has been notified and will call you shortly.';
        if(details) {
            const phoneInput = document.getElementById('phone');
            details.innerHTML = `
                <div class="detail-item"><span>Equipment</span><span>${data.itemName}</span></div>
                <div class="detail-item"><span>Price</span><span>₹${data.total.toLocaleString()}</span></div>
                <div class="detail-item"><span>Your Number</span><span>${phoneInput ? phoneInput.value : 'N/A'}</span></div>
            `;
        }
    } else {
        if(title) title.textContent = 'Booking Confirmed!';
        if(sub) sub.textContent = 'Your equipment has been reserved successfully.';
        if(details) {
            details.innerHTML = `
                <div class="detail-item"><span>Equipment</span><span>${data.itemName}</span></div>
                <div class="detail-item"><span>Date</span><span>${data.date}</span></div>
                <div class="detail-item"><span>Duration</span><span>${data.quantity} ${selectedItem.unit.replace('/','')}</span></div>
                <div class="detail-item"><span>Total Cost</span><span>₹${data.total.toLocaleString()}</span></div>
            `;
        }
    }
}

function updateBookedList() {
    const container = document.getElementById('bookedContainer');
    if(!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--light); background: var(--white); border-radius: 12px; border: 2px dashed var(--border);">
            <i class="fas fa-tractor" style="font-size: 40px; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>You haven't booked any equipment yet.</p>
        </div>`;
        return;
    }

    container.innerHTML = bookings.map(b => `
        <div class="booked-card ${b.type === 'buy' ? 'buy-type' : ''}">
            <div class="booked-content">
                <div class="booked-icon" style="color: ${b.type === 'buy' ? 'var(--accent)' : 'var(--primary)'}">
                    <i class="fas ${b.icon}"></i>
                </div>
                <div class="booked-info">
                    <h4>${b.itemName}</h4>
                    <p><strong>Ref:</strong> #${b.id.toString().slice(-6)}</p>
                    <p><strong>Date:</strong> ${b.date}</p>
                    <p><strong>Status:</strong> ${b.type === 'buy' ? 'Seller Contacted' : 'Reserved'}</p>
                    <p style="color:var(--text-dark); font-weight:700; margin-top:4px">₹${b.total.toLocaleString()}</p>
                </div>
            </div>
            <div class="booked-actions">
                <button class="cancel-btn" onclick="cancelBooking(${b.id})">
                    <i class="fas fa-times-circle"></i> Cancel Booking
                </button>
            </div>
        </div>
    `).join('');

    const bookedSection = document.getElementById('bookedSection');
    if(bookedSection) bookedSection.scrollIntoView({ behavior: 'smooth' });
}

function cancelBooking(id) {
    if(confirm("Are you sure you want to cancel this booking?")) {
        bookings = bookings.filter(b => b.id !== id);
        updateBookedList();
        showToast("Booking cancelled successfully");
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    if(toast && msg) {
        msg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function fireConfetti() {
    const container = document.getElementById('confetti');
    if(!container) return;
    
    const colors = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'];
    
    for(let i=0; i<50; i++) {
        const conf = document.createElement('div');
        conf.classList.add('confetti-piece');
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        container.appendChild(conf);
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    navigate('dashboard');
    // Weather is already called in the top auth listener, no need to duplicate
});
